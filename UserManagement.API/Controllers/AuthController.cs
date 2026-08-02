using Microsoft.AspNetCore.Mvc;
using UserManagement.Application.DTOs.Auth;
using UserManagement.Application.Interfaces.Auth;

namespace UserManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Yeni kullanıcı kaydı oluşturur.
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    //[FromBody] İstemcinin HTTP isteğinin gövdesinde (Body) gönderdiği JSON verisini okur ve
    //otomatik olarak C# nesnemiz olan RegisterDto sınıfına dönüştürür (Deserialization).
    {
        var result = await _authService.RegisterAsync(registerDto);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Kullanıcı girişi yapar ve JWT Token döner.
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        var result = await _authService.LoginAsync(loginDto);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}