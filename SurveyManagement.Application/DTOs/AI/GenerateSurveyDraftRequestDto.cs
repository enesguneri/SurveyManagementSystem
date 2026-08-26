using System.ComponentModel.DataAnnotations;

namespace SurveyManagement.Application.DTOs.AI;

public class GenerateSurveyDraftRequestDto
{
    // Kullanıcının anket açıklaması veya netleştirme cevabı.
    [Required]
    [StringLength(8000, MinimumLength = 10)]
    public string Prompt { get; set; } = string.Empty;

    // Stateless akış için önceki konuşma mesajları frontend tarafından gönderilir.
    [MaxLength(20)]
    public List<AiConversationMessageDto> Conversation { get; set; } = new();
}