using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Synora.Server.Api;
using Synora.Server.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSynoraInfrastructure();

builder.Services.AddHttpClient(SupabaseTokenAuthenticationHandler.HttpClientName);
builder.Services
    .AddAuthentication(SupabaseTokenAuthenticationHandler.SchemeName)
    .AddScheme<AuthenticationSchemeOptions, SupabaseTokenAuthenticationHandler>(
        SupabaseTokenAuthenticationHandler.SchemeName, _ => { });
builder.Services.AddAuthorization();

var configuredOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddPolicy("client", policy =>
{
    var origins = configuredOrigins.Length > 0
        ? configuredOrigins
        : ["http://localhost:3000"];
    policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
}));
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

var app = builder.Build();

app.UseCors("client");
app.UseAuthentication();
app.UseAuthorization();
app.UseDatabaseExceptionHandling();
app.MapGet("/health", async (
    ApiDatabaseProvider database,
    CancellationToken cancellationToken) =>
{
    var health = await DatabaseHealthService.CheckAsync(database, cancellationToken);
    return health.IsConnected
        ? Results.Ok(new { status = "ok", database = "connected" })
        : Results.Problem(
            title: health.IsConfigured ? "Database unavailable" : "Database is not configured",
            statusCode: StatusCodes.Status503ServiceUnavailable);
});

var api = app.MapGroup("/api").RequireAuthorization();
api.MapProfileEndpoints();
api.MapPatientDataEndpoints();
api.MapLabOcrEndpoints();
api.MapDashboardEndpoints();

app.Run();

public partial class Program { }
