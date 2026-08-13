namespace SurveyManagement.Application.DTOs.Responses;

public class FormResponseItemDto
{
    public int Id { get; set; }

    // ShowRespondentIdentity false ise null döner.
    public string? RespondentName { get; set; }

    public DateTime SubmittedAt { get; set; }

    public List<ResponseAnswerDetailsDto> Answers { get; set; } = new();
}