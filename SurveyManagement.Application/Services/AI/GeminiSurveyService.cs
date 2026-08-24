using Microsoft.Extensions.Logging;
using SurveyManagement.Application.DTOs.AI;
using SurveyManagement.Application.Interfaces.AI;
using SurveyManagement.Application.Interfaces.Forms;
using SurveyManagement.Application.Options;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SurveyManagement.Application.Services.AI;

public sealed class GeminiSurveyService : IGeminiSurveyService
{
    private const int MaxConversationMessageCount = 20;

    private readonly HttpClient _httpClient;
    private readonly GeminiOptions _options;
    private readonly IFormRequestValidator _formRequestValidator;
    private readonly ILogger<GeminiSurveyService> _logger;

    private readonly JsonSerializerOptions _jsonOptions =
        new(JsonSerializerDefaults.Web)
        {
            PropertyNameCaseInsensitive = true
        };

    public GeminiSurveyService(
        HttpClient httpClient,
        GeminiOptions options,
        IFormRequestValidator formRequestValidator,
        ILogger<GeminiSurveyService> logger)
    {
        _httpClient = httpClient;
        _options = options;
        _formRequestValidator = formRequestValidator;
        _logger = logger;

        _jsonOptions.Converters.Add(new JsonStringEnumConverter());
    }

    public async Task<GenerateSurveyDraftResponseDto> GenerateDraftAsync(
        GenerateSurveyDraftRequestDto request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            return FailedResponse("Gemini API anahtarı yapılandırılmamış.");
        }

        if (string.IsNullOrWhiteSpace(_options.Model))
        {
            return FailedResponse("Gemini modeli yapılandırılmamış.");
        }

        if (string.IsNullOrWhiteSpace(request.Prompt))
        {
            return FailedResponse("AI isteği boş olamaz.");
        }

        try
        {
            var requestBody = new
            {
                systemInstruction = new
                {
                    parts = new[]
                    {
                        new
                        {
                            text = BuildSystemInstruction()
                        }
                    }
                },
                contents = BuildConversation(request),
                generationConfig = new
                {
                    responseMimeType = "application/json",
                    responseJsonSchema = BuildResponseSchema(),
                    temperature = 0.2,
                    maxOutputTokens = 12000
                }
            };

            var requestUrl =
                $"{_options.BaseUrl.TrimEnd('/')}/v1beta/models/" +
                $"{Uri.EscapeDataString(_options.Model)}:generateContent";

            using var httpRequest = new HttpRequestMessage(
                HttpMethod.Post,
                requestUrl);

            // API anahtarı URL yerine header üzerinden gönderilir.
            httpRequest.Headers.TryAddWithoutValidation(
                "x-goog-api-key",
                _options.ApiKey);

            var jsonBody = JsonSerializer.Serialize(
                requestBody,
                _jsonOptions);

            httpRequest.Content = new StringContent(
                jsonBody,
                Encoding.UTF8,
                "application/json");

            using var httpResponse = await _httpClient.SendAsync(
                httpRequest,
                cancellationToken);

            var responseBody = await httpResponse.Content.ReadAsStringAsync(
                cancellationToken);

            if (!httpResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Gemini API başarısız yanıt döndürdü. HTTP: {StatusCode}",
                    httpResponse.StatusCode);

                return FailedResponse(
                    "Gemini servisi şu anda yanıt veremiyor.");
            }

            var responseText = ExtractResponseText(responseBody);

            if (string.IsNullOrWhiteSpace(responseText))
            {
                return FailedResponse(
                    "Gemini yanıtında okunabilir içerik bulunamadı.");
            }

            var result = JsonSerializer.Deserialize<
                GenerateSurveyDraftResponseDto>(
                CleanJsonResponse(responseText),
                _jsonOptions);

            if (result is null)
            {
                return FailedResponse(
                    "Gemini yanıtı beklenen formata dönüştürülemedi.");
            }

            if (result.Status == AiDraftStatus.Ready)
            {
                if (result.Draft is null)
                {
                    return FailedResponse(
                        "Gemini hazır durumunda taslak döndürmedi.");
                }

                // AI birim rolü Id'si üretemez.
                // Birim seçimini kullanıcı yapmalıdır.
                result.Draft.RoleIds.Clear();

                var validationErrors =
                    _formRequestValidator.Validate(result.Draft);

                if (validationErrors.Count > 0)
                {
                    return new GenerateSurveyDraftResponseDto
                    {
                        Status = AiDraftStatus.NeedsClarification,
                        Message =
                            "Üretilen taslak mevcut form kurallarını karşılamıyor.",
                        ClarifyingQuestions = validationErrors,
                        Draft = null
                    };
                }
            }

