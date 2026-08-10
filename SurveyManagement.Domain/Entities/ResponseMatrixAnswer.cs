namespace SurveyManagement.Domain.Entities;

public class ResponseMatrixAnswer
{
    public int Id { get; set; }

    public int ResponseAnswerId { get; set; }
    public ResponseAnswer ResponseAnswer { get; set; } = null!;

    public int MatrixRowId { get; set; }
    public MatrixRow MatrixRow { get; set; } = null!;

    public int MatrixColumnId { get; set; }
    public MatrixColumn MatrixColumn { get; set; } = null!;
}