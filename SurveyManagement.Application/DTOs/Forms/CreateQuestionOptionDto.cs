using System.ComponentModel.DataAnnotations;

namespace SurveyManagement.Application.DTOs.Forms;

public class CreateQuestionOptionDto
{
    [Required]
    [StringLength(500, MinimumLength = 1)]
    public string Text { get; set; } = string.Empty;
}