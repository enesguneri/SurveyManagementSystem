using System;
using System.Collections.Generic;
using System.Text;

namespace UserManagement.Domain.Entities;

public class User : BaseEntity
{
    public string Name {  get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    // Şifre güvenliği için byte dizileri (byte[]) kullanıyoruz
    public byte[] PasswordHash { get; set; } = Array.Empty<byte>();
    public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();

    // Çoka-Çok İlişki (Navigation Property)
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
