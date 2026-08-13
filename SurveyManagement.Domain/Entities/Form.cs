using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Domain.Entities;

public class Form : BaseEntity
{
    public Guid PublicId { get; set; } = Guid.NewGuid();
    public int CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    // Katılımcı adının sonuç ekranında gösterilip gösterilmeyeceğini belirler.
    // Katılımcı adı veritabanına her durumda kaydedilecektir.
    public bool ShowRespondentIdentity { get; set; } = false;

    public FormStatus Status { get; set; } = FormStatus.Draft;
    public FormAccessType AccessType { get; set; } = FormAccessType.Authenticated;
    public FormCreationSource CreationSource { get; set; } = FormCreationSource.Manual;

    public ICollection<Question> Questions { get; set; } = new List<Question>();
    public ICollection<FormResponse> Responses { get; set; } = new List<FormResponse>();
}