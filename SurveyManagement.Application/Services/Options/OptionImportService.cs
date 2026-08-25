using Microsoft.Extensions.Logging;
using SurveyManagement.Application.Common.Models;
using SurveyManagement.Application.DTOs.Options;
using SurveyManagement.Application.Interfaces.Options;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;

namespace SurveyManagement.Application.Services.Options;

public sealed class OptionImportService : IOptionImportService
{
    private const int MaxResponseBytes = 1_000_000;
    private const int MaxOptionCount = 500;
    private const int MaxOptionLength = 200;

    private readonly HttpClient _httpClient;
    private readonly ILogger<OptionImportService> _logger;

    public OptionImportService(
        HttpClient httpClient,
        ILogger<OptionImportService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<ApiResponse<ImportOptionsPreviewDto>> PreviewFromUrlAsync(
        ImportOptionsFromUrlRequestDto request,
        CancellationToken cancellationToken)
    {
        var rawUrl = request.Url.Trim();

        if (!Uri.TryCreate(
                rawUrl,
                UriKind.Absolute,
                out var uri) ||
            uri.Scheme != Uri.UriSchemeHttps)
        {
            return ApiResponse<ImportOptionsPreviewDto>.FailureResult(
                "Yalnızca geçerli HTTPS adresleri kullanılabilir.",
                400);
        }

        try
        {
            // SSRF riskini azaltmak için yerel ve özel ağ adresleri engellenir.
            if (await IsPrivateOrLocalAddressAsync(
                    uri,
                    cancellationToken))
            {
                return ApiResponse<ImportOptionsPreviewDto>.FailureResult(
                    "Yerel veya özel ağ adreslerine istek yapılamaz.",
                    400);
            }
        }
        catch (SocketException)
        {
            return ApiResponse<ImportOptionsPreviewDto>.FailureResult(
                "API adresi çözümlenemedi.",
                400);
        }

        try
        {
            using var response = await _httpClient.GetAsync(
                uri,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return ApiResponse<ImportOptionsPreviewDto>.FailureResult(
                    "Seçenek API'si başarılı bir yanıt döndürmedi.",
                    502);
            }

            // Bilinen response boyutu sınırı aşıyorsa işlem durdurulur.
            if (response.Content.Headers.ContentLength >
                MaxResponseBytes)
            {
                return ApiResponse<ImportOptionsPreviewDto>.FailureResult(
                    "API yanıtı izin verilen boyuttan büyük.",
                    400);
            }

            var json = await ReadLimitedContentAsync(
                response,
                cancellationToken);

            using var document = JsonDocument.Parse(json);

            var selectedNode = SelectJsonNode(
                document.RootElement,
                request.JsonPath);

            var extractedValues = ExtractOptionValues(
                selectedNode,
                request.TextProperty);

            var normalizedOptions = NormalizeOptions(
                extractedValues,
                out var skippedCount);

            if (normalizedOptions.Count == 0)
            {
                return ApiResponse<ImportOptionsPreviewDto>.FailureResult(
                    "API yanıtında kullanılabilir seçenek bulunamadı.",
                    400);
            }

            var preview = new ImportOptionsPreviewDto
            {
                SourceUrl = uri.GetLeftPart(UriPartial.Path),
                Options = normalizedOptions,
                SkippedCount = skippedCount
            };

            return ApiResponse<ImportOptionsPreviewDto>.SuccessResult(
                preview);
        }
        catch (InvalidOperationException exception)
        {
            _logger.LogWarning(
                exception,
                "Seçenek API yanıtı işlenemedi.");

            return ApiResponse<ImportOptionsPreviewDto>.FailureResult(
                exception.Message,
                400);
        }
        catch (JsonException exception)
        {
            _logger.LogWarning(
                exception,
                "Seçenek API'si geçerli JSON döndürmedi.");

            return ApiResponse<ImportOptionsPreviewDto>.FailureResult(
                "API yanıtı geçerli bir JSON formatında değil.",
                400);
        }
        catch (OperationCanceledException)
            when (!cancellationToken.IsCancellationRequested)
        {
            return ApiResponse<ImportOptionsPreviewDto>.FailureResult(
                "API isteği zaman aşımına uğradı.",
                504);
        }
        catch (HttpRequestException exception)
        {
            _logger.LogWarning(
                exception,
                "Seçenek API'sine bağlanılamadı.");

            return ApiResponse<ImportOptionsPreviewDto>.FailureResult(
                "Seçenek API'sine bağlanılamadı.",
                502);
        }
    }

    private static async Task<string> ReadLimitedContentAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        await using var sourceStream =
            await response.Content.ReadAsStreamAsync(
                cancellationToken);

        await using var memoryStream = new MemoryStream();

        var buffer = new byte[8192];
        var totalBytes = 0;

        while (true)
        {
            var readBytes = await sourceStream.ReadAsync(
                buffer.AsMemory(0, buffer.Length),
                cancellationToken);

            if (readBytes == 0)
            {
                break;
            }

            totalBytes += readBytes;

            if (totalBytes > MaxResponseBytes)
            {
                throw new InvalidOperationException(
                    "API yanıtı izin verilen boyuttan büyük.");
            }

            await memoryStream.WriteAsync(
                buffer.AsMemory(0, readBytes),
                cancellationToken);
        }

        return Encoding.UTF8.GetString(
            memoryStream.ToArray());
    }

