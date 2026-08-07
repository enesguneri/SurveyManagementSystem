namespace SurveyManagement.Application.Interfaces.Security;

public interface IPasswordHashService
{
    /// <summary>
    /// Açık metin (plain-text) şifreden Hash ve Salt verilerini üretir.
    /// </summary>
    void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt);

    /// <summary>
    /// Girilen şifrenin veritabanındaki Hash ve Salt ile eşleşip eşleşmediğini doğrular.
    /// </summary>
    bool VerifyPasswordHash(string password, byte[] storedHash, byte[] storedSalt);
}