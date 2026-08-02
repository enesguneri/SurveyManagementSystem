using UserManagement.Application.Common.Models;
using UserManagement.Application.DTOs.Auth;

namespace UserManagement.Application.Interfaces.Auth;

public interface IAuthService
{
    /// <summary>
    /// Yeni bir kullanıcı kaydı oluşturur ve JWT Token döner.
    /// </summary>
    Task<ApiResponse<TokenResponseDto>> RegisterAsync(RegisterDto registerDto);

    /// <summary>
    /// Kullanıcı adı/E-posta ve şifre kontrolü yaparak JWT Token döner.
    /// </summary>
    Task<ApiResponse<TokenResponseDto>> LoginAsync(LoginDto loginDto);
}