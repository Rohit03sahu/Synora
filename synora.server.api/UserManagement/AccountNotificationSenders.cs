using System.Net;
using System.Net.Http.Headers;
using System.Net.Mail;
using System.Text;

namespace Synora.Server.Api.UserManagement;

public interface IAccountEmailSender
{
    Task SendVerificationAsync(string email, string fullName, string token, CancellationToken cancellationToken);
    Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken);
}

public interface IAccountSmsSender
{
    Task SendVerificationCodeAsync(string phone, string code, CancellationToken cancellationToken);
}

public sealed class AccountNotificationException(string message, Exception? innerException = null)
    : Exception(message, innerException)
{
}

public sealed class SmtpAccountEmailSender(IConfiguration configuration) : IAccountEmailSender
{
    public Task SendVerificationAsync(
        string email, string fullName, string token, CancellationToken cancellationToken)
    {
        var url = BuildClientUrl("verify-email", token);
        var body = $"Hello {fullName},\n\nConfirm your Synora account by opening this link:\n{url}\n\nThe link expires in 24 hours.";
        return SendAsync(email, "Confirm your Synora account", body, cancellationToken);
    }

    public Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken)
    {
        var url = BuildClientUrl("reset-password", token);
        var body = $"A password reset was requested for your Synora account.\n\nSet a new password using this link:\n{url}\n\nThe link expires in 1 hour. If you did not request this, you can ignore this message.";
        return SendAsync(email, "Reset your Synora password", body, cancellationToken);
    }

    private string BuildClientUrl(string path, string token)
    {
        var baseUrl = configuration["Client:BaseUrl"]?.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(baseUrl) ||
            !Uri.TryCreate(baseUrl, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttps && !uri.IsLoopback))
        {
            throw new AccountNotificationException("Client:BaseUrl must be configured for account email delivery.");
        }

        return $"{baseUrl}/{path}?token={Uri.EscapeDataString(token)}";
    }

    private async Task SendAsync(
        string email, string subject, string body, CancellationToken cancellationToken)
    {
        var host = configuration["Email:SmtpHost"];
        var from = configuration["Email:FromAddress"];
        var port = configuration.GetValue<int?>("Email:SmtpPort") ?? 587;
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from) || port is < 1 or > 65535)
        {
            throw new AccountNotificationException("SMTP account email delivery is not configured.");
        }

        using var message = new MailMessage(from, email, subject, body);
        using var client = new SmtpClient(host, port)
        {
            EnableSsl = true,
            DeliveryMethod = SmtpDeliveryMethod.Network,
        };
        var username = configuration["Email:SmtpUsername"];
        var password = configuration["Email:SmtpPassword"];
        if (!string.IsNullOrWhiteSpace(username) || !string.IsNullOrWhiteSpace(password))
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                throw new AccountNotificationException("Both SMTP username and password must be configured.");
            }

            client.Credentials = new NetworkCredential(username, password);
        }

        try
        {
            await client.SendMailAsync(message, cancellationToken);
        }
        catch (SmtpException exception)
        {
            throw new AccountNotificationException("The account email could not be delivered.", exception);
        }
    }
}

public sealed class TwilioAccountSmsSender(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration) : IAccountSmsSender
{
    public async Task SendVerificationCodeAsync(
        string phone, string code, CancellationToken cancellationToken)
    {
        var accountSid = configuration["Twilio:AccountSid"];
        var authToken = configuration["Twilio:AuthToken"];
        var fromNumber = configuration["Twilio:FromNumber"];
        if (string.IsNullOrWhiteSpace(accountSid) ||
            string.IsNullOrWhiteSpace(authToken) ||
            string.IsNullOrWhiteSpace(fromNumber))
        {
            throw new AccountNotificationException("Twilio SMS delivery is not configured.");
        }

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"https://api.twilio.com/2010-04-01/Accounts/{Uri.EscapeDataString(accountSid)}/Messages.json");
        request.Headers.Authorization = new AuthenticationHeaderValue(
            "Basic",
            Convert.ToBase64String(Encoding.UTF8.GetBytes($"{accountSid}:{authToken}")));
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["From"] = fromNumber,
            ["To"] = phone,
            ["Body"] = $"Your Synora verification code is {code}. It expires in 10 minutes.",
        });

        try
        {
            using var response = await httpClientFactory.CreateClient("Twilio")
                .SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                throw new AccountNotificationException(
                    $"SMS delivery failed with provider status {(int)response.StatusCode}.");
            }
        }
        catch (HttpRequestException exception)
        {
            throw new AccountNotificationException("The SMS provider could not be reached.", exception);
        }
    }
}
