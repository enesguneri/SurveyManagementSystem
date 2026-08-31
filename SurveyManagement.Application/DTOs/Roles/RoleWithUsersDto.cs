namespace SurveyManagement.Application.DTOs.Roles;

public class RoleUserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class RoleWithUsersDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsSystemRole { get; set; }
    public bool IsActive { get; set; }
    public int UserCount { get; set; }
    public List<RoleUserDto> Users { get; set; } = new();
}
