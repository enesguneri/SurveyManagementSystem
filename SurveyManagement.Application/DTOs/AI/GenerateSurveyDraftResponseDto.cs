using SurveyManagement.Application.DTOs.Forms;

namespace SurveyManagement.Application.DTOs.AI;

public class GenerateSurveyDraftResponseDto
{
    // Taslak hazır mı, yoksa kullanıcıdan ek bilgi mi bekleniyor?
    public AiDraftStatus Status { get; set; }

    // Kullanıcıya gösterilecek açıklama.
    public string Message { get; set; } = string.Empty;

    // Taslak oluşturulamadığında sorulacak netleştirme soruları.
    public List<string> ClarifyingQuestions { get; set; } = new();

    // Hazır olduğunda mevcut form DTO yapısında taslak döner.
    // Bu nesne kullanıcı onaylamadan veritabanına kaydedilmez.
    public CreateFormDto? Draft { get; set; }
}