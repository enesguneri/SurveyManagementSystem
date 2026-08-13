namespace SurveyManagement.Application.DTOs.Responses;

public class SubmitFormResponseDto
{
    // Formdaki sorulara verilen cevapların tamamını içerir.
    public List<SubmitAnswerDto> Answers { get; set; } = new();
}