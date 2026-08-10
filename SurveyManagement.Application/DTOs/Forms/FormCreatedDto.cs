using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Application.DTOs.Forms;

public class FormCreatedDto
{
    public int Id { get; set; }
    public Guid PublicId { get; set; }

    public string Title { get; set; } = string.Empty;
    public FormStatus Status { get; set; }
    public FormAccessType AccessType { get; set; }

    public DateTime CreatedAt { get; set; }
}