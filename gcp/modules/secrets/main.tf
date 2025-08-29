# Secrets Module
# Google Secret Manager configuration

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Create secrets from configuration (if any provided)
resource "google_secret_manager_secret" "secrets" {
  for_each = nonsensitive(var.secrets)
  
  secret_id = each.key
  project   = var.project_id
  
  labels = merge(var.common_labels, each.value.labels)

  replication {
    auto {}
  }
}

# Create secret versions
resource "google_secret_manager_secret_version" "secret_versions" {
  for_each = nonsensitive(var.secrets)
  
  secret      = google_secret_manager_secret.secrets[each.key].id
  secret_data = each.value.secret_data
}
