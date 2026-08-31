using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Application.DTOs.Forms;

public class FormDetailsDto
{
    public Guid PublicId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    // Katılımcı adının sonuç ekranında gösterilip gösterilmeyeceğini belirler.
    public bool ShowRespondentIdentity { get; set; }
    public FormStatus Status { get; set; }
    public FormAccessType AccessType { get; set; }
    public bool HasCurrentUserResponded { get; set; }
    public bool IsClosedPreview { get; set; }

    // Formun bağlı olduğu birim rollerinin Id değerleri.
    public List<int> RoleIds { get; set; } = new();
    public List<QuestionDetailsDto> Questions { get; set; } = new();
}