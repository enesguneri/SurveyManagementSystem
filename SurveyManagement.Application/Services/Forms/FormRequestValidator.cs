using System.Text.RegularExpressions;
using SurveyManagement.Application.DTOs.Forms;
using SurveyManagement.Application.Interfaces.Forms;
using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Application.Services.Forms;

public class FormRequestValidator : IFormRequestValidator
{
    public List<string> Validate(CreateFormDto createFormDto)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(createFormDto.Title))
        {
            errors.Add("Form başlığı boş olamaz.");
        }

        if (createFormDto.Questions.Count == 0)
        {
            errors.Add("Form en az bir soru içermelidir.");
        }

        for (var index = 0; index < createFormDto.Questions.Count; index++)
        {
            ValidateQuestion(createFormDto.Questions[index], index + 1, errors);
        }

        return errors;
    }

    private static void ValidateQuestion(
        CreateQuestionDto question,
        int questionNumber,
        List<string> errors)
    {
        var prefix = $"{questionNumber}. soru";

        if (string.IsNullOrWhiteSpace(question.Title))
        {
            errors.Add($"{prefix} başlığı boş olamaz.");
        }

        if (!Enum.IsDefined(question.Type))
        {
            errors.Add($"{prefix} için geçersiz soru türü gönderildi.");
            return;
        }

        if (question.Type != QuestionType.Date && (question.Validation?.MinDate.HasValue == true ||
            question.Validation?.MaxDate.HasValue == true))
        {
            errors.Add(
                $"{prefix} tarih aralığı yalnızca Date tipi sorularda kullanılabilir.");
        }

        switch (question.Type)
        {
            case QuestionType.ShortText:
            case QuestionType.LongText:
                ValidateTextQuestion(question, prefix, errors);
                break;

            case QuestionType.SingleChoice:
            case QuestionType.MultipleChoice:
                ValidateChoiceQuestion(question, prefix, errors);
                break;

            case QuestionType.Rating:
                ValidateRatingQuestion(question, prefix, errors);
                break;

            case QuestionType.MultipleChoiceGrid:
            case QuestionType.CheckboxGrid:
                ValidateGridQuestion(question, prefix, errors);
                break;

            case QuestionType.Date:
                ValidateDateQuestion(question, prefix, errors);
                break;
        }
    }

    private static void ValidateTextQuestion(
        CreateQuestionDto question,
        string prefix,
        List<string> errors)
    {
        EnsureNoOptions(question, prefix, errors);
        EnsureNoMatrix(question, prefix, errors);

        if (question.Validation is null)
        {
            return;
        }

        var validation = question.Validation;

        if (validation.MinLength is < 0 || validation.MaxLength is < 0)
        {
            errors.Add($"{prefix} için karakter sınırları negatif olamaz.");
        }

        if (validation.MinLength.HasValue &&
            validation.MaxLength.HasValue &&
            validation.MinLength > validation.MaxLength)
        {
            errors.Add($"{prefix} için minimum karakter sayısı maksimumdan büyük olamaz.");
        }

        if (validation.MinValue.HasValue || validation.MaxValue.HasValue)
        {
            errors.Add($"{prefix} metin sorusunda sayısal değer sınırı kullanılamaz.");
        }

        if (!string.IsNullOrWhiteSpace(validation.RegexPattern))
        {
            try
            {
                _ = new Regex(
                    validation.RegexPattern,
                    RegexOptions.None,
                    TimeSpan.FromMilliseconds(100));
            }
            catch (ArgumentException)
            {
                errors.Add($"{prefix} için geçersiz regex deseni girildi.");
            }
        }
    }

    private static void ValidateChoiceQuestion(
        CreateQuestionDto question,
        string prefix,
        List<string> errors)
    {
        EnsureNoMatrix(question, prefix, errors);

        if (question.Validation is not null)
        {
            errors.Add($"{prefix} seçim sorusunda ek doğrulama tanımlanamaz.");
        }

        if (question.Options.Count < 2)
        {
            errors.Add($"{prefix} en az iki seçenek içermelidir.");
            return;
        }

        if (question.Options.Any(option => string.IsNullOrWhiteSpace(option.Text)))
        {
            errors.Add($"{prefix} boş seçenek içeremez.");
        }

        var optionTexts = question.Options
            .Select(option => option.Text.Trim())
            .ToList();

        if (optionTexts.Distinct(StringComparer.OrdinalIgnoreCase).Count() != optionTexts.Count)
        {
            errors.Add($"{prefix} aynı seçeneği birden fazla içeremez.");
        }
    }

    private static void ValidateRatingQuestion(
        CreateQuestionDto question,
        string prefix,
        List<string> errors)
    {
        EnsureNoOptions(question, prefix, errors);
        EnsureNoMatrix(question, prefix, errors);

        if (question.Validation is null ||
            !question.Validation.MinValue.HasValue ||
            !question.Validation.MaxValue.HasValue)
        {
            errors.Add($"{prefix} derecelendirme sorusu minimum ve maksimum değer içermelidir.");
            return;
        }

        var validation = question.Validation;

        if (validation.MinLength.HasValue ||
            validation.MaxLength.HasValue ||
            !string.IsNullOrWhiteSpace(validation.RegexPattern))
        {
            errors.Add($"{prefix} derecelendirme sorusunda metin doğrulaması kullanılamaz.");
        }

        if (validation.MinValue >= validation.MaxValue)
        {
            errors.Add($"{prefix} için minimum değer maksimum değerden küçük olmalıdır.");
        }

        if (validation.MinValue < 0 || validation.MaxValue > 10)
        {
            errors.Add($"{prefix} derecelendirme aralığı 0 ile 10 arasında olmalıdır.");
        }

        if (decimal.Truncate(validation.MinValue.Value) != validation.MinValue ||
            decimal.Truncate(validation.MaxValue.Value) != validation.MaxValue)
        {
            errors.Add($"{prefix} derecelendirme değerleri tam sayı olmalıdır.");
        }
    }

    private static void ValidateGridQuestion(
        CreateQuestionDto question,
        string prefix,
        List<string> errors)
    {
        EnsureNoOptions(question, prefix, errors);

        if (question.Validation is not null)
        {
            errors.Add($"{prefix} tablo sorusunda ek doğrulama tanımlanamaz.");
        }

        if (question.MatrixRows.Count == 0)
        {
            errors.Add($"{prefix} en az bir tablo satırı içermelidir.");
        }

        if (question.MatrixColumns.Count == 0)
        {
            errors.Add($"{prefix} en az bir tablo sütunu içermelidir.");
        }

        if (question.MatrixRows.Any(row => string.IsNullOrWhiteSpace(row.Text)))
        {
            errors.Add($"{prefix} boş tablo satırı içeremez.");
        }

        if (question.MatrixColumns.Any(column => string.IsNullOrWhiteSpace(column.Text)))
        {
            errors.Add($"{prefix} boş tablo sütunu içeremez.");
        }

        var rowTexts = question.MatrixRows.Select(row => row.Text.Trim()).ToList();
        var columnTexts = question.MatrixColumns.Select(column => column.Text.Trim()).ToList();

        if (rowTexts.Distinct(StringComparer.OrdinalIgnoreCase).Count() != rowTexts.Count)
        {
            errors.Add($"{prefix} aynı tablo satırını birden fazla içeremez.");
        }

        if (columnTexts.Distinct(StringComparer.OrdinalIgnoreCase).Count() != columnTexts.Count)
        {
            errors.Add($"{prefix} aynı tablo sütununu birden fazla içeremez.");
        }
    }

    private static void EnsureNoOptions(
        CreateQuestionDto question,
        string prefix,
        List<string> errors)
    {
        if (question.Options.Count > 0)
        {
            errors.Add($"{prefix} bu soru türünde seçenek içeremez.");
        }
    }

    private static void EnsureNoMatrix(
        CreateQuestionDto question,
        string prefix,
        List<string> errors)
    {
        if (question.MatrixRows.Count > 0 || question.MatrixColumns.Count > 0)
        {
            errors.Add($"{prefix} bu soru türünde tablo satırı veya sütunu içeremez.");
        }
    }

    private static void ValidateDateQuestion(
    CreateQuestionDto question,
    string prefix,
    List<string> errors)
    {
        EnsureNoOptions(question, prefix, errors);
        EnsureNoMatrix(question, prefix, errors);

        if (question.Validation is null)
        {
            return;
        }

        var validation = question.Validation;

        if (validation.MinLength.HasValue ||
            validation.MaxLength.HasValue ||
            !string.IsNullOrWhiteSpace(validation.RegexPattern) ||
            validation.MinValue.HasValue ||
            validation.MaxValue.HasValue)
        {
            errors.Add(
                $"{prefix} tarih sorusunda metin veya sayısal doğrulama kullanılamaz.");
        }

        if (validation.MinDate.HasValue &&
            validation.MaxDate.HasValue &&
            validation.MinDate > validation.MaxDate)
        {
            errors.Add(
                $"{prefix} için minimum tarih maksimum tarihten büyük olamaz.");
        }
    }
}