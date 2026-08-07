using Microsoft.EntityFrameworkCore;
using SurveyManagement.Application.Interfaces.Context;
using SurveyManagement.Domain.Entities;

namespace SurveyManagement.Persistence.Context;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();

    public DbSet<Form> Forms => Set<Form>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<QuestionValidation> QuestionValidations => Set<QuestionValidation>();
    public DbSet<QuestionOption> QuestionOptions => Set<QuestionOption>();
    public DbSet<MatrixRow> MatrixRows => Set<MatrixRow>();
    public DbSet<MatrixColumn> MatrixColumns => Set<MatrixColumn>();

    public DbSet<FormResponse> FormResponses => Set<FormResponse>();
    public DbSet<ResponseAnswer> ResponseAnswers => Set<ResponseAnswer>();
    public DbSet<ResponseAnswerOption> ResponseAnswerOptions => Set<ResponseAnswerOption>();
    public DbSet<ResponseMatrixAnswer> ResponseMatrixAnswers => Set<ResponseMatrixAnswer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserRole>()
            .HasKey(userRole => new { userRole.UserId, userRole.RoleId });

        modelBuilder.Entity<UserRole>()
            .HasOne(userRole => userRole.User)
            .WithMany(user => user.UserRoles)
            .HasForeignKey(userRole => userRole.UserId);

        modelBuilder.Entity<UserRole>()
            .HasOne(userRole => userRole.Role)
            .WithMany(role => role.UserRoles)
            .HasForeignKey(userRole => userRole.RoleId);

        modelBuilder.Entity<Form>()
            .HasIndex(form => form.PublicId)
            .IsUnique();

        modelBuilder.Entity<Form>()
            .Property(form => form.Title)
            .HasMaxLength(200)
            .IsRequired();

        modelBuilder.Entity<Form>()
            .Property(form => form.Status)
            .HasConversion<string>();

        modelBuilder.Entity<Form>()
            .Property(form => form.AccessType)
            .HasConversion<string>();

        modelBuilder.Entity<Form>()
            .Property(form => form.CreationSource)
            .HasConversion<string>();

        modelBuilder.Entity<Form>()
            .HasOne(form => form.CreatedByUser)
            .WithMany(user => user.CreatedForms)
            .HasForeignKey(form => form.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Question>()
            .Property(question => question.Title)
            .HasMaxLength(1000)
            .IsRequired();

        modelBuilder.Entity<Question>()
            .Property(question => question.Type)
            .HasConversion<string>();

        modelBuilder.Entity<Question>()
            .HasIndex(question => new { question.FormId, question.DisplayOrder })
            .IsUnique();

        modelBuilder.Entity<Question>()
            .HasOne(question => question.Form)
            .WithMany(form => form.Questions)
            .HasForeignKey(question => question.FormId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<QuestionValidation>()
            .HasKey(validation => validation.QuestionId);

        modelBuilder.Entity<QuestionValidation>()
            .Property(validation => validation.RegexPattern)
            .HasMaxLength(500);

        modelBuilder.Entity<QuestionValidation>()
            .Property(validation => validation.MinValue)
            .HasPrecision(10, 2);

        modelBuilder.Entity<QuestionValidation>()
            .Property(validation => validation.MaxValue)
            .HasPrecision(10, 2);

        modelBuilder.Entity<QuestionValidation>()
            .HasOne(validation => validation.Question)
            .WithOne(question => question.Validation)
            .HasForeignKey<QuestionValidation>(validation => validation.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<QuestionOption>()
            .Property(option => option.Text)
            .HasMaxLength(500)
            .IsRequired();

        modelBuilder.Entity<QuestionOption>()
            .HasIndex(option => new { option.QuestionId, option.DisplayOrder })
            .IsUnique();

        modelBuilder.Entity<QuestionOption>()
            .HasOne(option => option.Question)
            .WithMany(question => question.Options)
            .HasForeignKey(option => option.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MatrixRow>()
            .Property(row => row.Text)
            .HasMaxLength(500)
            .IsRequired();

        modelBuilder.Entity<MatrixRow>()
            .HasIndex(row => new { row.QuestionId, row.DisplayOrder })
            .IsUnique();

        modelBuilder.Entity<MatrixRow>()
            .HasOne(row => row.Question)
            .WithMany(question => question.MatrixRows)
            .HasForeignKey(row => row.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MatrixColumn>()
            .Property(column => column.Text)
            .HasMaxLength(500)
            .IsRequired();

        modelBuilder.Entity<MatrixColumn>()
            .HasIndex(column => new { column.QuestionId, column.DisplayOrder })
            .IsUnique();

        modelBuilder.Entity<MatrixColumn>()
            .HasOne(column => column.Question)
            .WithMany(question => question.MatrixColumns)
            .HasForeignKey(column => column.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<FormResponse>()
            .HasOne(response => response.Form)
            .WithMany(form => form.Responses)
            .HasForeignKey(response => response.FormId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<FormResponse>()
            .HasOne(response => response.RespondentUser)
            .WithMany(user => user.SubmittedFormResponses)
            .HasForeignKey(response => response.RespondentUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ResponseAnswer>()
            .HasIndex(answer => new { answer.FormResponseId, answer.QuestionId })
            .IsUnique();

        modelBuilder.Entity<ResponseAnswer>()
            .HasOne(answer => answer.FormResponse)
            .WithMany(response => response.Answers)
            .HasForeignKey(answer => answer.FormResponseId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ResponseAnswer>()
            .HasOne(answer => answer.Question)
            .WithMany(question => question.ResponseAnswers)
            .HasForeignKey(answer => answer.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ResponseAnswerOption>()
            .HasKey(selection => new
            {
                selection.ResponseAnswerId,
                selection.QuestionOptionId
            });

        modelBuilder.Entity<ResponseAnswerOption>()
            .HasOne(selection => selection.ResponseAnswer)
            .WithMany(answer => answer.SelectedOptions)
            .HasForeignKey(selection => selection.ResponseAnswerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ResponseAnswerOption>()
            .HasOne(selection => selection.QuestionOption)
            .WithMany(option => option.ResponseAnswerOptions)
            .HasForeignKey(selection => selection.QuestionOptionId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ResponseMatrixAnswer>()
            .HasIndex(answer => new
            {
                answer.ResponseAnswerId,
                answer.MatrixRowId,
                answer.MatrixColumnId
            })
            .IsUnique();

        modelBuilder.Entity<ResponseMatrixAnswer>()
            .HasOne(answer => answer.ResponseAnswer)
            .WithMany(responseAnswer => responseAnswer.MatrixAnswers)
            .HasForeignKey(answer => answer.ResponseAnswerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ResponseMatrixAnswer>()
            .HasOne(answer => answer.MatrixRow)
            .WithMany(row => row.ResponseMatrixAnswers)
            .HasForeignKey(answer => answer.MatrixRowId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ResponseMatrixAnswer>()
            .HasOne(answer => answer.MatrixColumn)
            .WithMany(column => column.ResponseMatrixAnswers)
            .HasForeignKey(answer => answer.MatrixColumnId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Role>().HasData(
            new Role
            {
                Id = 1,
                Name = "Admin",
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                IsActive = true
            },
            new Role
            {
                Id = 2,
                Name = "User",
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                IsActive = true
            }
        );
    }
}