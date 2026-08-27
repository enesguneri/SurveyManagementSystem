using SurveyManagement.Application.DTOs.Forms;
using SurveyManagement.Application.Services.Forms;
using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Tests.Validation;

public class FormRequestValidatorTests
{
    private readonly FormRequestValidator _sut = new();

    [Fact]
    public void Validate_WithValidRequest_ShouldReturnNoErrors()
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = "Memnuniyet Anketi",
            Description = "Açıklama",
            AccessType = FormAccessType.Public,
            Questions = new List<CreateQuestionDto>
            {
                new()
                {
                    Title = "Adınız?",
                    Type = QuestionType.ShortText,
                    IsRequired = true
                }
            }
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().BeEmpty();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_WhenTitleIsMissingOrWhitespace_ShouldReturnError(string? title)
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = title!,
            Questions = new List<CreateQuestionDto>
            {
                new() { Title = "Soru 1", Type = QuestionType.ShortText }
            }
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().Contain("Form başlığı boş olamaz.");
    }

    [Fact]
    public void Validate_WhenNoQuestionsProvided_ShouldReturnError()
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = "Boş Form",
            Questions = new List<CreateQuestionDto>()
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().Contain("Form en az bir soru içermelidir.");
    }

    [Fact]
    public void Validate_WhenQuestionTitleIsMissing_ShouldReturnError()
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = "Geçerli Form Başlığı",
            Questions = new List<CreateQuestionDto>
            {
                new() { Title = "   ", Type = QuestionType.ShortText }
            }
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().Contain("1. soru başlığı boş olamaz.");
    }

    // --- ShortText / LongText Tests ---
    [Fact]
    public void Validate_TextQuestionWithInvalidLengthRange_ShouldReturnError()
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = "Test Form",
            Questions = new List<CreateQuestionDto>
            {
                new()
                {
                    Title = "Görüşleriniz",
                    Type = QuestionType.LongText,
                    Validation = new CreateQuestionValidationDto
                    {
                        MinLength = 100,
                        MaxLength = 10
                    }
                }
            }
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().Contain("1. soru için minimum karakter sayısı maksimumdan büyük olamaz.");
    }

    [Fact]
    public void Validate_TextQuestionWithNumericLimits_ShouldReturnError()
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = "Test Form",
            Questions = new List<CreateQuestionDto>
            {
                new()
                {
                    Title = "Metin Sorusu",
                    Type = QuestionType.ShortText,
                    Validation = new CreateQuestionValidationDto
                    {
                        MinValue = 5,
                        MaxValue = 10
                    }
                }
            }
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().Contain("1. soru metin sorusunda sayısal değer sınırı kullanılamaz.");
    }

    [Fact]
    public void Validate_TextQuestionWithInvalidRegex_ShouldReturnError()
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = "Test Form",
            Questions = new List<CreateQuestionDto>
            {
                new()
                {
                    Title = "Regex Sorusu",
                    Type = QuestionType.ShortText,
                    Validation = new CreateQuestionValidationDto
                    {
                        RegexPattern = "[invalid regex pattern("
                    }
                }
            }
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().Contain("1. soru için geçersiz regex deseni girildi.");
    }

    // --- Choice Question Tests ---
    [Fact]
    public void Validate_ChoiceQuestionWithLessThanTwoOptions_ShouldReturnError()
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = "Test Form",
            Questions = new List<CreateQuestionDto>
            {
                new()
                {
                    Title = "Cinsiyetiniz?",
                    Type = QuestionType.SingleChoice,
                    Options = new List<CreateQuestionOptionDto>
                    {
                        new() { Text = "Tek Seçenek" }
                    }
                }
            }
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().Contain("1. soru en az iki seçenek içermelidir.");
    }

    [Fact]
    public void Validate_ChoiceQuestionWithDuplicateOptions_ShouldReturnError()
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = "Test Form",
            Questions = new List<CreateQuestionDto>
            {
                new()
                {
                    Title = "Bölümünüz?",
                    Type = QuestionType.Dropdown,
                    Options = new List<CreateQuestionOptionDto>
                    {
                        new() { Text = "Bilgisayar Mühendisliği" },
                        new() { Text = "bilgisayar mühendisliği" }
                    }
                }
            }
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().Contain("1. soru aynı seçeneği birden fazla içeremez.");
    }

    [Fact]
    public void Validate_ChoiceQuestionWithValidation_ShouldReturnError()
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = "Test Form",
            Questions = new List<CreateQuestionDto>
            {
                new()
                {
                    Title = "Seçim Sorusu",
                    Type = QuestionType.MultipleChoice,
                    Options = new List<CreateQuestionOptionDto>
                    {
                        new() { Text = "A" },
                        new() { Text = "B" }
                    },
                    Validation = new CreateQuestionValidationDto { MinLength = 1 }
                }
            }
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().Contain("1. soru seçim sorusunda ek doğrulama tanımlanamaz.");
    }

    // --- Rating Question Tests ---
    [Fact]
    public void Validate_RatingQuestionWithoutRange_ShouldReturnError()
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = "Test Form",
            Questions = new List<CreateQuestionDto>
            {
                new()
                {
                    Title = "Puan Veriniz",
                    Type = QuestionType.Rating
                }
            }
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().Contain("1. soru derecelendirme sorusu minimum ve maksimum değer içermelidir.");
    }

    [Fact]
    public void Validate_RatingQuestionWithInvalidRange_ShouldReturnErrors()
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = "Test Form",
            Questions = new List<CreateQuestionDto>
            {
                new()
                {
                    Title = "Puan Veriniz",
                    Type = QuestionType.Rating,
                    Validation = new CreateQuestionValidationDto
                    {
                        MinValue = 10,
                        MaxValue = 2
                    }
                }
            }
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().Contain("1. soru için minimum değer maksimum değerden küçük olmalıdır.");
    }

    [Fact]
    public void Validate_RatingQuestionOutsideZeroToTen_ShouldReturnError()
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = "Test Form",
            Questions = new List<CreateQuestionDto>
            {
                new()
                {
                    Title = "Puan Veriniz",
                    Type = QuestionType.Rating,
                    Validation = new CreateQuestionValidationDto
                    {
                        MinValue = -1,
                        MaxValue = 15
                    }
                }
            }
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().Contain("1. soru derecelendirme aralığı 0 ile 10 arasında olmalıdır.");
    }

    [Fact]
    public void Validate_RatingQuestionWithNonIntegerValues_ShouldReturnError()
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = "Test Form",
            Questions = new List<CreateQuestionDto>
            {
                new()
                {
                    Title = "Puan Veriniz",
                    Type = QuestionType.Rating,
                    Validation = new CreateQuestionValidationDto
                    {
                        MinValue = 1.5m,
                        MaxValue = 5.8m
                    }
                }
            }
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().Contain("1. soru derecelendirme değerleri tam sayı olmalıdır.");
    }

    // --- Grid Question Tests ---
    [Fact]
    public void Validate_GridQuestionWithoutRowsOrColumns_ShouldReturnErrors()
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = "Test Form",
            Questions = new List<CreateQuestionDto>
            {
                new()
                {
                    Title = "Matris Sorusu",
                    Type = QuestionType.MultipleChoiceGrid
                }
            }
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().Contain("1. soru en az bir tablo satırı içermelidir.");
        errors.Should().Contain("1. soru en az bir tablo sütunu içermelidir.");
    }

    [Fact]
    public void Validate_GridQuestionWithDuplicateRowsOrColumns_ShouldReturnErrors()
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = "Test Form",
            Questions = new List<CreateQuestionDto>
            {
                new()
                {
                    Title = "Matris Sorusu",
                    Type = QuestionType.CheckboxGrid,
                    MatrixRows = new List<CreateMatrixRowDto>
                    {
                        new() { Text = "Satır 1" },
                        new() { Text = "satır 1" }
                    },
                    MatrixColumns = new List<CreateMatrixColumnDto>
                    {
                        new() { Text = "Sütun 1" },
                        new() { Text = "SÜTUN 1" }
                    }
                }
            }
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().Contain("1. soru aynı tablo satırını birden fazla içeremez.");
        errors.Should().Contain("1. soru aynı tablo sütununu birden fazla içeremez.");
    }

    // --- Date Question Tests ---
    [Fact]
    public void Validate_DateQuestionWithInvalidDateRange_ShouldReturnError()
    {
        // Arrange
        var request = new CreateFormDto
        {
            Title = "Test Form",
            Questions = new List<CreateQuestionDto>
            {
                new()
                {
                    Title = "Doğum Tarihiniz?",
                    Type = QuestionType.Date,
                    Validation = new CreateQuestionValidationDto
                    {
                        MinDate = new DateOnly(2026, 12, 31),
                        MaxDate = new DateOnly(2026, 1, 1)
                    }
                }
            }
        };

        // Act
        var errors = _sut.Validate(request);

        // Assert
        errors.Should().Contain("1. soru için minimum tarih maksimum tarihten büyük olamaz.");
    }
}
