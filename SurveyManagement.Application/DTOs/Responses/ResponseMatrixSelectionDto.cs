namespace SurveyManagement.Application.DTOs.Responses;

public class ResponseMatrixSelectionDto
{
    public int MatrixRowId { get; set; }
    public string MatrixRowText { get; set; } = string.Empty;

    public int MatrixColumnId { get; set; }
    public string MatrixColumnText { get; set; } = string.Empty;
}