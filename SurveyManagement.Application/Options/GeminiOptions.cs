namespace SurveyManagement.Application.Options;

public sealed class GeminiOptions
{
    // API anahtarı kaynak kodda tutulmaz.
    public string ApiKey { get; set; } = string.Empty;

    // AI Studio hesabında erişilebilen model ile değiştirebiliriz.
    public string Model { get; set; } = "gemini-3.5-flash-lite";

    public string BaseUrl { get; set; } =
        "https://generativelanguage.googleapis.com";
}