using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.AI;
using SurveyManagement.Application.Interfaces.AI;
using SurveyManagement.Application.Interfaces.Context;
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
    private readonly IAppDbContext? _context;
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
        ILogger<GeminiSurveyService> logger,
        IAppDbContext? context = null)
    {
        _httpClient = httpClient;
        _options = options;
        _formRequestValidator = formRequestValidator;
        _logger = logger;
        _context = context;

        _jsonOptions.Converters.Add(new JsonStringEnumConverter());
    }

    public async Task<GenerateSurveyDraftResponseDto> GenerateDraftAsync(
        GenerateSurveyDraftRequestDto request,
        CancellationToken cancellationToken)
    {
        return await GenerateDraftAsync(request, null, cancellationToken);
    }

    public async Task<GenerateSurveyDraftResponseDto> GenerateDraftAsync(
        GenerateSurveyDraftRequestDto request,
        int? requesterUserId = null,
        CancellationToken cancellationToken = default)
    {
        string? effectiveApiKey = null;
        string? effectiveModel = null;

        if (_context is not null && requesterUserId.HasValue)
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == requesterUserId.Value, cancellationToken);

            if (user is not null && !string.IsNullOrWhiteSpace(user.GeminiApiKey))
            {
                effectiveApiKey = user.GeminiApiKey;
                effectiveModel = !string.IsNullOrWhiteSpace(user.GeminiModel)
                    ? user.GeminiModel
                    : _options.Model;
            }
        }

        // Eğer kullanıcıya özel anahtar yoksa genel ayarlar kontrol edilir (fallback).
        if (string.IsNullOrWhiteSpace(effectiveApiKey))
        {
            effectiveApiKey = _options.ApiKey;
            effectiveModel = _options.Model;
        }

        if (string.IsNullOrWhiteSpace(effectiveApiKey))
        {
            return FailedResponse("AI ile anket oluşturabilmek için lütfen önce kişisel Gemini API anahtarınızı yapılandırın.");
        }

        if (string.IsNullOrWhiteSpace(effectiveModel))
        {
            effectiveModel = "gemini-2.5-flash";
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
                $"{Uri.EscapeDataString(effectiveModel)}:generateContent";

            using var httpRequest = new HttpRequestMessage(
                HttpMethod.Post,
                requestUrl);

            // API anahtarı URL yerine header üzerinden gönderilir.
            httpRequest.Headers.TryAddWithoutValidation(
                "x-goog-api-key",
                effectiveApiKey);

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
            when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(
                "Gemini isteği zaman aşımına uğradı.");

            return FailedResponse(
                "Gemini isteği zaman aşımına uğradı.");
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

    public async Task<UserAiConfigDto> GetUserConfigAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        if (_context is null)
        {
            return new UserAiConfigDto
            {
                HasApiKey = !string.IsNullOrWhiteSpace(_options.ApiKey),
                MaskedApiKey = MaskApiKey(_options.ApiKey),
                Model = _options.Model
            };
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null || string.IsNullOrWhiteSpace(user.GeminiApiKey))
        {
            return new UserAiConfigDto
            {
                HasApiKey = false,
                MaskedApiKey = null,
                Model = _options.Model
            };
        }

        return new UserAiConfigDto
        {
            HasApiKey = true,
            MaskedApiKey = MaskApiKey(user.GeminiApiKey),
            Model = !string.IsNullOrWhiteSpace(user.GeminiModel) ? user.GeminiModel : _options.Model
        };
    }

    public async Task<ApiResponse<bool>> SaveUserConfigAsync(
        int userId,
        SaveUserAiConfigRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        if (_context is null)
        {
            return ApiResponse<bool>.FailureResult("Veritabanı bağlantısı bulunamadı.", 500);
        }

        var trimmedKey = dto.ApiKey?.Trim();
        if (string.IsNullOrWhiteSpace(trimmedKey))
        {
            return ApiResponse<bool>.FailureResult("Gemini API anahtarı boş bırakılamaz.", 400);
        }

        if (trimmedKey.Length < 10)
        {
            return ApiResponse<bool>.FailureResult("Geçersiz API anahtarı formatı.", 400);
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
        {
            return ApiResponse<bool>.FailureResult("Kullanıcı bulunamadı.", 404);
        }

        user.GeminiApiKey = trimmedKey;
        if (!string.IsNullOrWhiteSpace(dto.Model))
        {
            user.GeminiModel = dto.Model.Trim();
        }

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResult(true, "Gemini API yapılandırmanız başarıyla kaydedildi.");
    }

    private static string? MaskApiKey(string? apiKey)
    {
        if (string.IsNullOrWhiteSpace(apiKey)) return null;
        if (apiKey.Length <= 8) return "****";
        return $"{apiKey[..6]}...{apiKey[^4..]}";
    }
}