using System;
using System.Collections.Generic;
using System.Text;

namespace SurveyManagement.Domain.Entities;

public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    // Admin ve User gibi sistem rollerini,
    // Kariyer Merkezi veya Bilgi İşlem gibi birim rollerinden ayırır.
    public bool IsSystemRole { get; set; } = false;

    // Çoka-Çok İlişki (Navigation Property)
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    // Bu role/birime ait formlar.
    public ICollection<FormRole> FormRoles { get; set; } =
        new List<FormRole>();
}
