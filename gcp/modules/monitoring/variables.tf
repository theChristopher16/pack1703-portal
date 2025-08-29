# Variables for Monitoring Module

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

variable "common_labels" {
  description = "Common labels to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "notification_email" {
  description = "Email for monitoring alerts"
  type        = string
}

variable "cost_budget_amount" {
  description = "Monthly budget amount for cost alerts"
  type        = number
}

variable "function_names" {
  description = "List of Cloud Function names to monitor"
  type        = list(string)
  default     = []
}

variable "storage_buckets" {
  description = "List of storage bucket names to monitor"
  type        = list(string)
  default     = []
}
