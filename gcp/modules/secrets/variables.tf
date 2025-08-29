# Variables for Secrets Module

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

variable "secrets" {
  description = "Map of secrets to create"
  type = map(object({
    secret_data = string
    labels      = map(string)
  }))
  default   = {}
  sensitive = true
}
