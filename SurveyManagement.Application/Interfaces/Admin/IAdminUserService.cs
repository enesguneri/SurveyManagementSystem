using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Admin;

namespace SurveyManagement.Application.Interfaces.Admin;

public interface IAdminUserService
{
    // Admin panelinde tüm kullanıcıları ve rollerini listeler.
    Task<ApiResponse<List<AdminUserDto>>> GetUsersAsync(
        CancellationToken cancellationToken = default);
}