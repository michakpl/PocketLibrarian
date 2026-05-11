variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "westeurope"
}

variable "name_prefix" {
  description = "Short unique prefix for globally scoped resource names (max 8 chars, lowercase alphanumeric)"
  type        = string
  default     = "pocketlib"

  validation {
    condition     = length(var.name_prefix) <= 8 && can(regex("^[a-z0-9]+$", var.name_prefix))
    error_message = "name_prefix must be lowercase alphanumeric and at most 8 characters."
  }
}

# ── SQL ──────────────────────────────────────────────────────────────────────

variable "sql_admin_login" {
  description = "SQL Server administrator login"
  type        = string
  default     = "sqladmin"
}

variable "sql_admin_password" {
  description = "SQL Server administrator password (min 8 chars, upper/lower/digit/special)"
  type        = string
  sensitive   = true
}

# ── Entra ID ─────────────────────────────────────────────────────────────────

variable "api_entraid_client_id" {
  description = "Entra ID API app registration client ID"
  type        = string
}

variable "api_entraid_client_secret" {
  description = "Entra ID API app registration client secret"
  type        = string
  sensitive   = true
}

variable "api_entraid_audience" {
  description = "Entra ID API app registration audience"
  type        = string
  sensitive   = true
}

variable "web_entraid_client_id" {
  description = "Entra ID Web app registration client ID"
  type        = string
}

variable "web_entraid_scope_base" {
  description = "Entra ID Web app registration scope base"
  type        = string
}

# ── External APIs & Auth ──────────────────────────────────────────────────────

variable "google_books_api_key" {
  description = "Google Books API key"
  type        = string
  sensitive   = true
}

variable "web_session_secret" {
  description = "Web session encryption key (generate with: openssl rand -base64 32)"
  type        = string
  sensitive   = true
}

# ── Feature flags ─────────────────────────────────────────────────────────────

variable "enable_redis_cache" {
  description = "Create Azure Cache for Redis and wire it to both container apps. Set to false to skip Redis (saves cost for dev/hobby deployments)."
  type        = bool
  default     = false
}

# ── Locals ───────────────────────────────────────────────────────────────────

locals {
  common_tags = {
    Application = "PocketLibrarian"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
