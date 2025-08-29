# Outputs for Functions Module

output "service_account_email" {
  description = "Cloud Functions service account email"
  value       = google_service_account.functions.email
}

output "function_names" {
  description = "List of Cloud Function names"
  value       = local.function_names
}

output "function_urls" {
  description = "Cloud Function URLs (placeholder)"
  value = {
    for name in local.function_names : name => "https://${var.region}-${var.project_id}.cloudfunctions.net/${name}"
  }
}

output "service_accounts" {
  description = "Service account information"
  value = {
    functions = {
      email = google_service_account.functions.email
      name  = google_service_account.functions.name
    }
  }
  sensitive = true
}
