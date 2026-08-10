using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Application.DTOs.Forms;

public class FormDetailsDto
{
    public Guid PublicId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public FormStatus Status { get; set; }
    public FormAccessType AccessType { get; set; }

    public List<QuestionDetailsDto> Questions { get; set; } = new();
}