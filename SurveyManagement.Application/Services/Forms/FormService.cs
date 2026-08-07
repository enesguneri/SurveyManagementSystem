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
            CreatedAt = DateTime.UtcNow
        };

        // Liste sırası, soruların ve alt öğelerin görüntülenme sırasını belirler.
        for (var questionIndex = 0; questionIndex < createFormDto.Questions.Count; questionIndex++)
        {
            var questionDto = createFormDto.Questions[questionIndex];

            var question = new Question
            {
                Title = questionDto.Title.Trim(),
                Description = NormalizeOptionalText(questionDto.Description),
                Type = questionDto.Type,
                IsRequired = questionDto.IsRequired,
                DisplayOrder = questionIndex + 1,
                RatingMinLabel = NormalizeOptionalText(questionDto.RatingMinLabel),
                RatingMaxLabel = NormalizeOptionalText(questionDto.RatingMaxLabel),
                CreatedAt = DateTime.UtcNow
            };

            // Doğrulama nesnesi yalnızca ilgili soru için gönderilmişse oluşturulur.
            if (questionDto.Validation is not null)
            {
                question.Validation = new QuestionValidation
                {
                    MinLength = questionDto.Validation.MinLength,
                    MaxLength = questionDto.Validation.MaxLength,
                    RegexPattern = NormalizeOptionalText(questionDto.Validation.RegexPattern),
                    MinValue = questionDto.Validation.MinValue,
                    MaxValue = questionDto.Validation.MaxValue
                };
            }

            // Radio ve checkbox soru türlerinin seçenekleri eklenir.
            for (var optionIndex = 0; optionIndex < questionDto.Options.Count; optionIndex++)
            {
                question.Options.Add(new QuestionOption
                {
                    Text = questionDto.Options[optionIndex].Text.Trim(),
                    DisplayOrder = optionIndex + 1,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Tablo sorularının satırları eklenir.
            for (var rowIndex = 0; rowIndex < questionDto.MatrixRows.Count; rowIndex++)
            {
                question.MatrixRows.Add(new MatrixRow
                {
                    Text = questionDto.MatrixRows[rowIndex].Text.Trim(),
                    DisplayOrder = rowIndex + 1,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Tablo sorularının sütunları eklenir.
            for (var columnIndex = 0; columnIndex < questionDto.MatrixColumns.Count; columnIndex++)
            {
                question.MatrixColumns.Add(new MatrixColumn
                {
                    Text = questionDto.MatrixColumns[columnIndex].Text.Trim(),
                    DisplayOrder = columnIndex + 1,
                    CreatedAt = DateTime.UtcNow
                });
            }

            form.Questions.Add(question);
        }

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
            CreatedAt = form.CreatedAt
        };

        return ApiResponse<FormCreatedDto>.SuccessResult(
            responseDto,
            "Form taslak olarak başarıyla oluşturuldu.");
    }

    private static string? NormalizeOptionalText(string? value)
    {
        // Boş veya yalnızca boşluk içeren değerleri veritabanında null saklar.
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}