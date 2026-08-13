using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Application.DTOs.Forms;

public class FormCreatedDto
{
    public int Id { get; set; }
    public Guid PublicId { get; set; }

    public string Title { get; set; } = string.Empty;

    // Form ayarlarında katılımcı kimliği görünürlük durumunu döndürür.
    public bool ShowRespondentIdentity { get; set; }

    public FormStatus Status { get; set; }
    public FormAccessType AccessType { get; set; }

    public DateTime CreatedAt { get; set; }
}