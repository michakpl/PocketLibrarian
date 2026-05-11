resource "azurerm_mssql_server" "main" {
  name                         = "sql-pocketlibrarian-${var.environment}"
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  version                      = "12.0"
  administrator_login          = var.sql_admin_login
  administrator_login_password = var.sql_admin_password
  minimum_tls_version          = "1.2"

  azuread_administrator {
    login_username = "AzureAD Admin"
    object_id      = data.azurerm_client_config.current.object_id
  }

  tags = local.common_tags
}

resource "azurerm_mssql_database" "main" {
  name                 = "sqldb-pocketlibrarian-${var.environment}"
  server_id            = azurerm_mssql_server.main.id
  collation            = "Latin1_General_100_CI_AS_SC_UTF8"
  sku_name             = "S0"
  max_size_gb          = 2
  tags                 = local.common_tags
  storage_account_type = "Local"
}

resource "azurerm_mssql_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
