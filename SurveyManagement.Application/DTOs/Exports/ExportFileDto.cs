namespace SurveyManagement.Application.DTOs.Exports;

public sealed class ExportFileDto
{
    // Üretilecek dosyanın binary içeriği.
    public byte[] Content { get; set; } = Array.Empty<byte>();

    // Örneğin text/csv veya application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.
    public string ContentType { get; set; } = string.Empty;

    // Kullanıcının indireceği dosya adı.
    public string FileName { get; set; } = string.Empty;
}