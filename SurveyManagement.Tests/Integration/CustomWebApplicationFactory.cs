using System.Net.Http.Headers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using SurveyManagement.Application.Interfaces.Auth;
using SurveyManagement.Application.Interfaces.Context;
using SurveyManagement.Application.Interfaces.Security;
using SurveyManagement.Domain.Entities;
using SurveyManagement.Persistence.Context;

namespace SurveyManagement.Tests.Integration;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly InMemoryDatabaseRoot _dbRoot = new();
    private readonly string _dbName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var descriptorsToRemove = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions) ||
                d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                d.ServiceType == typeof(AppDbContext) ||
                d.ServiceType == typeof(IAppDbContext) ||
                (d.ServiceType.FullName != null && d.ServiceType.FullName.Contains("EntityFrameworkCore"))).ToList();

            foreach (var descriptor in descriptorsToRemove)
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName, _dbRoot);
            });

            services.AddScoped<IAppDbContext>(provider =>
                provider.GetRequiredService<AppDbContext>());

            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var passwordService = scope.ServiceProvider.GetRequiredService<IPasswordHashService>();

            context.Database.EnsureCreated();
            SeedDatabase(context, passwordService);
        });
    }

    private static void SeedDatabase(AppDbContext context, IPasswordHashService passwordService)
    {
        if (!context.Roles.Any())
        {
            var adminRole = new Role { Id = 1, Name = "Admin", IsSystemRole = true, IsActive = true, CreatedAt = DateTime.UtcNow };
            var userRole = new Role { Id = 2, Name = "User", IsSystemRole = true, IsActive = true, CreatedAt = DateTime.UtcNow };
            context.Roles.AddRange(adminRole, userRole);
            context.SaveChanges();
        }

        if (!context.Users.Any())
        {
            passwordService.CreatePasswordHash("AdminPassword123!", out var adminHash, out var adminSalt);
            var adminUser = new User
            {
                Id = 1,
                Username = "admin",
                Email = "admin@bakircay.edu.tr",
                Name = "System Administrator",
                PasswordHash = adminHash,
                PasswordSalt = adminSalt,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(adminUser);
            context.SaveChanges();

            context.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = 1 });

            passwordService.CreatePasswordHash("UserPassword123!", out var userHash, out var userSalt);
            var normalUser = new User
            {
                Id = 2,
                Username = "user1",
                Email = "user1@bakircay.edu.tr",
                Name = "Normal User",
                PasswordHash = userHash,
                PasswordSalt = userSalt,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(normalUser);
            context.SaveChanges();

            context.UserRoles.Add(new UserRole { UserId = normalUser.Id, RoleId = 2 });
            context.SaveChanges();
        }
    }

    public HttpClient CreateClientWithAuth(string username, string role = "User", int userId = 2, string email = "user@test.com")
    {
        var client = CreateClient();
        using var scope = Services.CreateScope();
        var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

        var user = new User
        {
            Id = userId,
            Username = username,
            Email = email,
            Name = username
        };

        var tokenResponse = tokenService.CreateToken(user, new List<string> { role });
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenResponse.AccessToken);
        return client;
    }
}
