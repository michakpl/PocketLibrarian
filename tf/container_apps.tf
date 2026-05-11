resource "azurerm_container_app_environment" "main" {
  name                       = "cae-pocketlibrarian-${var.environment}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  tags                       = local.common_tags
}

# ── API (ASP.NET Core 10) ─────────────────────────────────────────────────────

resource "azurerm_container_app" "api" {
  name                         = "ca-pocketlibrarian-api-${var.environment}"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.common_tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.api.id]
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.api.id
  }

  secret {
    name                = "sql-connection-string"
    key_vault_secret_id = azurerm_key_vault_secret.sql_connection_string.versionless_id
    identity            = azurerm_user_assigned_identity.api.id
  }

  secret {
    name                = "google-books-api-key"
    key_vault_secret_id = azurerm_key_vault_secret.google_books_api_key.versionless_id
    identity            = azurerm_user_assigned_identity.api.id
  }

  secret {
    name                = "entraid-client-id"
    key_vault_secret_id = azurerm_key_vault_secret.api_entraid_client_id.versionless_id
    identity            = azurerm_user_assigned_identity.api.id
  }

  secret {
    name                = "entraid-client-secret"
    key_vault_secret_id = azurerm_key_vault_secret.api_entraid_client_secret.versionless_id
    identity            = azurerm_user_assigned_identity.api.id
  }

  secret {
    name                = "entraid-audience"
    key_vault_secret_id = azurerm_key_vault_secret.api_entraid_audience.versionless_id
    identity            = azurerm_user_assigned_identity.api.id
  }

  template {
    min_replicas = 0
    max_replicas = 3

    container {
      name   = "api"
      image  = "${azurerm_container_registry.main.login_server}/pocketlibrarian-api:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = var.environment == "prod" ? "Production" : "Development"
      }
      env {
        name        = "ConnectionStrings__DefaultConnection"
        secret_name = "sql-connection-string"
      }
      env {
        name        = "GoogleBooks__ApiKey"
        secret_name = "google-books-api-key"
      }
      env {
        name        = "Auth__Providers__EntraId__ClientId"
        secret_name = "entraid-client-id"
      }
      env {
        name        = "Auth__Providers__EntraId__ClientSecret"
        secret_name = "entraid-client-secret"
      }
      env {
        name        = "Auth__Providers__EntraId__Audience"
        secret_name = "entraid-audience"
      }
      env {
        name  = "ApplicationInsights__ConnectionString"
        value = azurerm_application_insights.main.connection_string
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 8080
    transport        = "http"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  depends_on = [
    azurerm_role_assignment.api_acr_pull,
    azurerm_key_vault_access_policy.api,
  ]
}

# ── Web (Next.js 16.2) ────────────────────────────────────────────────────────

resource "azurerm_container_app" "web" {
  name                         = "ca-pocketlibrarian-web-${var.environment}"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.common_tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.web.id]
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.web.id
  }

  secret {
    name                = "session-secret"
    key_vault_secret_id = azurerm_key_vault_secret.web_session_secret.versionless_id
    identity            = azurerm_user_assigned_identity.web.id
  }

  secret {
    name                = "entraid-client-id"
    key_vault_secret_id = azurerm_key_vault_secret.web_entraid_client_id.versionless_id
    identity            = azurerm_user_assigned_identity.web.id
  }

  secret {
    name                = "entraid-scope-base"
    key_vault_secret_id = azurerm_key_vault_secret.web_entraid_scope_base.versionless_id
    identity            = azurerm_user_assigned_identity.web.id
  }

  dynamic "secret" {
    for_each = var.enable_redis_cache ? [1] : []
    content {
      name                = "redis-url"
      key_vault_secret_id = azurerm_key_vault_secret.web_redis_url[0].versionless_id
      identity            = azurerm_user_assigned_identity.web.id
    }
  }

  template {
    min_replicas = 0
    max_replicas = 3

    container {
      name   = "web"
      image  = "${azurerm_container_registry.main.login_server}/pocketlibrarian-web:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "NODE_ENV"
        value = var.environment == "prod" ? "production" : "development"
      }
      env {
        name  = "API_URL"
        value = "https://${azurerm_container_app.api.ingress[0].fqdn}"
      }
      env {
        name        = "SESSION_SECRET"
        secret_name = "session-secret"
      }
      env {
        name  = "REDIS_ENABLED"
        value = tostring(var.enable_redis_cache)
      }
      dynamic "env" {
        for_each = var.enable_redis_cache ? [1] : []
        content {
          name        = "REDIS_URL"
          secret_name = "redis-url"
        }
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    transport        = "http"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  depends_on = [
    azurerm_role_assignment.web_acr_pull,
    azurerm_key_vault_access_policy.web,
    azurerm_container_app.api,
  ]
}
