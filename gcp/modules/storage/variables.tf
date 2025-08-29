# Variables for Storage Module

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "common_labels" {
  description = "Common labels to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "service_prefix" {
  description = "Prefix for service naming"
  type        = string
}

variable "storage_class" {
  description = "Storage class for buckets"
  type        = string
  default     = "STANDARD"
}

variable "lifecycle_age_days" {
  description = "Days before moving to cheaper storage"
  type        = number
  default     = 30
}

variable "versioning_enabled" {
  description = "Enable versioning for buckets"
  type        = bool
  default     = true
}
