using Microsoft.EntityFrameworkCore;
using SurveyManagement.Application.DTOs.Responses;
using SurveyManagement.Application.Services.Forms;
using SurveyManagement.Application.Services.Responses;
using SurveyManagement.Domain.Entities;
using SurveyManagement.Domain.Enums;
using SurveyManagement.Tests.Common;

namespace SurveyManagement.Tests.Services;

public class FormResponseServiceTests
{
    private readonly FormResponseValidator _validator = new();

    [Fact]
    public async Task SubmitAsync_WithValidSubmission_ShouldSaveResponseAndReturnCreated()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var user = TestDbContextFactory.CreateUser(context, "respondent", "resp@test.com", "Respondent User");
        var sut = new FormResponseService(context, _validator, new FormAuthorizationService(context));

        var form = new Form
        {
            PublicId = Guid.NewGuid(),
            Title = "Yayınlanmış Anket",
            Status = FormStatus.Published,
            AccessType = FormAccessType.Public,
            ShowRespondentIdentity = true,
            CreatedAt = DateTime.UtcNow,
            Questions = new List<Question>
            {
                new()
                {
                    Id = 1,
                    DisplayOrder = 1,
                    Title = "Görüşünüz",
                    Type = QuestionType.ShortText,
                    IsRequired = true
                }
            }
        };
        context.Forms.Add(form);
        await context.SaveChangesAsync();

        var submitDto = new SubmitFormResponseDto
        {
            Answers = new List<SubmitAnswerDto>
            {
                new() { QuestionId = 1, TextValue = "Çok başarılı." }
            }
        };

        // Act
        var result = await sut.SubmitAsync(form.PublicId, submitDto, user.Id, "192.168.1.100");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.HttpStatusCode.Should().Be(200); // Service SuccessResult default status
        result.Data.Should().NotBeNull();
        result.Data!.FormPublicId.Should().Be(form.PublicId);

        var savedResponse = await context.FormResponses
            .Include(r => r.Answers)
            .FirstOrDefaultAsync(r => r.FormId == form.Id);

        savedResponse.Should().NotBeNull();
        savedResponse!.RespondentUserId.Should().Be(user.Id);
        savedResponse.RespondentNameSnapshot.Should().Be("Respondent User");
        savedResponse.RespondentEmailSnapshot.Should().Be("resp@test.com");
        savedResponse.RespondentIpAddress.Should().Be("192.168.1.100");
        savedResponse.Answers.Should().HaveCount(1);
        savedResponse.Answers.First().TextValue.Should().Be("Çok başarılı.");
    }

    [Fact]
    public async Task SubmitAsync_WhenUserAlreadyResponded_ShouldReturnConflict()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var user = TestDbContextFactory.CreateUser(context, "respondent", "resp@test.com");
        var sut = new FormResponseService(context, _validator, new FormAuthorizationService(context));

        var form = new Form
        {
            PublicId = Guid.NewGuid(),
            Title = "Anket",
            Status = FormStatus.Published,
            AccessType = FormAccessType.Authenticated,
            CreatedAt = DateTime.UtcNow,
            Questions = new List<Question>
            {
                new() { Id = 1, Title = "Soru", Type = QuestionType.ShortText, DisplayOrder = 1 }
            }
        };
        context.Forms.Add(form);
        await context.SaveChangesAsync();

        // Existing response
        context.FormResponses.Add(new FormResponse
        {
            FormId = form.Id,
            RespondentUserId = user.Id,
            SubmittedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var submitDto = new SubmitFormResponseDto
        {
            Answers = new List<SubmitAnswerDto>
            {
                new() { QuestionId = 1, TextValue = "İkinci Deneme" }
            }
        };

        // Act
        var result = await sut.SubmitAsync(form.PublicId, submitDto, user.Id, "127.0.0.1");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.HttpStatusCode.Should().Be(409);
        result.Errors.Should().Contain("Bu forma daha önce yanıt verdiniz.");
    }

    [Fact]
    public async Task SubmitAsync_WhenFormIsNotPublished_ShouldReturnBadRequest()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var sut = new FormResponseService(context, _validator, new FormAuthorizationService(context));

        var form = new Form
        {
            PublicId = Guid.NewGuid(),
            Title = "Taslak Anket",
            Status = FormStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };
        context.Forms.Add(form);
        await context.SaveChangesAsync();

        var submitDto = new SubmitFormResponseDto { Answers = new List<SubmitAnswerDto>() };

        // Act
        var result = await sut.SubmitAsync(form.PublicId, submitDto, null, null);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.HttpStatusCode.Should().Be(400);
        result.Errors.Should().Contain("Form şu anda yanıt kabul etmiyor.");
    }

    [Fact]
    public async Task GetByFormAsync_WhenShowRespondentIdentityIsFalse_ShouldMaskIdentityDetails()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var owner = TestDbContextFactory.CreateUser(context, "owner", "owner@test.com");
        var respondent = TestDbContextFactory.CreateUser(context, "respondent", "resp@test.com", "Secret Name");
        var sut = new FormResponseService(context, _validator, new FormAuthorizationService(context));

        var form = new Form
        {
            PublicId = Guid.NewGuid(),
            Title = "Anonim Anket",
            Status = FormStatus.Published,
            CreatedByUserId = owner.Id,
            ShowRespondentIdentity = false, // Anonymous responses
            CreatedAt = DateTime.UtcNow,
            Questions = new List<Question>
            {
                new() { Id = 1, Title = "Görüş", Type = QuestionType.ShortText, DisplayOrder = 1 }
            }
        };
        context.Forms.Add(form);
        await context.SaveChangesAsync();

        var response = new FormResponse
        {
            FormId = form.Id,
            RespondentUserId = respondent.Id,
            RespondentNameSnapshot = "Secret Name",
            RespondentEmailSnapshot = "resp@test.com",
            RespondentIpAddress = "10.0.0.1",
            SubmittedAt = DateTime.UtcNow,
            Answers = new List<ResponseAnswer>
            {
                new() { QuestionId = 1, TextValue = "Gizli yorum" }
            }
        };
        context.FormResponses.Add(response);
        await context.SaveChangesAsync();

        // Act
        var result = await sut.GetByFormAsync(form.PublicId, owner.Id);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Responses.Should().HaveCount(1);

        var item = result.Data.Responses.First();
        item.RespondentName.Should().BeNull();
        item.RespondentEmail.Should().BeNull();
        item.RespondentIpAddress.Should().BeNull();
        item.Answers.First().TextValue.Should().Be("Gizli yorum");
    }
}
