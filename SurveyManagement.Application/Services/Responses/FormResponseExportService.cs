using System.Globalization;
using System.Text;
using CsvHelper;
using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Exports;
using SurveyManagement.Application.DTOs.Responses;
using SurveyManagement.Application.Interfaces.Responses;
using ClosedXML.Excel;

namespace SurveyManagement.Application.Services.Responses;

public sealed class FormResponseExportService
    : IFormResponseExportService
{
    private readonly IFormResponseService _responseService;

    public FormResponseExportService(
        IFormResponseService responseService)
    {
        _responseService = responseService;
    }

    public async Task<ApiResponse<ExportFileDto>> ExportAsync(
        Guid formPublicId,
        int requesterUserId,
        string format,
        CancellationToken cancellationToken = default)
    {
        var normalizedFormat = format.Trim().ToLowerInvariant();

        if (normalizedFormat is not "csv" && normalizedFormat is not "xlsx")
        {
            return ApiResponse<ExportFileDto>.FailureResult(
                "Desteklenen formatlar: csv ve xlsx.",
                400);
        }

        // Yetki kontrolü mevcut response servisinde tekrar kullanılır.
        var responseResult =
            await _responseService.GetByFormAsync(
                formPublicId,
                requesterUserId,
                cancellationToken);

        if (!responseResult.IsSuccess ||
            responseResult.Data is null)
        {
            var errors = responseResult.Errors ??
                new List<string>
                {
                    responseResult.Message ??
                        "Yanıtlar alınamadı."
                };

            return ApiResponse<ExportFileDto>.FailureResult(
                errors,
                responseResult.Message,
                responseResult.HttpStatusCode);
        }

        byte[] fileContent;
        string contentType;
        string extension;

        if (normalizedFormat == "csv")
        {
            fileContent = BuildCsv(responseResult.Data);
            contentType = "text/csv; charset=utf-8";
            extension = "csv";
        }
        else
        {
            fileContent = BuildExcel(responseResult.Data);
            contentType =
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            extension = "xlsx";
        }

        var file = new ExportFileDto
        {
            Content = fileContent,
            ContentType = contentType,
            FileName =
                $"{SanitizeFileName(responseResult.Data.Title)} Yanıtları.{extension}"
        };

        return ApiResponse<ExportFileDto>.SuccessResult(file);
    }

    private static byte[] BuildCsv(
        FormResponsesDto formResponses)
    {
        using var memoryStream = new MemoryStream();

        // UTF-8 BOM, Türkçe karakterlerin Excel'de doğru görünmesini sağlar.
        using var writer = new StreamWriter(
            memoryStream,
            new UTF8Encoding(
                encoderShouldEmitUTF8Identifier: true),
            1024,
            leaveOpen: true);

        using var csv = new CsvWriter(
            writer,
            CultureInfo.InvariantCulture);

        WriteHeader(csv);

        foreach (var response in formResponses.Responses)
        {
            foreach (var answer in response.Answers)
            {
                if (answer.SelectedOptions.Count > 0)
                {
                    foreach (var option in answer.SelectedOptions)
                    {
                        WriteRow(
                            csv,
                            response,
                            answer,
                            option,
                            null);
                    }

                    continue;
                }

                if (answer.MatrixSelections.Count > 0)
                {
                    foreach (var matrixSelection
                             in answer.MatrixSelections)
                    {
                        WriteRow(
                            csv,
                            response,
                            answer,
                            null,
                            matrixSelection);
                    }

                    continue;
                }

                // Metin, tarih ve derecelendirme cevapları.
                WriteRow(
                    csv,
                    response,
                    answer,
                    null,
                    null);
            }
        }

        writer.Flush();

        return memoryStream.ToArray();
    }

    private static void WriteHeader(
        CsvWriter csv)
    {
        csv.WriteField("ResponseId");
        csv.WriteField("SubmittedAt");
        csv.WriteField("RespondentName");
        csv.WriteField("RespondentEmail");
        csv.WriteField("RespondentIpAddress");
        csv.WriteField("QuestionId");
        csv.WriteField("QuestionTitle");
        csv.WriteField("QuestionType");
        csv.WriteField("TextValue");
        csv.WriteField("NumericValue");
        csv.WriteField("DateValue");
        csv.WriteField("OptionId");
        csv.WriteField("OptionText");
        csv.WriteField("MatrixRowId");
        csv.WriteField("MatrixRowText");
        csv.WriteField("MatrixColumnId");
        csv.WriteField("MatrixColumnText");
        csv.NextRecord();
    }

    private static void WriteRow(
        CsvWriter csv,
        FormResponseItemDto response,
        ResponseAnswerDetailsDto answer,
        ResponseSelectedOptionDto? option,
        ResponseMatrixSelectionDto? matrixSelection)
    {
        csv.WriteField(response.Id);
        csv.WriteField(
            response.SubmittedAt.ToString(
                "O",
                CultureInfo.InvariantCulture));
        csv.WriteField(response.RespondentName);
        csv.WriteField(response.RespondentEmail);
        csv.WriteField(response.RespondentIpAddress);
        csv.WriteField(answer.QuestionId);
        csv.WriteField(answer.QuestionTitle);
        csv.WriteField(answer.QuestionType.ToString());
        csv.WriteField(answer.TextValue);
        csv.WriteField(
            answer.NumericValue?.ToString(
                CultureInfo.InvariantCulture));
        csv.WriteField(
            answer.DateValue?.ToString(
                "yyyy-MM-dd",
                CultureInfo.InvariantCulture));

        csv.WriteField(option?.Id);
        csv.WriteField(option?.Text);

        csv.WriteField(matrixSelection?.MatrixRowId);
        csv.WriteField(matrixSelection?.MatrixRowText);
        csv.WriteField(matrixSelection?.MatrixColumnId);
        csv.WriteField(matrixSelection?.MatrixColumnText);

        csv.NextRecord();
    }

    private static string SanitizeFileName(
        string title)
    {
        var invalidCharacters =
            Path.GetInvalidFileNameChars();

        var sanitized = string.Concat(
            title.Select(character =>
                invalidCharacters.Contains(character)
                    ? '_'
                    : character));

        return string.IsNullOrWhiteSpace(sanitized)
            ? "survey"
            : sanitized.Trim();
    }

    private static byte[] BuildExcel(
    FormResponsesDto formResponses)
    {
        using var workbook = new XLWorkbook();

        var responsesSheet =
            workbook.Worksheets.Add("Yanıtlar");

        var detailsSheet =
            workbook.Worksheets.Add("Cevap Ayrıntıları");

        var selectionsSheet =
            workbook.Worksheets.Add("Seçim Ayrıntıları");

        WriteResponseHeaders(responsesSheet);
        WriteDetailHeaders(detailsSheet);
        WriteSelectionHeaders(selectionsSheet);

        var responseRow = 2;
        var detailRow = 2;
        var selectionRow = 2;

        foreach (var response in formResponses.Responses)
        {
            responsesSheet.Cell(responseRow, 1).Value =
                response.Id;

            responsesSheet.Cell(responseRow, 2).Value =
                response.SubmittedAt.ToString("O");

            responsesSheet.Cell(responseRow, 3).Value =
                response.RespondentName ?? string.Empty;

            responsesSheet.Cell(responseRow, 4).Value =
                response.RespondentEmail ?? string.Empty;

            responsesSheet.Cell(responseRow, 5).Value =
                response.RespondentIpAddress ?? string.Empty;

            responsesSheet.Cell(responseRow, 6).Value =
                response.Answers.Count;

            responseRow++;

            foreach (var answer in response.Answers)
            {
                if (answer.SelectedOptions.Count > 0)
                {
                    foreach (var option in answer.SelectedOptions)
                    {
                        WriteSelectionRow(
                            selectionsSheet,
                            selectionRow,
                            response,
                            answer,
                            option,
                            null);

                        selectionRow++;
                    }

                    continue;
                }

                if (answer.MatrixSelections.Count > 0)
                {
                    foreach (var matrixSelection
                             in answer.MatrixSelections)
                    {
                        WriteSelectionRow(
                            selectionsSheet,
                            selectionRow,
                            response,
                            answer,
                            null,
                            matrixSelection);

                        selectionRow++;
                    }

                    continue;
                }

                WriteDetailRow(
                    detailsSheet,
                    detailRow,
                    response,
                    answer);

                detailRow++;
            }
        }

        StyleWorksheet(responsesSheet);
        StyleWorksheet(detailsSheet);
        StyleWorksheet(selectionsSheet);

        using var stream = new MemoryStream();

        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void WriteResponseHeaders(
    IXLWorksheet worksheet)
    {
        worksheet.Cell(1, 1).Value = "ResponseId";
        worksheet.Cell(1, 2).Value = "SubmittedAt";
        worksheet.Cell(1, 3).Value = "RespondentName";
        worksheet.Cell(1, 4).Value = "RespondentEmail";
        worksheet.Cell(1, 5).Value = "RespondentIpAddress";
        worksheet.Cell(1, 6).Value = "AnswerCount";
    }

    private static void WriteDetailHeaders(
        IXLWorksheet worksheet)
    {
        worksheet.Cell(1, 1).Value = "ResponseId";
        worksheet.Cell(1, 2).Value = "SubmittedAt";
        worksheet.Cell(1, 3).Value = "RespondentName";
        worksheet.Cell(1, 4).Value = "QuestionId";
        worksheet.Cell(1, 5).Value = "QuestionTitle";
        worksheet.Cell(1, 6).Value = "QuestionType";
        worksheet.Cell(1, 7).Value = "TextValue";
        worksheet.Cell(1, 8).Value = "NumericValue";
        worksheet.Cell(1, 9).Value = "DateValue";
    }

    private static void WriteSelectionHeaders(
        IXLWorksheet worksheet)
    {
        worksheet.Cell(1, 1).Value = "ResponseId";
        worksheet.Cell(1, 2).Value = "SubmittedAt";
        worksheet.Cell(1, 3).Value = "RespondentName";
        worksheet.Cell(1, 4).Value = "QuestionId";
        worksheet.Cell(1, 5).Value = "QuestionTitle";
        worksheet.Cell(1, 6).Value = "QuestionType";
        worksheet.Cell(1, 7).Value = "OptionId";
        worksheet.Cell(1, 8).Value = "OptionText";
        worksheet.Cell(1, 9).Value = "MatrixRowId";
        worksheet.Cell(1, 10).Value = "MatrixRowText";
        worksheet.Cell(1, 11).Value = "MatrixColumnId";
        worksheet.Cell(1, 12).Value = "MatrixColumnText";
    }

    private static void WriteDetailRow(
        IXLWorksheet worksheet,
        int row,
        FormResponseItemDto response,
        ResponseAnswerDetailsDto answer)
    {
        worksheet.Cell(row, 1).Value = response.Id;
        worksheet.Cell(row, 2).Value =
            response.SubmittedAt.ToString("O");
        worksheet.Cell(row, 3).Value =
            response.RespondentName ?? string.Empty;
        worksheet.Cell(row, 4).Value = answer.QuestionId;
        worksheet.Cell(row, 5).Value = answer.QuestionTitle;
        worksheet.Cell(row, 6).Value =
            answer.QuestionType.ToString();
        worksheet.Cell(row, 7).Value =
            answer.TextValue ?? string.Empty;
        worksheet.Cell(row, 8).Value =
            answer.NumericValue?.ToString() ?? string.Empty;
        worksheet.Cell(row, 9).Value =
            answer.DateValue?.ToString("yyyy-MM-dd") ??
            string.Empty;
    }

    private static void WriteSelectionRow(
        IXLWorksheet worksheet,
        int row,
        FormResponseItemDto response,
        ResponseAnswerDetailsDto answer,
        ResponseSelectedOptionDto? option,
        ResponseMatrixSelectionDto? matrixSelection)
    {
        worksheet.Cell(row, 1).Value = response.Id;
        worksheet.Cell(row, 2).Value =
            response.SubmittedAt.ToString("O");
        worksheet.Cell(row, 3).Value =
            response.RespondentName ?? string.Empty;
        worksheet.Cell(row, 4).Value = answer.QuestionId;
        worksheet.Cell(row, 5).Value = answer.QuestionTitle;
        worksheet.Cell(row, 6).Value =
            answer.QuestionType.ToString();

        worksheet.Cell(row, 7).Value =
            option?.Id ?? 0;
        worksheet.Cell(row, 8).Value =
            option?.Text ?? string.Empty;

        worksheet.Cell(row, 9).Value =
            matrixSelection?.MatrixRowId ?? 0;
        worksheet.Cell(row, 10).Value =
            matrixSelection?.MatrixRowText ?? string.Empty;

        worksheet.Cell(row, 11).Value =
            matrixSelection?.MatrixColumnId ?? 0;
        worksheet.Cell(row, 12).Value =
            matrixSelection?.MatrixColumnText ?? string.Empty;
    }

    private static void StyleWorksheet(
        IXLWorksheet worksheet)
    {
        var header = worksheet.Row(1);

        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor =
            XLColor.LightBlue;

        worksheet.SheetView.FreezeRows(1);
        worksheet.Columns().AdjustToContents();
    }
}