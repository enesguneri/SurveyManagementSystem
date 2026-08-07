using SurveyManagement.Application.DTOs.Auth;
using SurveyManagement.Domain.Entities;

namespace SurveyManagement.Application.Interfaces.Security;

public interface ITokenService
{
    /// <summary>
    /// Kullanıcı bilgileri ve rollerine göre geçerli bir JWT Access Token üretir.
    /// </summary>
    TokenResponseDto CreateToken(User user, List<string> roles);
}