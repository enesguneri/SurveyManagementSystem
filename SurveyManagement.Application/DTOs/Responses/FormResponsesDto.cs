namespace SurveyManagement.Application.DTOs.Responses;

public class FormResponsesDto
{
    public Guid FormPublicId { get; set; }
    public string Title { get; set; } = string.Empty;

    // Frontend'in isim gösterme politikasını bilmesini sağlar.
    public bool ShowRespondentIdentity { get; set; }

    public List<FormResponseItemDto> Responses { get; set; } = new();
}