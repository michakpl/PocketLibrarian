terraform {
  required_version = ">= 1.9"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  # Uncomment and populate after creating the state storage account:
  #   az group create -n rg-pocketlibrarian-tfstate -l westeurope
  #   az storage account create -n stpocketlibtf -g rg-pocketlibrarian-tfstate --sku Standard_LRS
  #   az storage container create -n tfstate --account-name stpocketlibtf
  #
  backend "azurerm" {
    resource_group_name  = "rg-pocketlibrarian-tfstate"
    storage_account_name = "stpocketlibtf"
    container_name       = "tfstate"
    key                  = "pocketlibrarian.tfstate"
  }
}

provider "azurerm" {
  features {
  }
}

data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "main" {
  name     = "rg-pocketlibrarian-${var.environment}"
  location = var.location
  tags     = local.common_tags
}
