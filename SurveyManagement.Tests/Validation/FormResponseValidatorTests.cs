using Moq;
using SurveyManagement.Application.DTOs.Responses;
using SurveyManagement.Application.Services.Responses;
using SurveyManagement.Domain.Entities;
using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Tests.Validation;

public class FormResponseValidatorTests
{
    private readonly FormResponseValidator _sut = new();

    private static Form CreateTestFormWithQuestion(Question question)
    {
        var form = new Form
        {
            Id = 1,
            PublicId = Guid.NewGuid(),
            Title = "Test Form",
            Questions = new List<Question> { question }
        };
        question.FormId = form.Id;
        question.Form = form;
        return form;
    }

    [Fact]
    public void Validate_WhenRequiredQuestionNotAnswered_ShouldReturnError()
    {
        // Arrange
        var question = new Question
        {
            Id = 10,
            DisplayOrder = 1,
            Title = "Zorunlu Soru",
            Type = QuestionType.ShortText,
            IsRequired = true
        };
        var form = CreateTestFormWithQuestion(question);
        var submitDto = new SubmitFormResponseDto { Answers = new List<SubmitAnswerDto>() };

        // Act
        var errors = _sut.Validate(form, submitDto);

        // Assert
        errors.Should().Contain("1. soru zorunludur.");
    }

    [Fact]
    public void Validate_WhenOptionalQuestionNotAnswered_ShouldReturnNoErrors()
    {
        // Arrange
        var question = new Question
        {
            Id = 10,
            DisplayOrder = 1,
            Title = "İsteğe Bağlı Soru",
            Type = QuestionType.ShortText,
            IsRequired = false
        };
        var form = CreateTestFormWithQuestion(question);
        var submitDto = new SubmitFormResponseDto { Answers = new List<SubmitAnswerDto>() };

        // Act
        var errors = _sut.Validate(form, submitDto);

        // Assert
        errors.Should().BeEmpty();
    }

    [Fact]
    public void Validate_WhenDuplicateAnswersForSameQuestion_ShouldReturnError()
    {
        // Arrange
        var question = new Question
        {
            Id = 10,
            DisplayOrder = 1,
            Title = "Soru",
            Type = QuestionType.ShortText,
            IsRequired = false
        };
        var form = CreateTestFormWithQuestion(question);
        var submitDto = new SubmitFormResponseDto
        {
            Answers = new List<SubmitAnswerDto>
            {
                new() { QuestionId = 10, TextValue = "Cevap 1" },
                new() { QuestionId = 10, TextValue = "Cevap 2" }
            }
        };

        // Act
        var errors = _sut.Validate(form, submitDto);

        // Assert
        errors.Should().Contain("10 numaralı soruya birden fazla cevap gönderilemez.");
    }

    [Fact]
    public void Validate_WhenAnswerForNonExistentQuestion_ShouldReturnError()
    {
        // Arrange
        var question = new Question
        {
            Id = 10,
            DisplayOrder = 1,
            Title = "Soru",
            Type = QuestionType.ShortText,
            IsRequired = false
        };
        var form = CreateTestFormWithQuestion(question);
        var submitDto = new SubmitFormResponseDto
        {
            Answers = new List<SubmitAnswerDto>
            {
                new() { QuestionId = 999, TextValue = "Cevap" }
            }
        };

        // Act
        var errors = _sut.Validate(form, submitDto);

        // Assert
        errors.Should().Contain("999 numaralı soru bu forma ait değildir.");
    }

    // --- ShortText / LongText Answer Tests ---
    [Fact]
    public void Validate_TextAnswerViolatingLength_ShouldReturnError()
    {
        // Arrange
        var question = new Question
        {
            Id = 10,
            DisplayOrder = 1,
            Title = "Adınız",
            Type = QuestionType.ShortText,
            IsRequired = true,
            Validation = new QuestionValidation
            {
                MinLength = 5,
                MaxLength = 10
            }
        };
        var form = CreateTestFormWithQuestion(question);
        var submitDto = new SubmitFormResponseDto
        {
            Answers = new List<SubmitAnswerDto>
            {
                new() { QuestionId = 10, TextValue = "Ali" } // length 3 < 5
            }
        };

        // Act
        var errors = _sut.Validate(form, submitDto);

        // Assert
        errors.Should().Contain("1. soru en az 5 karakter olmalıdır.");
    }

