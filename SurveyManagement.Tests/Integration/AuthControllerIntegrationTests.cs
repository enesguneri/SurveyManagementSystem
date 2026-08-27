using System.Net;
using System.Net.Http.Json;
using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Auth;

namespace SurveyManagement.Tests.Integration;

public class AuthControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AuthControllerIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnOkAndToken()
    {
        // Arrange
        var request = new LoginDto
        {
            UsernameOrEmail = "admin",
            Password = "AdminPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<TokenResponseDto>>();
        result.Should().NotBeNull();
        result!.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().NotBeNullOrWhiteSpace();
        result.Data.Expiration.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new LoginDto
        {
            UsernameOrEmail = "admin",
            Password = "WrongPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<TokenResponseDto>>();
        result.Should().NotBeNull();
        result!.IsSuccess.Should().BeFalse();
        result.Errors.Should().Contain("Kullanıcı adı/E-posta veya şifre hatalı.");
    }

    [Fact]
    public async Task Register_WithNewUser_ShouldReturnOkAndToken()
    {
        // Arrange
        var uniqueSuffix = Guid.NewGuid().ToString("N")[..6];
        var request = new RegisterDto
        {
            Username = $"newuser_{uniqueSuffix}",
            Email = $"new_{uniqueSuffix}@bakircay.edu.tr",
            Name = "Yeni Kayıtlı Kullanıcı",
            Password = "SecurePassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<TokenResponseDto>>();
        result.Should().NotBeNull();
        result!.IsSuccess.Should().BeTrue();
        result.Data!.AccessToken.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Register_WithDuplicateUsername_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new RegisterDto
        {
            Username = "admin", // Already exists in seed
            Email = "admin_duplicate@test.com",
            Name = "Duplicate Admin",
            Password = "Password123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
