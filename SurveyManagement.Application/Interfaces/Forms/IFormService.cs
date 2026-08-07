using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Forms;

namespace SurveyManagement.Application.Interfaces.Forms;

public interface IFormService
{
    Task<ApiResponse<FormCreatedDto>> CreateAsync(
        CreateFormDto createFormDto,
        int createdByUserId,
        CancellationToken cancellationToken = default);

    Task<ApiResponse<FormCreatedDto>> PublishAsync(
    Guid publicId,
    int requesterUserId,
    CancellationToken cancellationToken = default);
}