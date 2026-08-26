namespace SurveyManagement.Application.DTOs.AI;

// Gemini çıktısının hangi aşamada olduğunu belirtir.
public enum AiDraftStatus
{
    NeedsClarification = 1,
    Ready = 2,
    Failed = 3
}