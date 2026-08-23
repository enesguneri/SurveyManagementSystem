using Microsoft.EntityFrameworkCore;
using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Forms;
using SurveyManagement.Application.Interfaces.Context;
using SurveyManagement.Application.Interfaces.Forms;
using SurveyManagement.Domain.Entities;
using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Application.Services.Forms;

public class FormService : IFormService
{
    private readonly IAppDbContext _context;
    private readonly IFormRequestValidator _formRequestValidator;

    public FormService(
        IAppDbContext context,
        IFormRequestValidator formRequestValidator)
    {
        _context = context;
        _formRequestValidator = formRequestValidator;
    }

    public async Task<ApiResponse<FormCreatedDto>> CreateAsync(
        CreateFormDto createFormDto,
        int createdByUserId,
        CancellationToken cancellationToken = default)
    {
        // Soru türlerine özel iş kurallarını veritabanına gitmeden kontrol eder.
        var validationErrors = _formRequestValidator.Validate(createFormDto);

        if (validationErrors.Count > 0)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                validationErrors,
                "Form doğrulama kurallarını karşılamıyor.");
        }

        // JWT geçerli olsa bile kullanıcının hâlâ aktif olduğunu veritabanından doğrular.
        var isActiveUser = await _context.Users.AnyAsync(
            user => user.Id == createdByUserId && user.IsActive,
            cancellationToken);


        if (!isActiveUser)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                "Form oluşturacak aktif kullanıcı bulunamadı.");
        }

        var roleScopeResult = await ValidateRoleScopeAsync(
            createFormDto.RoleIds,
            createdByUserId,
            cancellationToken);

        if (!roleScopeResult.IsValid)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                roleScopeResult.ErrorMessage!,
                roleScopeResult.StatusCode);
        }

        var roleIds = roleScopeResult.RoleIds;

        // İstemciden gelen DTO, veritabanı entity'lerine dönüştürülür.
        var form = new Form
        {
            Title = createFormDto.Title.Trim(),
            Description = NormalizeOptionalText(createFormDto.Description),
            AccessType = createFormDto.AccessType,

            // Form ilk oluşturulduğunda yayımlanmaz; önce taslak olur.
            Status = FormStatus.Draft,

            // Manuel oluşturma kaynağı istemciden değil, backend tarafından belirlenir.
            CreationSource = FormCreationSource.Manual,

            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow,
            ShowRespondentIdentity = createFormDto.ShowRespondentIdentity
        };

        // Formun seçilen birimlerle ilişkisi oluşturulur.
        foreach (var roleId in roleIds)
        {
            form.FormRoles.Add(new FormRole
            {
                RoleId = roleId
            });
        }

        // Sorular ve soru alt öğeleri ortak mapper metodu ile oluşturulur.
        AddQuestionsToForm(form, createFormDto.Questions);

        // Form kök entity olarak eklendiğinde EF Core bağlı alt entity'leri de takip eder.
        _context.Forms.Add(form);
        await _context.SaveChangesAsync(cancellationToken);

        // Entity yerine API için tasarlanmış güvenli cevap DTO'su döndürülür.
        var responseDto = new FormCreatedDto
        {
            Id = form.Id,
            PublicId = form.PublicId,
            Title = form.Title,
            Status = form.Status,
            AccessType = form.AccessType,
            CreatedAt = form.CreatedAt,
            ShowRespondentIdentity = form.ShowRespondentIdentity
        };

        return ApiResponse<FormCreatedDto>.SuccessResult(
            responseDto,
            "Form taslak olarak başarıyla oluşturuldu.");
    }

    public async Task<ApiResponse<FormCreatedDto>> PublishAsync(
    Guid publicId,
    int requesterUserId,
    CancellationToken cancellationToken = default)
    {
        // Form, paylaşım için kullanılan PublicId üzerinden bulunur.
        var form = await _context.Forms
            .FirstOrDefaultAsync(
                currentForm => currentForm.PublicId == publicId,
                cancellationToken);

        if (form is null)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                "Yayınlanacak form bulunamadı.",
                404);
        }

        //Yetki kontrolü
        var canManageForm = await CanManageFormAsync(form,requesterUserId,cancellationToken);

        if (!canManageForm)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                "Bu formu yayınlama yetkiniz yok.",
                403);
        }

        if (form.Status == FormStatus.Published)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                "Form zaten yayımlanmış durumda.",
                400);
        }

        // Taslak veya kapalı form yeniden yayımlanabilir.
        form.Status = FormStatus.Published;

        await _context.SaveChangesAsync(cancellationToken);

        var responseDto = new FormCreatedDto
        {
            Id = form.Id,
            PublicId = form.PublicId,
            Title = form.Title,
            Status = form.Status,
            AccessType = form.AccessType,
            CreatedAt = form.CreatedAt,
            ShowRespondentIdentity = form.ShowRespondentIdentity
        };

        return ApiResponse<FormCreatedDto>.SuccessResult(
            responseDto,
            "Form başarıyla yayımlandı.");
    }

    public async Task<ApiResponse<FormDetailsDto>> GetByPublicIdAsync(
    Guid publicId,
    int? requesterUserId,
    CancellationToken cancellationToken = default)
    {
        // Form yalnızca okunduğu için entity tracking kapatılır.
        var form = await _context.Forms
            .AsNoTracking()
            .Include(formEntity => formEntity.Questions)
                .ThenInclude(question => question.Validation)
            .Include(formEntity => formEntity.Questions)
                .ThenInclude(question => question.Options)
            .Include(formEntity => formEntity.Questions)
                .ThenInclude(question => question.MatrixRows)
            .Include(formEntity => formEntity.Questions)
                .ThenInclude(question => question.MatrixColumns)
            .Where(formEntity => formEntity.PublicId == publicId)
            .FirstOrDefaultAsync(cancellationToken);

        if (form is null)
        {
            return ApiResponse<FormDetailsDto>.FailureResult(
                "Form bulunamadı.",
                404);
        }

        // Taslak ve kapalı formlar cevaplama ekranına gösterilmez.
        if (form.Status != FormStatus.Published)
        {
            return ApiResponse<FormDetailsDto>.FailureResult(
                "Form şu anda cevap kabul etmiyor.",
                404);
        }

        // Authenticated form için JWT zorunludur.
        if (form.AccessType == FormAccessType.Authenticated &&
            requesterUserId is null)
        {
            return ApiResponse<FormDetailsDto>.FailureResult(
                "Bu formu görüntülemek için giriş yapmalısınız.",
                401);
        }

        var responseDto = new FormDetailsDto
        {
            PublicId = form.PublicId,
            Title = form.Title,
            Description = form.Description,
            Status = form.Status,
            AccessType = form.AccessType,
            Questions = form.Questions
                .OrderBy(question => question.DisplayOrder)
                .Select(MapQuestionDetails)
                .ToList(),
            ShowRespondentIdentity = form.ShowRespondentIdentity
        };

        return ApiResponse<FormDetailsDto>.SuccessResult(responseDto);
    }

    private static QuestionDetailsDto MapQuestionDetails(Question question)
    {
        return new QuestionDetailsDto
        {
            Id = question.Id,
            Title = question.Title,
            Description = question.Description,
            Type = question.Type,
            IsRequired = question.IsRequired,
            DisplayOrder = question.DisplayOrder,
            RatingMinLabel = question.RatingMinLabel,
            RatingMaxLabel = question.RatingMaxLabel,

            Validation = question.Validation is null
                ? null
                : new QuestionValidationDetailsDto
                {
                    MinLength = question.Validation.MinLength,
                    MaxLength = question.Validation.MaxLength,
                    RegexPattern = question.Validation.RegexPattern,
                    MinValue = question.Validation.MinValue,
                    MaxValue = question.Validation.MaxValue,
                    MinDate = question.Validation.MinDate,
                    MaxDate = question.Validation.MaxDate
                },

            Options = question.Options
                .OrderBy(option => option.DisplayOrder)
                .Select(option => new QuestionOptionDetailsDto
                {
                    Id = option.Id,
                    Text = option.Text,
                    DisplayOrder = option.DisplayOrder
                })
                .ToList(),

            MatrixRows = question.MatrixRows
                .OrderBy(row => row.DisplayOrder)
                .Select(row => new MatrixItemDetailsDto
                {
                    Id = row.Id,
                    Text = row.Text,
                    DisplayOrder = row.DisplayOrder
                })
                .ToList(),

            MatrixColumns = question.MatrixColumns
                .OrderBy(column => column.DisplayOrder)
                .Select(column => new MatrixItemDetailsDto
                {
                    Id = column.Id,
                    Text = column.Text,
                    DisplayOrder = column.DisplayOrder
                })
                .ToList()
        };
    }

    public async Task<ApiResponse<FormCreatedDto>> CloseAsync(
    Guid publicId,
    int requesterUserId,
    CancellationToken cancellationToken = default)
    {
        // Form, paylaşım için kullanılan PublicId üzerinden bulunur.
        var form = await _context.Forms
            .FirstOrDefaultAsync(
                currentForm => currentForm.PublicId == publicId,
                cancellationToken);

        if (form is null)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                "Kapatılacak form bulunamadı.",
                404);
        }

        // Form sahibi veya Admin kapatma yetkisine sahiptir.
        var canManageForm = await CanManageFormAsync(
            form,
            requesterUserId,
            cancellationToken);

        if (!canManageForm)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                "Bu formu kapatma yetkiniz yok.",
                403);
        }

        if (form.Status != FormStatus.Published)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                "Yalnızca yayımlanmış formlar kapatılabilir.",
                400);
        }

        // Form kapatılır; cevaplar veritabanında korunur.
        form.Status = FormStatus.Closed;

        await _context.SaveChangesAsync(cancellationToken);

        var responseDto = new FormCreatedDto
        {
            Id = form.Id,
            PublicId = form.PublicId,
            Title = form.Title,
            Status = form.Status,
            AccessType = form.AccessType,
            CreatedAt = form.CreatedAt,
            ShowRespondentIdentity = form.ShowRespondentIdentity
        };

        return ApiResponse<FormCreatedDto>.SuccessResult(
            responseDto,
            "Form başarıyla kapatıldı.");
    }

    public async Task<ApiResponse<FormCreatedDto>> UpdateDraftAsync(
    Guid publicId,
    CreateFormDto updateFormDto,
    int requesterUserId,
    CancellationToken cancellationToken = default)
    {
        // Güncellenen form, öncelikle aynı Create/Question kurallarıyla doğrulanır.
        var validationErrors = _formRequestValidator.Validate(updateFormDto);

        if (validationErrors.Count > 0)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                validationErrors,
                "Form güncelleme doğrulaması başarısız.");
        }

        var form = await _context.Forms
            .Include(currentForm => currentForm.Questions)
            .Include(currentForm => currentForm.FormRoles)
            .FirstOrDefaultAsync(
        currentForm => currentForm.PublicId == publicId,
        cancellationToken);

        if (form is null)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                "Güncellenecek form bulunamadı.",
                404);
        }

        // Form sahibi veya Admin güncelleme yapabilir.
        var canManageForm = await CanManageFormAsync(
            form,
            requesterUserId,
            cancellationToken);

        if (!canManageForm)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                "Bu formu güncelleme yetkiniz yok.",
                403);
        }

        var roleScopeResult = await ValidateRoleScopeAsync(
            updateFormDto.RoleIds,
            requesterUserId,
            cancellationToken);

        if (!roleScopeResult.IsValid)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                roleScopeResult.ErrorMessage!,
                roleScopeResult.StatusCode);
        }

        // Yayınlanmış veya kapatılmış formlar bu endpoint ile değiştirilemez.
        if (form.Status != FormStatus.Draft)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                "Yalnızca taslak formlar güncellenebilir.",
                400);
        }

        // Taslak formun eski soru ağacı kaldırılır.
        // Soru altındaki seçenek, validation ve matrix kayıtları
        // veritabanındaki cascade kurallarıyla temizlenir.
        var oldQuestions = form.Questions.ToList();

        _context.Questions.RemoveRange(oldQuestions);
        form.Questions.Clear();

        // Formun kimliği ve sahibi korunur; düzenlenebilir alanlar güncellenir.
        form.Title = updateFormDto.Title.Trim();
        form.Description = NormalizeOptionalText(updateFormDto.Description);
        form.AccessType = updateFormDto.AccessType;
        form.ShowRespondentIdentity = updateFormDto.ShowRespondentIdentity;

        // Eski form-birim ilişkileri temizlenir.
        form.FormRoles.Clear();

        // Yeni birim ilişkileri eklenir.
        foreach (var roleId in roleScopeResult.RoleIds)
        {
            form.FormRoles.Add(new FormRole
            {
                FormId = form.Id,
                RoleId = roleId
            });
        }

        // Yeni soru ağacı oluşturulur.
        AddQuestionsToForm(form, updateFormDto.Questions);

        await _context.SaveChangesAsync(cancellationToken);

        var responseDto = new FormCreatedDto
        {
            Id = form.Id,
            PublicId = form.PublicId,
            Title = form.Title,
            Status = form.Status,
            AccessType = form.AccessType,
            CreatedAt = form.CreatedAt,
            ShowRespondentIdentity = form.ShowRespondentIdentity
        };

        return ApiResponse<FormCreatedDto>.SuccessResult(
            responseDto,
            "Taslak form başarıyla güncellendi.");
    }

    private static string? NormalizeOptionalText(string? value)
    {
        // Boş veya yalnızca boşluk içeren değerleri veritabanında null saklar.
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
    private async Task<(
    bool IsValid,
    List<int> RoleIds,
    string? ErrorMessage,
    int StatusCode)> ValidateRoleScopeAsync(
    List<int> requestedRoleIds,
    int userId,
    CancellationToken cancellationToken)
    {
        // Aynı rol Id'sinin iki kez gönderilmesini engeller.
        var roleIds = requestedRoleIds
            .Distinct()
            .ToList();

        if (roleIds.Count == 0)
        {
            return (
                false,
                roleIds,
                "Form en az bir birime ait olmalıdır.",
                400);
        }

        // Yalnızca aktif roller kabul edilir.
        var activeRoleIds = await _context.Roles
            .Where(role =>
                role.IsActive &&
                !role.IsSystemRole &&
                roleIds.Contains(role.Id))
            .Select(role => role.Id)
            .ToListAsync(cancellationToken);

        if (activeRoleIds.Count != roleIds.Count)
        {
            return (
                false,
                roleIds,
                "Form için geçersiz veya pasif birim rolü seçildi.",
                400);
        }

        // Admin tüm birimlere form atayabilir.
        var isAdmin = await _context.UserRoles
            .AnyAsync(
                userRole =>
                    userRole.UserId == userId &&
                    userRole.Role.Name == "Admin",
                cancellationToken);

        if (isAdmin)
        {
            return (
                true,
                roleIds,
                null,
                200);
        }

        // Normal kullanıcı yalnızca sahip olduğu rolleri seçebilir.
        var assignedRoleIds = await _context.UserRoles
            .Where(userRole =>
                userRole.UserId == userId &&
                roleIds.Contains(userRole.RoleId))
            .Select(userRole => userRole.RoleId)
            .ToListAsync(cancellationToken);

        var unauthorizedRoleIds = roleIds
            .Except(assignedRoleIds)
            .ToList();

        if (unauthorizedRoleIds.Count > 0)
        {
            return (
                false,
                roleIds,
                "Form için yetkiniz olmayan birim rolü seçildi.",
                403);
        }

        return (
            true,
            roleIds,
            null,
            200);
    }

    private async Task<bool> CanManageFormAsync(
    Form form,
    int requesterUserId,
    CancellationToken cancellationToken)
    {
        // Form sahibi kendi formunu yönetebilir.
        if (form.CreatedByUserId == requesterUserId)
        {
            return true;
        }

        // Admin tüm formları yönetebilir.
        // Diğer kullanıcılar, sahip oldukları rollerden biri forma atanmışsa
        // formu yönetebilir.
        return await _context.UserRoles.AnyAsync(
            userRole =>
                userRole.UserId == requesterUserId &&
                (
                    userRole.Role.Name == "Admin" ||
                    _context.FormRoles.Any(
                        formRole =>
                            formRole.FormId == form.Id &&
                            formRole.RoleId == userRole.RoleId)
                ),
            cancellationToken);
    }

    private static void AddQuestionsToForm(
    Form form,
    List<CreateQuestionDto> questionDtos)
    {
        for (var questionIndex = 0;
             questionIndex < questionDtos.Count;
             questionIndex++)
        {
            var questionDto = questionDtos[questionIndex];

            // DTO, veritabanı Question entity'sine dönüştürülür.
            var question = new Question
            {
                Form = form,
                Title = questionDto.Title.Trim(),
                Description = NormalizeOptionalText(questionDto.Description),
                Type = questionDto.Type,
                IsRequired = questionDto.IsRequired,
                DisplayOrder = questionIndex + 1,
                RatingMinLabel = NormalizeOptionalText(questionDto.RatingMinLabel),
                RatingMaxLabel = NormalizeOptionalText(questionDto.RatingMaxLabel),
                CreatedAt = DateTime.UtcNow
            };

            // Soruya ait validation kaydı oluşturulur.
            if (questionDto.Validation is not null)
            {
                question.Validation = new QuestionValidation
                {
                    Question = question,
                    MinLength = questionDto.Validation.MinLength,
                    MaxLength = questionDto.Validation.MaxLength,
                    RegexPattern = NormalizeOptionalText(
                        questionDto.Validation.RegexPattern),
                    MinValue = questionDto.Validation.MinValue,
                    MaxValue = questionDto.Validation.MaxValue,
                    MinDate = questionDto.Validation.MinDate,
                    MaxDate = questionDto.Validation.MaxDate
                };
            }

            // Radio ve checkbox seçenekleri oluşturulur.
            for (var optionIndex = 0;
                 optionIndex < questionDto.Options.Count;
                 optionIndex++)
            {
                question.Options.Add(new QuestionOption
                {
                    Question = question,
                    Text = questionDto.Options[optionIndex].Text.Trim(),
                    DisplayOrder = optionIndex + 1,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Matrix satırları oluşturulur.
            for (var rowIndex = 0;
                 rowIndex < questionDto.MatrixRows.Count;
                 rowIndex++)
            {
                question.MatrixRows.Add(new MatrixRow
                {
                    Question = question,
                    Text = questionDto.MatrixRows[rowIndex].Text.Trim(),
                    DisplayOrder = rowIndex + 1,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Matrix sütunları oluşturulur.
            for (var columnIndex = 0;
                 columnIndex < questionDto.MatrixColumns.Count;
                 columnIndex++)
            {
                question.MatrixColumns.Add(new MatrixColumn
                {
                    Question = question,
                    Text = questionDto.MatrixColumns[columnIndex].Text.Trim(),
                    DisplayOrder = columnIndex + 1,
                    CreatedAt = DateTime.UtcNow
                });
            }

            form.Questions.Add(question);
        }
    }
}