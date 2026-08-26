using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Options;

namespace SurveyManagement.Application.Interfaces.Options;

public interface IOptionImportService
{
    // API’den seçenekleri okuyup yalnızca önizleme olarak döndürür.
    // Bu aşamada veritabanına kayıt yapılmaz.
    Task<ApiResponse<ImportOptionsPreviewDto>> PreviewFromUrlAsync(
        ImportOptionsFromUrlRequestDto request,
        CancellationToken cancellationToken);
}