    private static JsonElement SelectJsonNode(
        JsonElement root,
        string? jsonPath)
    {
        if (string.IsNullOrWhiteSpace(jsonPath))
        {
            if (root.ValueKind == JsonValueKind.Object &&
                TryGetPropertyIgnoreCase(
                    root,
                    "options",
                    out var optionsNode))
            {
                return optionsNode;
            }

            return root;
        }

        var currentNode = root;

        foreach (var segment in jsonPath.Split(
                     '.',
                     StringSplitOptions.RemoveEmptyEntries))
        {
            if (currentNode.ValueKind != JsonValueKind.Object ||
                !TryGetPropertyIgnoreCase(
                    currentNode,
                    segment,
                    out var nextNode))
            {
                throw new InvalidOperationException(
                    $"JSON yolu bulunamadı: {jsonPath}");
            }

            currentNode = nextNode;
        }

        return currentNode;
    }

    private static List<string> ExtractOptionValues(
        JsonElement node,
        string textProperty)
    {
        if (node.ValueKind != JsonValueKind.Array)
        {
            throw new InvalidOperationException(
                "Seçenek kaynağı bir JSON dizisi olmalıdır.");
        }

        var values = new List<string>();

        foreach (var item in node.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.String)
            {
                values.Add(item.GetString() ?? string.Empty);
                continue;
            }

            if (item.ValueKind == JsonValueKind.Object &&
                TryGetPropertyIgnoreCase(
                    item,
                    textProperty,
                    out var textNode) &&
                textNode.ValueKind == JsonValueKind.String)
            {
                values.Add(textNode.GetString() ?? string.Empty);
            }
        }

        return values;
    }

    private static List<string> NormalizeOptions(
        IEnumerable<string> values,
        out int skippedCount)
    {
        var result = new List<string>();
        var seen = new HashSet<string>();
        skippedCount = 0;

        foreach (var value in values)
        {
            var normalizedValue = value.Trim();

            if (string.IsNullOrWhiteSpace(normalizedValue) ||
                normalizedValue.Length > MaxOptionLength ||
                !seen.Add(normalizedValue) ||
                result.Count >= MaxOptionCount)
            {
                skippedCount++;
                continue;
            }

            result.Add(normalizedValue);
        }

        return result;
    }

    private static bool TryGetPropertyIgnoreCase(
        JsonElement element,
        string propertyName,
        out JsonElement value)
    {
        foreach (var property in element.EnumerateObject())
        {
            if (string.Equals(
                    property.Name,
                    propertyName,
                    StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }

    private static async Task<bool> IsPrivateOrLocalAddressAsync(
        Uri uri,
        CancellationToken cancellationToken)
    {
        if (uri.Host.Equals(
                "localhost",
                StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (IPAddress.TryParse(
                uri.DnsSafeHost,
                out var parsedAddress))
        {
            return IsPrivateAddress(parsedAddress);
        }

        var addresses = await Dns.GetHostAddressesAsync(
            uri.DnsSafeHost,
            cancellationToken);

        return addresses.Any(IsPrivateAddress);
    }

    private static bool IsPrivateAddress(IPAddress address)
    {
        if (IPAddress.IsLoopback(address))
        {
            return true;
        }

        var bytes = address.GetAddressBytes();

        if (address.AddressFamily ==
            AddressFamily.InterNetwork)
        {
            return
                bytes[0] == 10 ||
                bytes[0] == 127 ||
                bytes[0] == 169 && bytes[1] == 254 ||
                bytes[0] == 192 && bytes[1] == 168 ||
                bytes[0] == 172 &&
                bytes[1] >= 16 &&
                bytes[1] <= 31;
        }

        // IPv6 link-local ve unique-local adresleri engellenir.
        return address.IsIPv6LinkLocal ||
               bytes[0] >= 0xFC && bytes[0] <= 0xFD;
    }
}