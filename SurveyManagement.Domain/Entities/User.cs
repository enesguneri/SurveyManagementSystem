using System;
using System.Collections.Generic;
using System.Text;

namespace SurveyManagement.Domain.Entities;

public class User : BaseEntity
{
    public string Name {  get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    // Şifre güvenliği için byte dizileri (byte[]) kullanıyoruz
    public byte[] PasswordHash { get; set; } = Array.Empty<byte>();
    public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();

    // Kullanıcıya özel Gemini AI yapılandırması
    public string? GeminiApiKey { get; set; }
    public string? GeminiModel { get; set; }

    // Çoka-Çok İlişki (Navigation Property)
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<Form> CreatedForms { get; set; } = new List<Form>();
    public ICollection<FormResponse> SubmittedFormResponses { get; set; } = new List<FormResponse>();
}
