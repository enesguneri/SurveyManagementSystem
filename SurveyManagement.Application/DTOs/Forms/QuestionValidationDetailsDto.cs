namespace SurveyManagement.Application.DTOs.Forms;

public class QuestionValidationDetailsDto
{
    public int? MinLength { get; set; }
    public int? MaxLength { get; set; }
    public string? RegexPattern { get; set; }

    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
}