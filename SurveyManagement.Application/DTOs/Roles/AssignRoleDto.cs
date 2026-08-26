using System.ComponentModel.DataAnnotations;

namespace SurveyManagement.Application.DTOs.Roles;

public class AssignRoleDto
{
    [Range(1, int.MaxValue)]
    public int UserId { get; set; }

    [Range(1, int.MaxValue)]
    public int RoleId { get; set; }
}