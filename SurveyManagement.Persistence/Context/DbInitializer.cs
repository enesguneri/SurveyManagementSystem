using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SurveyManagement.Domain.Entities;

namespace SurveyManagement.Persistence.Context;

/// <summary>
/// Proje ilk kurulduğunda veya ayağa kaldırıldığında gerekli başlangıç ve örnek verilerini
/// (İzmir Bakırçay Üniversitesi idari ve akademik birimleri) idempotent (tekrar çalıştırılabilir)
/// şekilde veritabanına ekleyen tohum veri başlatıcısı.
/// </summary>
public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // 1. Sistem Rolleri (Admin ve User)
        if (!await context.Roles.AnyAsync(r => r.Name == "Admin"))
        {
            context.Roles.Add(new Role
            {
                Name = "Admin",
                IsSystemRole = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!await context.Roles.AnyAsync(r => r.Name == "User"))
        {
            context.Roles.Add(new Role
            {
                Name = "User",
                IsSystemRole = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        await context.SaveChangesAsync();

        // 2. İzmir Bakırçay Üniversitesi İdari ve Akademik Birimleri
        var initialUnits = new[]
        {
            // 🏢 İdari Birimler
            "Bilgi İşlem Daire Başkanlığı",
            "Öğrenci İşleri Daire Başkanlığı",
            "Sağlık, Kültür ve Spor Daire Başkanlığı",
            "Kütüphane ve Dokümantasyon Daire Başkanlığı",
            "Personel Daire Başkanlığı",
            "Strateji Geliştirme Daire Başkanlığı",
            "Kariyer Uygulama ve Araştırma Merkezi",

            // 🎓 Akademik Birimler (Fakülte ve Yüksekokullar)
            "Mühendislik ve Mimarlık Fakültesi",
            "İktisadi ve İdari Bilimler Fakültesi",
            "Sağlık Bilimleri Fakültesi",
            "Tıp Fakültesi",
            "Fen Edebiyat Fakültesi",
            "Hukuk Fakültesi",
            "Yabancı Diller Yüksekokulu"
        };

        var existingRoleNames = await context.Roles
            .Select(r => r.Name)
            .ToListAsync();

        var rolesToAdd = initialUnits
            .Where(name => !existingRoleNames.Contains(name, StringComparer.OrdinalIgnoreCase))
            .Select(name => new Role
            {
                Name = name,
                IsSystemRole = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            })
            .ToList();

        if (rolesToAdd.Count > 0)
        {
            context.Roles.AddRange(rolesToAdd);
            await context.SaveChangesAsync();
        }
    }
}
