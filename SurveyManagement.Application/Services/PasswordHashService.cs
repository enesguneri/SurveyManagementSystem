using System.Security.Cryptography;
using System.Text;
using SurveyManagement.Application.Interfaces.Security;

namespace SurveyManagement.Application.Services;

public class PasswordHashService : IPasswordHashService
{
    //İki kullanıcının da veritabanındaki PasswordHash değeri birebir aynı olur.
    //Hacker veritabanını ele geçirdiğinde bu kalıbı (Rainbow Table) çözebilir.
    //Her kullanıcı için HMACSHA512 nesnesi tamamen rastgele benzersiz bir passwordSalt üretir.
    //İki kullanıcının şifresi aynı olsa bile veritabanındaki PasswordHash değerleri tamamen farklı görünür.

    public void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
    {
        // HMACSHA512 nesnesi oluşturulurken otomatik olarak rastgele bir Salt üre tir
        using var hmac = new HMACSHA512();

        passwordSalt = hmac.Key; // Üretilen rastgele Salt
        passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password)); // Salt ile harmanlanmış Hash
    }

    public bool VerifyPasswordHash(string password, byte[] storedHash, byte[] storedSalt)
    {
        // Veritabanındaki orijinal Salt'ı kullanarak HMAC nesnesini başlatıyoruz
        using var hmac = new HMACSHA512(storedSalt);

        // Kullanıcının giriş yaparken girdiği şifrenin hash'ini hesaplıyoruz
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));

        // Hesaplanan hash ile veritabanında saklanan hash'in her bir baytını karşılaştırıyoruz
        for (int i = 0; i < computedHash.Length; i++)
        {
            if (computedHash[i] != storedHash[i])
            {
                return false; // Şifre yanlış
            }
        }

        return true; // Şifre doğru
    }
}