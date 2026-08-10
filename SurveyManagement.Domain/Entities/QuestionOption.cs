namespace SurveyManagement.Domain.Entities;

public class QuestionOption : BaseEntity
{
    public int QuestionId { get; set; }
    public Question Question { get; set; } = null!;

    public string Text { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }

    public ICollection<ResponseAnswerOption> ResponseAnswerOptions { get; set; } = new List<ResponseAnswerOption>();
}