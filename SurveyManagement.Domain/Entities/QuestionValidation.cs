namespace SurveyManagement.Domain.Entities;

public class QuestionValidation
{
    public int QuestionId { get; set; }
    public Question Question { get; set; } = null!;

    public int? MinLength { get; set; }
    public int? MaxLength { get; set; }
    public string? RegexPattern { get; set; }

    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
}