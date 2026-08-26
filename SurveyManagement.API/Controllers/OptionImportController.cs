using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SurveyManagement.Application.DTOs.Options;
using SurveyManagement.Application.Interfaces.Options;

namespace SurveyManagement.API.Controllers;

[ApiController]
[Route("api/options")]
[Authorize]
public sealed class OptionImportController : ControllerBase
{
    private readonly IOptionImportService _optionImportService;

    public OptionImportController(
        IOptionImportService optionImportService)
    {
        _optionImportService = optionImportService;
    }

    [HttpPost("preview-from-url")]
    public async Task<IActionResult> PreviewFromUrl(
        [FromBody] ImportOptionsFromUrlRequestDto request,
        CancellationToken cancellationToken)
    {
        // Bu endpoint yalnızca önizleme döndürür.
        // Veritabanına herhangi bir kayıt yapılmaz.
        var result =
            await _optionImportService.PreviewFromUrlAsync(
                request,
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