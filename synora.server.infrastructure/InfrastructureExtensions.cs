namespace Synora.Server.Infrastructure;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddSynoraInfrastructure(this IServiceCollection services) =>
        services.AddSingleton<ApiDatabaseProvider>();

    public static IApplicationBuilder UseDatabaseExceptionHandling(this IApplicationBuilder app)
    {
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

        return app;
    }
}
