using System.Text.RegularExpressions;
using SurveyManagement.Application.DTOs.Options;
using SurveyManagement.Application.DTOs.Responses;
using SurveyManagement.Application.Interfaces.Options;
using SurveyManagement.Application.Interfaces.Responses;
using SurveyManagement.Domain.Entities;
using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Application.Services.Responses;

public class FormResponseValidator : IFormResponseValidator
{
    private readonly IOptionImportService? _optionImportService;

    public FormResponseValidator(IOptionImportService? optionImportService = null)
    {
        _optionImportService = optionImportService;
    }

    public List<string> Validate(
        Form form,
        SubmitFormResponseDto submitDto)
    {
        return ValidateAsync(form, submitDto, CancellationToken.None).GetAwaiter().GetResult();
    }

    public async Task<List<string>> ValidateAsync(
        Form form,
        SubmitFormResponseDto submitDto,
        CancellationToken cancellationToken = default)
    {
        var errors = new List<string>();
        var answers = submitDto.Answers ?? new List<SubmitAnswerDto>();

        var questionsById = form.Questions
            .ToDictionary(question => question.Id);

        var duplicateQuestionIds = answers
            .GroupBy(answer => answer.QuestionId)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key);

        foreach (var questionId in duplicateQuestionIds)
        {
            errors.Add(
                $"{questionId} numaralı soruya birden fazla cevap gönderilemez.");
        }

        foreach (var answer in answers)
        {
            if (!questionsById.ContainsKey(answer.QuestionId))
            {
                errors.Add(
                    $"{answer.QuestionId} numaralı soru bu forma ait değildir.");
            }
        }

        foreach (var question in form.Questions)
        {
            var answer = answers.FirstOrDefault(
                currentAnswer => currentAnswer.QuestionId == question.Id);

            if (answer is null)
            {
                if (question.IsRequired)
                {
                    errors.Add(
                        $"{question.DisplayOrder}. soru zorunludur.");
                }

                continue;
            }

            await ValidateQuestionAnswerAsync(question, answer, errors, cancellationToken);
        }