    [Fact]
    public void Validate_TextAnswerViolatingRegex_ShouldReturnError()
    {
        // Arrange
        var question = new Question
        {
            Id = 10,
            DisplayOrder = 1,
            Title = "Öğrenci No",
            Type = QuestionType.ShortText,
            IsRequired = true,
            Validation = new QuestionValidation
            {
                RegexPattern = @"^\d{9}$"
            }
        };
        var form = CreateTestFormWithQuestion(question);
        var submitDto = new SubmitFormResponseDto
        {
            Answers = new List<SubmitAnswerDto>
            {
                new() { QuestionId = 10, TextValue = "abc12345" }
            }
        };

        // Act
        var errors = _sut.Validate(form, submitDto);

        // Assert
        errors.Should().Contain("1. soru geçerli formatta değildir.");
    }

    // --- Choice Answer Tests ---
    [Fact]
    public void Validate_SingleChoiceWithMultipleSelections_ShouldReturnError()
    {
        // Arrange
        var question = new Question
        {
            Id = 10,
            DisplayOrder = 1,
            Title = "Cinsiyet",
            Type = QuestionType.SingleChoice,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Id = 1, Text = "Kadın" },
                new() { Id = 2, Text = "Erkek" }
            }
        };
        var form = CreateTestFormWithQuestion(question);
        var submitDto = new SubmitFormResponseDto
        {
            Answers = new List<SubmitAnswerDto>
            {
                new() { QuestionId = 10, SelectedOptionIds = new List<int> { 1, 2 } }
            }
        };

        // Act
        var errors = _sut.Validate(form, submitDto);

        // Assert
        errors.Should().Contain("1. soru yalnızca bir seçenek kabul eder.");
    }

    [Fact]
    public void Validate_ChoiceWithInvalidOptionId_ShouldReturnError()
    {
        // Arrange
        var question = new Question
        {
            Id = 10,
            DisplayOrder = 1,
            Title = "Seçim",
            Type = QuestionType.SingleChoice,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Id = 1, Text = "Seçenek 1" }
            }
        };
        var form = CreateTestFormWithQuestion(question);
        var submitDto = new SubmitFormResponseDto
        {
            Answers = new List<SubmitAnswerDto>
            {
                new() { QuestionId = 10, SelectedOptionIds = new List<int> { 999 } }
            }
        };

        // Act
        var errors = _sut.Validate(form, submitDto);

        // Assert
        errors.Should().Contain("1. soru geçersiz bir seçenek içeriyor.");
    }

    // --- Rating Answer Tests ---
    [Fact]
    public void Validate_RatingAnswerOutsideLimits_ShouldReturnError()
    {
        // Arrange
        var question = new Question
        {
            Id = 10,
            DisplayOrder = 1,
            Title = "Memnuniyet",
            Type = QuestionType.Rating,
            IsRequired = true,
            Validation = new QuestionValidation
            {
                MinValue = 1,
                MaxValue = 5
            }
        };
        var form = CreateTestFormWithQuestion(question);
        var submitDto = new SubmitFormResponseDto
        {
            Answers = new List<SubmitAnswerDto>
            {
                new() { QuestionId = 10, NumericValue = 10 }
            }
        };

        // Act
        var errors = _sut.Validate(form, submitDto);

        // Assert
        errors.Should().Contain("1. soru maksimum puan değerinden büyük olamaz.");
    }

    // --- Grid Answer Tests ---
    [Fact]
    public void Validate_MultipleChoiceGridWithMultipleColumnsPerSameRow_ShouldReturnError()
    {
        // Arrange
        var question = new Question
        {
            Id = 10,
            DisplayOrder = 1,
            Title = "Değerlendirme Tablosu",
            Type = QuestionType.MultipleChoiceGrid,
            IsRequired = true,
            MatrixRows = new List<MatrixRow>
            {
                new() { Id = 101, Text = "Hizmet Hızı" }
            },
            MatrixColumns = new List<MatrixColumn>
            {
                new() { Id = 201, Text = "İyi" },
                new() { Id = 202, Text = "Kötü" }
            }
        };
        var form = CreateTestFormWithQuestion(question);
        var submitDto = new SubmitFormResponseDto
        {
            Answers = new List<SubmitAnswerDto>
            {
                new()
                {
                    QuestionId = 10,
                    MatrixSelections = new List<SubmitMatrixCellDto>
                    {
                        new() { MatrixRowId = 101, MatrixColumnId = 201 },
                        new() { MatrixRowId = 101, MatrixColumnId = 202 }
                    }
                }
            }
        };

        // Act
        var errors = _sut.Validate(form, submitDto);

        // Assert
        errors.Should().Contain("1. soru her satır için yalnızca bir sütun seçilebilir.");
    }

    // --- Date Answer Tests ---
    [Fact]
    public void Validate_DateAnswerOutsideAllowedRange_ShouldReturnError()
    {
        // Arrange
        var question = new Question
        {
            Id = 10,
            DisplayOrder = 1,
            Title = "Tarih",
            Type = QuestionType.Date,
            IsRequired = true,
            Validation = new QuestionValidation
            {
                MinDate = new DateOnly(2026, 1, 1),
                MaxDate = new DateOnly(2026, 12, 31)
            }
        };
        var form = CreateTestFormWithQuestion(question);
        var submitDto = new SubmitFormResponseDto
        {
            Answers = new List<SubmitAnswerDto>
            {
                new() { QuestionId = 10, DateValue = new DateOnly(2025, 5, 20) }
            }
        };

        // Act
        var errors = _sut.Validate(form, submitDto);

        // Assert
        errors.Should().Contain("1. soru için tarih 2026-01-01 tarihinden önce olamaz.");
    }

    // --- Dynamic API Answer Validation Tests ---
    [Fact]
    public async Task ValidateAsync_WhenApiDynamicOptionExistsInApiResult_ShouldReturnNoErrors()
    {
        // Arrange
        var optionImportMock = new Moq.Mock<SurveyManagement.Application.Interfaces.Options.IOptionImportService>();
        optionImportMock
            .Setup(s => s.PreviewFromUrlAsync(Moq.It.IsAny<SurveyManagement.Application.DTOs.Options.ImportOptionsFromUrlRequestDto>(), Moq.It.IsAny<CancellationToken>()))
            .ReturnsAsync(SurveyManagement.Application.Common.Models.ApiResponse<SurveyManagement.Application.DTOs.Options.ImportOptionsPreviewDto>.SuccessResult(
                new SurveyManagement.Application.DTOs.Options.ImportOptionsPreviewDto
                {
                    Options = new List<string> { "Michael", "Emily", "Sophia" }
                }));

        var validator = new FormResponseValidator(optionImportMock.Object);

        var question = new Question
        {
            Id = 20,
            DisplayOrder = 1,
            Title = "API Sorusu",
            Type = QuestionType.SingleChoice,
            OptionSourceType = DynamicOptionSourceType.Api,
            OptionSourceUrl = "https://dummyjson.com/users",
            IsRequired = true
        };
        var form = CreateTestFormWithQuestion(question);
        var submitDto = new SubmitFormResponseDto
        {
            Answers = new List<SubmitAnswerDto>
            {
                new() { QuestionId = 20, SelectedOptionTexts = new List<string> { "Emily" } }
            }
        };

        // Act
        var errors = await validator.ValidateAsync(form, submitDto);

        // Assert
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task ValidateAsync_WhenApiDynamicOptionNotInApiResult_ShouldReturnError()
    {
        // Arrange
        var optionImportMock = new Moq.Mock<SurveyManagement.Application.Interfaces.Options.IOptionImportService>();
        optionImportMock
            .Setup(s => s.PreviewFromUrlAsync(Moq.It.IsAny<SurveyManagement.Application.DTOs.Options.ImportOptionsFromUrlRequestDto>(), Moq.It.IsAny<CancellationToken>()))
            .ReturnsAsync(SurveyManagement.Application.Common.Models.ApiResponse<SurveyManagement.Application.DTOs.Options.ImportOptionsPreviewDto>.SuccessResult(
                new SurveyManagement.Application.DTOs.Options.ImportOptionsPreviewDto
                {
                    Options = new List<string> { "Michael", "Emily", "Sophia" }
                }));

        var validator = new FormResponseValidator(optionImportMock.Object);

        var question = new Question
        {
            Id = 20,
            DisplayOrder = 1,
            Title = "API Sorusu",
            Type = QuestionType.SingleChoice,
            OptionSourceType = DynamicOptionSourceType.Api,
            OptionSourceUrl = "https://dummyjson.com/users",
            IsRequired = true
        };
        var form = CreateTestFormWithQuestion(question);
        var submitDto = new SubmitFormResponseDto
        {
            Answers = new List<SubmitAnswerDto>
            {
                new() { QuestionId = 20, SelectedOptionTexts = new List<string> { "HackerOption" } }
            }
        };

        // Act
        var errors = await validator.ValidateAsync(form, submitDto);

        // Assert
        errors.Should().Contain(e => e.Contains("HackerOption") && e.Contains("harici API kaynağında bulunamadı"));
    }
}
