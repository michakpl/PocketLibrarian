resource "azurerm_redis_cache" "main" {
  count               = var.enable_redis_cache ? 1 : 0
  name                = "redis-${var.name_prefix}-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = 0
  family              = "C"
  sku_name            = "Basic"
  minimum_tls_version = "1.2"

  redis_configuration {}

  tags = local.common_tags
}
