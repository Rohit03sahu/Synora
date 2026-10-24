using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synora.Server.Infrastructure;

namespace Synora.Server.Api.UserManagement;

[ApiController]
[Route("api/auth")]
public sealed class UserManagementController(UserManagementService users) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("register")]
    public Task<IActionResult> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken) =>
        Execute(async () =>
        {
            await users.RegisterAsync(
                request.Email,
                request.Password,
                request.FullName,
                request.Phone,
                cancellationToken);
            return Accepted();
        });

    [AllowAnonymous]
    [HttpPost("verify-email")]
    public Task<IActionResult> VerifyEmail(
        [FromBody] AccountTokenRequest request,
        CancellationToken cancellationToken) =>
        Execute(async () => await users.VerifyEmailAsync(request.Token, cancellationToken)
            ? NoContent()
            : Problem(statusCode: StatusCodes.Status400BadRequest, detail: "This verification link is invalid or expired."));

    [AllowAnonymous]
    [HttpPost("resend-verification")]
    public Task<IActionResult> ResendVerification(
        [FromBody] EmailRequest request,
        CancellationToken cancellationToken) =>
        Execute(async () =>
        {
            await users.ResendVerificationEmailAsync(request.Email, cancellationToken);
            return Ok(new { message = "If this account needs verification, an email has been sent." });
        });

    [AllowAnonymous]
    [HttpPost("login")]
    public Task<IActionResult> SignIn(
        [FromBody] SignInRequest request,
        CancellationToken cancellationToken) =>
        Execute(async () =>
        {
            var session = await users.SignInAsync(request.Email, request.Password, cancellationToken);
            return Ok(new { accessToken = session.AccessToken, expiresAt = session.ExpiresAt });
        });

    [Authorize]
    [HttpPost("logout")]
    public Task<IActionResult> SignOut(CancellationToken cancellationToken) =>
        Execute(async () =>
        {
            var token = GetBearerToken();
            await users.SignOutAsync(token, cancellationToken);
            return NoContent();
        });

    [Authorize]
    [HttpPost("change-password")]
    public Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken cancellationToken) =>
        Execute(async () =>
        {
            await users.ChangePasswordAsync(
                ApiUser.Id(User),
                request.CurrentPassword,
                request.NewPassword,
                GetBearerToken(),
                cancellationToken);
            return NoContent();
        });

    [AllowAnonymous]
    [HttpPost("password-reset")]
    public Task<IActionResult> RequestPasswordReset(
        [FromBody] EmailRequest request,
        CancellationToken cancellationToken) =>
        Execute(async () =>
        {
            await users.RequestPasswordResetAsync(request.Email, cancellationToken);
            return Ok(new { message = "If an account exists for this email, a password reset link has been sent." });
        });

    [AllowAnonymous]
    [HttpPost("password-reset/confirm")]
    public Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest request,
        CancellationToken cancellationToken) =>
        Execute(async () =>
        {
            await users.ResetPasswordAsync(request.Token, request.NewPassword, cancellationToken);
            return NoContent();
        });

    [Authorize]
    [HttpPost("phone/send-code")]
    public Task<IActionResult> SendPhoneCode(
        [FromBody] PhoneRequest request,
        CancellationToken cancellationToken) =>
        Execute(async () =>
        {
            await users.SendPhoneVerificationCodeAsync(ApiUser.Id(User), request.Phone, cancellationToken);
            return Accepted();
        });

    [Authorize]
    [HttpPost("phone/verify-code")]
    public Task<IActionResult> VerifyPhoneCode(
        [FromBody] VerifyPhoneRequest request,
        CancellationToken cancellationToken) =>
        Execute(async () =>
        {
            await users.VerifyPhoneCodeAsync(
                ApiUser.Id(User),
                request.Phone,
                request.Code,
                cancellationToken);
            return NoContent();
        });

    private async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try
        {
            return await action();
        }
        catch (UserManagementException exception)
        {
            return Problem(statusCode: exception.StatusCode, detail: exception.Message);
        }
    }

    private string GetBearerToken()
    {
        var authorization = Request.Headers.Authorization.ToString();
        return authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authorization["Bearer ".Length..].Trim()
            : string.Empty;
    }
}

public sealed class RegisterRequest
{
    [Required, EmailAddress, StringLength(320)]
    public required string Email { get; init; }

    [Required, StringLength(128, MinimumLength = 8)]
    public required string Password { get; init; }

    [Required, StringLength(200, MinimumLength = 1)]
    public required string FullName { get; init; }

    [StringLength(40)]
    public string? Phone { get; init; }
}

public sealed class SignInRequest
{
    [Required, EmailAddress, StringLength(320)]
    public required string Email { get; init; }

    [Required, StringLength(128)]
    public required string Password { get; init; }
}

public sealed class EmailRequest
{
    [Required, EmailAddress, StringLength(320)]
    public required string Email { get; init; }
}

public sealed class AccountTokenRequest
{
    [Required, StringLength(256, MinimumLength = 16)]
    public required string Token { get; init; }
}

public sealed class ResetPasswordRequest
{
    [Required, StringLength(256, MinimumLength = 16)]
    public required string Token { get; init; }

    [Required, StringLength(128, MinimumLength = 8)]
    public required string NewPassword { get; init; }
}

public sealed class ChangePasswordRequest
{
    [Required, StringLength(128)]
    public required string CurrentPassword { get; init; }

    [Required, StringLength(128, MinimumLength = 8)]
    public required string NewPassword { get; init; }
}

public sealed class PhoneRequest
{
    [Required, StringLength(16, MinimumLength = 9)]
    public required string Phone { get; init; }
}

public sealed class VerifyPhoneRequest
{
    [Required, StringLength(16, MinimumLength = 9)]
    public required string Phone { get; init; }

    [Required, RegularExpression(@"^\d{6}$")]
    public required string Code { get; init; }
}
