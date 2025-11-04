# Variables for GCP Infrastructure
# Pack 1703 RSVP System

# Project Configuration
variable "project_id" {
  description = "GCP Project ID"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project_id))
    error_message = "Project ID must be 6-30 characters, start with lowercase letter, and contain only lowercase letters, numbers, and hyphens."
  }
}

variable "project_name" {
  description = "Human-readable project name"
  type        = string
  default     = "pack1703-rsvp"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "region" {
  description = "GCP region for resources"
  type        = string
  default     = "us-central1"
}

# Domain Configuration
variable "domains" {
  description = "List of domains to configure for Firebase Hosting"
  type        = list(string)
  default     = ["sfpack1703.com"]
}

# Billing Configuration
variable "billing_account_id" {
  description = "GCP Billing Account ID (optional, for billing account IAM grants)"
  type        = string
  default     = null
}

# Firestore Configuration
variable "firestore_location" {
  description = "Firestore database location"
  type        = string
  default     = "us-central1"
  validation {
    condition = contains([
      "us-central1", "us-east1", "us-east4", "us-west2", "us-west3", "us-west4",
      "europe-west1", "europe-west2", "europe-west3", "asia-east1", "asia-northeast1", "asia-south1"
    ], var.firestore_location)
    error_message = "Firestore location must be a valid multi-region or regional location."
  }
}

# Cloud Functions Configuration
variable "function_runtime" {
  description = "Runtime for Cloud Functions"
  type        = string
  default     = "nodejs20"
}

variable "function_memory" {
  description = "Memory allocation for Cloud Functions"
  type        = string
  default     = "256Mi"
  validation {
    condition = contains([
      "128Mi", "256Mi", "512Mi", "1Gi", "2Gi", "4Gi", "8Gi"
    ], var.function_memory)
    error_message = "Function memory must be a valid Cloud Functions memory allocation."
  }
}

variable "function_timeout" {
  description = "Timeout for Cloud Functions in seconds"
  type        = number
  default     = 60
  validation {
    condition     = var.function_timeout >= 1 && var.function_timeout <= 540
    error_message = "Function timeout must be between 1 and 540 seconds."
  }
}

variable "function_min_instances" {
  description = "Minimum instances for Cloud Functions"
  type        = number
  default     = 0
}

variable "function_max_instances" {
  description = "Maximum instances for Cloud Functions"
  type        = number
  default     = 100
}

# Storage Configuration
variable "storage_class" {
  description = "Storage class for Cloud Storage buckets"
  type        = string
  default     = "STANDARD"
  validation {
    condition = contains([
      "STANDARD", "NEARLINE", "COLDLINE", "ARCHIVE"
    ], var.storage_class)
    error_message = "Storage class must be STANDARD, NEARLINE, COLDLINE, or ARCHIVE."
  }
}

variable "storage_lifecycle_age_days" {
  description = "Days after which to move objects to cheaper storage"
  type        = number
  default     = 30
}

variable "storage_versioning_enabled" {
  description = "Enable versioning for storage buckets"
  type        = bool
  default     = true
}

# Background Processing Configuration
variable "scheduler_timezone" {
  description = "Timezone for Cloud Scheduler jobs"
  type        = string
  default     = "America/New_York"
}

# Security Configuration
variable "app_check_enabled" {
  description = "Enable Firebase App Check"
  type        = bool
  default     = true
}

# Monitoring Configuration
variable "notification_email" {
  description = "Email address for monitoring alerts"
  type        = string
  default     = "cubmaster@sfpack1703.com"
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.notification_email))
    error_message = "Notification email must be a valid email address."
  }
}

variable "cost_budget_amount" {
  description = "Monthly budget amount for cost alerts (USD)"
  type        = number
  default     = 5.00
  validation {
    condition     = var.cost_budget_amount > 0
    error_message = "Budget amount must be greater than 0."
  }
}

# Secrets Configuration
variable "secrets_config" {
  description = "Configuration for secrets in Secret Manager"
  type = map(object({
    secret_data = string
    labels      = map(string)
  }))
  default = {}
  sensitive = true
}

# Environment-specific defaults
locals {
  environment_defaults = {
    dev = {
      function_min_instances = 0
      function_max_instances = 10
      cost_budget_amount     = 2.00
      app_check_enabled      = false
    }
    staging = {
      function_min_instances = 0
      function_max_instances = 50
      cost_budget_amount     = 3.00
      app_check_enabled      = true
    }
    prod = {
      function_min_instances = 1
      function_max_instances = 100
      cost_budget_amount     = 5.00
      app_check_enabled      = true
    }
  }
}

# Apply environment-specific defaults
variable "use_environment_defaults" {
  description = "Use environment-specific default values"
  type        = bool
  default     = true
}

# Common resource tags/labels
variable "additional_labels" {
  description = "Additional labels to apply to all resources"
  type        = map(string)
  default     = {}
}

# Feature flags
variable "enable_monitoring" {
  description = "Enable monitoring and alerting"
  type        = bool
  default     = true
}

variable "enable_backup" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "enable_audit_logging" {
  description = "Enable audit logging"
  type        = bool
  default     = true
}
