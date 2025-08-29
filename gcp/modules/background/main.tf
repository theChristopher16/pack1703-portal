# Background Processing Module
# Pub/Sub topics and Cloud Scheduler jobs

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Pub/Sub topic for email notifications
resource "google_pubsub_topic" "email_notifications" {
  name    = "${var.service_prefix}-email-notifications"
  project = var.project_id
  
  labels = var.common_labels
}

# Pub/Sub topic for data processing
resource "google_pubsub_topic" "data_processing" {
  name    = "${var.service_prefix}-data-processing"
  project = var.project_id
  
  labels = var.common_labels
}

# Cloud Scheduler job for daily digest
resource "google_cloud_scheduler_job" "daily_digest" {
  name      = "${var.service_prefix}-daily-digest"
  project   = var.project_id
  region    = var.region
  schedule  = "0 8 * * *"  # 8 AM daily
  time_zone = var.scheduler_timezone

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-${var.project_id}.cloudfunctions.net/dailyDigest"
    
    headers = {
      "Content-Type" = "application/json"
    }
    
    body = base64encode(jsonencode({
      type = "daily_digest"
    }))
  }
}

# Cloud Scheduler job for weekly reports
resource "google_cloud_scheduler_job" "weekly_report" {
  name      = "${var.service_prefix}-weekly-report"
  project   = var.project_id
  region    = var.region
  schedule  = "0 9 * * 1"  # 9 AM every Monday
  time_zone = var.scheduler_timezone

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-${var.project_id}.cloudfunctions.net/weeklyReport"
    
    headers = {
      "Content-Type" = "application/json"
    }
    
    body = base64encode(jsonencode({
      type = "weekly_report"
    }))
  }
}
