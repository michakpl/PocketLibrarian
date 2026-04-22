# Build stage — restore dependencies first for layer caching
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["PocketLibrarian.slnx", "."]
COPY ["src/PocketLibrarian.API/PocketLibrarian.API.csproj",                 "src/PocketLibrarian.API/"]
COPY ["src/PocketLibrarian.Application/PocketLibrarian.Application.csproj", "src/PocketLibrarian.Application/"]
COPY ["src/PocketLibrarian.Domain/PocketLibrarian.Domain.csproj",           "src/PocketLibrarian.Domain/"]
COPY ["src/PocketLibrarian.Infrastructure/PocketLibrarian.Infrastructure.csproj", "src/PocketLibrarian.Infrastructure/"]

RUN dotnet restore "src/PocketLibrarian.API/PocketLibrarian.API.csproj"

COPY . .

RUN dotnet publish "src/PocketLibrarian.API/PocketLibrarian.API.csproj" \
    -c Release \
    -o /app/publish \
    --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080

COPY --from=build /app/publish .

RUN chown -R 1000:1000 /app
USER 1000

ENTRYPOINT ["dotnet", "PocketLibrarian.API.dll"]
