# Variables for Functions Module

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

variable "runtime" {
  description = "Runtime for Cloud Functions"
  type        = string
  default     = "nodejs20"
}

variable "memory" {
  description = "Memory allocation for Cloud Functions"
  type        = string
  default     = "256Mi"
}

variable "timeout" {
  description = "Timeout for Cloud Functions"
  type        = number
  default     = 60
}

variable "min_instances" {
  description = "Minimum instances for Cloud Functions"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum instances for Cloud Functions"
  type        = number
  default     = 100
}

variable "app_check_enabled" {
  description = "Whether App Check is enabled"
  type        = bool
  default     = true
}
