namespace SurveyManagement.Domain.Entities;

public class ResponseAnswerOption
{
    public int ResponseAnswerId { get; set; }
    public ResponseAnswer ResponseAnswer { get; set; } = null!;

    public int QuestionOptionId { get; set; }
    public QuestionOption QuestionOption { get; set; } = null!;
}