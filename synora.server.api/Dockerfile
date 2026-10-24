FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

COPY synora.server.infrastructure/Synora.Server.Infrastructure.csproj synora.server.infrastructure/
COPY synora.server.api/Synora.Server.Api.csproj synora.server.api/
RUN dotnet restore synora.server.api/Synora.Server.Api.csproj

COPY synora.server.infrastructure/ synora.server.infrastructure/
COPY synora.server.api/ synora.server.api/
RUN dotnet publish synora.server.api/Synora.Server.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=build --chown=app:app /app/publish/ ./
USER app
EXPOSE 5247
ENTRYPOINT ["dotnet", "Synora.Server.Api.dll"]
