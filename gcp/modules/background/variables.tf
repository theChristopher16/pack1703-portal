# Variables for Background Processing Module

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

variable "scheduler_timezone" {
  description = "Timezone for Cloud Scheduler jobs"
  type        = string
  default     = "America/New_York"
}

variable "function_urls" {
  description = "Map of function names to URLs"
  type        = map(string)
  default     = {}
}
