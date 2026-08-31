using Microsoft.EntityFrameworkCore;
using SurveyManagement.Application.DTOs.Forms;
using SurveyManagement.Application.Services.Forms;
using SurveyManagement.Domain.Entities;
using SurveyManagement.Domain.Enums;
using SurveyManagement.Tests.Common;

namespace SurveyManagement.Tests.Services;

public class FormServiceTests
{
    private readonly FormRequestValidator _validator = new();

    [Fact]
    public async Task CreateAsync_WithValidDraft_ShouldSaveFormInDraftStatus()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var user = TestDbContextFactory.CreateUser(context, "creator", "creator@test.com", "Creator User");
        var sut = new FormService(context, _validator, new FormAuthorizationService(context));

        var request = new CreateFormDto
        {
            Title = "Akademik Memnuniyet Anketi",
            Description = "Açıklama",
            AccessType = FormAccessType.Public,
            Questions = new List<CreateQuestionDto>
            {
                new()
                {
                    Title = "Fakültenizden memnun musunuz?",
                    Type = QuestionType.SingleChoice,
                    IsRequired = true,
                    Options = new List<CreateQuestionOptionDto>
                    {
                        new() { Text = "Evet" },
                        new() { Text = "Hayır" }
                    }
                }
            }
        };

        // Act
        var result = await sut.CreateAsync(request, user.Id);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.HttpStatusCode.Should().Be(200);
        result.Data.Should().NotBeNull();
        result.Data!.Status.Should().Be(FormStatus.Draft);
        result.Data.Title.Should().Be("Akademik Memnuniyet Anketi");

        var savedForm = await context.Forms
            .Include(f => f.Questions)
            .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(f => f.PublicId == result.Data.PublicId);

