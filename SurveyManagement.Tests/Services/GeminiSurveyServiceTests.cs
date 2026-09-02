using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using SurveyManagement.Application.DTOs.AI;
using SurveyManagement.Application.Interfaces.Forms;
using SurveyManagement.Application.Options;
using SurveyManagement.Application.Services.AI;
using SurveyManagement.Domain.Entities;
using SurveyManagement.Tests.Common;
using System.Net.Http;
using Xunit;

namespace SurveyManagement.Tests.Services;

public class GeminiSurveyServiceTests
{
    private readonly HttpClient _httpClient = new();
    private readonly Mock<IFormRequestValidator> _validatorMock = new();
    private readonly NullLogger<GeminiSurveyService> _logger = new();

    [Fact]
    public async Task GetUserConfigAsync_WhenUserHasNoKey_ShouldReturnHasApiKeyFalse()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var user = TestDbContextFactory.CreateUser(context, "geminiuser1", "user1@test.com");

        var options = new GeminiOptions { ApiKey = "", Model = "gemini-2.5-flash" };
        var sut = new GeminiSurveyService(_httpClient, options, _validatorMock.Object, _logger, context);

        // Act
        var config = await sut.GetUserConfigAsync(user.Id);

        // Assert
        config.Should().NotBeNull();
        config.HasApiKey.Should().BeFalse();
        config.MaskedApiKey.Should().BeNull();
    }

    [Fact]
    public async Task SaveUserConfigAsync_WhenValidKeyProvided_ShouldSaveToUserAndReturnTrue()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var user = TestDbContextFactory.CreateUser(context, "geminiuser2", "user2@test.com");

        var options = new GeminiOptions { ApiKey = "", Model = "gemini-2.5-flash" };
        var sut = new GeminiSurveyService(_httpClient, options, _validatorMock.Object, _logger, context);

        var dto = new SaveUserAiConfigRequestDto
        {
            ApiKey = "AIzaSyD-SecretKey1234567890",
            Model = "gemini-1.5-pro"
        };

        // Act
        var result = await sut.SaveUserConfigAsync(user.Id, dto);

        // Assert
        result.IsSuccess.Should().BeTrue();

        var updatedUser = await context.Users.FindAsync(user.Id);
        updatedUser.Should().NotBeNull();
        updatedUser!.GeminiApiKey.Should().Be("AIzaSyD-SecretKey1234567890");
        updatedUser.GeminiModel.Should().Be("gemini-1.5-pro");

        var config = await sut.GetUserConfigAsync(user.Id);
        config.HasApiKey.Should().BeTrue();
        config.MaskedApiKey.Should().Contain("...");
        config.Model.Should().Be("gemini-1.5-pro");
    }

    [Fact]
    public async Task SaveUserConfigAsync_WhenEmptyKey_ShouldReturnBadRequest()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var user = TestDbContextFactory.CreateUser(context, "geminiuser3", "user3@test.com");

        var options = new GeminiOptions { ApiKey = "", Model = "gemini-2.5-flash" };
        var sut = new GeminiSurveyService(_httpClient, options, _validatorMock.Object, _logger, context);

        var dto = new SaveUserAiConfigRequestDto
        {
            ApiKey = "   "
        };

        // Act
        var result = await sut.SaveUserConfigAsync(user.Id, dto);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.HttpStatusCode.Should().Be(400);
    }

    [Fact]
    public async Task GenerateDraftAsync_WhenNoKeyConfigured_ShouldReturnConfigErrorMessage()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var user = TestDbContextFactory.CreateUser(context, "geminiuser4", "user4@test.com");

        var options = new GeminiOptions { ApiKey = "", Model = "gemini-2.5-flash" };
        var sut = new GeminiSurveyService(_httpClient, options, _validatorMock.Object, _logger, context);

        var request = new GenerateSurveyDraftRequestDto
        {
            Prompt = "Memnuniyet anketi oluştur"
        };

        // Act
        var result = await sut.GenerateDraftAsync(request, requesterUserId: user.Id);

        // Assert
        result.Status.Should().Be(AiDraftStatus.Failed);
        result.Message.Should().Contain("Gemini API anahtarınızı");
    }
}
