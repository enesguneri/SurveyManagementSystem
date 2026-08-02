using UserManagement.Application.DTOs.Auth;
using UserManagement.Domain.Entities;

namespace UserManagement.Application.Interfaces.Security;

public interface ITokenService
{
    /// <summary>
    /// Kullanıcı bilgileri ve rollerine göre geçerli bir JWT Access Token üretir.
    /// </summary>
    TokenResponseDto CreateToken(User user, List<string> roles);
}