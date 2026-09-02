using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.AI;

namespace SurveyManagement.Application.Interfaces.AI;

public interface IGeminiSurveyService
{
    // Kullanıcı açıklamasından anket taslağı veya netleştirme soruları üretir.
    Task<GenerateSurveyDraftResponseDto> GenerateDraftAsync(
        GenerateSurveyDraftRequestDto request,
        int? requesterUserId = null,
        CancellationToken cancellationToken = default);

    // Kullanıcının Gemini API yapılandırma durumunu döner.
    Task<UserAiConfigDto> GetUserConfigAsync(
        int userId,
        CancellationToken cancellationToken = default);

    // Kullanıcının kişisel Gemini API anahtarını ve model tercihini günceller.
    Task<ApiResponse<bool>> SaveUserConfigAsync(
        int userId,
        SaveUserAiConfigRequestDto dto,
        CancellationToken cancellationToken = default);
}