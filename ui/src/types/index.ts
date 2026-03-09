// ── Source / Job types ────────────────────────────────────────────────────────

export type SourceType = 'git' | 'github' | 'filesystem' | 's3' | 'docker' | 'gitlab'
export type JobStatus  = 'pending' | 'running' | 'completed' | 'failed'
export type ScanMode   = 'instant' | 'background'

// ── Request models (mirrors internal/models/request.go) ──────────────────────

export interface GitConfig {
  uri: string
  head_ref?: string
  base_ref?: string
  max_depth?: number
  bare?: boolean
  skip_binaries?: boolean
  exclude_globs?: string
  include_paths_file?: string
  exclude_paths_file?: string
}

export interface GitHubConfig {
  endpoint?: string
  token?: string
  orgs?: string[]
  repos?: string[]
  include_members?: boolean
  include_forks?: boolean
  include_issue_comments?: boolean
  include_pull_request_comments?: boolean
  include_gist_comments?: boolean
  include_wikis?: boolean
  include_repos?: string[]
  exclude_repos?: string[]
  skip_binaries?: boolean
  concurrency?: number
  comments_timeframe_days?: number
}

export interface FilesystemConfig {
  paths: string[]
  include_paths_file?: string
  exclude_paths_file?: string
}

export interface S3Config {
  key?: string
  secret?: string
  session_token?: string
  cloud_cred?: boolean
  buckets?: string[]
  ignore_buckets?: string[]
  roles?: string[]
}

export interface DockerConfig {
  images: string[]
  bearer_token?: string
  use_docker_keychain?: boolean
}

export interface GitLabConfig {
  token: string
  endpoint?: string
  repos?: string[]
  include_repos?: string[]
  exclude_repos?: string[]
  skip_binaries?: boolean
}

export interface ScanRequest {
  source: SourceType
  verify?: boolean
  filter_unverified?: boolean
  concurrency?: number
  git?: GitConfig
  github?: GitHubConfig
  filesystem?: FilesystemConfig
  s3?: S3Config
  docker?: DockerConfig
  gitlab?: GitLabConfig
}

// ── Response models (mirrors internal/models/response.go) ────────────────────

export interface Finding {
  detector_name: string
  detector_type: string
  verified: boolean
  raw: string
  raw_v2: string
  redacted: string
  extra_data: Record<string, string>
  source_type: string
  source_name: string
  source_metadata: Record<string, unknown>
  decoder_type: string
}

export interface ScanMetrics {
  chunks_scanned: number
  bytes_scanned: number
  findings_count: number
}

export interface Job {
  id: string
  status: JobStatus
  created_at: string
  started_at: string
  ended_at: string
  request: ScanRequest
  findings: Finding[]
  error: string
  metrics: ScanMetrics
}

export interface JobSummary {
  id: string
  status: JobStatus
  created_at: string
  ended_at: string
  findings_count: number
  source: SourceType
}

export interface InstantScanResponse {
  findings: Finding[]
  metrics: ScanMetrics
}

export interface StartScanResponse {
  job_id: string
  status: JobStatus
}

export interface ListJobsResponse {
  jobs: JobSummary[]
  total: number
}

export interface HealthResponse {
  status: string
  version: string
}

// ── localStorage-extended finding ────────────────────────────────────────────

export interface StoredFinding extends Finding {
  _id: string        // client-generated UUID
  _jobId: string     // 'instant-<uuid>' or async job UUID
  _scannedAt: string // ISO-8601 timestamp
}

// ── Filter state ──────────────────────────────────────────────────────────────

export interface FilterState {
  detectors: string[]           // empty = all
  verified: 'all' | 'verified' | 'unverified'
  sourceSearch: string          // substring match on source_name
}
