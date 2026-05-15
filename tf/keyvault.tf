resource "azurerm_key_vault" "main" {
  name                       = "kv-${var.name_prefix}-${var.environment}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  purge_protection_enabled   = var.environment == "prod" ? true : false
  soft_delete_retention_days = 7
  tags                       = local.common_tags
}

resource "azurerm_key_vault_access_policy" "terraform_deployer" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  secret_permissions = ["Backup", "Delete", "Get", "List", "Purge", "Recover", "Restore", "Set"]
}

resource "azurerm_key_vault_access_policy" "api" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_user_assigned_identity.api.principal_id

  secret_permissions = ["Get", "List"]
}

resource "azurerm_key_vault_access_policy" "web" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_user_assigned_identity.web.principal_id

  secret_permissions = ["Get", "List"]
}

resource "azurerm_key_vault_secret" "sql_connection_string" {
  name         = "sql-connection-string"
  key_vault_id = azurerm_key_vault.main.id
  value        = "Server=tcp:${azurerm_mssql_server.main.fully_qualified_domain_name},1433;Initial Catalog=${azurerm_mssql_database.main.name};Persist Security Info=False;User ID=${var.sql_admin_login};Password=${var.sql_admin_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  depends_on   = [azurerm_key_vault_access_policy.terraform_deployer]
}

# ioredis / Node.js URL format for the web container (rediss:// with SSL)
resource "azurerm_key_vault_secret" "web_redis_url" {
  count        = var.enable_redis_cache ? 1 : 0
  name         = "web-redis-url"
  key_vault_id = azurerm_key_vault.main.id
  value        = "rediss://:${azurerm_redis_cache.main[0].primary_access_key}@${azurerm_redis_cache.main[0].hostname}:${azurerm_redis_cache.main[0].ssl_port}"
  depends_on   = [azurerm_key_vault_access_policy.terraform_deployer]
}

resource "azurerm_key_vault_secret" "google_books_api_key" {
  name         = "google-books-api-key"
  key_vault_id = azurerm_key_vault.main.id
  value        = var.google_books_api_key
  depends_on   = [azurerm_key_vault_access_policy.terraform_deployer]
}

resource "azurerm_key_vault_secret" "web_session_secret" {
  name         = "web-session-secret"
  key_vault_id = azurerm_key_vault.main.id
  value        = var.web_session_secret
  depends_on   = [azurerm_key_vault_access_policy.terraform_deployer]
}

resource "azurerm_key_vault_secret" "api_entraid_client_id" {
  name         = "api-entraid-client-id"
  key_vault_id = azurerm_key_vault.main.id
  value        = var.api_entraid_client_id
  depends_on   = [azurerm_key_vault_access_policy.terraform_deployer]
}

resource "azurerm_key_vault_secret" "api_entraid_client_secret" {
  name         = "api-entraid-client-secret"
  key_vault_id = azurerm_key_vault.main.id
  value        = var.api_entraid_client_secret
  depends_on   = [azurerm_key_vault_access_policy.terraform_deployer]
}

resource "azurerm_key_vault_secret" "api_entraid_audience" {
  name         = "api-entraid-audience"
  key_vault_id = azurerm_key_vault.main.id
  value        = var.api_entraid_audience
  depends_on   = [azurerm_key_vault_access_policy.terraform_deployer]
}

resource "azurerm_key_vault_secret" "web_entraid_client_id" {
  name         = "web-entraid-client-id"
  key_vault_id = azurerm_key_vault.main.id
  value        = var.web_entraid_client_id
  depends_on   = [azurerm_key_vault_access_policy.terraform_deployer]
}

resource "azurerm_key_vault_secret" "web_entraid_scope_base" {
  name         = "web-entraid-scope-base"
  key_vault_id = azurerm_key_vault.main.id
  value        = var.web_entraid_scope_base
  depends_on   = [azurerm_key_vault_access_policy.terraform_deployer]
}

resource "azurerm_key_vault_secret" "app_insights_connection_string" {
  name         = "app-insights-connection-string"
  key_vault_id = azurerm_key_vault.main.id
  value        = azurerm_application_insights.main.connection_string
  depends_on   = [azurerm_key_vault_access_policy.terraform_deployer]
}
