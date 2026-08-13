using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Responses;

namespace SurveyManagement.Application.Interfaces.Responses;

public interface IFormResponseService
{
    // Bir forma verilen yanıtları kaydeder.
    Task<ApiResponse<ResponseSubmittedDto>> SubmitAsync(
        Guid formPublicId,
        SubmitFormResponseDto submitDto,
        int? respondentUserId,
        string? respondentIpAddress,
        CancellationToken cancellationToken = default);

    // Bir forma ait yanıtları form sahibi veya Admin için listeler.
    Task<ApiResponse<FormResponsesDto>> GetByFormAsync(
        Guid formPublicId,
        int requesterUserId,
        CancellationToken cancellationToken = default);
}