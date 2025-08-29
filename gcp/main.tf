# Pack 1703 & Smith Station - GCP Infrastructure
# Complete serverless architecture using Firebase and Cloud Functions

terraform {
  required_version = ">= 1.6"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

# Provider configuration
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
  
  # Set quota project for Identity Platform API
  user_project_override = true
  billing_project       = var.project_id
}

# Local values for consistent naming
locals {
  common_labels = {
    project     = "pack1703-rsvp"
    environment = var.environment
    managed_by  = "opentofu"
    created_by  = "pack1703-migration"
  }
  
  # Service naming convention
  service_prefix = "${var.project_name}-${var.environment}"
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "firebase.googleapis.com",
    "firestore.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudscheduler.googleapis.com",
    "pubsub.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",

    "identitytoolkit.googleapis.com"
  ])

  service            = each.key
  disable_on_destroy = false
}

# Firebase project configuration
module "firebase" {
  source = "./modules/firebase"
  
  project_id     = var.project_id
  project_name   = var.project_name
  environment    = var.environment
  common_labels  = local.common_labels
  
  # Domain configuration
  domains = var.domains
  
  depends_on = [google_project_service.required_apis]
}

# Firestore database and security rules
module "firestore" {
  source = "./modules/firestore"
  
  project_id    = var.project_id
  environment   = var.environment
  common_labels = local.common_labels
  
  # Database configuration
  location_id     = var.firestore_location
  delete_protection_state = var.environment == "prod" ? "DELETE_PROTECTION_ENABLED" : "DELETE_PROTECTION_DISABLED"
  
  depends_on = [google_project_service.required_apis]
}

# Cloud Functions for API endpoints
module "functions" {
  source = "./modules/functions"
  
  project_id      = var.project_id
  project_name    = var.project_name
  environment     = var.environment
  region          = var.region
  common_labels   = local.common_labels
  service_prefix  = local.service_prefix
  
  # Function configuration
  runtime                = var.function_runtime
  memory                 = var.function_memory
  timeout                = var.function_timeout
  min_instances         = var.function_min_instances
  max_instances         = var.function_max_instances
  
  # Security configuration
  app_check_enabled = var.app_check_enabled
  
  depends_on = [
    google_project_service.required_apis,
    module.firestore
  ]
}

# Cloud Storage for file uploads and backups
module "storage" {
  source = "./modules/storage"
  
  project_id      = var.project_id
  project_name    = var.project_name
  environment     = var.environment
  region          = var.region
  common_labels   = local.common_labels
  service_prefix  = local.service_prefix
  
  # Storage configuration
  storage_class          = var.storage_class
  lifecycle_age_days     = var.storage_lifecycle_age_days
  versioning_enabled     = var.storage_versioning_enabled
  
  depends_on = [google_project_service.required_apis]
}

# Background processing with Pub/Sub and Cloud Scheduler
module "background_processing" {
  source = "./modules/background"
  
  project_id      = var.project_id
  project_name    = var.project_name
  environment     = var.environment
  region          = var.region
  common_labels   = local.common_labels
  service_prefix  = local.service_prefix
  
  # Scheduler configuration
  scheduler_timezone = var.scheduler_timezone
  
  # Function URLs for scheduled tasks
  function_urls = module.functions.function_urls
  
  depends_on = [
    google_project_service.required_apis,
    module.functions
  ]
}

# Monitoring and alerting
module "monitoring" {
  source = "./modules/monitoring"
  
  project_id      = var.project_id
  project_name    = var.project_name
  environment     = var.environment
  common_labels   = local.common_labels
  
  # Monitoring configuration
  notification_email = var.notification_email
  cost_budget_amount = var.cost_budget_amount
  
  # Resource references for monitoring
  function_names = module.functions.function_names
  storage_buckets = module.storage.bucket_names
  
  depends_on = [
    google_project_service.required_apis,
    module.functions,
    module.storage
  ]
}

# Secret Manager for sensitive configuration
module "secrets" {
  source = "./modules/secrets"
  
  project_id     = var.project_id
  environment    = var.environment
  common_labels  = local.common_labels
  
  # Secrets configuration
  secrets = var.secrets_config
  
  depends_on = [google_project_service.required_apis]
}