        return errors;
    }

    private async Task ValidateQuestionAnswerAsync(
        Question question,
        SubmitAnswerDto answer,
        List<string> errors,
        CancellationToken cancellationToken)
    {
        var prefix = $"{question.DisplayOrder}. soru";

        switch (question.Type)
        {
            case QuestionType.ShortText:
            case QuestionType.LongText:
                ValidateTextAnswer(question, answer, prefix, errors);
                break;

            case QuestionType.Date:
                ValidateDateAnswer(question, answer, prefix, errors);
                break;

            case QuestionType.Rating:
                ValidateRatingAnswer(question, answer, prefix, errors);
                break;

            case QuestionType.SingleChoice:
            case QuestionType.Dropdown:
            case QuestionType.MultipleChoice:
                await ValidateChoiceAnswerAsync(question, answer, prefix, errors, cancellationToken);
                break;

            case QuestionType.MultipleChoiceGrid:
            case QuestionType.CheckboxGrid:
                ValidateGridAnswer(question, answer, prefix, errors);
                break;
        }
    }

    private async Task ValidateChoiceAnswerAsync(
        Question question,
        SubmitAnswerDto answer,
        string prefix,
        List<string> errors,
        CancellationToken cancellationToken)
    {
        var selectedIds = answer.SelectedOptionIds ?? new List<int>();
        var selectedTexts = new List<string>();

        if (answer.SelectedOptionTexts != null && answer.SelectedOptionTexts.Count > 0)
        {
            selectedTexts.AddRange(answer.SelectedOptionTexts
                .Where(text => !string.IsNullOrWhiteSpace(text))
                .Select(text => text.Trim()));
        }
        else if (!string.IsNullOrWhiteSpace(answer.TextValue))
        {
            selectedTexts.Add(answer.TextValue.Trim());
        }

        var isSingleSelection = question.Type == QuestionType.SingleChoice || question.Type == QuestionType.Dropdown;

        if (selectedIds.Count == 0 && selectedTexts.Count == 0)
        {
            if (question.IsRequired)
            {
                errors.Add($"{prefix} için en az bir seçenek seçilmelidir.");
            }

            return;
        }

        if (isSingleSelection && (selectedIds.Count > 1 || selectedTexts.Count > 1))
        {
            errors.Add($"{prefix} yalnızca bir seçenek kabul eder.");
            return;
        }

        // 🌐 Harici API Dinamik Seçenek Kontrolü
        if (question.OptionSourceType == DynamicOptionSourceType.Api &&
            !string.IsNullOrWhiteSpace(question.OptionSourceUrl))
        {
            if (_optionImportService is not null)
            {
                var apiResult = await _optionImportService.PreviewFromUrlAsync(
                    new ImportOptionsFromUrlRequestDto
                    {
                        Url = question.OptionSourceUrl,
                        JsonPath = question.OptionJsonPath ?? string.Empty,
                        TextProperty = question.OptionTextProperty ?? "text"
                    },
                    cancellationToken);

                if (!apiResult.IsSuccess || apiResult.Data?.Options is null)
                {
                    errors.Add($"{prefix} için harici API seçenekleri doğrulanamadı.");
                    return;
                }

                var validApiOptions = apiResult.Data.Options;

                // ID gönderilmişse ve metin yoksa indeksten metne çevir
                if (selectedTexts.Count == 0 && selectedIds.Count > 0)
                {
                    foreach (var id in selectedIds)
                    {
                        if (id >= 1 && id <= validApiOptions.Count)
                        {
                            selectedTexts.Add(validApiOptions[id - 1]);
                        }
                        else
                        {
                            errors.Add($"{prefix} geçersiz bir seçenek içeriyor.");
                            return;
                        }
                    }
                }

                foreach (var selectedText in selectedTexts)
                {
                    if (!validApiOptions.Contains(selectedText, StringComparer.OrdinalIgnoreCase))
                    {
                        errors.Add($"{prefix} için seçilen '{selectedText}' seçeneği harici API kaynağında bulunamadı.");
                    }
                }
            }

            return;
        }

        // 📄 TXT Dosyası Dinamik Seçenek Kontrolü
        if (question.OptionSourceType == DynamicOptionSourceType.Txt &&
            !string.IsNullOrWhiteSpace(question.OptionFileContent))
        {
            var validLines = question.OptionFileContent
                .Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries)
                .Select(line => line.Trim())
                .Where(line => !string.IsNullOrWhiteSpace(line))
                .Distinct()
                .Take(500)
                .ToList();

            if (selectedTexts.Count == 0 && selectedIds.Count > 0)
            {
                foreach (var id in selectedIds)
                {
                    if (id >= 1 && id <= validLines.Count)
                    {
                        selectedTexts.Add(validLines[id - 1]);
                    }
                    else
                    {
                        errors.Add($"{prefix} geçersiz bir seçenek içeriyor.");
                        return;
                    }
                }
            }

            foreach (var selectedText in selectedTexts)
            {
                if (!validLines.Contains(selectedText, StringComparer.OrdinalIgnoreCase))
                {
                    errors.Add($"{prefix} için seçilen '{selectedText}' seçeneği geçerli bir seçenek değil.");
                }
            }

            return;
        }

        // Standart Veritabanı Seçenekleri Kontrolü
        if (question.Options.Count > 0)
        {
            if (selectedIds.Distinct().Count() != selectedIds.Count)
            {
                errors.Add($"{prefix} aynı seçenek birden fazla gönderilemez.");
            }

            var validOptionIds = question.Options
                .Select(option => option.Id)
                .ToHashSet();

            if (selectedIds.Any(id => !validOptionIds.Contains(id)))
            {
                errors.Add($"{prefix} geçersiz bir seçenek içeriyor.");
            }
        }
    }

    private static void ValidateTextAnswer(
        Question question,
        SubmitAnswerDto answer,
        string prefix,
        List<string> errors)
    {
        if (string.IsNullOrWhiteSpace(answer.TextValue))
        {
            if (question.IsRequired)
            {
                errors.Add($"{prefix} için cevap boş bırakılamaz.");
            }

            return;
        }

        var value = answer.TextValue.Trim();
        var validation = question.Validation;

        if (validation is null)
        {
            return;
        }

        if (validation.MinLength.HasValue &&
            value.Length < validation.MinLength.Value)
        {
            errors.Add(
                $"{prefix} en az {validation.MinLength} karakter olmalıdır.");
        }

        if (validation.MaxLength.HasValue &&
            value.Length > validation.MaxLength.Value)
        {
            errors.Add(
                $"{prefix} en fazla {validation.MaxLength} karakter olabilir.");
        }

        if (!string.IsNullOrWhiteSpace(validation.RegexPattern))
        {
            try
            {
                var isMatch = Regex.IsMatch(
                    value,
                    validation.RegexPattern,
                    RegexOptions.None,
                    TimeSpan.FromMilliseconds(100));

                if (!isMatch)
                {
                    errors.Add($"{prefix} geçerli formatta değildir.");
                }
            }
            catch (ArgumentException)
            {
                errors.Add($"{prefix} için regex kuralı geçersizdir.");
            }
        }
    }

    private static void ValidateDateAnswer(
        Question question,
        SubmitAnswerDto answer,
        string prefix,
        List<string> errors)
    {
        if (!answer.DateValue.HasValue)
        {
            if (question.IsRequired)
            {
                errors.Add($"{prefix} için tarih girilmelidir.");
            }

            return;
        }

        var date = answer.DateValue.Value;
        var validation = question.Validation;

        if (validation is null)
        {
            return;
        }

        if (validation.MinDate.HasValue &&
            date < validation.MinDate.Value)
        {
            errors.Add(
                $"{prefix} için tarih {validation.MinDate:yyyy-MM-dd} tarihinden önce olamaz.");
        }

        if (validation.MaxDate.HasValue &&
            date > validation.MaxDate.Value)
        {
            errors.Add(
                $"{prefix} için tarih {validation.MaxDate:yyyy-MM-dd} tarihinden sonra olamaz.");
        }
    }

    private static void ValidateRatingAnswer(
        Question question,
        SubmitAnswerDto answer,
        string prefix,
        List<string> errors)
    {
        if (!answer.NumericValue.HasValue)
        {
            if (question.IsRequired)
            {
                errors.Add($"{prefix} için puan girilmelidir.");
            }

            return;
        }

        var value = answer.NumericValue.Value;
        var validation = question.Validation;

        if (validation is null)
        {
            errors.Add($"{prefix} için puan aralığı tanımlanmamış.");
            return;
        }

        if (validation.MinValue.HasValue &&
            value < validation.MinValue.Value)
        {
            errors.Add($"{prefix} minimum puan değerinden küçük olamaz.");
        }

        if (validation.MaxValue.HasValue &&
            value > validation.MaxValue.Value)
        {
            errors.Add($"{prefix} maksimum puan değerinden büyük olamaz.");
        }

        if (decimal.Truncate(value) != value)
        {
            errors.Add($"{prefix} tam sayı bir puan olmalıdır.");
        }
    }


    private static void ValidateGridAnswer(
        Question question,
        SubmitAnswerDto answer,
        string prefix,
        List<string> errors)
    {
        var selections = answer.MatrixSelections
            ?? new List<SubmitMatrixCellDto>();

        if (selections.Count == 0)
        {
            if (question.IsRequired)
            {
                errors.Add($"{prefix} için tablo seçimi yapılmalıdır.");
            }

            return;
        }

        var validRowIds = question.MatrixRows
            .Select(row => row.Id)
            .ToHashSet();

        var validColumnIds = question.MatrixColumns
            .Select(column => column.Id)
            .ToHashSet();

        var duplicateCells = selections
            .GroupBy(selection =>
                new
                {
                    selection.MatrixRowId,
                    selection.MatrixColumnId
                })
            .Any(group => group.Count() > 1);

        if (duplicateCells)
        {
            errors.Add($"{prefix} aynı tablo hücresini birden fazla içeremez.");
        }

        if (selections.Any(selection =>
                !validRowIds.Contains(selection.MatrixRowId) ||
                !validColumnIds.Contains(selection.MatrixColumnId)))
        {
            errors.Add($"{prefix} geçersiz satır veya sütun içeriyor.");
        }

        var selectionsByRow = selections
            .GroupBy(selection => selection.MatrixRowId)
            .ToDictionary(group => group.Key, group => group.Count());

        if (question.Type == QuestionType.MultipleChoiceGrid &&
            selectionsByRow.Any(item => item.Value > 1))
        {
            errors.Add(
                $"{prefix} her satır için yalnızca bir sütun seçilebilir.");
        }

        if (question.IsRequired &&
            question.MatrixRows.Any(row =>
                !selectionsByRow.ContainsKey(row.Id)))
        {
            errors.Add(
                $"{prefix} içindeki tüm satırlar cevaplanmalıdır.");
        }
    }
}