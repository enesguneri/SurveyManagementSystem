using SurveyManagement.Application.DTOs.Forms;

namespace SurveyManagement.Application.Interfaces.Forms;

public interface IFormRequestValidator
{
    List<string> Validate(CreateFormDto createFormDto);
}