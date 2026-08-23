using Microsoft.EntityFrameworkCore;
using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Admin;
using SurveyManagement.Application.Interfaces.Admin;
using SurveyManagement.Application.Interfaces.Context;

namespace SurveyManagement.Application.Services.Admin;

public class AdminUserService : IAdminUserService
{
    private readonly IAppDbContext _context;

    public AdminUserService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<AdminUserDto>>> GetUsersAsync(
        CancellationToken cancellationToken = default)
    {
        // Şifre alanları seçilmez; yalnızca admin paneli için
        // gerekli güvenli kullanıcı bilgileri alınır.
        var users = await _context.Users
            .AsNoTracking()
            .Include(user => user.UserRoles)
                .ThenInclude(userRole => userRole.Role)
            .OrderBy(user => user.Username)
            .ToListAsync(cancellationToken);

        var userDtos = users
            .Select(user => new AdminUserDto
            {
                Id = user.Id,
                Name = user.Name,
                Username = user.Username,
                Email = user.Email,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                Roles = user.UserRoles
                    .Where(userRole =>
                        userRole.Role.IsActive)
                    .Select(userRole =>
                        userRole.Role.Name)
                    .OrderBy(roleName => roleName)
                    .ToList()
            })
            .ToList();

        return ApiResponse<List<AdminUserDto>>.SuccessResult(
            userDtos);
    }
}