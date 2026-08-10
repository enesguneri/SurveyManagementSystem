using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Domain.Entities;

public class Question : BaseEntity
{
    public int FormId { get; set; }
    public Form Form { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public QuestionType Type { get; set; }

    public bool IsRequired { get; set; }
    public int DisplayOrder { get; set; }

    public string? RatingMinLabel { get; set; }
    public string? RatingMaxLabel { get; set; }

    public QuestionValidation? Validation { get; set; }
    public ICollection<QuestionOption> Options { get; set; } = new List<QuestionOption>();
    public ICollection<MatrixRow> MatrixRows { get; set; } = new List<MatrixRow>();
    public ICollection<MatrixColumn> MatrixColumns { get; set; } = new List<MatrixColumn>();
    public ICollection<ResponseAnswer> ResponseAnswers { get; set; } = new List<ResponseAnswer>();
}