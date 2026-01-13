# Cloud Tasks Queue Configuration
# Creates the media-processing queue for async media operations

resource "google_cloud_tasks_queue" "media_processing" {
  name     = "media-processing"
  location = var.location

  rate_limits {
    max_dispatches_per_second = 10
    max_concurrent_dispatches = 5
  }

  retry_config {
    max_attempts       = 5
    min_backoff        = "1s"
    max_backoff        = "300s"
    max_doublings      = 4
    max_retry_duration = "86400s" # 24 hours
  }

  stackdriver_logging_config {
    sampling_ratio = 1.0
  }
}

# Grant Cloud Run service account permission to create tasks
resource "google_cloud_tasks_queue_iam_member" "cloud_run_enqueuer" {
  project  = var.project_id
  location = var.location
  name     = google_cloud_tasks_queue.media_processing.name
  role     = "roles/cloudtasks.enqueuer"
  member   = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Output the queue path for configuration
output "media_queue_path" {
  description = "Full path to the media processing queue"
  value       = google_cloud_tasks_queue.media_processing.id
}
