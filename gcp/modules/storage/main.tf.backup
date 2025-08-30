# Cloud Storage Module
# File uploads, backups, and static assets

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Storage bucket for user uploads
resource "google_storage_bucket" "uploads" {
  name          = "${var.service_prefix}-uploads"
  location      = var.region
  project       = var.project_id
  storage_class = var.storage_class
  
  labels = var.common_labels

  versioning {
    enabled = var.versioning_enabled
  }

  lifecycle_rule {
    condition {
      age = var.lifecycle_age_days
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  cors {
    origin          = ["https://sfpack1703.com", ""]
    method          = ["GET", "POST", "PUT"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# Storage bucket for backups
resource "google_storage_bucket" "backups" {
  name          = "${var.service_prefix}-backups"
  location      = var.region
  project       = var.project_id
  storage_class = "COLDLINE"
  
  labels = merge(var.common_labels, {
    type = "backup"
  })

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }
}
