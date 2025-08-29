# GCP Project Configuration for Pack 1703 Migration
project_id   = "pack-1703-portal"
project_name = "pack1703-rsvp"
environment  = "prod"
region       = "us-central1"

# Domain Configuration
domains = [
  "sfpack1703.com"
]

# Firestore Configuration
firestore_location = "us-central1"

# Cloud Functions Configuration
function_runtime       = "nodejs20"
function_memory        = "256Mi"
function_timeout       = 60
function_min_instances = 1
function_max_instances = 100

# Storage Configuration
storage_class              = "STANDARD"
storage_lifecycle_age_days = 30
storage_versioning_enabled = true

# Background Processing
scheduler_timezone = "America/New_York"

# Security Configuration
app_check_enabled = false  # Disabled due to permission issues

# Monitoring Configuration
notification_email = "cubmaster@sfpack1703.com"
cost_budget_amount = 5.00

# Feature Flags
enable_monitoring    = true
enable_backup       = true
enable_audit_logging = true

# Additional Labels
additional_labels = {
  owner       = "pack1703"
  cost_center = "scouting"
  managed_by  = "opentofu"
}

# Secrets Configuration (empty for now - will be added later)
secrets_config = {}
