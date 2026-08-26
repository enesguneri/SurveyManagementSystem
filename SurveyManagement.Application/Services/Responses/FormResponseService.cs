using Microsoft.EntityFrameworkCore;
using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Responses;
using SurveyManagement.Application.Interfaces.Context;
using SurveyManagement.Application.Interfaces.Responses;
using SurveyManagement.Domain.Entities;
using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Application.Services.Responses;

public class FormResponseService : IFormResponseService
{
    private readonly IAppDbContext _context;
    private readonly IFormResponseValidator _validator;

    public FormResponseService(
        IAppDbContext context,
        IFormResponseValidator validator)
    {
        _context = context;
        _validator = validator;
    }

    public async Task<ApiResponse<ResponseSubmittedDto>> SubmitAsync(
        Guid formPublicId,
        SubmitFormResponseDto submitDto,
        int? respondentUserId,
        string? respondentIpAddress,
        CancellationToken cancellationToken = default)
    {
        // Form ve cevap oluşturmak için gerekli alt kayıtlar birlikte yüklenir.
        var form = await _context.Forms
            .Include(currentForm => currentForm.Questions)
                .ThenInclude(question => question.Validation)
            .Include(currentForm => currentForm.Questions)
                .ThenInclude(question => question.Options)
            .Include(currentForm => currentForm.Questions)
                .ThenInclude(question => question.MatrixRows)
            .Include(currentForm => currentForm.Questions)
                .ThenInclude(question => question.MatrixColumns)
            .FirstOrDefaultAsync(
                currentForm => currentForm.PublicId == formPublicId,
                cancellationToken);

        if (form is null)
        {
            return ApiResponse<ResponseSubmittedDto>.FailureResult(
                "Yanıt gönderilecek form bulunamadı.",
                404);
        }

        // Sadece yayımlanmış formlar yanıt kabul eder.
        if (form.Status != FormStatus.Published)
        {
            return ApiResponse<ResponseSubmittedDto>.FailureResult(
                "Form şu anda yanıt kabul etmiyor.",
                400);
        }

        // Authenticated form için giriş yapmış kullanıcı zorunludur.
        if (form.AccessType == FormAccessType.Authenticated &&
            respondentUserId is null)
        {
            return ApiResponse<ResponseSubmittedDto>.FailureResult(
                "Bu forma yanıt vermek için giriş yapmalısınız.",
                401);
        }

        if (respondentUserId.HasValue)
        {
            var hasAlreadyResponded =
                await _context.FormResponses
                    .AsNoTracking()
                    .AnyAsync(
                        response =>
                            response.FormId == form.Id &&
                            response.RespondentUserId ==
                                respondentUserId.Value,
                        cancellationToken);

            if (hasAlreadyResponded)
            {
                return ApiResponse<ResponseSubmittedDto>
                    .FailureResult(
                        "Bu forma daha önce yanıt verdiniz.",
                        409);
            }
        }

        // Formdaki tüm cevaplar soru kurallarına göre doğrulanır.
        var validationErrors = _validator.Validate(form, submitDto);

        if (validationErrors.Count > 0)
        {
            return ApiResponse<ResponseSubmittedDto>.FailureResult(
                validationErrors,
                "Form yanıtları doğrulama kurallarını karşılamıyor.");
        }

        string? respondentName = null;
        string? respondentEmail = null;

        if (respondentUserId.HasValue)
        {
            // Kullanıcı adı istemciden alınmaz; güvenilir kaynaktan okunur.
            var respondentUser = await _context.Users
                .AsNoTracking()
                .Where(user =>
                    user.Id == respondentUserId.Value &&
                    user.IsActive)
                .Select(user => new
                {
                    user.Name,
                    user.Email
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (respondentUser is null)
            {
                return ApiResponse<ResponseSubmittedDto>.FailureResult(
                    "Yanıt gönderecek aktif kullanıcı bulunamadı.",
                    401);
            }

            respondentName = respondentUser.Name.Trim();
            respondentEmail = respondentUser.Email.Trim();
        }

        var normalizedIpAddress = string.IsNullOrWhiteSpace(respondentIpAddress)
            ? null
            : respondentIpAddress.Trim();

        if (normalizedIpAddress?.Length > 45)
        {
            return ApiResponse<ResponseSubmittedDto>.FailureResult(
                "Geçersiz IP adresi bilgisi.",
                400);
        }

        var submittedAt = DateTime.UtcNow;

        var formResponse = new FormResponse
        {
            FormId = form.Id,
            RespondentUserId = respondentUserId,
            RespondentNameSnapshot = respondentName,
            RespondentEmailSnapshot = respondentEmail,
            RespondentIpAddress = normalizedIpAddress,
            SubmittedAt = submittedAt
        };

        // Her soru için cevap entity'si oluşturulur.
        foreach (var question in form.Questions)
        {
            var answerDto = submitDto.Answers
                .FirstOrDefault(answer =>
                    answer.QuestionId == question.Id);

            if (answerDto is null ||
                !HasAnswerValue(question, answerDto))
            {
                continue;
            }

            var responseAnswer = new ResponseAnswer
            {
                QuestionId = question.Id
            };

            switch (question.Type)
            {
                case QuestionType.ShortText:
                case QuestionType.LongText:
                    responseAnswer.TextValue =
                        answerDto.TextValue?.Trim();
                    break;

                case QuestionType.Date:
                    responseAnswer.DateValue =
                        answerDto.DateValue;
                    break;

                case QuestionType.Rating:
                    responseAnswer.NumericValue =
                        answerDto.NumericValue;
                    break;

                case QuestionType.SingleChoice:
                case QuestionType.Dropdown:
                case QuestionType.MultipleChoice:
                    AddSelectedOptions(
                        responseAnswer,
                        question,
                        answerDto);
                    break;

                case QuestionType.MultipleChoiceGrid:
                case QuestionType.CheckboxGrid:
                    AddMatrixSelections(
                        responseAnswer,
                        answerDto);
                    break;
            }

            formResponse.Answers.Add(responseAnswer);
        }

        _context.FormResponses.Add(formResponse);
        await _context.SaveChangesAsync(cancellationToken);

        var responseDto = new ResponseSubmittedDto
        {
            FormResponseId = formResponse.Id,
            FormPublicId = form.PublicId,
            SubmittedAt = submittedAt
        };

        return ApiResponse<ResponseSubmittedDto>.SuccessResult(
            responseDto,
            "Form yanıtı başarıyla kaydedildi.");
    }

    public async Task<ApiResponse<FormResponsesDto>> GetByFormAsync(
    Guid formPublicId,
    int requesterUserId,
    CancellationToken cancellationToken = default)
    {
        // Önce form bulunur; sonuçların hangi forma ait olduğu doğrulanır.
        var form = await _context.Forms
            .AsNoTracking()
            .FirstOrDefaultAsync(
                currentForm => currentForm.PublicId == formPublicId,
                cancellationToken);

        if (form is null)
        {
            return ApiResponse<FormResponsesDto>.FailureResult(
                "Yanıtları listelenecek form bulunamadı.",
                404);
        }

        // Yalnızca form sahibi veya Admin sonuçları görebilir.
        var canViewResponses = await CanManageFormAsync(
            form,
            requesterUserId,
            cancellationToken);

        if (!canViewResponses)
        {
            return ApiResponse<FormResponsesDto>.FailureResult(
                "Bu formun yanıtlarını görüntüleme yetkiniz yok.",
                403);
        }

        // Yanıtlar, cevapların seçenek ve matris ilişkileriyle birlikte yüklenir.
        var responses = await _context.FormResponses
            .AsNoTracking()
            .Where(response => response.FormId == form.Id)
            .Include(response => response.Answers)
                .ThenInclude(answer => answer.Question)
            .Include(response => response.Answers)
                .ThenInclude(answer => answer.SelectedOptions)
                    .ThenInclude(selection => selection.QuestionOption)
            .Include(response => response.Answers)
                .ThenInclude(answer => answer.MatrixAnswers)
                    .ThenInclude(matrixAnswer => matrixAnswer.MatrixRow)
            .Include(response => response.Answers)
                .ThenInclude(answer => answer.MatrixAnswers)
                    .ThenInclude(matrixAnswer => matrixAnswer.MatrixColumn)
            .OrderByDescending(response => response.SubmittedAt)
            .ToListAsync(cancellationToken);

        var responseDto = new FormResponsesDto
        {
            FormPublicId = form.PublicId,
            Title = form.Title,
            ShowRespondentIdentity = form.ShowRespondentIdentity,
            Responses = responses
                .Select(response => new FormResponseItemDto
                {
                    Id = response.Id,

                    // İsim veritabanında tutulur; burada yalnızca form ayarı izin
                    // veriyorsa frontend'e aktarılır.
                    RespondentName = form.ShowRespondentIdentity
                        ? response.RespondentNameSnapshot
                        : null,

                    RespondentEmail = form.ShowRespondentIdentity
                        ? response.RespondentEmailSnapshot
                        : null,

                    RespondentIpAddress = form.ShowRespondentIdentity
                        ? response.RespondentIpAddress
                        : null,

                    SubmittedAt = response.SubmittedAt,
                    Answers = response.Answers
                        .OrderBy(answer => answer.Question.DisplayOrder)
                        .Select(answer => new ResponseAnswerDetailsDto
                        {
                            QuestionId = answer.QuestionId,
                            QuestionTitle = answer.Question.Title,
                            QuestionType = answer.Question.Type,
                            TextValue = answer.TextValue,
                            NumericValue = answer.NumericValue,
                            DateValue = answer.DateValue,

                            SelectedOptions = answer.SelectedOptions
                                .Select(selection =>
                                    new ResponseSelectedOptionDto
                                    {
                                        Id = selection.QuestionOptionId,
                                        Text = selection.QuestionOption.Text
                                    })
                                .ToList(),

                            MatrixSelections = answer.MatrixAnswers
                                .Select(matrixAnswer =>
                                    new ResponseMatrixSelectionDto
                                    {
                                        MatrixRowId = matrixAnswer.MatrixRowId,
                                        MatrixRowText = matrixAnswer.MatrixRow.Text,
                                        MatrixColumnId = matrixAnswer.MatrixColumnId,
                                        MatrixColumnText =
                                            matrixAnswer.MatrixColumn.Text
                                    })
                                .ToList()
                        })
                        .ToList()
                })
                .ToList()
        };

        return ApiResponse<FormResponsesDto>.SuccessResult(responseDto);
    }

    private static bool HasAnswerValue(
        Question question,
        SubmitAnswerDto answer)
    {
        return question.Type switch
        {
            QuestionType.ShortText or QuestionType.LongText =>
                !string.IsNullOrWhiteSpace(answer.TextValue),

            QuestionType.Date =>
                answer.DateValue.HasValue,

            QuestionType.Rating =>
                answer.NumericValue.HasValue,

            QuestionType.SingleChoice or QuestionType.Dropdown or QuestionType.MultipleChoice =>
                answer.SelectedOptionIds.Count > 0,

            QuestionType.MultipleChoiceGrid or QuestionType.CheckboxGrid =>
                answer.MatrixSelections.Count > 0,

            _ => false
        };
    }

    private static void AddSelectedOptions(
        ResponseAnswer responseAnswer,
        Question question,
        SubmitAnswerDto answerDto)
    {
        var selectedOptionIds = answerDto.SelectedOptionIds
            .Distinct()
            .ToHashSet();

        var selectedOptions = question.Options
            .Where(option => selectedOptionIds.Contains(option.Id));

        foreach (var option in selectedOptions)
        {
            responseAnswer.SelectedOptions.Add(
                new ResponseAnswerOption
                {
                    QuestionOptionId = option.Id
                });
        }
    }

    private static void AddMatrixSelections(
        ResponseAnswer responseAnswer,
        SubmitAnswerDto answerDto)
    {
        var selections = answerDto.MatrixSelections
            .DistinctBy(selection =>
                new
                {
                    selection.MatrixRowId,
                    selection.MatrixColumnId
                });

        foreach (var selection in selections)
        {
            responseAnswer.MatrixAnswers.Add(
                new ResponseMatrixAnswer
                {
                    MatrixRowId = selection.MatrixRowId,
                    MatrixColumnId = selection.MatrixColumnId
                });
        }
    }

    private async Task<bool> CanManageFormAsync(
    Form form,
    int requesterUserId,
    CancellationToken cancellationToken)
    {
        // Form sahibi kendi formunun yanıtlarını görebilir.
        if (form.CreatedByUserId == requesterUserId)
        {
            return true;
        }

        // Admin tüm formların yanıtlarını görebilir.
        // Birim rolüne sahip kullanıcılar ise
        // kendi birimlerine bağlı formların yanıtlarını görebilir.
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
}