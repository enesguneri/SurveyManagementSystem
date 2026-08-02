using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using UserManagement.Application.DTOs.Auth;
using UserManagement.Application.Interfaces.Security;
using UserManagement.Domain.Entities;

namespace UserManagement.Application.Services;

public class JwtService : ITokenService
{
    private readonly IConfiguration _configuration;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public TokenResponseDto CreateToken(User user, List<string> roles)
    {
        // 1. JWT içerisine koyacağımız Hakları/Bilgileri (Claims) hazırlıyoruz
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email)
        };

        // Kullanıcının rollerini claim olarak ekliyoruz
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        // 2. Yapılandırma dosyasından (User Secrets / appsettings) JWT ayarlarını okuyoruz
        var secretKey = _configuration["JwtSettings:SecretKey"]
            ?? throw new InvalidOperationException("JWT SecretKey yapılandırmada bulunamadı.");
        var issuer = _configuration["JwtSettings:Issuer"];
        var audience = _configuration["JwtSettings:Audience"];
        var expirationInDays = double.Parse(_configuration["JwtSettings:ExpirationInDays"] ?? "7");

        // 3. Şifreleme Anahtarını (SymmetricSecurityKey) ve İmzalama Algoritmasını belirliyoruz
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

        // 4. Token'ın geçerlilik süresini hesaplıyoruz
        var expiration = DateTime.UtcNow.AddDays(expirationInDays);

        // 5. JWT Token nesnesini oluşturuyoruz
        var tokenDescriptor = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiration,
            signingCredentials: credentials
        );

        // 6. Token'ı string formata çevirip DTO olarak döndürüyoruz
        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenString = tokenHandler.WriteToken(tokenDescriptor);

        return new TokenResponseDto
        {
            AccessToken = tokenString,
            Expiration = expiration
        };
    }
}