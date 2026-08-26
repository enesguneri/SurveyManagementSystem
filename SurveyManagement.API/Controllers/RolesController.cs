using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Roles;
using SurveyManagement.Application.Interfaces.Roles;

namespace SurveyManagement.API.Controllers;

[ApiController]
[Route("api/roles")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet("available")]
    public async Task<IActionResult> GetAvailable(
        CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(
                ApiResponse<string>.FailureResult(
                    "Kullanıcı kimliği alınamadı.",
                    401));
        }

        var result = await _roleService.GetAvailableAsync(
            userId,
            User.IsInRole("Admin"),
            cancellationToken);

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(
        [FromBody] CreateRoleDto createRoleDto,
        CancellationToken cancellationToken)
    {
        var result = await _roleService.CreateAsync(
            createRoleDto,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(
                result.HttpStatusCode,
                result);
        }

        return StatusCode(
            StatusCodes.Status201Created,
            result);
    }

    [HttpPost("assignments")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AssignRole(
    [FromBody] AssignRoleDto assignRoleDto,
    CancellationToken cancellationToken)
    {
        var result = await _roleService.AssignToUserAsync(
            assignRoleDto,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(
                result.HttpStatusCode,
                result);
        }

        return StatusCode(
            StatusCodes.Status201Created,
            result);
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllActive(
    CancellationToken cancellationToken)
    {
        var result = await _roleService.GetAllActiveAsync(
            cancellationToken);

        return Ok(result);
    }
}