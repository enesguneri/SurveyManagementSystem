namespace SurveyManagement.Domain.Entities;

public class FormResponse
{
    public int Id { get; set; }

    public int FormId { get; set; }
    public Form Form { get; set; } = null!;

    public int? RespondentUserId { get; set; }

    // Yanıt gönderildiği andaki kullanıcı adını saklar.
    public string? RespondentNameSnapshot { get; set; }
    // Anonim yanıtlar dahil olmak üzere istemci IP adresini saklar.
    public string? RespondentIpAddress { get; set; }

    public User? RespondentUser { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ResponseAnswer> Answers { get; set; } = new List<ResponseAnswer>();
}