using System.ComponentModel.DataAnnotations;

namespace SurveyManagement.Application.DTOs.Options;

public sealed class ImportOptionsFromUrlRequestDto
{
    // Seçenekleri sağlayan API adresi.
    [Required]
    [Url]
    public string Url { get; set; } = string.Empty;

    // Örneğin: data.items veya options.
    // Boş bırakılırsa JSON kökü kullanılır.
    [StringLength(500)]
    public string? JsonPath { get; set; }

    // API nesne döndürüyorsa seçenek metninin okunacağı alan.
    // Örneğin: name, title veya text.
    [StringLength(100)]
    public string TextProperty { get; set; } = "text";
}