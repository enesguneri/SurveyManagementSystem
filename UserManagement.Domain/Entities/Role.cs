using System;
using System.Collections.Generic;
using System.Text;

namespace UserManagement.Domain.Entities;

public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    // Çoka-Çok İlişki (Navigation Property)
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
