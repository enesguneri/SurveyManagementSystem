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
            return BadRequest(result);
        }

        // Form başarıyla oluşturulduğunda HTTP 201 dönülür.
        return StatusCode(StatusCodes.Status201Created, result);
    }
}