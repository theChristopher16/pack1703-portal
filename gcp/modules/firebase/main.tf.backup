# Firebase Module
# Configures Firebase project, web apps, and hosting

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

# Firebase project configuration
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id
}

# Firebase web app for the main application
resource "google_firebase_web_app" "sfpack1703" {
  provider     = google-beta
  project      = var.project_id
  display_name = "${var.project_name}-${var.environment}"
  
  # Deletion policy for production safety
  deletion_policy = var.environment == "prod" ? "ABANDON" : "DELETE"

  depends_on = [google_firebase_project.default]
}

# Firebase web app configuration (data source)
data "google_firebase_web_app_config" "sfpack1703" {
  provider   = google-beta
  project    = var.project_id
  web_app_id = google_firebase_web_app.sfpack1703.app_id
}

# Random suffixes for unique site names
resource "random_id" "site_suffix" {
  for_each = toset(var.domains)
  
  byte_length = 4
}

# Firebase Hosting sites for each domain
resource "google_firebase_hosting_site" "sites" {
  provider = google-beta
  
  for_each = toset(var.domains)
  
  project = var.project_id
  site_id = "site-${random_id.site_suffix[each.key].hex}"
  app_id  = each.key == "sfpack1703.com" ? google_firebase_web_app.sfpack1703.app_id : null

  depends_on = [google_firebase_project.default]
}

# Firebase Hosting custom domains
resource "google_firebase_hosting_custom_domain" "domains" {
  provider = google-beta
  
  for_each = toset(var.domains)
  
  project                   = var.project_id
  site_id                  = google_firebase_hosting_site.sites[each.key].site_id
  custom_domain            = each.key
  cert_preference          = "GROUPED"
  redirect_target          = null
  wait_dns_verification    = true

  depends_on = [google_firebase_hosting_site.sites]
}

# Firebase Authentication configuration
resource "google_identity_platform_config" "auth" {
  provider = google-beta
  project  = var.project_id

  # Sign-in options
  sign_in {
    allow_duplicate_emails = false
    
    email {
      enabled           = true
      password_required = true
    }
  }

  # Authorized domains
  authorized_domains = concat(var.domains, [
    "${var.project_id}.firebaseapp.com",
    "${var.project_id}.web.app"
  ])

  depends_on = [google_firebase_project.default]
}

# Note: App Check configuration will be done via Firebase console
# The Terraform provider doesn't fully support these resources yet

# Service account for Firebase Admin SDK
resource "google_service_account" "firebase_admin" {
  account_id   = "firebase-admin-${var.environment}"
  display_name = "Firebase Admin Service Account for ${var.environment}"
  description  = "Service account for Firebase Admin SDK operations"
  project      = var.project_id
}

# IAM roles for Firebase Admin service account
resource "google_project_iam_member" "firebase_admin_roles" {
  for_each = toset([
    "roles/firebase.admin",
    "roles/datastore.user",
    "roles/storage.admin"
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.firebase_admin.email}"
}

# Service account key for Firebase Admin SDK
resource "google_service_account_key" "firebase_admin_key" {
  service_account_id = google_service_account.firebase_admin.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

# Store Firebase Admin key in Secret Manager
resource "google_secret_manager_secret" "firebase_admin_key" {
  secret_id = "firebase-admin-key-${var.environment}"
  project   = var.project_id

  labels = merge(var.common_labels, {
    type = "firebase-admin-key"
  })

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "firebase_admin_key" {
  secret      = google_secret_manager_secret.firebase_admin_key.id
  secret_data = base64decode(google_service_account_key.firebase_admin_key.private_key)
}
