using SurveyManagement.Application.DTOs.AI;

namespace SurveyManagement.Application.Interfaces.AI;

public interface IGeminiSurveyService
{
    // Kullanıcı açıklamasından anket taslağı veya netleştirme soruları üretir.
    Task<GenerateSurveyDraftResponseDto> GenerateDraftAsync(
        GenerateSurveyDraftRequestDto request,
        CancellationToken cancellationToken);
}