output "resource_group_name" {
  description = "Resource group name"
  value       = azurerm_resource_group.main.name
}

output "container_registry_login_server" {
  description = "ACR login server — use this as the image registry in CI/CD"
  value       = azurerm_container_registry.main.login_server
}

output "api_fqdn" {
  description = "API Container App public URL — use as NEXT_PUBLIC_API_URL Docker build arg"
  value       = "https://${azurerm_container_app.api.ingress[0].fqdn}"
}

output "web_fqdn" {
  description = "Web Container App public URL"
  value       = "https://${azurerm_container_app.web.ingress[0].fqdn}"
}

output "sql_server_fqdn" {
  description = "SQL Server FQDN for manual access or migration scripts"
  value       = azurerm_mssql_server.main.fully_qualified_domain_name
}

output "sql_database_name" {
  description = "SQL database name"
  value       = azurerm_mssql_database.main.name
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}

output "application_insights_connection_string" {
  description = "Application Insights connection string (sensitive)"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}

output "api_managed_identity_client_id" {
  description = "Client ID of the API managed identity — use for Managed Identity DB auth in CI/CD"
  value       = azurerm_user_assigned_identity.api.client_id
}
