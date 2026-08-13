using System.Text.Json.Serialization;

namespace SurveyManagement.Application.Common.Models;

public class ApiResponse<T>
{
    public bool IsSuccess { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    // Controller'ın HTTP durum kodunu belirlemesi için kullanılır.
    // JsonIgnore sayesinde istemciye JSON alanı olarak gönderilmez.
    [JsonIgnore]
    public int HttpStatusCode { get; set; } = 200;

    // Başarılı veri yanıtı oluşturur.
    public static ApiResponse<T> SuccessResult(
        T data,
        string? message = null)
    {
        return new ApiResponse<T>
        {
            IsSuccess = true,
            Data = data,
            Message = message,
            HttpStatusCode = 200
        };
    }

    // Veri içermeyen başarılı yanıt oluşturur.
    public static ApiResponse<T> SuccessResult(string message)
    {
        return new ApiResponse<T>
        {
            IsSuccess = true,
            Message = message,
            HttpStatusCode = 200
        };
    }

    // Tek hata mesajı içeren başarısız yanıt oluşturur.
    public static ApiResponse<T> FailureResult(
        string errorMessage,
        int httpStatusCode = 400)
    {
        return new ApiResponse<T>
        {
            IsSuccess = false,
            Message = errorMessage,
            Errors = new List<string> { errorMessage },
            HttpStatusCode = httpStatusCode
        };
    }

    // Birden fazla hata içeren başarısız yanıt oluşturur.
    public static ApiResponse<T> FailureResult(
        List<string> errors,
        string? message = null,
        int httpStatusCode = 400)
    {
        return new ApiResponse<T>
        {
            IsSuccess = false,
            Message = message,
            Errors = errors,
            HttpStatusCode = httpStatusCode
        };
    }
}