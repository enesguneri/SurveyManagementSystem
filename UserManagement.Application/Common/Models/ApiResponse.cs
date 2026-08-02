namespace UserManagement.Application.Common.Models;

/// <summary>
/// Tüm API yanıtlarını standart bir formatta sarmalayan jenerik sınıf.
/// </summary>
/// <typeparam name="T">Yanıt verisinin tipi</typeparam>
public class ApiResponse<T>
{
    public bool IsSuccess { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    // --- Başarılı Yanıt Fabrika Metotları (Factory Methods) ---

    public static ApiResponse<T> SuccessResult(T data, string? message = null)
    {
        return new ApiResponse<T>
        {
            IsSuccess = true,
            Data = data,
            Message = message
        };
    }

    public static ApiResponse<T> SuccessResult(string message)
    {
        return new ApiResponse<T>
        {
            IsSuccess = true,
            Message = message
        };
    }

    // --- Hatalı Yanıt Fabrika Metotları ---

    public static ApiResponse<T> FailureResult(string errorMessage)
    {
        return new ApiResponse<T>
        {
            IsSuccess = false,
            Message = errorMessage,
            Errors = new List<string> { errorMessage }
        };
    }

    public static ApiResponse<T> FailureResult(List<string> errors, string? message = null)
    {
        return new ApiResponse<T>
        {
            IsSuccess = false,
            Message = message,
            Errors = errors
        };
    }
}