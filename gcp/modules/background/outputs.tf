# Outputs for Background Processing Module

output "topic_names" {
  description = "Pub/Sub topic names"
  value = [
    google_pubsub_topic.email_notifications.name,
    google_pubsub_topic.data_processing.name
  ]
}

output "job_names" {
  description = "Cloud Scheduler job names"
  value = [
    google_cloud_scheduler_job.daily_digest.name,
    google_cloud_scheduler_job.weekly_report.name
  ]
}
