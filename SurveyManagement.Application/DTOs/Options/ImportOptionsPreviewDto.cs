namespace SurveyManagement.Application.DTOs.Options;

public sealed class ImportOptionsPreviewDto
{
    // API’den okunup kullanılabilir bulunan seçenekler.
    public List<string> Options { get; set; } = new();

    // Boş, tekrar eden veya geçersiz kayıtların sayısı.
    public int SkippedCount { get; set; }

    // İstek yapılan API adresi.
    public string SourceUrl { get; set; } = string.Empty;
}