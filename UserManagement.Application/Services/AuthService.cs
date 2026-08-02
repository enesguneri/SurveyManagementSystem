using Microsoft.EntityFrameworkCore;
using UserManagement.Application.Common.Models;
using UserManagement.Application.DTOs.Auth;
using UserManagement.Application.Interfaces.Auth;
using UserManagement.Application.Interfaces.Context;
using UserManagement.Application.Interfaces.Security;
using UserManagement.Domain.Entities;

namespace UserManagement.Application.Services;

public class AuthService : IAuthService
{
    private readonly IAppDbContext _context;
    private readonly IPasswordHashService _passwordHashService;
    private readonly ITokenService _tokenService;

    public AuthService(
        IAppDbContext context,
        IPasswordHashService passwordHashService,
        ITokenService tokenService)
    {
        _context = context;
        _passwordHashService = passwordHashService;
        _tokenService = tokenService;
    }

    public async Task<ApiResponse<TokenResponseDto>> RegisterAsync(RegisterDto registerDto)
    {
        // 1. E-posta veya Kullanıcı Adı daha önce alınmış mı kontrol et
        var userExists = await _context.Users.AnyAsync(u =>
            u.Email.ToLower() == registerDto.Email.ToLower() ||
            u.Username.ToLower() == registerDto.Username.ToLower());

        if (userExists)
        {
            return ApiResponse<TokenResponseDto>.FailureResult("Bu e-posta adresi veya kullanıcı adı zaten kullanılmakta.");
        }

        // 2. Şifreyi Hash ve Salt değerlerine dönüştür
        _passwordHashService.CreatePasswordHash(
            registerDto.Password,
            out byte[] passwordHash,
            out byte[] passwordSalt);

        // 3. Yeni User nesnesini oluştur
        var newUser = new User
        {
            Name = registerDto.Name,
            Username = registerDto.Username,
            Email = registerDto.Email,
            PasswordHash = passwordHash,
            PasswordSalt = passwordSalt,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        // 4. Varsayılan olarak "User" rolünü ata
        var defaultRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
        if (defaultRole != null)
        {
            newUser.UserRoles.Add(new UserRole
            {
                Role = defaultRole
            });
        }

        // 5. Veritabanına kaydet
        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        // 6. Kullanıcının rollerini çek ve JWT Token üret
        var roles = defaultRole != null ? new List<string> { defaultRole.Name } : new List<string>();
        var tokenResponse = _tokenService.CreateToken(newUser, roles);

        return ApiResponse<TokenResponseDto>.SuccessResult(tokenResponse, "Kullanıcı kaydı başarıyla tamamlandı.");
    }

    public async Task<ApiResponse<TokenResponseDto>> LoginAsync(LoginDto loginDto)
    {
        // 1. Kullanıcıyı Username veya Email ile bul (Rollerini de yükle)
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u =>
                u.Username.ToLower() == loginDto.UsernameOrEmail.ToLower() ||
                u.Email.ToLower() == loginDto.UsernameOrEmail.ToLower());

        if (user == null)
        {
            return ApiResponse<TokenResponseDto>.FailureResult("Kullanıcı adı/E-posta veya şifre hatalı.");
        }

        // 2. Kullanıcı aktif mi kontrol et
        if (!user.IsActive)
        {
            return ApiResponse<TokenResponseDto>.FailureResult("Hesabınız pasif durumdadır. Lütfen yönetici ile iletişime geçin.");
        }

        // 3. Şifreyi doğrula
        var isPasswordValid = _passwordHashService.VerifyPasswordHash(
            loginDto.Password,
            user.PasswordHash,
            user.PasswordSalt);

        if (!isPasswordValid)
        {
            return ApiResponse<TokenResponseDto>.FailureResult("Kullanıcı adı/E-posta veya şifre hatalı.");
        }

        // 4. Kullanıcının rollerini liste haline getir ve JWT üret
        var userRoles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var tokenResponse = _tokenService.CreateToken(user, userRoles);

        return ApiResponse<TokenResponseDto>.SuccessResult(tokenResponse, "Giriş işlemi başarılı.");
    }
}