using Microsoft.EntityFrameworkCore;
using SurveyManagement.Domain.Entities;
using SurveyManagement.Persistence.Context;

namespace SurveyManagement.Tests.Common;

public static class TestDbContextFactory
{
    public static AppDbContext Create(string? databaseName = null)
    {
        var dbName = databaseName ?? Guid.NewGuid().ToString();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .EnableSensitiveDataLogging()
            .Options;

        var context = new AppDbContext(options);
        context.Database.EnsureCreated();

        SeedTestRoles(context);

        return context;
    }

    private static void SeedTestRoles(AppDbContext context)
    {
        if (!context.Roles.Any(r => r.Name == "Admin"))
        {
            context.Roles.Add(new Role
            {
                Id = 1,
                Name = "Admin",
                IsSystemRole = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!context.Roles.Any(r => r.Name == "User"))
        {
            context.Roles.Add(new Role
            {
                Id = 2,
                Name = "User",
                IsSystemRole = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        context.SaveChanges();
    }

    public static User CreateUser(
        AppDbContext context,
        string username = "testuser",
        string email = "test@bakircay.edu.tr",
        string name = "Test User",
        bool isActive = true,
        params string[] roleNames)
    {
        var user = new User
        {
            Username = username,
            Email = email,
            Name = name,
            IsActive = isActive,
            PasswordHash = new byte[] { 1, 2, 3 },
            PasswordSalt = new byte[] { 4, 5, 6 },
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        context.SaveChanges();

        foreach (var roleName in roleNames)
        {
            var role = context.Roles.FirstOrDefault(r => r.Name == roleName);
            if (role == null)
            {
                role = new Role
                {
                    Name = roleName,
                    IsSystemRole = roleName is "Admin" or "User",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Roles.Add(role);
                context.SaveChanges();
            }

            context.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = role.Id
            });
        }

        context.SaveChanges();
        return user;
    }
}
