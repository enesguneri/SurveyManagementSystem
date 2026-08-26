namespace SurveyManagement.Application.DTOs.Admin;

public class AdminUserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }

    // Kullanıcının sahip olduğu sistem ve birim rolleri.
    public List<string> Roles { get; set; } = new();
}