        savedForm.Should().NotBeNull();
        savedForm!.Status.Should().Be(FormStatus.Draft);
        savedForm.CreatedByUserId.Should().Be(user.Id);
        savedForm.Questions.Should().HaveCount(1);
        savedForm.Questions.First().Options.Should().HaveCount(2);
    }

    [Fact]
    public async Task PublishAsync_FromDraftToPublished_ShouldSucceedForOwner()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var user = TestDbContextFactory.CreateUser(context, "owner", "owner@test.com");
        var sut = new FormService(context, _validator, new FormAuthorizationService(context));

        var form = new Form
        {
            PublicId = Guid.NewGuid(),
            Title = "Taslak Form",
            Status = FormStatus.Draft,
            AccessType = FormAccessType.Public,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            Questions = new List<Question>
            {
                new() { Title = "Soru 1", Type = QuestionType.ShortText, DisplayOrder = 1 }
            }
        };
        context.Forms.Add(form);
        await context.SaveChangesAsync();

        // Act
        var result = await sut.PublishAsync(form.PublicId, user.Id);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.Status.Should().Be(FormStatus.Published);

        var updatedForm = await context.Forms.FirstAsync(f => f.Id == form.Id);
        updatedForm.Status.Should().Be(FormStatus.Published);
    }

    [Fact]
    public async Task PublishAsync_WhenRequesterIsNotOwnerOrAdmin_ShouldReturnForbidden()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var owner = TestDbContextFactory.CreateUser(context, "owner", "owner@test.com");
        var unauthorizedUser = TestDbContextFactory.CreateUser(context, "stranger", "stranger@test.com");
        var sut = new FormService(context, _validator, new FormAuthorizationService(context));

        var form = new Form
        {
            PublicId = Guid.NewGuid(),
            Title = "Özel Form",
            Status = FormStatus.Draft,
            CreatedByUserId = owner.Id,
            CreatedAt = DateTime.UtcNow
        };
        context.Forms.Add(form);
        await context.SaveChangesAsync();

        // Act
        var result = await sut.PublishAsync(form.PublicId, unauthorizedUser.Id);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.HttpStatusCode.Should().Be(403);
    }

    [Fact]
    public async Task CloseAsync_WhenFormIsDraft_ShouldReturnBadRequest()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var user = TestDbContextFactory.CreateUser(context, "owner", "owner@test.com");
        var sut = new FormService(context, _validator, new FormAuthorizationService(context));

        var form = new Form
        {
            PublicId = Guid.NewGuid(),
            Title = "Taslak Form",
            Status = FormStatus.Draft,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };
        context.Forms.Add(form);
        await context.SaveChangesAsync();

        // Act
        var result = await sut.CloseAsync(form.PublicId, user.Id);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.HttpStatusCode.Should().Be(400);
        result.Errors.Should().Contain("Yalnızca yayımlanmış formlar kapatılabilir.");
    }

    [Fact]
    public async Task CloseAsync_WhenFormIsPublished_ShouldSetStatusToClosed()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var user = TestDbContextFactory.CreateUser(context, "owner", "owner@test.com");
        var sut = new FormService(context, _validator, new FormAuthorizationService(context));

        var form = new Form
        {
            PublicId = Guid.NewGuid(),
            Title = "Aktif Form",
            Status = FormStatus.Published,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };
        context.Forms.Add(form);
        await context.SaveChangesAsync();

        // Act
        var result = await sut.CloseAsync(form.PublicId, user.Id);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.Status.Should().Be(FormStatus.Closed);

        var updatedForm = await context.Forms.FirstAsync(f => f.Id == form.Id);
        updatedForm.Status.Should().Be(FormStatus.Closed);
    }

    [Fact]
    public async Task UpdateDraftAsync_WhenFormIsPublished_ShouldReturnBadRequest()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var user = TestDbContextFactory.CreateUser(context, "creator", "creator@test.com");
        var sut = new FormService(context, _validator, new FormAuthorizationService(context));

        var form = new Form
        {
            PublicId = Guid.NewGuid(),
            Title = "Kapatılmış Form",
            Status = FormStatus.Closed,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };
        context.Forms.Add(form);
        await context.SaveChangesAsync();

        var updateRequest = new CreateFormDto
        {
            Title = "Yeni Başlık",
            Questions = new List<CreateQuestionDto>
            {
                new() { Title = "Soru", Type = QuestionType.ShortText }
            }
        };

        // Act
        var result = await sut.UpdateDraftAsync(form.PublicId, updateRequest, user.Id);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.HttpStatusCode.Should().Be(400);
        result.Errors.Should().Contain("Kapatılmış formlar güncellenemez.");
    }

    [Fact]
    public async Task UpdateDraftAsync_WhenFormIsPublished_ShouldSucceed()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var user = TestDbContextFactory.CreateUser(context, "creator", "creator@test.com");
        var sut = new FormService(context, _validator, new FormAuthorizationService(context));

        var form = new Form
        {
            PublicId = Guid.NewGuid(),
            Title = "Yayındaki Form",
            Status = FormStatus.Published,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };
        context.Forms.Add(form);
        await context.SaveChangesAsync();

        var updateRequest = new CreateFormDto
        {
            Title = "Güncellenmiş Başlık",
            Questions = new List<CreateQuestionDto>
            {
                new() { Title = "Yeni Soru", Type = QuestionType.ShortText }
            }
        };

        // Act
        var result = await sut.UpdateDraftAsync(form.PublicId, updateRequest, user.Id);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Title.Should().Be("Güncellenmiş Başlık");
    }

    [Fact]
    public async Task GetManageableAsync_WhenUserIsAdmin_ShouldReturnAllForms()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var admin = TestDbContextFactory.CreateUser(context, "admin", "admin@test.com", "Admin User", true, "Admin");
        var otherUser = TestDbContextFactory.CreateUser(context, "other", "other@test.com");
        var sut = new FormService(context, _validator, new FormAuthorizationService(context));

        context.Forms.AddRange(
            new Form { PublicId = Guid.NewGuid(), Title = "Form 1", CreatedByUserId = admin.Id, CreatedAt = DateTime.UtcNow },
            new Form { PublicId = Guid.NewGuid(), Title = "Form 2", CreatedByUserId = otherUser.Id, CreatedAt = DateTime.UtcNow }
        );
        await context.SaveChangesAsync();

        // Act
        var result = await sut.GetManageableAsync(admin.Id);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetByPublicIdAsync_WhenAuthenticatedFormAccessedByAnonymous_ShouldReturnUnauthorized()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var owner = TestDbContextFactory.CreateUser(context, "owner", "owner@test.com");
        var sut = new FormService(context, _validator, new FormAuthorizationService(context));

        var form = new Form
        {
            PublicId = Guid.NewGuid(),
            Title = "Yetkili Kullanıcı Formu",
            Status = FormStatus.Published,
            AccessType = FormAccessType.Authenticated,
            CreatedByUserId = owner.Id,
            CreatedAt = DateTime.UtcNow
        };
        context.Forms.Add(form);
        await context.SaveChangesAsync();

        // Act
        var result = await sut.GetByPublicIdAsync(form.PublicId, requesterUserId: null);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.HttpStatusCode.Should().Be(401);
        result.Errors.Should().Contain("Bu formu görüntülemek için giriş yapmalısınız.");
    }
}
