namespace SurveyManagement.Application.DTOs.AI;

public class UserAiConfigDto
{
    public bool HasApiKey { get; set; }
    public string? MaskedApiKey { get; set; }
    public string? Model { get; set; }
}
