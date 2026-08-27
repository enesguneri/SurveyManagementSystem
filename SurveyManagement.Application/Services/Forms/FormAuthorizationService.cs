using Microsoft.EntityFrameworkCore;
using SurveyManagement.Application.Interfaces.Context;
using SurveyManagement.Application.Interfaces.Services;
using SurveyManagement.Domain.Entities;

namespace SurveyManagement.Application.Services.Forms;

public class FormAuthorizationService : IFormAuthorizationService
{
    private readonly IAppDbContext _context;

    public FormAuthorizationService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> CanManageFormAsync(
        Form form,
        int requesterUserId,
        CancellationToken cancellationToken = default)
    {
        // 1. Form sahibi kendi formunu yönetebilir.
        if (form.CreatedByUserId == requesterUserId)
        {
            return true;
        }

        // 2. Admin tüm formları yönetebilir.
        // Diğer kullanıcılar, sahip oldukları aktif rollerden biri forma atanmışsa formu yönetebilir.
        return await _context.UserRoles.AnyAsync(
            userRole =>
                userRole.UserId == requesterUserId &&
                userRole.Role.IsActive &&
                (
                    (
                        userRole.Role.IsSystemRole &&
                        userRole.Role.Name == "Admin"
                    ) ||
                    _context.FormRoles.Any(
                        formRole =>
                            formRole.FormId == form.Id &&
                            formRole.RoleId == userRole.RoleId &&
                            formRole.Role.IsActive)
                ),
            cancellationToken);
    }
}
