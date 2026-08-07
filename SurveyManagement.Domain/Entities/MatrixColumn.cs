namespace SurveyManagement.Domain.Entities;

public class MatrixColumn : BaseEntity
{
    public int QuestionId { get; set; }
    public Question Question { get; set; } = null!;

    public string Text { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }

    public ICollection<ResponseMatrixAnswer> ResponseMatrixAnswers { get; set; } = new List<ResponseMatrixAnswer>();
}