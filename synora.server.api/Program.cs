using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Npgsql;
using Synora.Server.Api;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<ApiDatabaseProvider>();

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
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (DatabaseNotConfiguredException)
    {
        context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
        await context.Response.WriteAsJsonAsync(new
        {
            title = "Database is not configured",
            detail = "Configure ConnectionStrings:Postgres to enable this API.",
            status = StatusCodes.Status503ServiceUnavailable,
        });
    }
});

app.MapGet("/health", async (ApiDatabaseProvider database, CancellationToken cancellationToken) =>
{
    try
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand("SELECT 1", connection);
        await command.ExecuteScalarAsync(cancellationToken);
        return Results.Ok(new { status = "ok", database = "connected" });
    }
    catch (Exception exception) when (exception is NpgsqlException or DatabaseNotConfiguredException)
    {
        return Results.Problem(
            title: exception is DatabaseNotConfiguredException
                ? "Database is not configured"
                : "Database unavailable",
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});

var api = app.MapGroup("/api").RequireAuthorization();
api.MapProfileEndpoints();
api.MapPatientDataEndpoints();
api.MapDashboardEndpoints();

app.Run();

public partial class Program { }
