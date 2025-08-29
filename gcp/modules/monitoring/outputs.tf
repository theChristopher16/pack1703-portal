# Outputs for Monitoring Module

output "notification_channel_ids" {
  description = "Notification channel IDs"
  value = [
    google_monitoring_notification_channel.email.id
  ]
  sensitive = true
}

output "alert_policy_names" {
  description = "Alert policy names"
  value = [
    google_monitoring_alert_policy.high_error_rate.display_name,
    google_monitoring_alert_policy.high_latency.display_name
  ]
}

output "dashboard_urls" {
  description = "Monitoring dashboard URLs"
  value = {
    functions = "https://console.cloud.google.com/functions/list?project=${var.project_id}"
    monitoring = "https://console.cloud.google.com/monitoring?project=${var.project_id}"
    logs = "https://console.cloud.google.com/logs?project=${var.project_id}"
  }
}

output "budget_name" {
  description = "Budget name"
  value = google_billing_budget.monthly_budget.display_name
}
