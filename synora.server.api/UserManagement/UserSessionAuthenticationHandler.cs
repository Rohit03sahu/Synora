using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Synora.Server.Infrastructure;

namespace Synora.Server.Api.UserManagement;

public sealed class UserSessionAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "UserSession";
    private readonly ApiDatabaseProvider _database;

    public UserSessionAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        ApiDatabaseProvider database)
        : base(options, logger, encoder)
    {
        _database = database;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var authorization = Request.Headers.Authorization.ToString();
        if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return AuthenticateResult.NoResult();
        }

        var token = authorization["Bearer ".Length..].Trim();
        if (token.Length == 0)
        {
            return AuthenticateResult.Fail("The access token is empty.");
        }

        var session = await _database.FindActiveSessionAsync(AccountToken.Hash(token), Context.RequestAborted);
        if (session is null)
        {
            return AuthenticateResult.Fail("The access token is invalid or expired.");
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, session.UserId.ToString()),
            new(ClaimTypes.Email, session.Email),
        };
        if (session.Phone is not null)
        {
            claims.Add(new Claim(ClaimTypes.MobilePhone, session.Phone));
        }
        if (session.PhoneConfirmedAt is not null)
        {
            claims.Add(new Claim("phone_confirmed_at", session.PhoneConfirmedAt.Value.ToString("O")));
        }

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        return AuthenticateResult.Success(new AuthenticationTicket(principal, SchemeName));
    }
}
