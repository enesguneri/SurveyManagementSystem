using System.Security.Claims;
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

    [HttpGet("config")]
    public async Task<IActionResult> GetUserConfig(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<UserAiConfigDto>.FailureResult("Yetkisiz erişim.", 401));
        }

        var config = await _geminiSurveyService.GetUserConfigAsync(userId, cancellationToken);
        return Ok(ApiResponse<UserAiConfigDto>.SuccessResult(config));
    }

    [HttpPut("config")]
    public async Task<IActionResult> SaveUserConfig(
        [FromBody] SaveUserAiConfigRequestDto dto,
        CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<bool>.FailureResult("Yetkisiz erişim.", 401));
        }

        var result = await _geminiSurveyService.SaveUserConfigAsync(userId, dto, cancellationToken);
        if (!result.IsSuccess)
        {
            return StatusCode(result.HttpStatusCode, result);
        }

        return Ok(result);
    }

    [HttpPost("survey-draft")]
    public async Task<IActionResult> GenerateSurveyDraft(
        [FromBody] GenerateSurveyDraftRequestDto request,
        CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        int? requesterUserId = int.TryParse(userIdClaim, out var parsedId) ? parsedId : null;

        // Gemini özelliği yalnızca giriş yapmış kullanıcılar içindir.
        var result = await _geminiSurveyService.GenerateDraftAsync(
            request,
            requesterUserId,
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