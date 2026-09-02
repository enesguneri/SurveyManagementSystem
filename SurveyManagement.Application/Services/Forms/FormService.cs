using Microsoft.EntityFrameworkCore;
using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Forms;
using SurveyManagement.Application.DTOs.Options;
using SurveyManagement.Application.Interfaces.Context;
using SurveyManagement.Application.Interfaces.Forms;
using SurveyManagement.Application.Interfaces.Options;
using SurveyManagement.Application.Interfaces.Services;
using SurveyManagement.Domain.Entities;
using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Application.Services.Forms;

public class FormService : IFormService
{
    private readonly IAppDbContext _context;
    private readonly IFormRequestValidator _formRequestValidator;
    private readonly IFormAuthorizationService _formAuthorizationService;
    private readonly IOptionImportService? _optionImportService;

    public FormService(
        IAppDbContext context,
        IFormRequestValidator formRequestValidator,
        IFormAuthorizationService formAuthorizationService,
        IOptionImportService? optionImportService = null)
    {
        _context = context;
        _formRequestValidator = formRequestValidator;
        _formAuthorizationService = formAuthorizationService;
        _optionImportService = optionImportService;
    }

    public async Task<ApiResponse<List<ManageableFormDto>>> GetManageableAsync(
    int requesterUserId,
    CancellationToken cancellationToken = default)
    {
        // Kullanıcının Admin rolüne sahip olup olmadığı kontrol edilir.
        var isAdmin = await _context.UserRoles
            .AnyAsync(
                userRole =>
                    userRole.UserId == requesterUserId &&
                    userRole.Role.Name == "Admin" &&
                    userRole.Role.IsActive,
                cancellationToken);

        // Kullanıcının aktif birim rolleri alınır.
        var assignedRoleIds = await _context.UserRoles
            .Where(
                userRole =>
                    userRole.UserId == requesterUserId &&
                    userRole.Role.IsActive)
            .Select(userRole => userRole.RoleId)
            .ToListAsync(cancellationToken);

        // Filtreleme veritabanı seviyesinde yapılır.
        var forms = await _context.Forms
            .AsNoTracking()
            .Where(
                form =>
                    isAdmin ||
                    form.CreatedByUserId == requesterUserId ||
                    form.FormRoles.Any(
                        formRole =>
                            formRole.Role.IsActive &&
                            assignedRoleIds.Contains(formRole.RoleId)))
            .OrderByDescending(form => form.CreatedAt)
            .Select(
                form => new ManageableFormDto
                {
                    Id = form.Id,
                    PublicId = form.PublicId,
                    Title = form.Title,
                    Description = form.Description,
                    Status = form.Status,
                    AccessType = form.AccessType,
                    CreatedAt = form.CreatedAt,
                    CreatedByUserId = form.CreatedByUserId,
                    CreatedByUserName = form.CreatedByUser.Name,
                    RoleNames = form.FormRoles
                        .Where(formRole => formRole.Role.IsActive)
                        .OrderBy(formRole => formRole.Role.Name)
                        .Select(formRole => formRole.Role.Name)
                        .ToList(),
                    ResponseCount = form.Responses.Count()
                })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<ManageableFormDto>>.SuccessResult(
            forms);
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

    public async Task<ApiResponse<FormDetailsDto>>
    GetManageableByPublicIdAsync(
        Guid publicId,
        int requesterUserId,
        CancellationToken cancellationToken = default)
    {
        // Form, soruları ve birim ilişkileriyle birlikte yüklenir.
        var form = await _context.Forms
            .AsNoTracking()
            .Include(currentForm => currentForm.Questions)
                .ThenInclude(question => question.Validation)
            .Include(currentForm => currentForm.Questions)
                .ThenInclude(question => question.Options)
            .Include(currentForm => currentForm.Questions)
                .ThenInclude(question => question.MatrixRows)
            .Include(currentForm => currentForm.Questions)
                .ThenInclude(question => question.MatrixColumns)
            .Include(currentForm => currentForm.FormRoles)
                .ThenInclude(formRole => formRole.Role)
            .FirstOrDefaultAsync(
                currentForm => currentForm.PublicId == publicId,
                cancellationToken);

        if (form is null)
        {
            return ApiResponse<FormDetailsDto>.FailureResult(
                "Form bulunamadı.",
                404);
        }

        // Form sahibi, Admin veya ilgili birim kullanıcısı kontrol edilir.
        var canManageForm = await _formAuthorizationService.CanManageFormAsync(
            form,
            requesterUserId,
            cancellationToken);

        if (!canManageForm)
        {
            return ApiResponse<FormDetailsDto>.FailureResult(
                "Bu formu görüntüleme yetkiniz yok.",
                403);
        }

        // Bu endpoint taslak veya yayındaki formların düzenleme ekranı içindir.
        if (form.Status == FormStatus.Closed)
        {
            return ApiResponse<FormDetailsDto>.FailureResult(
                "Kapatılmış formlar düzenlenemez.",
                400);
        }

        var responseDto = new FormDetailsDto
        {
            PublicId = form.PublicId,
            Title = form.Title,
            Description = form.Description,
            Status = form.Status,
            AccessType = form.AccessType,
            ShowRespondentIdentity = form.ShowRespondentIdentity,

            // Formun bağlı olduğu aktif birim rollerinin Id değerleri.
            RoleIds = form.FormRoles
                .Where(formRole => formRole.Role.IsActive)
                .Select(formRole => formRole.RoleId)
                .ToList(),

            Questions = form.Questions
                .OrderBy(question => question.DisplayOrder)
                .Select(MapQuestionDetails)
                .ToList()
        };

        return ApiResponse<FormDetailsDto>.SuccessResult(
            responseDto);
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

        // Yetki kontrolü
        var canManageForm = await _formAuthorizationService.CanManageFormAsync(
            form,
            requesterUserId,
            cancellationToken);

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

    public async Task<ApiResponse<FormCreatedDto>> ReopenAsync(
        Guid publicId,
        int requesterUserId,
        CancellationToken cancellationToken = default)
    {
        var form = await _context.Forms
            .FirstOrDefaultAsync(
                currentForm => currentForm.PublicId == publicId,
                cancellationToken);

        if (form is null)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                "Yeniden yayınlanacak form bulunamadı.",
                404);
        }

        var canManageForm = await _formAuthorizationService.CanManageFormAsync(
            form,
            requesterUserId,
            cancellationToken);

        if (!canManageForm)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                "Bu formu yeniden yayınlama yetkiniz yok.",
                403);
        }

        if (form.Status == FormStatus.Published)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                "Form zaten yayında.",
                400);
        }

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
            "Form başarıyla yeniden yayımlandı.");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(
        Guid publicId,
        int requesterUserId,
        CancellationToken cancellationToken = default)
    {
        var form = await _context.Forms
            .FirstOrDefaultAsync(
                f => f.PublicId == publicId,
                cancellationToken);

        if (form is null)
        {
            return ApiResponse<bool>.FailureResult(
                "Silinecek form bulunamadı.",
                404);
        }

        var canManageForm = await _formAuthorizationService.CanManageFormAsync(
            form,
            requesterUserId,
            cancellationToken);

        if (!canManageForm)
        {
            return ApiResponse<bool>.FailureResult(
                "Bu formu silme yetkiniz yok.",
                403);
        }

        _context.Forms.Remove(form);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResult(
            true,
            "Form ve tüm ilişkili verileri başarıyla silindi.");
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

        // Kapatılmış anketlerde anket yöneticisine önizleme izni verilir.
        if (form.Status != FormStatus.Published)
        {
            if (form.Status == FormStatus.Closed && requesterUserId.HasValue)
            {
                var canManageForm = await _formAuthorizationService.CanManageFormAsync(
                    form,
                    requesterUserId.Value,
                    cancellationToken);

                if (canManageForm)
                {
                    var previewDto = new FormDetailsDto
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
                        ShowRespondentIdentity = form.ShowRespondentIdentity,
                        HasCurrentUserResponded = false,
                        IsClosedPreview = true
                    };

                    return ApiResponse<FormDetailsDto>.SuccessResult(previewDto);
                }
            }

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

        var hasCurrentUserResponded = requesterUserId.HasValue && await _context.FormResponses
            .AsNoTracking()
            .AnyAsync(
                response =>
                    response.FormId == form.Id &&
                    response.RespondentUserId == requesterUserId.Value,
            cancellationToken);

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
            ShowRespondentIdentity = form.ShowRespondentIdentity,
            HasCurrentUserResponded = hasCurrentUserResponded,
            IsClosedPreview = false
        };

        return ApiResponse<FormDetailsDto>.SuccessResult(responseDto);
    }

    private QuestionDetailsDto MapQuestionDetails(Question question)
    {
        var options = question.Options
            .OrderBy(option => option.DisplayOrder)
            .Select(option => new QuestionOptionDetailsDto
            {
                Id = option.Id,
                Text = option.Text,
                DisplayOrder = option.DisplayOrder
            })
            .ToList();

        // Eğer TXT kaynağından dinamik seçenek tanımlıysa ve options tablosu boşsa TXT satırlarından seçenek listesini oluşturur.
        if (options.Count == 0 &&
            question.OptionSourceType == DynamicOptionSourceType.Txt &&
            !string.IsNullOrWhiteSpace(question.OptionFileContent))
        {
            var lines = question.OptionFileContent
                .Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries)
                .Select(line => line.Trim())
                .Where(line => !string.IsNullOrWhiteSpace(line))
                .Distinct()
                .Take(500)
                .ToList();

            for (var i = 0; i < lines.Count; i++)
            {
                options.Add(new QuestionOptionDetailsDto
                {
                    Id = i + 1,
                    Text = lines[i],
                    DisplayOrder = i + 1
                });
            }
        }

        // Eğer API kaynağından dinamik seçenek tanımlıysa ve options tablosu henüz boşsa API'den seçenek listesini yükler.
        if (options.Count == 0 &&
            question.OptionSourceType == DynamicOptionSourceType.Api &&
            !string.IsNullOrWhiteSpace(question.OptionSourceUrl) &&
            _optionImportService != null)
        {
            try
            {
                var apiResult = _optionImportService.PreviewFromUrlAsync(
                    new ImportOptionsFromUrlRequestDto
                    {
                        Url = question.OptionSourceUrl,
                        JsonPath = question.OptionJsonPath ?? string.Empty,
                        TextProperty = question.OptionTextProperty ?? "text"
                    },
                    CancellationToken.None).GetAwaiter().GetResult();

                if (apiResult.IsSuccess && apiResult.Data?.Options != null)
                {
                    for (var i = 0; i < apiResult.Data.Options.Count; i++)
                    {
                        options.Add(new QuestionOptionDetailsDto
                        {
                            Id = i + 1,
                            Text = apiResult.Data.Options[i],
                            DisplayOrder = i + 1
                        });
                    }
                }
            }
            catch
            {
                // API erişilemezse boş seçenek döner.
            }
        }

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
            OptionSourceType = question.OptionSourceType,
            OptionSourceUrl = question.OptionSourceUrl,
            OptionJsonPath = question.OptionJsonPath,
            OptionTextProperty = question.OptionTextProperty,
            OptionFileContent = question.OptionFileContent,

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

            Options = options,

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
        var canManageForm = await _formAuthorizationService.CanManageFormAsync(
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
        var canManageForm = await _formAuthorizationService.CanManageFormAsync(
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

        // Kapatılmış formlar bu endpoint ile değiştirilemez.
        if (form.Status == FormStatus.Closed)
        {
            return ApiResponse<FormCreatedDto>.FailureResult(
                "Kapatılmış formlar güncellenemez.",
                400);
        }

        var hasResponses = await _context.FormResponses
            .AnyAsync(r => r.FormId == form.Id, cancellationToken);

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

        // Eğer forma henüz yanıt verilmemişse sorular tamamen yenilenir.
        if (!hasResponses)
        {
            var oldQuestions = form.Questions.ToList();
            _context.Questions.RemoveRange(oldQuestions);
            form.Questions.Clear();

            // Yeni soru ağacı oluşturulur.
            AddQuestionsToForm(form, updateFormDto.Questions);
        }

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

        // Birim seçimi isteğe bağlıdır.
        // Boş liste, formun belirli bir birime bağlanmadığı anlamına gelir.
        if (roleIds.Count == 0)
        {
            return (
                true,
                roleIds,
                null,
                200);
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
                OptionSourceType = questionDto.OptionSourceType,
                OptionSourceUrl = NormalizeOptionalText(questionDto.OptionSourceUrl),
                OptionJsonPath = NormalizeOptionalText(questionDto.OptionJsonPath),
                OptionTextProperty = NormalizeOptionalText(questionDto.OptionTextProperty),
                OptionFileContent = questionDto.OptionFileContent,
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
            // Dinamik seçenek tanımlıysa (API / TXT) başlangıçta veritabanına seçenek kaydı yapılmaz;
            // seçenekler kullanıcılar işaretledikçe veritabanına eklenecektir.
            if (questionDto.OptionSourceType == DynamicOptionSourceType.None)
            {
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