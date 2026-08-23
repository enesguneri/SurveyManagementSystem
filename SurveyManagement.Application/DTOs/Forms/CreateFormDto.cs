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

    // Katılımcı adının sonuç ekranında gösterilip gösterilmeyeceğini belirtir.
    // Katılımcı adı veritabanına her durumda kaydedilir.
    public bool ShowRespondentIdentity { get; set; } = false;

    public FormAccessType AccessType { get; set; } = FormAccessType.Authenticated;

    // Formun bağlı olduğu birim rollerinin Id değerleri.
    // Boş bırakılabilir; bu durumda form belirli bir birime bağlanmaz.
    public List<int> RoleIds { get; set; } = new();

    [MinLength(1)]
    public List<CreateQuestionDto> Questions { get; set; } = new();
}