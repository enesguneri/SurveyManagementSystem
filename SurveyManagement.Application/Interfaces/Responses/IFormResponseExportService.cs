using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Exports;

namespace SurveyManagement.Application.Interfaces.Responses;

public interface IFormResponseExportService
{
    // format değerleri: csv veya xlsx.
    Task<ApiResponse<ExportFileDto>> ExportAsync(
        Guid formPublicId,
        int requesterUserId,
        string format,
        CancellationToken cancellationToken = default);
}