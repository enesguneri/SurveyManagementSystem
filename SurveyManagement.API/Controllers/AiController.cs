using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.AI;
using SurveyManagement.Application.Interfaces.AI;

namespace SurveyManagement.API.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly IGeminiSurveyService _geminiSurveyService;

    public AiController(
        IGeminiSurveyService geminiSurveyService)
    {
        _geminiSurveyService = geminiSurveyService;
    }

    [HttpPost("survey-draft")]
    public async Task<IActionResult> GenerateSurveyDraft(
        [FromBody] GenerateSurveyDraftRequestDto request,
        CancellationToken cancellationToken)
    {
        // Gemini özelliği yalnızca giriş yapmış kullanıcılar içindir.
        var result = await _geminiSurveyService.GenerateDraftAsync(
            request,
            cancellationToken);

        // Gemini sağlayıcısı başarısız olursa 502 Bad Gateway döndürülür.
        if (result.Status == AiDraftStatus.Failed)
        {
            return StatusCode(
                StatusCodes.Status502BadGateway,
                ApiResponse<GenerateSurveyDraftResponseDto>.FailureResult(
                    result.Message,
                    StatusCodes.Status502BadGateway));
        }

        // NeedsClarification ve Ready durumları başarılı AI yanıtlarıdır.
        return Ok(
            ApiResponse<GenerateSurveyDraftResponseDto>.SuccessResult(
                result));
    }
}