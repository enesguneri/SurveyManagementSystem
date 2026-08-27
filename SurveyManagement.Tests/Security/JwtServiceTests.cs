using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using SurveyManagement.Application.Services;
using SurveyManagement.Domain.Entities;

namespace SurveyManagement.Tests.Security;

public class JwtServiceTests
{
    private const string ValidSecretKey = "super_secret_key_for_testing_purposes_that_is_at_least_64_bytes_long_1234567890!";
    private const string Issuer = "SurveyManagementSystem";
    private const string Audience = "SurveyManagementSystemUsers";

    private static IConfiguration CreateConfiguration(
        string? secretKey = ValidSecretKey,
        string? issuer = Issuer,
        string? audience = Audience,
        string? expirationInDays = "7")
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = secretKey,
            ["JwtSettings:Issuer"] = issuer,
            ["JwtSettings:Audience"] = audience,
            ["JwtSettings:ExpirationInDays"] = expirationInDays
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();
    }

    [Fact]
    public void CreateToken_WithValidUserAndRoles_ShouldReturnValidTokenResponse()
    {
        // Arrange
        var configuration = CreateConfiguration();
        var sut = new JwtService(configuration);

        var user = new User
        {
            Id = 42,
            Username = "enesguneri",
            Email = "enes@bakircay.edu.tr",
            Name = "Enes Guneri"
        };
        var roles = new List<string> { "Admin", "UnitManager" };

        // Act
        var result = sut.CreateToken(user, roles);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrWhiteSpace();
        result.Expiration.Should().BeAfter(DateTime.UtcNow.AddDays(6));

        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(result.AccessToken);

        jwtToken.Issuer.Should().Be(Issuer);
        jwtToken.Audiences.Should().Contain(Audience);

        jwtToken.Claims.First(c => c.Type == ClaimTypes.NameIdentifier).Value.Should().Be("42");
        jwtToken.Claims.First(c => c.Type == ClaimTypes.Name).Value.Should().Be("enesguneri");
        jwtToken.Claims.First(c => c.Type == ClaimTypes.Email).Value.Should().Be("enes@bakircay.edu.tr");

        var roleClaims = jwtToken.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();
        roleClaims.Should().BeEquivalentTo(new[] { "Admin", "UnitManager" });
    }

    [Fact]
    public void CreateToken_WhenSecretKeyMissing_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var configuration = CreateConfiguration(secretKey: null);
        var sut = new JwtService(configuration);

        var user = new User { Id = 1, Username = "user", Email = "user@test.com" };

        // Act
        var act = () => sut.CreateToken(user, new List<string>());

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*SecretKey*");
    }
}
