using SurveyManagement.Domain.Enums;

namespace SurveyManagement.Application.DTOs.Responses;

public class ResponseAnswerDetailsDto
{
    public int QuestionId { get; set; }
    public string QuestionTitle { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }

    public string? TextValue { get; set; }
    public decimal? NumericValue { get; set; }
    public DateOnly? DateValue { get; set; }

    public List<ResponseSelectedOptionDto> SelectedOptions { get; set; } = new();
    public List<ResponseMatrixSelectionDto> MatrixSelections { get; set; } = new();
}