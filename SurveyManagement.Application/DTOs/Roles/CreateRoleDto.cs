using System.ComponentModel.DataAnnotations;

namespace SurveyManagement.Application.DTOs.Roles;

public class CreateRoleDto
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;
}