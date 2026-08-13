namespace SurveyManagement.Domain.Entities;

public class ResponseAnswer
{
    public int Id { get; set; }

    public int FormResponseId { get; set; }
    public FormResponse FormResponse { get; set; } = null!;

    public int QuestionId { get; set; }
    public Question Question { get; set; } = null!;

    public string? TextValue { get; set; }
    public decimal? NumericValue { get; set; }

    // Date türündeki soruların tarih olarak saklanmasını sağlar.
    public DateOnly? DateValue { get; set; }

    public ICollection<ResponseAnswerOption> SelectedOptions { get; set; } = new List<ResponseAnswerOption>();
    public ICollection<ResponseMatrixAnswer> MatrixAnswers { get; set; } = new List<ResponseMatrixAnswer>();
}