            return result;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (JsonException exception)
        {
            _logger.LogError(
                exception,
                "Gemini JSON yanıtı işlenemedi.");

            return FailedResponse(
                "Gemini yanıtı geçerli JSON formatında değil.");
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(
                exception,
                "Gemini API bağlantısı kurulamadı.");

            return FailedResponse(
                "Gemini servisine bağlanılamadı.");
        }
    }

    private static string BuildSystemInstruction()
    {
        return """
            Sen İzmir Bakırçay Üniversitesi Anket Yönetim Sistemi için
            çalışan bir anket tasarım asistanısın.

            Kullanıcının istediği anketi analiz et.

            Temel bilgiler eksikse status değerini NeedsClarification yap
            ve en fazla üç netleştirici soru üret.

            Bilgiler yeterliyse status değerini Ready yap ve draft alanında
            geçerli bir anket taslağı üret.

            Yalnızca aşağıdaki soru türlerini kullan:
            ShortText, LongText, SingleChoice, MultipleChoice, Rating,
            MultipleChoiceGrid, CheckboxGrid, Date ve Dropdown.

            RoleIds alanını her zaman boş dizi olarak gönder.
            Kullanıcı birim seçimini uygulama arayüzünde yapacaktır.

            Yanıtı yalnızca istenen JSON şemasına uygun olarak üret.
            Markdown veya açıklama metni ekleme.

            Rating türündeki her soru için validation alanında
            MinValue ve MaxValue zorunludur.

            Kullanıcı derecelendirme aralığını belirtmediyse
            Rating sorusu üretme; bunun yerine NeedsClarification döndür.

            Kullanıcı istemediği sürece yapılandırması eksik soru türleri üretme.
            """;
    }

    private static List<object> BuildConversation(
        GenerateSurveyDraftRequestDto request)
    {
        var contents = new List<object>();

        foreach (var message in request.Conversation
                     .TakeLast(MaxConversationMessageCount))
        {
            var role = message.Role.Trim().ToLowerInvariant();

            if (role == "assistant")
            {
                role = "model";
            }

            if (role != "user" && role != "model")
            {
                continue;
            }

            contents.Add(new
            {
                role,
                parts = new[]
                {
                    new
                    {
                        text = message.Content
                    }
                }
            });
        }

        // Güncel kullanıcı mesajı konuşmanın son mesajıdır.
        contents.Add(new
        {
            role = "user",
            parts = new[]
            {
                new
                {
                    text = request.Prompt
                }
            }
        });

        return contents;
    }

    private static string? ExtractResponseText(string responseBody)
    {
        using var document = JsonDocument.Parse(responseBody);

        if (!document.RootElement.TryGetProperty(
                "candidates",
                out var candidates))
        {
            return null;
        }

        foreach (var candidate in candidates.EnumerateArray())
        {
            if (!candidate.TryGetProperty(
                    "content",
                    out var content))
            {
                continue;
            }

            if (!content.TryGetProperty(
                    "parts",
                    out var parts))
            {
                continue;
            }

            var textBuilder = new StringBuilder();

            foreach (var part in parts.EnumerateArray())
            {
                if (part.TryGetProperty(
                        "text",
                        out var text))
                {
                    textBuilder.Append(text.GetString());
                }
            }

            return textBuilder.ToString();
        }

        return null;
    }

    private static string CleanJsonResponse(string responseText)
    {
        var cleaned = responseText.Trim();

        if (!cleaned.StartsWith("```"))
        {
            return cleaned;
        }

        var firstLineEnd = cleaned.IndexOf('\n');

        if (firstLineEnd >= 0)
        {
            cleaned = cleaned[(firstLineEnd + 1)..];
        }

        var lastFence = cleaned.LastIndexOf("```");

        if (lastFence >= 0)
        {
            cleaned = cleaned[..lastFence];
        }

        return cleaned.Trim();
    }

    private static GenerateSurveyDraftResponseDto FailedResponse(
        string message)
    {
        return new GenerateSurveyDraftResponseDto
        {
            Status = AiDraftStatus.Failed,
            Message = message,
            ClarifyingQuestions = new List<string>(),
            Draft = null
        };
    }

    private static Dictionary<string, object?> BuildResponseSchema()
    {
        var nullableString = new Dictionary<string, object?>
        {
            ["type"] = new[] { "string", "null" }
        };

        var nullableInteger = new Dictionary<string, object?>
        {
            ["type"] = new[] { "integer", "null" }
        };

        var nullableNumber = new Dictionary<string, object?>
        {
            ["type"] = new[] { "number", "null" }
        };

        var validationSchema = new Dictionary<string, object?>
        {
            ["type"] = new[] { "object", "null" },
            ["properties"] = new Dictionary<string, object?>
            {
                ["minLength"] = nullableInteger,
                ["maxLength"] = nullableInteger,
                ["regexPattern"] = nullableString,
                ["minValue"] = nullableNumber,
                ["maxValue"] = nullableNumber,
                ["minDate"] = nullableString,
                ["maxDate"] = nullableString
            }
        };

        var optionSchema = new Dictionary<string, object?>
        {
            ["type"] = "object",
            ["properties"] = new Dictionary<string, object?>
            {
                ["text"] = new Dictionary<string, object?>
                {
                    ["type"] = "string"
                }
            },
            ["required"] = new[] { "text" }
        };

        var matrixItemSchema = new Dictionary<string, object?>
        {
            ["type"] = "object",
            ["properties"] = new Dictionary<string, object?>
            {
                ["text"] = new Dictionary<string, object?>
                {
                    ["type"] = "string"
                }
            },
            ["required"] = new[] { "text" }
        };

        var questionSchema = new Dictionary<string, object?>
        {
            ["type"] = "object",
            ["properties"] = new Dictionary<string, object?>
            {
                ["title"] = new Dictionary<string, object?>
                {
                    ["type"] = "string"
                },
                ["description"] = nullableString,
                ["type"] = new Dictionary<string, object?>
                {
                    ["type"] = "string",
                    ["enum"] = new[]
                    {
                        "ShortText",
                        "LongText",
                        "SingleChoice",
                        "MultipleChoice",
                        "Rating",
                        "MultipleChoiceGrid",
                        "CheckboxGrid",
                        "Date",
                        "Dropdown"
                    }
                },
                ["isRequired"] = new Dictionary<string, object?>
                {
                    ["type"] = "boolean"
                },
                ["ratingMinLabel"] = nullableString,
                ["ratingMaxLabel"] = nullableString,
                ["validation"] = validationSchema,
                ["options"] = new Dictionary<string, object?>
                {
                    ["type"] = "array",
                    ["items"] = optionSchema
                },
                ["matrixRows"] = new Dictionary<string, object?>
                {
                    ["type"] = "array",
                    ["items"] = matrixItemSchema
                },
                ["matrixColumns"] = new Dictionary<string, object?>
                {
                    ["type"] = "array",
                    ["items"] = matrixItemSchema
                }
            },
            ["required"] = new[]
            {
                "title",
                "description",
                "type",
                "isRequired",
                "ratingMinLabel",
                "ratingMaxLabel",
                "validation",
                "options",
                "matrixRows",
                "matrixColumns"
            }
        };

        var draftSchema = new Dictionary<string, object?>
        {
            ["type"] = new[] { "object", "null" },
            ["properties"] = new Dictionary<string, object?>
            {
                ["title"] = new Dictionary<string, object?>
                {
                    ["type"] = "string"
                },
                ["description"] = nullableString,
                ["showRespondentIdentity"] = new Dictionary<string, object?>
                {
                    ["type"] = "boolean"
                },
                ["accessType"] = new Dictionary<string, object?>
                {
                    ["type"] = "string",
                    ["enum"] = new[]
                    {
                        "Public",
                        "Authenticated"
                    }
                },
                ["roleIds"] = new Dictionary<string, object?>
                {
                    ["type"] = "array",
                    ["items"] = new Dictionary<string, object?>
                    {
                        ["type"] = "integer"
                    }
                },
                ["questions"] = new Dictionary<string, object?>
                {
                    ["type"] = "array",
                    ["items"] = questionSchema
                }
            },
            ["required"] = new[]
            {
                "title",
                "description",
                "showRespondentIdentity",
                "accessType",
                "roleIds",
                "questions"
            }
        };

        return new Dictionary<string, object?>
        {
            ["type"] = "object",
            ["properties"] = new Dictionary<string, object?>
            {
                ["status"] = new Dictionary<string, object?>
                {
                    ["type"] = "string",
                    ["enum"] = new[]
                    {
                        "NeedsClarification",
                        "Ready"
                    }
                },
                ["message"] = new Dictionary<string, object?>
                {
                    ["type"] = "string"
                },
                ["clarifyingQuestions"] = new Dictionary<string, object?>
                {
                    ["type"] = "array",
                    ["items"] = new Dictionary<string, object?>
                    {
                        ["type"] = "string"
                    }
                },
                ["draft"] = draftSchema
            },
            ["required"] = new[]
            {
                "status",
                "message",
                "clarifyingQuestions",
                "draft"
            }
        };
    }
}