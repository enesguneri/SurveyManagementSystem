using SurveyManagement.Application.Services;

namespace SurveyManagement.Tests.Security;

public class PasswordHashServiceTests
{
    private readonly PasswordHashService _sut = new();

    [Fact]
    public void CreatePasswordHash_ShouldGenerateNonEmptyHashAndSalt()
    {
        // Arrange
        const string password = "StrongPassword123!";

        // Act
        _sut.CreatePasswordHash(password, out var hash, out var salt);

        // Assert
        hash.Should().NotBeNullOrEmpty();
        salt.Should().NotBeNullOrEmpty();
        salt.Length.Should().Be(128); // HMACSHA512 default key length
        hash.Length.Should().Be(64);  // 512 bits = 64 bytes
    }

    [Fact]
    public void CreatePasswordHash_ForSamePassword_ShouldGenerateDifferentHashesAndSalts()
    {
        // Arrange
        const string password = "SamePassword123!";

        // Act
        _sut.CreatePasswordHash(password, out var hash1, out var salt1);
        _sut.CreatePasswordHash(password, out var hash2, out var salt2);

        // Assert
        salt1.Should().NotEqual(salt2);
        hash1.Should().NotEqual(hash2);
    }

    [Fact]
    public void VerifyPasswordHash_WithCorrectPassword_ShouldReturnTrue()
    {
        // Arrange
        const string password = "MySecretPassword!2026";
        _sut.CreatePasswordHash(password, out var hash, out var salt);

        // Act
        var result = _sut.VerifyPasswordHash(password, hash, salt);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void VerifyPasswordHash_WithIncorrectPassword_ShouldReturnFalse()
    {
        // Arrange
        const string password = "CorrectPassword123!";
        const string wrongPassword = "WrongPassword123!";
        _sut.CreatePasswordHash(password, out var hash, out var salt);

        // Act
        var result = _sut.VerifyPasswordHash(wrongPassword, hash, salt);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void VerifyPasswordHash_WithCorruptedHash_ShouldReturnFalse()
    {
        // Arrange
        const string password = "SecurePassword123!";
        _sut.CreatePasswordHash(password, out var hash, out var salt);

        // Corrupt the hash by inverting the first byte
        hash[0] = (byte)(hash[0] ^ 0xFF);

        // Act
        var result = _sut.VerifyPasswordHash(password, hash, salt);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void VerifyPasswordHash_WithCorruptedSalt_ShouldReturnFalse()
    {
        // Arrange
        const string password = "SecurePassword123!";
        _sut.CreatePasswordHash(password, out var hash, out var salt);

        // Corrupt the salt by inverting the first byte
        salt[0] = (byte)(salt[0] ^ 0xFF);

        // Act
        var result = _sut.VerifyPasswordHash(password, hash, salt);

        // Assert
        result.Should().BeFalse();
    }
}
