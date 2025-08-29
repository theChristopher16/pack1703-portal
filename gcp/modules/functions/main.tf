# Cloud Functions Module
# Placeholder for Cloud Functions deployment

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Note: Cloud Functions will be deployed via Firebase CLI
# This module creates the necessary IAM and configuration

# Service account for Cloud Functions
resource "google_service_account" "functions" {
  account_id   = "${var.service_prefix}-functions"
  display_name = "Cloud Functions Service Account"
  description  = "Service account for Cloud Functions runtime"
  project      = var.project_id
}

# IAM roles for Cloud Functions service account
resource "google_project_iam_member" "functions_roles" {
  for_each = toset([
    "roles/datastore.user",
    "roles/storage.objectAdmin",
    "roles/secretmanager.secretAccessor",
    "roles/pubsub.publisher"
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.functions.email}"
}

# Placeholder outputs for function URLs (will be populated after deployment)
locals {
  function_names = [
    "submitRSVP",
    "getRSVPCounts", 
    "submitVolunteer",
    "submitFeedback",
    "createEvent",
    "updateEvent",
    "deleteEvent"
  ]
}
