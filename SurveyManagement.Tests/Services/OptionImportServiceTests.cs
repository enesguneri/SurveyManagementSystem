using System.Net;
using System.Text;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using SurveyManagement.Application.DTOs.Options;
using SurveyManagement.Application.Services.Options;

namespace SurveyManagement.Tests.Services;

public class OptionImportServiceTests
{
    private readonly Mock<ILogger<OptionImportService>> _loggerMock = new();

    private OptionImportService CreateServiceWithMockResponse(
        HttpStatusCode statusCode,
        string content,
        string contentType = "application/json")
    {
        var handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);

        handlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = statusCode,
                Content = new StringContent(content, Encoding.UTF8, contentType)
            });

        var httpClient = new HttpClient(handlerMock.Object);
        return new OptionImportService(httpClient, _loggerMock.Object);
    }

    [Theory]
    [InlineData("http://example.com/options.json")]
    [InlineData("ftp://example.com/options.json")]
    [InlineData("not-a-valid-url")]
    public async Task PreviewFromUrlAsync_WithNonHttpsUrl_ShouldReturnBadRequest(string url)
    {
        // Arrange
        var service = CreateServiceWithMockResponse(HttpStatusCode.OK, "[]");
        var request = new ImportOptionsFromUrlRequestDto { Url = url };

        // Act
        var result = await service.PreviewFromUrlAsync(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.HttpStatusCode.Should().Be(400);
        result.Errors.Should().Contain("Yalnızca geçerli HTTPS adresleri kullanılabilir.");
    }

    [Theory]
    [InlineData("https://localhost/options.json")]
    [InlineData("https://127.0.0.1/options.json")]
    [InlineData("https://192.168.1.1/options.json")]
    [InlineData("https://10.0.0.5/options.json")]
    [InlineData("https://172.16.0.1/options.json")]
    [InlineData("https://169.254.1.1/options.json")]
    public async Task PreviewFromUrlAsync_WithPrivateOrLocalAddress_ShouldReturnBadRequest(string url)
    {
        // Arrange
        var service = CreateServiceWithMockResponse(HttpStatusCode.OK, "[]");
        var request = new ImportOptionsFromUrlRequestDto { Url = url };

        // Act
        var result = await service.PreviewFromUrlAsync(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.HttpStatusCode.Should().Be(400);
        result.Errors.Should().Contain("Yerel veya özel ağ adreslerine istek yapılamaz.");
    }

    [Fact]
    public async Task PreviewFromUrlAsync_WithUnresolvableHost_ShouldReturnBadRequest()
    {
        // Arrange
        var service = CreateServiceWithMockResponse(HttpStatusCode.OK, "[]");
        var request = new ImportOptionsFromUrlRequestDto
        {
            Url = "https://unresolvable-fake-host-domain-987654321.com/options"
        };

        // Act
        var result = await service.PreviewFromUrlAsync(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.HttpStatusCode.Should().Be(400);
        result.Errors.Should().Contain("API adresi çözümlenemedi.");
    }

    [Fact]
    public async Task PreviewFromUrlAsync_WithValidJsonArray_ShouldExtractAndDeduplicateOptions()
    {
        // Arrange
        const string jsonContent = """
            [
                "Seçenek A",
                "Seçenek B",
                "  Seçenek A  ",
                "Seçenek C"
            ]
            """;

        var service = CreateServiceWithMockResponse(HttpStatusCode.OK, jsonContent);
        var request = new ImportOptionsFromUrlRequestDto
        {
            // Use public IP to avoid network DNS resolution
            Url = "https://1.1.1.1/items"
        };

        // Act
        var result = await service.PreviewFromUrlAsync(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Options.Should().BeEquivalentTo(new[] { "Seçenek A", "Seçenek B", "Seçenek C" }, options => options.WithStrictOrdering());
        result.Data.SkippedCount.Should().Be(1); // Duplicate "Seçenek A" skipped
    }

    [Fact]
    public async Task PreviewFromUrlAsync_WithNestedJsonPathAndCustomProperty_ShouldExtractOptions()
    {
        // Arrange
        const string jsonContent = """
            {
                "data": {
                    "categories": [
                        { "id": 1, "title": "Kategori 1" },
                        { "id": 2, "title": "Kategori 2" }
                    ]
                }
            }
            """;

        var service = CreateServiceWithMockResponse(HttpStatusCode.OK, jsonContent);
        var request = new ImportOptionsFromUrlRequestDto
        {
            Url = "https://1.1.1.1/categories",
            JsonPath = "data.categories",
            TextProperty = "title"
        };

        // Act
        var result = await service.PreviewFromUrlAsync(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.Options.Should().BeEquivalentTo(new[] { "Kategori 1", "Kategori 2" });
        result.Data.SkippedCount.Should().Be(0);
    }

    [Fact]
    public async Task PreviewFromUrlAsync_WhenRemoteServerReturns500_ShouldReturnBadGateway()
    {
        // Arrange
        var service = CreateServiceWithMockResponse(HttpStatusCode.InternalServerError, "Internal Server Error");
        var request = new ImportOptionsFromUrlRequestDto
        {
            Url = "https://1.1.1.1/error"
        };

        // Act
        var result = await service.PreviewFromUrlAsync(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.HttpStatusCode.Should().Be(502);
        result.Errors.Should().Contain("Seçenek API'si başarılı bir yanıt döndürmedi.");
    }
}
