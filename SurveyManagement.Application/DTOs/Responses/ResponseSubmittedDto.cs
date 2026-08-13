namespace SurveyManagement.Application.DTOs.Responses;

public class ResponseSubmittedDto
{
    public int FormResponseId { get; set; }
    public Guid FormPublicId { get; set; }
    public DateTime SubmittedAt { get; set; }
}