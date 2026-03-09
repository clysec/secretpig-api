package models

import "time"

// JobStatus represents the lifecycle state of a scan job.
type JobStatus string

const (
	JobStatusPending   JobStatus = "pending"
	JobStatusRunning   JobStatus = "running"
	JobStatusCompleted JobStatus = "completed"
	JobStatusFailed    JobStatus = "failed"
)

// Finding represents a single secret or credential discovered during a scan.
type Finding struct {
	// DetectorName is the human-readable name of the detector that found this secret.
	DetectorName string `json:"detector_name" example:"GitHubOauth2"`

	// DetectorType is the numeric identifier string of the detector.
	DetectorType string `json:"detector_type" example:"18"`

	// Verified indicates whether the credential was verified to be active.
	Verified bool `json:"verified" example:"true"`

	// Raw is the raw secret value (may be empty when redacted).
	Raw string `json:"raw,omitempty" example:"ghp_xxxx"`

	// RawV2 is an alternative raw value used by some detectors.
	RawV2 string `json:"raw_v2,omitempty"`

	// Redacted is a censored version of the secret safe for logging.
	Redacted string `json:"redacted,omitempty" example:"ghp_****"`

	// ExtraData holds additional key-value pairs returned by the detector.
	ExtraData map[string]string `json:"extra_data,omitempty"`

	// SourceType identifies the type of source where the secret was found.
	SourceType string `json:"source_type" example:"git"`

	// SourceName is the name/label of the source instance.
	SourceName string `json:"source_name" example:"https://github.com/org/repo"`

	// SourceMetadata contains source-specific location information
	// (file path, line number, commit hash, S3 key, etc.).
	SourceMetadata map[string]interface{} `json:"source_metadata,omitempty"`

	// DecoderType describes how the chunk was decoded before detection.
	DecoderType string `json:"decoder_type,omitempty" example:"PLAIN"`
}

// ScanMetrics contains aggregate scan statistics.
type ScanMetrics struct {
	// ChunksScanned is the total number of data chunks examined.
	ChunksScanned uint64 `json:"chunks_scanned"`

	// BytesScanned is the total number of bytes processed.
	BytesScanned uint64 `json:"bytes_scanned"`

	// FindingsCount is the total number of findings before deduplication.
	FindingsCount int `json:"findings_count"`
}

// Job represents a scan job (used in async mode).
type Job struct {
	// ID is the unique job identifier (UUID).
	ID string `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`

	// Status is the current lifecycle state.
	Status JobStatus `json:"status" example:"running"`

	// CreatedAt is the time the job was created.
	CreatedAt time.Time `json:"created_at"`

	// StartedAt is the time the scan started (nil if still pending).
	StartedAt *time.Time `json:"started_at,omitempty"`

	// EndedAt is the time the scan finished (nil if not yet done).
	EndedAt *time.Time `json:"ended_at,omitempty"`

	// Request is the original scan request.
	Request *ScanRequest `json:"request"`

	// Findings is the list of discovered secrets (populated after completion).
	Findings []Finding `json:"findings"`

	// Error describes the failure reason when Status == "failed".
	Error string `json:"error,omitempty"`

	// Metrics contains aggregate statistics (populated after completion).
	Metrics *ScanMetrics `json:"metrics,omitempty"`
}

// JobSummary is a lightweight job representation used in list responses.
type JobSummary struct {
	// ID is the unique job identifier.
	ID string `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`

	// Status is the current lifecycle state.
	Status JobStatus `json:"status" example:"completed"`

	// CreatedAt is the time the job was created.
	CreatedAt time.Time `json:"created_at"`

	// EndedAt is the time the scan finished (nil if not yet done).
	EndedAt *time.Time `json:"ended_at,omitempty"`

	// FindingsCount is the number of findings (only set after completion).
	FindingsCount int `json:"findings_count"`

	// Source identifies the source type used for this scan.
	Source SourceType `json:"source"`
}

// StartScanResponse is returned from POST /api/v1/scan/start.
type StartScanResponse struct {
	// JobID is the UUID of the created job.
	JobID string `json:"job_id" example:"550e8400-e29b-41d4-a716-446655440000"`

	// Status is always "pending" immediately after creation.
	Status JobStatus `json:"status" example:"pending"`
}

// InstantScanResponse is returned from POST /api/v1/scan/instant.
type InstantScanResponse struct {
	// Findings is the list of discovered secrets.
	Findings []Finding `json:"findings"`

	// Metrics contains aggregate scan statistics.
	Metrics ScanMetrics `json:"metrics"`
}

// ListJobsResponse wraps the list of job summaries.
type ListJobsResponse struct {
	// Jobs is the list of known jobs.
	Jobs []JobSummary `json:"jobs"`

	// Total is the total number of jobs.
	Total int `json:"total"`
}

// ErrorResponse is the standard error envelope.
type ErrorResponse struct {
	// Error is a human-readable description of what went wrong.
	Error string `json:"error" example:"invalid source type"`
}
