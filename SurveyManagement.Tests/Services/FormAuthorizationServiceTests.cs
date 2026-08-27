using SurveyManagement.Application.Services.Forms;
using SurveyManagement.Domain.Entities;
using SurveyManagement.Tests.Common;

namespace SurveyManagement.Tests.Services;

public class FormAuthorizationServiceTests
{
    [Fact]
    public async Task CanManageFormAsync_WhenUserIsFormOwner_ShouldReturnTrue()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var owner = TestDbContextFactory.CreateUser(context, "owner", "owner@test.com");
        var sut = new FormAuthorizationService(context);

        var form = new Form
        {
            Id = 1,
            Title = "Sahip Formu",
            CreatedByUserId = owner.Id
        };
        context.Forms.Add(form);
        await context.SaveChangesAsync();

        // Act
        var result = await sut.CanManageFormAsync(form, owner.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task CanManageFormAsync_WhenUserIsAdmin_ShouldReturnTrue()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var owner = TestDbContextFactory.CreateUser(context, "owner", "owner@test.com");
        var admin = TestDbContextFactory.CreateUser(context, "admin", "admin@test.com", "Admin", true, "Admin");
        var sut = new FormAuthorizationService(context);

        var form = new Form
        {
            Id = 1,
            Title = "Sahip Formu",
            CreatedByUserId = owner.Id
        };
        context.Forms.Add(form);
        await context.SaveChangesAsync();

        // Act
        var result = await sut.CanManageFormAsync(form, admin.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task CanManageFormAsync_WhenUserHasAssignedUnitRole_ShouldReturnTrue()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var owner = TestDbContextFactory.CreateUser(context, "owner", "owner@test.com");
        var unitStaff = TestDbContextFactory.CreateUser(context, "staff", "staff@test.com");
        var sut = new FormAuthorizationService(context);

        var unitRole = new Role
        {
            Name = "Bilgi İşlem Daire Başkanlığı",
            IsSystemRole = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Roles.Add(unitRole);
        await context.SaveChangesAsync();

        // Assign unit role to staff
        context.UserRoles.Add(new UserRole { UserId = unitStaff.Id, RoleId = unitRole.Id });

        var form = new Form
        {
            Id = 1,
            Title = "Birim Formu",
            CreatedByUserId = owner.Id
        };
        context.Forms.Add(form);
        await context.SaveChangesAsync();

        // Assign form to unit role
        context.FormRoles.Add(new FormRole { FormId = form.Id, RoleId = unitRole.Id });
        await context.SaveChangesAsync();

        // Act
        var result = await sut.CanManageFormAsync(form, unitStaff.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task CanManageFormAsync_WhenUserIsUnauthorizedStranger_ShouldReturnFalse()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var owner = TestDbContextFactory.CreateUser(context, "owner", "owner@test.com");
        var stranger = TestDbContextFactory.CreateUser(context, "stranger", "stranger@test.com");
        var sut = new FormAuthorizationService(context);

        var form = new Form
        {
            Id = 1,
            Title = "Özel Form",
            CreatedByUserId = owner.Id
        };
        context.Forms.Add(form);
        await context.SaveChangesAsync();

        // Act
        var result = await sut.CanManageFormAsync(form, stranger.Id);

        // Assert
        result.Should().BeFalse();
    }
}
