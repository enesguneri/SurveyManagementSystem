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
    private readonly IFormResponseExportService _formResponseExportService;

    public ResponsesController(IFormResponseService formResponseService, IFormResponseExportService formResponseExportService)
    {
        _formResponseService = formResponseService;
        _formResponseExportService = formResponseExportService;
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

    [HttpGet("export")]
    [Authorize]
    public async Task<IActionResult> Export(
    Guid publicId,
    [FromQuery] string format = "csv",
    CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(
                ApiResponse<string>.FailureResult(
                    "Kimliği doğrulanmış kullanıcı bilgisi alınamadı."));
        }

        var result =
            await _formResponseExportService.ExportAsync(
                publicId,
                userId,
                format,
                cancellationToken);

        if (!result.IsSuccess ||
            result.Data is null)
        {
            return StatusCode(
                result.HttpStatusCode,
                result);
        }

        return File(
            result.Data.Content,
            result.Data.ContentType,
            result.Data.FileName);
    }

    [HttpDelete("{responseId:int}")]
    [Authorize]
    public async Task<IActionResult> DeleteResponse(
        Guid publicId,
        int responseId,
        CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(
                ApiResponse<bool>.FailureResult(
                    "Kimliği doğrulanmış kullanıcı bilgisi alınamadı."));
        }

        var result = await _formResponseService.DeleteResponseAsync(
            publicId,
            responseId,
            userId,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(
                result.HttpStatusCode,
                result);
        }

        return Ok(result);
    }
}