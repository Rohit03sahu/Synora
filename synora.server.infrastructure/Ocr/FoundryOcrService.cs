using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Synora.Server.Infrastructure.Ocr;

public sealed class FoundryOcrService
{
    private const string ApiVersion = "2024-05-01-preview";
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public FoundryOcrService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_configuration["Foundry:Endpoint"]) &&
        !string.IsNullOrWhiteSpace(_configuration["Foundry:ApiKey"]) &&
        !string.IsNullOrWhiteSpace(_configuration["Foundry:Model"]);

    public async Task<IReadOnlyList<OcrLabResult>> ExtractAsync(
        byte[] image,
        string mediaType,
        CancellationToken cancellationToken)
    {
        var endpoint = _configuration["Foundry:Endpoint"]?.TrimEnd('/');
        var apiKey = _configuration["Foundry:ApiKey"];
        var model = _configuration["Foundry:Model"];
        if (string.IsNullOrWhiteSpace(endpoint) ||
            string.IsNullOrWhiteSpace(apiKey) ||
            string.IsNullOrWhiteSpace(model))
        {
            throw new FoundryOcrException("Azure AI Foundry OCR is not configured.");
        }

        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var endpointUri) ||
            endpointUri.Scheme != Uri.UriSchemeHttps)
        {
            throw new FoundryOcrException("The Azure AI Foundry endpoint must be an HTTPS URL.");
        }

        var requestUri = new Uri(endpointUri, $"models/chat/completions?api-version={ApiVersion}");
        var payload = new
        {
            model,
            temperature = 0,
            max_tokens = 4096,
            messages = new object[]
            {
                new
                {
                    role = "user",
                    content = new object[]
                    {
                        new
                        {
                            type = "text",
                            text = """
                                Read the laboratory report image and extract only clearly legible test results.
                                Return a JSON object with a "results" array. Each item must contain:
                                "parameter", "result", "unit", "reference", "date", and "status".
                                Use strings for values; use an empty string when a value is absent or unclear.
                                For "status", return only "normal", "borderline", "high", or "low" when the
                                report explicitly indicates it; otherwise return an empty string. Do not infer
                                or calculate values, statuses, or reference ranges. Use the collection/report
                                date when clearly shown; otherwise leave date empty. Do not provide medical
                                advice or include any prose outside the JSON object.
                                """,
                        },
                        new
                        {
                            type = "image_url",
                            image_url = new
                            {
                                url = $"data:{mediaType};base64,{Convert.ToBase64String(image)}",
                            },
                        },
                    },
                },
            },
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, requestUri);
        request.Headers.Add("api-key", apiKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json");

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, cancellationToken);
        }
        catch (HttpRequestException exception)
        {
            throw new FoundryOcrException("Azure AI Foundry could not be reached.", exception);
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                throw new FoundryOcrException(
                    $"Azure AI Foundry returned HTTP {(int)response.StatusCode}.");
            }

            try
            {
                await using var responseStream = await response.Content.ReadAsStreamAsync(cancellationToken);
                using var responseJson = await JsonDocument.ParseAsync(
                    responseStream,
                    cancellationToken: cancellationToken);
                var content = responseJson.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();
                if (string.IsNullOrWhiteSpace(content))
                {
                    throw new JsonException("The OCR response did not contain message content.");
                }

                var json = content.Trim();
                if (json.StartsWith("```", StringComparison.Ordinal))
                {
                    var firstLineEnd = json.IndexOf('\n');
                    var lastFence = json.LastIndexOf("```", StringComparison.Ordinal);
                    if (firstLineEnd < 0 || lastFence <= firstLineEnd)
                    {
                        throw new JsonException("The OCR response contained invalid JSON formatting.");
                    }

                    json = json[(firstLineEnd + 1)..lastFence].Trim();
                }

                using var extractedJson = JsonDocument.Parse(json);
                var extracted = extractedJson.RootElement.GetProperty("results");
                if (extracted.ValueKind != JsonValueKind.Array)
                {
                    throw new JsonException("The OCR response results field was not an array.");
                }

                return extracted.EnumerateArray()
                    .Take(200)
                    .Select(item => new OcrLabResult(
                        ReadText(item, "parameter", 120),
                        ReadText(item, "result", 80),
                        ReadText(item, "unit", 40),
                        ReadText(item, "reference", 120),
                        ReadDate(item),
                        ReadStatus(item)))
                    .Where(item =>
                        !string.IsNullOrWhiteSpace(item.Parameter) &&
                        !string.IsNullOrWhiteSpace(item.Result))
                    .ToArray();
            }
            catch (Exception exception) when (
                exception is JsonException or InvalidOperationException or KeyNotFoundException or IndexOutOfRangeException)
            {
                throw new FoundryOcrException(
                    "Azure AI Foundry returned an invalid OCR response.",
                    exception);
            }
        }
    }

    private static string ReadText(JsonElement item, string property, int maxLength)
    {
        if (!item.TryGetProperty(property, out var value) ||
            value.ValueKind != JsonValueKind.String)
        {
            return string.Empty;
        }

        var text = value.GetString()?.Trim() ?? string.Empty;
        return text.Length <= maxLength ? text : text[..maxLength];
    }

    private static string ReadDate(JsonElement item)
    {
        var date = ReadText(item, "date", 10);
        return DateOnly.TryParse(date, out var parsed) ? parsed.ToString("yyyy-MM-dd") : string.Empty;
    }

    private static string ReadStatus(JsonElement item)
    {
        var status = ReadText(item, "status", 20);
        return status.ToLowerInvariant() is "normal" or "borderline" or "high" or "low"
            ? status.ToLowerInvariant()
            : string.Empty;
    }
}

public sealed record OcrLabResult(
    string Parameter,
    string Result,
    string Unit,
    string Reference,
    string Date,
    string Status);

public sealed class FoundryOcrException : Exception
{
    public FoundryOcrException(string message) : base(message)
    {
    }

    public FoundryOcrException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
