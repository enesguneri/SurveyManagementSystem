namespace SurveyManagement.Application.DTOs.Responses;

public class SubmitAnswerDto
{
    public int QuestionId { get; set; }

    // ShortText ve LongText cevapları için kullanılır.
    public string? TextValue { get; set; }

    // Rating cevapları için kullanılır.
    public decimal? NumericValue { get; set; }

    // Date tipi sorular için kullanılır.
    public DateOnly? DateValue { get; set; }

    // SingleChoice ve MultipleChoice sorularında seçilen seçenekler.
    public List<int> SelectedOptionIds { get; set; } = new();

    // Matrix sorularındaki satır-sütun seçimleri.
    public List<SubmitMatrixCellDto> MatrixSelections { get; set; } = new();
}