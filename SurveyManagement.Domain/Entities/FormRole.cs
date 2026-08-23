namespace SurveyManagement.Domain.Entities;

public class FormRole
{
    // Form ile birim rolü arasındaki bağlantıyı tutar.
    public int FormId { get; set; }
    public Form Form { get; set; } = null!;

    // Rol, sistemdeki birimi temsil eder.
    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;
}