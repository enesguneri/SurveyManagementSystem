using Microsoft.EntityFrameworkCore;
using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Roles;
using SurveyManagement.Application.Interfaces.Context;
using SurveyManagement.Application.Interfaces.Roles;
using SurveyManagement.Domain.Entities;

namespace SurveyManagement.Application.Services.Roles;

public class RoleService : IRoleService
{
    private readonly IAppDbContext _context;

    public RoleService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<RoleDto>>> GetAvailableAsync(
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Roles
            .AsNoTracking()
            .Where(role =>
                role.IsActive &&
                !role.IsSystemRole);

        if (!isAdmin)
        {
            query = query.Where(role =>
                role.UserRoles.Any(userRole =>
                    userRole.UserId == userId));
        }

        var roles = await query
            .OrderBy(role => role.Name)
            .Select(role => new RoleDto
            {
                Id = role.Id,
                Name = role.Name
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<RoleDto>>.SuccessResult(roles);
    }

    public async Task<ApiResponse<RoleDto>> CreateAsync(
        CreateRoleDto createRoleDto,
        CancellationToken cancellationToken = default)
    {
        var normalizedName = createRoleDto.Name.Trim();

        var roleExists = await _context.Roles
            .AnyAsync(
                role => role.Name.ToLower() ==
                        normalizedName.ToLower(),
                cancellationToken);

        if (roleExists)
        {
            return ApiResponse<RoleDto>.FailureResult(
                "Bu isimde bir rol zaten mevcut.",
                400);
        }

        var role = new Role
        {
            Name = normalizedName,
            IsSystemRole = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Roles.Add(role);
        await _context.SaveChangesAsync(cancellationToken);

        var response = new RoleDto
        {
            Id = role.Id,
            Name = role.Name
        };

        return ApiResponse<RoleDto>.SuccessResult(
            response,
            "Birim rolü başarıyla oluşturuldu.");
    }

    public async Task<ApiResponse<string>> AssignToUserAsync(
    AssignRoleDto assignRoleDto,
    CancellationToken cancellationToken = default)
    {
        var userExists = await _context.Users
            .AnyAsync(
                user =>
                    user.Id == assignRoleDto.UserId &&
                    user.IsActive,
                cancellationToken);

        if (!userExists)
        {
            return ApiResponse<string>.FailureResult(
                "Aktif kullanıcı bulunamadı.",
                404);
        }

        var roleExists = await _context.Roles
            .AnyAsync(
                role =>
                    role.Id == assignRoleDto.RoleId &&
                    role.IsActive,
                cancellationToken);

        if (!roleExists)
        {
            return ApiResponse<string>.FailureResult(
                "Aktif rol bulunamadı.",
                404);
        }

        var assignmentExists = await _context.UserRoles
            .AnyAsync(
                userRole =>
                    userRole.UserId == assignRoleDto.UserId &&
                    userRole.RoleId == assignRoleDto.RoleId,
                cancellationToken);

        if (assignmentExists)
        {
            return ApiResponse<string>.FailureResult(
                "Bu rol kullanıcıya zaten atanmış.",
                400);
        }

        _context.UserRoles.Add(new Domain.Entities.UserRole
        {
            UserId = assignRoleDto.UserId,
            RoleId = assignRoleDto.RoleId
        });

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<string>.SuccessResult(
            "Rol kullanıcıya başarıyla atandı.");
    }

    public async Task<ApiResponse<List<RoleDto>>> GetAllActiveAsync(
    CancellationToken cancellationToken = default)
    {
        var roles = await _context.Roles
            .AsNoTracking()
            .Where(role => role.IsActive)
            .OrderBy(role => role.Name)
            .Select(role => new RoleDto
            {
                Id = role.Id,
                Name = role.Name
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<RoleDto>>.SuccessResult(roles);
    }
}