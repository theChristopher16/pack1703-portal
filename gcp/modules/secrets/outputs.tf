# Outputs for Secrets Module

output "secret_names" {
  description = "List of created secret names"
  value       = [for secret in google_secret_manager_secret.secrets : secret.secret_id]
}

output "secret_ids" {
  description = "Map of secret names to full resource IDs"
  value = {
    for name, secret in google_secret_manager_secret.secrets : name => secret.id
  }
  sensitive = true
}
