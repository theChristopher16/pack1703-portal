output "database_id" {
  description = "Firestore database ID"
  value       = google_firestore_database.database.name
}

output "location_id" {
  description = "Firestore database location"
  value       = google_firestore_database.database.location_id
}

output "database_type" {
  description = "Firestore database type"
  value       = google_firestore_database.database.type
}

output "point_in_time_recovery_enabled" {
  description = "Whether point-in-time recovery is enabled"
  value       = google_firestore_database.database.point_in_time_recovery_enablement == "POINT_IN_TIME_RECOVERY_ENABLED"
}

output "delete_protection_enabled" {
  description = "Whether delete protection is enabled"
  value       = google_firestore_database.database.delete_protection_state == "DELETE_PROTECTION_ENABLED"
}
