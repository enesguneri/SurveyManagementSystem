using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Application.DTOs.Forms;

public class ManageableFormDto
{
    public int Id { get; set; }

    public Guid PublicId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public FormStatus Status { get; set; }

    public FormAccessType AccessType { get; set; }

    public DateTime CreatedAt { get; set; }

    public int CreatedByUserId { get; set; }

    public string CreatedByUserName { get; set; } = string.Empty;

    // Formun bağlı olduğu birimlerin adları.
    public List<string> RoleNames { get; set; } = new();
}