namespace Synora.Server.Api.UserManagement;

public static class UserManagementExtensions
{
    public static IServiceCollection AddUserManagement(this IServiceCollection services)
    {
        services.AddScoped<UserManagementService>();
        services.AddScoped<IAccountEmailSender, SmtpAccountEmailSender>();
        services.AddScoped<IAccountSmsSender, TwilioAccountSmsSender>();
        services.AddHttpClient("Twilio", client => client.Timeout = TimeSpan.FromSeconds(15));
        return services;
    }
}
