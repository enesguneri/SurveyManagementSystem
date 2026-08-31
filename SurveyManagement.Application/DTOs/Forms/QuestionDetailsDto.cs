using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Application.DTOs.Forms;

public class QuestionDetailsDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public QuestionType Type { get; set; }
    public bool IsRequired { get; set; }
    public int DisplayOrder { get; set; }

    public string? RatingMinLabel { get; set; }
    public string? RatingMaxLabel { get; set; }

    // Dinamik dış kaynak seçenek alanları
    public DynamicOptionSourceType OptionSourceType { get; set; } = DynamicOptionSourceType.None;
    public string? OptionSourceUrl { get; set; }
    public string? OptionJsonPath { get; set; }
    public string? OptionTextProperty { get; set; }
    public string? OptionFileContent { get; set; }

    public QuestionValidationDetailsDto? Validation { get; set; }

    public List<QuestionOptionDetailsDto> Options { get; set; } = new();
    public List<MatrixItemDetailsDto> MatrixRows { get; set; } = new();
    public List<MatrixItemDetailsDto> MatrixColumns { get; set; } = new();
}