using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Forms;
using SurveyManagement.Application.Interfaces.Forms;

namespace SurveyManagement.API.Controllers;

[ApiController]
[Route("api/forms")]
[Authorize]
public class FormsController : ControllerBase
{
    private readonly IFormService _formService;

    public FormsController(IFormService formService)
    {
        _formService = formService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateFormDto createFormDto,
        CancellationToken cancellationToken)
    {
        // JWT içindeki NameIdentifier claim'i giriş yapan kullanıcının Id değeridir.
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<string>.FailureResult(
                "Kimliği doğrulanmış kullanıcı bilgisi alınamadı."));
        }

        // Formun sahibi, isteğin gövdesinden değil JWT'den alınır.
        var result = await _formService.CreateAsync(
            createFormDto,
            userId,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(result.HttpStatusCode, result);
        }

        // Form başarıyla oluşturulduğunda HTTP 201 dönülür.
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPost("{publicId:guid}/publish")]
    public async Task<IActionResult> Publish(
    Guid publicId,
    CancellationToken cancellationToken)
    {
        // Yayınlama yetkisi JWT içindeki kullanıcıya göre belirlenir.
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<string>.FailureResult(
                "Kimliği doğrulanmış kullanıcı bilgisi alınamadı."));
        }

        var result = await _formService.PublishAsync(
            publicId,
            userId,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(result.HttpStatusCode, result);
        }

        return Ok(result);
    }

    [HttpGet("{publicId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByPublicId(
    Guid publicId,
    CancellationToken cancellationToken)
    {
        // Public form için null, Authenticated form için JWT kullanıcı Id'si gönderilir.
        int? requesterUserId = null;

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (int.TryParse(userIdClaim, out var parsedUserId))
        {
            requesterUserId = parsedUserId;
        }

        var result = await _formService.GetByPublicIdAsync(
            publicId,
            requesterUserId,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(result.HttpStatusCode, result);
        }

        return Ok(result);
    }
}