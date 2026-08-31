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

        _context.UserRoles.Add(new UserRole
        {
            UserId = assignRoleDto.UserId,
            RoleId = assignRoleDto.RoleId
        });

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<string>.SuccessResult(
            "Rol kullanıcıya başarıyla atandı.");
    }

    public async Task<ApiResponse<string>> RemoveFromUserAsync(
        AssignRoleDto assignRoleDto,
        CancellationToken cancellationToken = default)
    {
        var assignment = await _context.UserRoles
            .FirstOrDefaultAsync(
                userRole =>
                    userRole.UserId == assignRoleDto.UserId &&
                    userRole.RoleId == assignRoleDto.RoleId,
                cancellationToken);

        if (assignment is null)
        {
            return ApiResponse<string>.FailureResult(
                "Kullanıcıya atanmış bu rol bulunamadı.",
                404);
        }

        _context.UserRoles.Remove(assignment);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<string>.SuccessResult(
            "Rol kullanıcıdan başarıyla kaldırıldı.");
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

    public async Task<ApiResponse<List<RoleWithUsersDto>>> GetAllWithUsersAsync(
        CancellationToken cancellationToken = default)
    {
        var roles = await _context.Roles
            .AsNoTracking()
            .Where(role => role.IsActive)
            .Include(role => role.UserRoles)
                .ThenInclude(userRole => userRole.User)
            .OrderBy(role => role.Name)
            .Select(role => new RoleWithUsersDto
            {
                Id = role.Id,
                Name = role.Name,
                IsSystemRole = role.IsSystemRole,
                IsActive = role.IsActive,
                UserCount = role.UserRoles.Count(ur => ur.User.IsActive),
                Users = role.UserRoles
                    .Where(ur => ur.User.IsActive)
                    .Select(ur => new RoleUserDto
                    {
                        Id = ur.User.Id,
                        Name = ur.User.Name,
                        Username = ur.User.Username,
                        Email = ur.User.Email,
                        IsActive = ur.User.IsActive
                    })
                    .OrderBy(u => u.Name)
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<RoleWithUsersDto>>.SuccessResult(roles);
    }

    public async Task<ApiResponse<string>> DeleteAsync(
        int roleId,
        CancellationToken cancellationToken = default)
    {
        var role = await _context.Roles
            .Include(r => r.UserRoles)
            .Include(r => r.FormRoles)
            .FirstOrDefaultAsync(r => r.Id == roleId, cancellationToken);

        if (role is null || !role.IsActive)
        {
            return ApiResponse<string>.FailureResult(
                "Silinecek rol bulunamadı.",
                404);
        }

        if (role.IsSystemRole || string.Equals(role.Name, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return ApiResponse<string>.FailureResult(
                "Sistem rolleri silinemez.",
                400);
        }

        _context.UserRoles.RemoveRange(role.UserRoles);
        _context.FormRoles.RemoveRange(role.FormRoles);
        role.IsActive = false;

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<string>.SuccessResult(
            "Birim rolü başarıyla silindi.");
    }
}