namespace SurveyManagement.Application.DTOs.AI;

public class SaveUserAiConfigRequestDto
{
    public string ApiKey { get; set; } = string.Empty;
    public string? Model { get; set; }
}
