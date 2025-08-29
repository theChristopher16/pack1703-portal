# Firestore Module
# Configures Firestore database, indexes, and security rules

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Firestore database - using existing database
resource "google_firestore_database" "database" {
  project                 = var.project_id
  name                   = "(default)"
  location_id            = var.location_id
  type                   = "FIRESTORE_NATIVE"
  delete_protection_state = var.delete_protection_state
  
  # Point-in-time recovery for production
  point_in_time_recovery_enablement = var.environment == "prod" ? "POINT_IN_TIME_RECOVERY_ENABLED" : "POINT_IN_TIME_RECOVERY_DISABLED"
  
  # App Engine integration (disabled for pure Firestore)
  app_engine_integration_mode = "DISABLED"
  
  # Concurrency mode
  concurrency_mode = "OPTIMISTIC"
  
  # Prevent recreation of existing database
  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      location_id,
      type,
      app_engine_integration_mode,
      concurrency_mode
    ]
  }
}

# Firestore indexes for optimized queries
resource "google_firestore_index" "events_by_season_and_date" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "events"

  fields {
    field_path = "seasonId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "startDate"
    order      = "ASCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "events_by_visibility_and_date" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "events"

  fields {
    field_path = "visibility"
    order      = "ASCENDING"
  }

  fields {
    field_path = "startDate"
    order      = "ASCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "events_by_category_and_date" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "events"

  fields {
    field_path = "category"
    order      = "ASCENDING"
  }

  fields {
    field_path = "startDate"
    order      = "ASCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "rsvps_by_event_and_timestamp" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "rsvps"

  fields {
    field_path = "eventId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "submittedAt"
    order      = "DESCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "volunteers_by_event_and_role" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "volunteers"

  fields {
    field_path = "eventId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "role"
    order      = "ASCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "announcements_by_pinned_and_date" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "announcements"

  fields {
    field_path = "pinned"
    order      = "DESCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "ASCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "ASCENDING"
  }
}

# Firestore security rules (placeholder - will be deployed via Firebase CLI)
resource "local_file" "firestore_rules" {
  content = templatefile("${path.module}/firestore.rules.tpl", {
    environment = var.environment
  })
  filename = "${path.root}/firestore.rules"
}

# Backup configuration for production
resource "google_firestore_backup_schedule" "daily_backup" {
  count    = var.environment == "prod" ? 1 : 0
  project  = var.project_id
  database = google_firestore_database.database.name

  retention = "604800s" # 7 days

  daily_recurrence {}
}
