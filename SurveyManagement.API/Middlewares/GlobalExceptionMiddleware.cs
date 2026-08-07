using System.Net;
using System.Text.Json;
using SurveyManagement.Application.Common.Models;

namespace SurveyManagement.API.Middlewares;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // İsteği bir sonraki middleware/controller adımına ilet
            await _next(context);
        }
        catch (Exception ex)
        {
            // Hatanı konsola/log sistemine detaylıca yaz
            _logger.LogError(ex, "Beklenmeyen bir hata oluştu: {Message}", ex.Message);

            // İstemciye standart hatayı dön
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        // ApiResponse<T> formatında hata yanıtı oluşturma
        var response = ApiResponse<string>.FailureResult(
            errors: new List<string> { exception.Message },
            message: "Sunucu tarafında beklenmeyen bir hata oluştu."
        );

        // JSON çıktısının camelCase formatında olması için konfigürasyon
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var json = JsonSerializer.Serialize(response, options);
        await context.Response.WriteAsync(json);
    }
}