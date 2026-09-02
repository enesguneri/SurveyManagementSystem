using SurveyManagement.Application.DTOs.Responses;
using SurveyManagement.Domain.Entities;

namespace SurveyManagement.Application.Interfaces.Responses;

public interface IFormResponseValidator
{
    // Form yanıtlarının soru tiplerine ve form kurallarına uygunluğunu kontrol eder.
    List<string> Validate(
        Form form,
        SubmitFormResponseDto submitDto);

    Task<List<string>> ValidateAsync(
        Form form,
        SubmitFormResponseDto submitDto,
        CancellationToken cancellationToken = default);
}