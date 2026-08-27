using System.Text;
using Moq;
using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Responses;
using SurveyManagement.Application.Interfaces.Responses;
using SurveyManagement.Application.Services.Responses;
using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Tests.Services;

public class FormResponseExportServiceTests
{
    private readonly Mock<IFormResponseService> _responseServiceMock = new();

    private FormResponsesDto CreateSampleResponsesDto(string title = "Öğrenci Memnuniyet Anketi")
    {
        return new FormResponsesDto
        {
            FormPublicId = Guid.NewGuid(),
            Title = title,
            ShowRespondentIdentity = true,
            Responses = new List<FormResponseItemDto>
            {
                new()
                {
                    Id = 1,
                    RespondentName = "Ayşe Kaya",
                    RespondentEmail = "ayse@bakircay.edu.tr",
                    RespondentIpAddress = "192.168.1.50",
                    SubmittedAt = new DateTime(2026, 5, 20, 14, 30, 0, DateTimeKind.Utc),
                    Answers = new List<ResponseAnswerDetailsDto>
                    {
                        new()
                        {
                            QuestionId = 10,
                            QuestionTitle = "Görüşleriniz",
                            QuestionType = QuestionType.ShortText,
                            TextValue = "Harika bir dönemdi."
                        },
                        new()
                        {
                            QuestionId = 20,
                            QuestionTitle = "Hangi kulüplere üyesiniz?",
                            QuestionType = QuestionType.MultipleChoice,
                            SelectedOptions = new List<ResponseSelectedOptionDto>
                            {
                                new() { Id = 101, Text = "Yazılım Kulübü" },
                                new() { Id = 102, Text = "Robotik Kulübü" }
                            }
                        },
                        new()
                        {
                            QuestionId = 30,
                            QuestionTitle = "Hizmet Değerlendirme",
                            QuestionType = QuestionType.MultipleChoiceGrid,
                            MatrixSelections = new List<ResponseMatrixSelectionDto>
                            {
                                new()
                                {
                                    MatrixRowId = 301,
                                    MatrixRowText = "Kütüphane",
                                    MatrixColumnId = 401,
                                    MatrixColumnText = "Mükemmel"
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    [Fact]
    public async Task ExportAsync_WithUnsupportedFormat_ShouldReturnBadRequest()
    {
        // Arrange
        var sut = new FormResponseExportService(_responseServiceMock.Object);

        // Act
        var result = await sut.ExportAsync(Guid.NewGuid(), 1, "pdf");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.HttpStatusCode.Should().Be(400);
        result.Errors.Should().Contain("Desteklenen formatlar: csv ve xlsx.");
    }

    [Fact]
    public async Task ExportAsync_WhenResponseServiceReturnsForbidden_ShouldPropagateFailure()
    {
        // Arrange
        var formPublicId = Guid.NewGuid();
        _responseServiceMock
            .Setup(s => s.GetByFormAsync(formPublicId, 999, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ApiResponse<FormResponsesDto>.FailureResult("Yetkisiz erişim.", 403));

        var sut = new FormResponseExportService(_responseServiceMock.Object);

        // Act
        var result = await sut.ExportAsync(formPublicId, 999, "csv");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.HttpStatusCode.Should().Be(403);
    }

    [Fact]
    public async Task ExportAsync_WithCsvFormat_ShouldGenerateValidCsvWithUtf8Bom()
    {
        // Arrange
        var formPublicId = Guid.NewGuid();
        var sampleDto = CreateSampleResponsesDto();

        _responseServiceMock
            .Setup(s => s.GetByFormAsync(formPublicId, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ApiResponse<FormResponsesDto>.SuccessResult(sampleDto));

        var sut = new FormResponseExportService(_responseServiceMock.Object);

        // Act
        var result = await sut.ExportAsync(formPublicId, 1, "csv");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.ContentType.Should().Be("text/csv; charset=utf-8");
        result.Data.FileName.Should().Be("Öğrenci Memnuniyet Anketi Yanıtları.csv");
        result.Data.Content.Should().NotBeEmpty();

        // Check UTF-8 BOM (0xEF, 0xBB, 0xBF)
        result.Data.Content.Take(3).Should().Equal(new byte[] { 0xEF, 0xBB, 0xBF });

        var csvText = Encoding.UTF8.GetString(result.Data.Content);
        csvText.Should().Contain("ResponseId");
        csvText.Should().Contain("Ayşe Kaya");
        csvText.Should().Contain("Harika bir dönemdi.");
        csvText.Should().Contain("Yazılım Kulübü");
        csvText.Should().Contain("Kütüphane");
        csvText.Should().Contain("Mükemmel");
    }

    [Fact]
    public async Task ExportAsync_WithExcelFormat_ShouldGenerateValidXlsxWorkbook()
    {
        // Arrange
        var formPublicId = Guid.NewGuid();
        var sampleDto = CreateSampleResponsesDto();

        _responseServiceMock
            .Setup(s => s.GetByFormAsync(formPublicId, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ApiResponse<FormResponsesDto>.SuccessResult(sampleDto));

        var sut = new FormResponseExportService(_responseServiceMock.Object);

        // Act
        var result = await sut.ExportAsync(formPublicId, 1, "xlsx");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.ContentType.Should().Be("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        result.Data.FileName.Should().Be("Öğrenci Memnuniyet Anketi Yanıtları.xlsx");
        result.Data.Content.Should().NotBeEmpty();

        // Verify valid OpenXML zip header (PK\x03\x04)
        result.Data.Content.Take(2).Should().Equal(new byte[] { 0x50, 0x4B });
    }
}
