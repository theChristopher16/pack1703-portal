# Variables for Firestore Module

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "common_labels" {
  description = "Common labels to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "location_id" {
  description = "Firestore database location"
  type        = string
  default     = "us-central1"
}

variable "delete_protection_state" {
  description = "Delete protection state for the database"
  type        = string
  default     = "DELETE_PROTECTION_DISABLED"
  validation {
    condition = contains([
      "DELETE_PROTECTION_ENABLED", 
      "DELETE_PROTECTION_DISABLED"
    ], var.delete_protection_state)
    error_message = "Delete protection state must be ENABLED or DISABLED."
  }
}
