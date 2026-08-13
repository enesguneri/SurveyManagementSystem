using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Responses;
using SurveyManagement.Application.Interfaces.Responses;

namespace SurveyManagement.API.Controllers;

[ApiController]
[Route("api/forms/{publicId:guid}/responses")]
public class ResponsesController : ControllerBase
{
    private readonly IFormResponseService _formResponseService;

    public ResponsesController(IFormResponseService formResponseService)
    {
        _formResponseService = formResponseService;
    }

    [HttpPost]
    public async Task<IActionResult> Submit(
        Guid publicId,
        [FromBody] SubmitFormResponseDto submitDto,
        CancellationToken cancellationToken)
    {
        // Public form için kullanıcı Id'si null kalabilir.
        // Authenticated form kontrolü servis katmanında yapılır.
        int? respondentUserId = null;

        var userIdClaim = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (int.TryParse(userIdClaim, out var parsedUserId))
        {
            respondentUserId = parsedUserId;
        }

        // IP adresi istemciden alınmaz; HTTP bağlantısından okunur.
        var respondentIpAddress =
            HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _formResponseService.SubmitAsync(
            publicId,
            submitDto,
            respondentUserId,
            respondentIpAddress,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(result.HttpStatusCode, result);
        }

        // Yeni FormResponse kaydı oluşturulduğu için 201 Created döndürülür.
        return StatusCode(
            StatusCodes.Status201Created,
            result);
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetResponses(
    Guid publicId,
    CancellationToken cancellationToken)
    {
        // Sonuçları görüntülemek için JWT içindeki kullanıcı Id'si gerekir.
        var userIdClaim = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<string>.FailureResult(
                "Kimliği doğrulanmış kullanıcı bilgisi alınamadı."));
        }

        var result = await _formResponseService.GetByFormAsync(
            publicId,
            userId,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(result.HttpStatusCode, result);
        }

        return Ok(result);
    }
}