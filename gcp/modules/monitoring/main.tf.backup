# Monitoring Module
# Cloud Monitoring dashboards and alerts

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Notification channel for email alerts
resource "google_monitoring_notification_channel" "email" {
  display_name = "Email Notifications"
  type         = "email"
  project      = var.project_id
  
  labels = {
    email_address = var.notification_email
  }
}

# Alert policy for high error rate
resource "google_monitoring_alert_policy" "high_error_rate" {
  display_name = "High Error Rate"
  project      = var.project_id
  combiner     = "OR"
  
  conditions {
    display_name = "Cloud Function Error Rate"
    
    condition_threshold {
      filter          = "resource.type=\"cloud_function\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.01  # 1% error rate
      duration        = "300s"
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }
  
  notification_channels = [google_monitoring_notification_channel.email.id]
}

# Alert policy for high latency
resource "google_monitoring_alert_policy" "high_latency" {
  display_name = "High Latency"
  project      = var.project_id
  combiner     = "OR"
  
  conditions {
    display_name = "Cloud Function High Latency"
    
    condition_threshold {
      filter          = "resource.type=\"cloud_function\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1000  # 1 second
      duration        = "300s"
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_PERCENTILE_95"
      }
    }
  }
  
  notification_channels = [google_monitoring_notification_channel.email.id]
}

# Budget alert
resource "google_billing_budget" "monthly_budget" {
  billing_account = data.google_billing_account.account.id
  display_name    = "${var.project_name} Monthly Budget"
  
  budget_filter {
    projects = ["projects/${var.project_id}"]
  }
  
  amount {
    specified_amount {
      currency_code = "USD"
      units         = tostring(floor(var.cost_budget_amount))
      nanos         = floor((var.cost_budget_amount - floor(var.cost_budget_amount)) * 1000000000)
    }
  }
  
  threshold_rules {
    threshold_percent = 0.8
  }
  
  threshold_rules {
    threshold_percent = 1.0
  }
}

# Get billing account
data "google_billing_account" "account" {
  billing_account = data.google_project.current.billing_account
}

data "google_project" "current" {
  project_id = var.project_id
}
