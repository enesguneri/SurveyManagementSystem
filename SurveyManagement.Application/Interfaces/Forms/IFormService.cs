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

    Task<ApiResponse<FormDetailsDto>> GetByPublicIdAsync(
    Guid publicId,
    int? requesterUserId,
    CancellationToken cancellationToken = default);

    Task<ApiResponse<FormCreatedDto>> CloseAsync(
    Guid publicId,
    int requesterUserId,
    CancellationToken cancellationToken = default);

    Task<ApiResponse<FormCreatedDto>> UpdateDraftAsync(
    Guid publicId,
    CreateFormDto updateFormDto,
    int requesterUserId,
    CancellationToken cancellationToken = default);

    // Kullanıcının sahibi olduğu veya birim rolüyle erişebildiği
    // formları listeler.
    Task<ApiResponse<List<ManageableFormDto>>> GetManageableAsync(
        int requesterUserId,
        CancellationToken cancellationToken = default);
}