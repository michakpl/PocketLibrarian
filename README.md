# Pocket Librarian API

ASP.NET Core 10 backend for the Pocket Librarian application — a personal book management service secured with Microsoft Entra ID.

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | .NET 10 / C# 14 |
| Framework | ASP.NET Core 10, Minimal APIs |
| CQRS | Mediator by martinothamar |
| ORM | EF Core 10 |
| Auth | Microsoft Entra ID (JWT Bearer) |
| Database | Azure SQL (local: Azure SQL Edge via Docker) |
| Blob storage | Azure Blob Storage (book covers) |
| Cache | Azure Cache for Redis |

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Tilt](https://tilt.dev/) — `brew install tilt` (optional, for local dev loop)

## Local Development

### 1. Clone and restore

```bash
git clone <repo-url>
cd PocketLibrarianAPI
dotnet restore
```

### 2. Configure secrets via user-secrets

Sensitive values must **never** be committed. Set them with `dotnet user-secrets`:

```bash
# Azure AD / Entra ID
dotnet user-secrets set "Auth:Providers:EntraId:ClientId" "<your-client-id>" \
  --project src/PocketLibrarian.API
dotnet user-secrets set "Auth:Providers:EntraId:ClientSecret" "<your-client-secret>" \
  --project src/PocketLibrarian.API
dotnet user-secrets set "Auth:Providers:EntraId:Audience" "<your-audience>" \
  --project src/PocketLibrarian.API

# Database (only needed if not using Docker Compose defaults)
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<connection-string>" \
  --project src/PocketLibrarian.API

# Google Books API (required when the feature is enabled)
dotnet user-secrets set "GoogleBooks:ApiKey" "<your-api-key>" \
  --project src/PocketLibrarian.API
```

### 3. Start the database

```bash
docker compose up db -d
```

This starts Azure SQL Edge on `localhost:1433` with the local dev credentials defined in `docker-compose.yml`.

### 4. Apply EF Core migrations

```bash
dotnet ef database update \
  --project src/PocketLibrarian.Infrastructure \
  --startup-project src/PocketLibrarian.API
```

### 5. Run the API

```bash
dotnet run --project src/PocketLibrarian.API
```

The API is available at `http://localhost:5000`. OpenAPI schema is served at `/openapi/v1.json` in Development.

---

## Configuration Reference

### appsettings.Development.json — non-secret values

The file at `src/PocketLibrarian.API/appsettings.Development.json` contains non-sensitive defaults for local development. Edit it for values that are safe to commit (tenant IDs, client IDs, URLs).

| Key | Description | Source |
|-----|-------------|--------|
| `Auth:Providers:EntraId:Instance` | Entra ID login endpoint | appsettings |
| `Auth:Providers:EntraId:TenantId` | Entra ID tenant GUID | appsettings |
| `Auth:Providers:EntraId:ClientId` | App registration client ID | appsettings |
| `Auth:Providers:EntraId:Audience` | Token audience (usually same as ClientId) | appsettings |
| `Auth:Providers:EntraId:Scopes:book.read` | API scope name | appsettings |
| `ConnectionStrings:DefaultConnection` | SQL Server connection string | appsettings (local dev) / user-secrets |

### Secrets — set via dotnet user-secrets (local) / Azure Key Vault (production)

| Key | Description |
|-----|-------------|
| `Auth:Providers:EntraId:ClientSecret` | Entra ID app registration client secret |
| `GoogleBooks:ApiKey` | Google Books API key |
| `Redis:ConnectionString` | Azure Cache for Redis connection string |
| `AzureStorage:ConnectionString` | Azure Blob Storage connection string |

---

## Docker Compose

`docker-compose.yml` runs two services:

| Service | Port | Description |
|---------|------|-------------|
| `db` | `1433` | Azure SQL Edge (local dev database) |
| `api` | `8080` | Pocket Librarian API (built from `src/PocketLibrarian.API/Dockerfile`) |

Required environment variables for the `api` service (override via environment or `.env` file):

| Variable | Default in compose | Description |
|----------|--------------------|-------------|
| `ASPNETCORE_ENVIRONMENT` | `Development` | ASP.NET Core environment |
| `ASPNETCORE_URLS` | `http://+:8080` | Bind address |
| `ConnectionStrings__DefaultConnection` | Local SQL Edge string | Database connection |
| `Auth__Providers__EntraId__ClientSecret` | _(not set)_ | **Required** — set in environment or `.env` |
| `GoogleBooks__ApiKey` | _(not set)_ | Required when Google Books feature is used |

Run everything:

```bash
docker compose up
```

The API will wait for the database health check to pass before starting.

---

## Tilt (recommended for local development)

[Tilt](https://tilt.dev/) provides live reload on source changes — rebuilds and restarts the API automatically when files under `src/` change.

```bash
tilt up
```

Tilt reads `Tiltfile` which:
- Uses `docker-compose.yml` for service orchestration
- Watches `src/` and `PocketLibrarian.slnx` for changes (ignores `bin/` and `obj/`)
- Labels services: `database` (db), `backend` (api)

To stop:

```bash
tilt down
```

**Tilt does not inject secrets.** Set `Auth__Providers__EntraId__ClientSecret` (and other secrets) in the environment before running `tilt up`, or add an `.env` file alongside `docker-compose.yml` (git-ignored).

---

## EF Core Migrations

```bash
# Add a new migration
dotnet ef migrations add <MigrationName> \
  --project src/PocketLibrarian.Infrastructure \
  --startup-project src/PocketLibrarian.API

# Apply migrations
dotnet ef database update \
  --project src/PocketLibrarian.Infrastructure \
  --startup-project src/PocketLibrarian.API
```

Never write migration files by hand.

---

## Build & Test

```bash
dotnet build
dotnet test
```
