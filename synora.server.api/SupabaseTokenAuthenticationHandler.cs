using System.Security.Claims;
using System.Text.Json;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Synora.Server.Api;

public sealed class SupabaseTokenAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "SupabaseBearer";
    public const string HttpClientName = "SupabaseAuth";
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public SupabaseTokenAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
        : base(options, logger, encoder)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var authorization = Request.Headers.Authorization.ToString();
        if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return AuthenticateResult.NoResult();
        }

        var supabaseUrl = _configuration["Supabase:Url"]?.TrimEnd('/');
        var anonKey = _configuration["Supabase:AnonKey"];
        if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(anonKey))
        {
            Logger.LogError("Supabase:Url and Supabase:AnonKey must be configured to authenticate API requests.");
            return AuthenticateResult.Fail("API authentication is not configured.");
        }

        var token = authorization["Bearer ".Length..].Trim();
        if (token.Length == 0)
        {
            return AuthenticateResult.Fail("Bearer token is empty.");
        }

        using var request = new HttpRequestMessage(HttpMethod.Get, $"{supabaseUrl}/auth/v1/user");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        request.Headers.Add("apikey", anonKey);

        try
        {
            using var response = await _httpClientFactory.CreateClient(HttpClientName)
                .SendAsync(request, Context.RequestAborted);
            if (!response.IsSuccessStatusCode)
            {
                return AuthenticateResult.Fail("Supabase rejected the bearer token.");
            }

            await using var content = await response.Content.ReadAsStreamAsync(Context.RequestAborted);
            using var user = await JsonDocument.ParseAsync(content, cancellationToken: Context.RequestAborted);
            if (!user.RootElement.TryGetProperty("id", out var idProperty) ||
                !Guid.TryParse(idProperty.GetString(), out var userId))
            {
                return AuthenticateResult.Fail("Supabase returned an invalid user identity.");
            }

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, userId.ToString()),
            };
            if (user.RootElement.TryGetProperty("email", out var emailProperty) &&
                emailProperty.ValueKind == JsonValueKind.String)
            {
                claims.Add(new Claim(ClaimTypes.Email, emailProperty.GetString()!));
            }

            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, SchemeName));
            return AuthenticateResult.Success(new AuthenticationTicket(principal, SchemeName));
        }
        catch (HttpRequestException exception)
        {
            Logger.LogError(exception, "Could not validate an access token with Supabase Auth.");
            return AuthenticateResult.Fail("Authentication service is unavailable.");
        }
        catch (JsonException exception)
        {
            Logger.LogError(exception, "Supabase Auth returned an invalid user response.");
            return AuthenticateResult.Fail("Authentication service returned an invalid response.");
        }
    }
}
