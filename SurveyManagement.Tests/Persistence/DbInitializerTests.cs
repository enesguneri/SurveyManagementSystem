using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SurveyManagement.Persistence.Context;
using Xunit;

namespace SurveyManagement.Tests.Persistence;

public class DbInitializerTests
{
    [Fact]
    public async Task SeedAsync_WhenDatabaseIsEmpty_ShouldSeedAdminUserAndUniversityUnits()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        using var context = new AppDbContext(options);

        // Act
        await DbInitializer.SeedAsync(context);

        // Assert
        var roles = await context.Roles.ToListAsync();
        roles.Should().Contain(r => r.Name == "Admin" && r.IsSystemRole);
        roles.Should().Contain(r => r.Name == "User" && r.IsSystemRole);
        roles.Should().Contain(r => r.Name == "Bilgi İşlem Daire Başkanlığı" && !r.IsSystemRole);
        roles.Should().Contain(r => r.Name == "Mühendislik ve Mimarlık Fakültesi" && !r.IsSystemRole);
        roles.Should().HaveCount(16);
    }

    [Fact]
    public async Task SeedAsync_WhenRunMultipleTimes_ShouldBeIdempotentWithoutDuplicates()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        using var context = new AppDbContext(options);

        // Act: Run twice
        await DbInitializer.SeedAsync(context);
        await DbInitializer.SeedAsync(context);

        // Assert
        var roles = await context.Roles.ToListAsync();
        roles.Should().HaveCount(16);
    }
}
