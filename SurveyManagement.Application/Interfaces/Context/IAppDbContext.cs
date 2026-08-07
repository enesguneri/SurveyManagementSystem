using Microsoft.EntityFrameworkCore;
using SurveyManagement.Domain.Entities;

namespace SurveyManagement.Application.Interfaces.Context;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<UserRole> UserRoles { get; }

    DbSet<Form> Forms { get; }
    DbSet<Question> Questions { get; }
    DbSet<QuestionValidation> QuestionValidations { get; }
    DbSet<QuestionOption> QuestionOptions { get; }
    DbSet<MatrixRow> MatrixRows { get; }
    DbSet<MatrixColumn> MatrixColumns { get; }

    DbSet<FormResponse> FormResponses { get; }
    DbSet<ResponseAnswer> ResponseAnswers { get; }
    DbSet<ResponseAnswerOption> ResponseAnswerOptions { get; }
    DbSet<ResponseMatrixAnswer> ResponseMatrixAnswers { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}