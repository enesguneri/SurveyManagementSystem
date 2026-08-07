using System.ComponentModel.DataAnnotations;
using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Application.DTOs.Forms;

public class CreateFormDto
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; set; }

    public FormAccessType AccessType { get; set; } = FormAccessType.Authenticated;

    [MinLength(1)]
    public List<CreateQuestionDto> Questions { get; set; } = new();
}