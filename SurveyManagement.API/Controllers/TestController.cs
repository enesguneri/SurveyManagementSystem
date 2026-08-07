using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace SurveyManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    /// <summary>
    /// Herkese açık bir endpoint. Token gerektirmez.
    /// </summary>
    [HttpGet("public")]
    public IActionResult GetPublicData()
    {
        return Ok(new { Message = "Bu veriyi herkes görebilir. Token gerekli değil." });
    }

    /// <summary>
    /// Sadece geçerli bir JWT Token'a sahip kullanıcıların erişebileceği korumalı endpoint.
    /// </summary>
    [HttpGet("protected")]
    [Authorize] // 🔒 Bu attribute, metodun sadece giriş yapmış kullanıcılara açık olmasını sağlar
    public IActionResult GetProtectedData()
    {
        // Token içindeki kullanıcının e-posta bilgisini okuyalım
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;

        return Ok(new
        {
            Message = "Tebrikler! Geçerli bir Token ile bu korumalı veriye ulaştınız.",
            User = userEmail
        });
    }

    /// <summary>
    /// Sadece 'Admin' rolüne sahip kullanıcıların erişebileceği endpoint.
    /// </summary>
    [HttpGet("admin-only")]
    [Authorize(Roles = "Admin")] // 👑 Sadece token yetmez, rolün de Admin olması şart!
    public IActionResult GetAdminData()
    {
        return Ok(new { Message = "Hoş geldin Admin! Bu çok gizli veriyi sadece sen görebilirsin." });
    }
}