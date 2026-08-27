using SurveyManagement.Domain.Entities;

namespace SurveyManagement.Application.Interfaces.Services;

public interface IFormAuthorizationService
{
    Task<bool> CanManageFormAsync(Form form, int userId, CancellationToken cancellationToken = default);
}
