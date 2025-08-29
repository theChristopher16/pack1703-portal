# Outputs for Storage Module

output "buckets" {
  description = "Storage bucket information"
  value = {
    uploads = {
      name = google_storage_bucket.uploads.name
      url  = google_storage_bucket.uploads.url
    }
    backups = {
      name = google_storage_bucket.backups.name
      url  = google_storage_bucket.backups.url
    }
  }
}

output "bucket_names" {
  description = "List of bucket names"
  value = [
    google_storage_bucket.uploads.name,
    google_storage_bucket.backups.name
  ]
}

output "bucket_urls" {
  description = "Storage bucket URLs"
  value = {
    uploads = google_storage_bucket.uploads.url
    backups = google_storage_bucket.backups.url
  }
}
