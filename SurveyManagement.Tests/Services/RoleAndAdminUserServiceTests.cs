using Microsoft.EntityFrameworkCore;
using SurveyManagement.Application.DTOs.Admin;
using SurveyManagement.Application.DTOs.Roles;
using SurveyManagement.Application.Services.Admin;
using SurveyManagement.Application.Services.Roles;
using SurveyManagement.Domain.Entities;
using SurveyManagement.Tests.Common;

namespace SurveyManagement.Tests.Services;

public class RoleAndAdminUserServiceTests
{
    [Fact]
    public async Task RoleService_GetAvailableAsync_WhenAdmin_ShouldReturnAllNonSystemActiveRoles()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var admin = TestDbContextFactory.CreateUser(context, "admin", "admin@test.com", "Admin", true, "Admin");
        var sut = new RoleService(context);

        context.Roles.AddRange(
            new Role { Name = "Mühendislik Fakültesi", IsSystemRole = false, IsActive = true, CreatedAt = DateTime.UtcNow },
            new Role { Name = "Kariyer Merkezi", IsSystemRole = false, IsActive = true, CreatedAt = DateTime.UtcNow }
        );
        await context.SaveChangesAsync();

        // Act
        var result = await sut.GetAvailableAsync(admin.Id, isAdmin: true);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(2);
        result.Data!.Select(r => r.Name).Should().Contain(new[] { "Mühendislik Fakültesi", "Kariyer Merkezi" });
    }

    [Fact]
    public async Task RoleService_GetAvailableAsync_WhenNormalUser_ShouldReturnOnlyUserAssignedRoles()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var user = TestDbContextFactory.CreateUser(context, "staff", "staff@test.com");
        var sut = new RoleService(context);

        var role1 = new Role { Name = "Mühendislik Fakültesi", IsSystemRole = false, IsActive = true, CreatedAt = DateTime.UtcNow };
        var role2 = new Role { Name = "Tıp Fakültesi", IsSystemRole = false, IsActive = true, CreatedAt = DateTime.UtcNow };
        context.Roles.AddRange(role1, role2);
        await context.SaveChangesAsync();

        context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role1.Id });
        await context.SaveChangesAsync();

        // Act
        var result = await sut.GetAvailableAsync(user.Id, isAdmin: false);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(1);
        result.Data!.First().Name.Should().Be("Mühendislik Fakültesi");
    }

    [Fact]
    public async Task RoleService_CreateAsync_WithDuplicateName_ShouldReturnBadRequest()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var sut = new RoleService(context);

        context.Roles.Add(new Role { Name = "Sağlık Bilimleri", IsSystemRole = false, IsActive = true, CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var request = new CreateRoleDto { Name = "  sağlık bilimleri  " };

        // Act
        var result = await sut.CreateAsync(request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.HttpStatusCode.Should().Be(400);
        result.Errors.Should().Contain("Bu isimde bir rol zaten mevcut.");
    }

    [Fact]
    public async Task RoleService_AssignToUserAsync_WhenDuplicateAssignment_ShouldReturnBadRequest()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var user = TestDbContextFactory.CreateUser(context, "user1", "u1@test.com");
        var sut = new RoleService(context);

        var role = new Role { Name = "Birim X", IsSystemRole = false, IsActive = true, CreatedAt = DateTime.UtcNow };
        context.Roles.Add(role);
        await context.SaveChangesAsync();

        context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        await context.SaveChangesAsync();

        var request = new AssignRoleDto { UserId = user.Id, RoleId = role.Id };

        // Act
        var result = await sut.AssignToUserAsync(request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.HttpStatusCode.Should().Be(400);
        result.Errors.Should().Contain("Bu rol kullanıcıya zaten atanmış.");
    }

    [Fact]
    public async Task AdminUserService_GetUsersAsync_ShouldReturnUsersWithAssignedRoles()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        TestDbContextFactory.CreateUser(context, "enes", "enes@test.com", "Enes Guneri", true, "Admin");
        TestDbContextFactory.CreateUser(context, "ahmet", "ahmet@test.com", "Ahmet Yilmaz", true, "User");
        var sut = new AdminUserService(context);

        // Act
        var result = await sut.GetUsersAsync();

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(2);

        var enesDto = result.Data!.First(u => u.Username == "enes");
        enesDto.Name.Should().Be("Enes Guneri");
        enesDto.Roles.Should().Contain("Admin");

        var ahmetDto = result.Data!.First(u => u.Username == "ahmet");
        ahmetDto.Name.Should().Be("Ahmet Yilmaz");
        ahmetDto.Roles.Should().Contain("User");
    }
}
