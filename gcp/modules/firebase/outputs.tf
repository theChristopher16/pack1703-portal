# Outputs for Firebase Module

output "project_id" {
  description = "Firebase project ID"
  value       = google_firebase_project.default.project
}

output "web_app_id" {
  description = "Firebase web app ID"
  value       = google_firebase_web_app.sfpack1703.app_id
}

output "firebase_config" {
  description = "Firebase configuration for client applications"
  value = {
    apiKey            = data.google_firebase_web_app_config.sfpack1703.api_key
    authDomain        = data.google_firebase_web_app_config.sfpack1703.auth_domain
    projectId         = var.project_id
    storageBucket     = data.google_firebase_web_app_config.sfpack1703.storage_bucket
    messagingSenderId = data.google_firebase_web_app_config.sfpack1703.messaging_sender_id
    appId             = google_firebase_web_app.sfpack1703.app_id
    measurementId     = data.google_firebase_web_app_config.sfpack1703.measurement_id
  }
  sensitive = true
}

output "hosting_sites" {
  description = "Firebase Hosting site information"
  value = {
    for domain in var.domains : domain => {
      site_id      = google_firebase_hosting_site.sites[domain].site_id
      default_url  = google_firebase_hosting_site.sites[domain].default_url
      custom_domain = domain
    }
  }
}

output "auth_config" {
  description = "Firebase Authentication configuration"
  value = {
    authorized_domains = google_identity_platform_config.auth.authorized_domains
    email_enabled     = true
    password_required = true
  }
}

output "app_check_config" {
  description = "Firebase App Check configuration"
  value = {
    enabled      = var.environment == "prod"
    recaptcha_v3 = var.environment == "prod"
    note        = "App Check configuration must be done via Firebase console"
  }
  sensitive = true
}

output "service_account_email" {
  description = "Firebase Admin service account email"
  value       = google_service_account.firebase_admin.email
}

output "admin_key_secret_name" {
  description = "Secret Manager secret name for Firebase Admin key"
  value       = google_secret_manager_secret.firebase_admin_key.secret_id
}
