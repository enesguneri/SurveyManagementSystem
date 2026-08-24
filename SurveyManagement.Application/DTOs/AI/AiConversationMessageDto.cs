using System.ComponentModel.DataAnnotations;

namespace SurveyManagement.Application.DTOs.AI;

public class AiConversationMessageDto
{
    // Beklenen değerler: user veya assistant.
    [Required]
    public string Role { get; set; } = string.Empty;

    [Required]
    [StringLength(8000)]
    public string Content { get; set; } = string.Empty;
}