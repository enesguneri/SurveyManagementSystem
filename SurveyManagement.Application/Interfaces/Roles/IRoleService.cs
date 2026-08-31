using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Roles;

namespace SurveyManagement.Application.Interfaces.Roles;

public interface IRoleService
{
    // Kullanıcının bağlı olduğu aktif rolleri getirir.
    // Admin tüm aktif rolleri görebilir.
    Task<ApiResponse<List<RoleDto>>> GetAvailableAsync(
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    // Yalnızca Admin tarafından yeni birim rolü oluşturulur.
    Task<ApiResponse<RoleDto>> CreateAsync(
        CreateRoleDto createRoleDto,
        CancellationToken cancellationToken = default);

    // Admin tarafından kullanıcıya birim rolü atanır.
    Task<ApiResponse<string>> AssignToUserAsync(
        AssignRoleDto assignRoleDto,
        CancellationToken cancellationToken = default);

    // Admin tarafından kullanıcının belirli bir rolü kaldırılır.
    Task<ApiResponse<string>> RemoveFromUserAsync(
        AssignRoleDto assignRoleDto,
        CancellationToken cancellationToken = default);

    // Admin paneli için tüm aktif rolleri getirir.
    Task<ApiResponse<List<RoleDto>>> GetAllActiveAsync(
        CancellationToken cancellationToken = default);

    // Admin paneli için rolleri ve her role tanımlı kullanıcıları getirir.
    Task<ApiResponse<List<RoleWithUsersDto>>> GetAllWithUsersAsync(
        CancellationToken cancellationToken = default);
}