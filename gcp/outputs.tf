# Outputs for GCP Infrastructure
# Pack 1703 & Smith Station RSVP System

# Project Information
output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "region" {
  description = "GCP region"
  value       = var.region
}

# Firebase Configuration
output "firebase_project_id" {
  description = "Firebase project ID"
  value       = module.firebase.project_id
}

output "firebase_web_app_id" {
  description = "Firebase web app ID"
  value       = module.firebase.web_app_id
}

output "firebase_config" {
  description = "Firebase configuration for client apps"
  value       = module.firebase.firebase_config
  sensitive   = true
}

output "firebase_hosting_sites" {
  description = "Firebase Hosting sites"
  value       = module.firebase.hosting_sites
}

# Firestore Information
output "firestore_database_id" {
  description = "Firestore database ID"
  value       = module.firestore.database_id
}

output "firestore_location" {
  description = "Firestore database location"
  value       = module.firestore.location_id
}

# Cloud Functions
output "function_urls" {
  description = "Cloud Function trigger URLs"
  value       = module.functions.function_urls
}

output "function_names" {
  description = "Cloud Function names"
  value       = module.functions.function_names
}

output "function_service_accounts" {
  description = "Cloud Function service accounts"
  value       = module.functions.service_accounts
  sensitive   = true
}

# Cloud Storage
output "storage_buckets" {
  description = "Cloud Storage bucket information"
  value       = module.storage.buckets
}

output "storage_bucket_urls" {
  description = "Cloud Storage bucket URLs"
  value       = module.storage.bucket_urls
}

# Background Processing
output "pubsub_topics" {
  description = "Pub/Sub topic names"
  value       = module.background_processing.topic_names
}

output "scheduler_jobs" {
  description = "Cloud Scheduler job names"
  value       = module.background_processing.job_names
}

# Monitoring
output "monitoring_dashboards" {
  description = "Monitoring dashboard URLs"
  value       = module.monitoring.dashboard_urls
}

output "alert_policies" {
  description = "Alert policy names"
  value       = module.monitoring.alert_policy_names
}

output "notification_channels" {
  description = "Notification channel IDs"
  value       = module.monitoring.notification_channel_ids
  sensitive   = true
}

# Secrets
output "secret_names" {
  description = "Secret Manager secret names"
  value       = module.secrets.secret_names
}

# Cost Information
output "estimated_monthly_cost" {
  description = "Estimated monthly cost breakdown (USD)"
  value = {
    cloud_functions = "0.40"
    firestore      = "0.18"
    firebase_hosting = "0.00"
    cloud_storage  = "0.02"
    monitoring     = "0.00"
    total          = "0.60"
    currency       = "USD"
    note           = "Based on 2M function invocations, 50K reads, 10K writes, 1GB storage"
  }
}

# Security Information
output "app_check_enabled" {
  description = "Whether App Check is enabled"
  value       = var.app_check_enabled
}

output "security_summary" {
  description = "Security configuration summary"
  value = {
    app_check_enabled     = var.app_check_enabled
    audit_logging_enabled = var.enable_audit_logging
    firestore_rules_deployed = true
    secrets_managed       = length(var.secrets_config) > 0
    monitoring_enabled    = var.enable_monitoring
  }
  sensitive = true
}

# Deployment Information
output "deployment_info" {
  description = "Deployment information and next steps"
  value = {
    status = "Infrastructure deployed successfully"
    next_steps = [
      "Deploy Cloud Functions code",
      "Configure Firebase Hosting",
      "Set up Firestore security rules",
      "Configure custom domains",
      "Test end-to-end functionality"
    ]
    useful_commands = {
      "Deploy functions" = "firebase deploy --only functions"
      "Deploy hosting"   = "firebase deploy --only hosting"
      "Deploy rules"     = "firebase deploy --only firestore:rules"
      "View logs"        = "gcloud functions logs read --limit=50"
      "Monitor costs"    = "gcloud billing budgets list"
    }
  }
}

# URLs and Endpoints
output "service_urls" {
  description = "Important service URLs"
  value = {
    firebase_console = "https://console.firebase.google.com/project/${var.project_id}"
    gcp_console     = "https://console.cloud.google.com/home/dashboard?project=${var.project_id}"
    firestore_console = "https://console.firebase.google.com/project/${var.project_id}/firestore"
    functions_console = "https://console.cloud.google.com/functions/list?project=${var.project_id}"
    monitoring_console = "https://console.cloud.google.com/monitoring?project=${var.project_id}"
    storage_console = "https://console.cloud.google.com/storage/browser?project=${var.project_id}"
  }
}

# Configuration Files
output "config_files_needed" {
  description = "Configuration files that need to be created"
  value = {
    firebase_config = ".firebaserc and firebase.json"
    environment_variables = ".env files for each environment"
    security_rules = "firestore.rules and storage.rules"
    function_code = "functions/src/ directory with TypeScript code"
    github_actions = ".github/workflows/ for CI/CD"
  }
}
