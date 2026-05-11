resource "azurerm_user_assigned_identity" "api" {
  name                = "id-pocketlibrarian-api-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tags                = local.common_tags
}

resource "azurerm_user_assigned_identity" "web" {
  name                = "id-pocketlibrarian-web-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tags                = local.common_tags
}
