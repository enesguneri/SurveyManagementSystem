namespace SurveyManagement.Application.DTOs.Forms;

public class CreateQuestionValidationDto
{
    public int? MinLength { get; set; }
    public int? MaxLength { get; set; }
    public string? RegexPattern { get; set; }

    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }

    // Yalnızca Date tipi sorular için kullanılacaktır.
    public DateOnly? MinDate { get; set; }
    public DateOnly? MaxDate { get; set; }
}