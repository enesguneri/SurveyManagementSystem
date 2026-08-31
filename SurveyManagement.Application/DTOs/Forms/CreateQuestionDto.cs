using System.ComponentModel.DataAnnotations;
using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Application.DTOs.Forms;

public class CreateQuestionDto
{
    [Required]
    [StringLength(1000, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; set; }

    public QuestionType Type { get; set; }
    public bool IsRequired { get; set; }

    [StringLength(200)]
    public string? RatingMinLabel { get; set; }

    [StringLength(200)]
    public string? RatingMaxLabel { get; set; }

    // Dinamik dış kaynak seçenek alanları
    public DynamicOptionSourceType OptionSourceType { get; set; } = DynamicOptionSourceType.None;

    [StringLength(2000)]
    public string? OptionSourceUrl { get; set; }

    [StringLength(500)]
    public string? OptionJsonPath { get; set; }

    [StringLength(200)]
    public string? OptionTextProperty { get; set; }

    public string? OptionFileContent { get; set; }

    public CreateQuestionValidationDto? Validation { get; set; }

    public List<CreateQuestionOptionDto> Options { get; set; } = new();
    public List<CreateMatrixRowDto> MatrixRows { get; set; } = new();
    public List<CreateMatrixColumnDto> MatrixColumns { get; set; } = new();
}