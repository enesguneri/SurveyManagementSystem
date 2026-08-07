namespace SurveyManagement.Application.DTOs.Forms;

public class QuestionOptionDetailsDto
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}