package models

// SourceType identifies the TruffleHog source to scan.
type SourceType string

const (
	SourceGit        SourceType = "git"
	SourceGitHub     SourceType = "github"
	SourceFilesystem SourceType = "filesystem"
	SourceS3         SourceType = "s3"
	SourceDocker     SourceType = "docker"
	SourceGitLab     SourceType = "gitlab"
)

// ScanRequest is the shared envelope for all scan requests.
type ScanRequest struct {
	// Source selects the TruffleHog source engine.
	// Enum: git, github, filesystem, s3, docker, gitlab
	Source SourceType `json:"source" binding:"required" example:"git"`

	// Verify controls whether discovered credentials are verified against live APIs.
	Verify bool `json:"verify" example:"true"`

	// FilterUnverified returns only the first unverified result per chunk per detector.
	FilterUnverified bool `json:"filter_unverified" example:"false"`

	// Concurrency is the number of concurrent scanner workers (default: 8).
	Concurrency int `json:"concurrency" example:"8"`

	// Git holds config for the "git" source.
	Git *GitConfig `json:"git,omitempty"`

	// GitHub holds config for the "github" source.
	GitHub *GitHubConfig `json:"github,omitempty"`

	// Filesystem holds config for the "filesystem" source.
	Filesystem *FilesystemConfig `json:"filesystem,omitempty"`

	// S3 holds config for the "s3" source.
	S3 *S3Config `json:"s3,omitempty"`

	// Docker holds config for the "docker" source.
	Docker *DockerConfig `json:"docker,omitempty"`

	// GitLab holds config for the "gitlab" source.
	GitLab *GitLabConfig `json:"gitlab,omitempty"`
}

// GetConcurrency returns a safe concurrency value (defaults to 8).
func (r *ScanRequest) GetConcurrency() int {
	if r.Concurrency <= 0 {
		return 8
	}
	return r.Concurrency
}

// GitConfig configures a Git repository scan.
type GitConfig struct {
	// URI is the repository URL or local path (file://, http://, https://, ssh://).
	URI string `json:"uri" binding:"required" example:"https://github.com/trufflesecurity/test_keys"`

	// HeadRef is the reference to scan up to (branch, tag, or commit SHA).
	HeadRef string `json:"head_ref" example:"main"`

	// BaseRef is the reference to scan from (enables diff mode).
	BaseRef string `json:"base_ref" example:""`

	// MaxDepth limits how many commits back to scan (0 = unlimited).
	MaxDepth int `json:"max_depth" example:"0"`

	// Bare indicates the repository is a bare clone.
	Bare bool `json:"bare" example:"false"`

	// SkipBinaries skips binary file content.
	SkipBinaries bool `json:"skip_binaries" example:"false"`

	// ExcludeGlobs is a comma-separated list of globs to exclude from git log output.
	ExcludeGlobs string `json:"exclude_globs,omitempty" example:"*.pdf,*.png"`

	// IncludePathsFile is the path to a file containing regexps of paths to include.
	IncludePathsFile string `json:"include_paths_file,omitempty"`

	// ExcludePathsFile is the path to a file containing regexps of paths to exclude.
	ExcludePathsFile string `json:"exclude_paths_file,omitempty"`
}

// GitHubConfig configures a GitHub organization/user scan.
type GitHubConfig struct {
	// Endpoint is the GitHub API base URL (for GHES; default: https://api.github.com).
	Endpoint string `json:"endpoint,omitempty" example:"https://api.github.com"`

	// Token is a GitHub personal access token.
	Token string `json:"token,omitempty" example:"ghp_xxxx"`

	// Orgs is a list of GitHub organizations to scan.
	Orgs []string `json:"orgs,omitempty" example:"[\"trufflesecurity\"]"`

	// Repos is a list of specific repositories to scan (owner/repo format).
	Repos []string `json:"repos,omitempty" example:"[\"trufflesecurity/trufflehog\"]"`

	// IncludeMembers also scans repositories of organization members.
	IncludeMembers bool `json:"include_members" example:"false"`

	// IncludeForks includes forked repositories.
	IncludeForks bool `json:"include_forks" example:"false"`

	// IncludeIssueComments includes issue comment bodies.
	IncludeIssueComments bool `json:"include_issue_comments" example:"false"`

	// IncludePullRequestComments includes pull-request comment bodies.
	IncludePullRequestComments bool `json:"include_pull_request_comments" example:"false"`

	// IncludeGistComments includes GitHub gist comment bodies.
	IncludeGistComments bool `json:"include_gist_comments" example:"false"`

	// IncludeWikis includes GitHub wiki pages.
	IncludeWikis bool `json:"include_wikis" example:"false"`

	// IncludeRepos filters to only these repos within the org.
	IncludeRepos []string `json:"include_repos,omitempty"`

	// ExcludeRepos skips these repos.
	ExcludeRepos []string `json:"exclude_repos,omitempty"`

	// SkipBinaries skips binary file content.
	SkipBinaries bool `json:"skip_binaries" example:"false"`

	// Concurrency controls per-source worker count.
	Concurrency int `json:"concurrency" example:"0"`

	// CommentsTimeframeDays limits how many days of comments to include.
	CommentsTimeframeDays uint32 `json:"comments_timeframe_days" example:"0"`
}

// FilesystemConfig configures a local filesystem scan.
type FilesystemConfig struct {
	// Paths is the list of directories or files to scan.
	Paths []string `json:"paths" binding:"required" example:"[\"/home/user/projects\"]"`

	// IncludePathsFile is a path to a file listing regexp patterns of paths to include.
	IncludePathsFile string `json:"include_paths_file,omitempty"`

	// ExcludePathsFile is a path to a file listing regexp patterns of paths to exclude.
	ExcludePathsFile string `json:"exclude_paths_file,omitempty"`
}

// S3Config configures an AWS S3 bucket scan.
type S3Config struct {
	// Key is the AWS access key ID (leave empty to use instance role / env vars).
	Key string `json:"key,omitempty" example:"AKIAIOSFODNN7EXAMPLE"`

	// Secret is the AWS secret access key.
	Secret string `json:"secret,omitempty" example:"wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"`

	// SessionToken is an optional temporary session token.
	SessionToken string `json:"session_token,omitempty"`

	// CloudCred uses the ambient cloud credentials (IAM role, env vars, etc.).
	CloudCred bool `json:"cloud_cred" example:"false"`

	// Buckets is the list of buckets to scan (empty = all accessible buckets).
	Buckets []string `json:"buckets,omitempty" example:"[\"my-bucket\"]"`

	// IgnoreBuckets skips these buckets.
	IgnoreBuckets []string `json:"ignore_buckets,omitempty"`

	// Roles is a list of IAM role ARNs to assume before scanning.
	Roles []string `json:"roles,omitempty"`
}

// DockerConfig configures a Docker image scan.
type DockerConfig struct {
	// Images is the list of Docker image references to scan.
	Images []string `json:"images" binding:"required" example:"[\"trufflesecurity/trufflehog:latest\"]"`

	// BearerToken is a bearer token for registry authentication.
	BearerToken string `json:"bearer_token,omitempty"`

	// UseDockerKeychain uses the local Docker credential store for authentication.
	UseDockerKeychain bool `json:"use_docker_keychain" example:"false"`
}

// GitLabConfig configures a GitLab group/project scan.
type GitLabConfig struct {
	// Token is the GitLab personal access token (required).
	Token string `json:"token" binding:"required" example:"glpat-xxxx"`

	// Endpoint is the GitLab instance base URL (default: https://gitlab.com).
	Endpoint string `json:"endpoint,omitempty" example:"https://gitlab.com"`

	// Repos is a list of specific repository URLs to scan.
	Repos []string `json:"repos,omitempty"`

	// IncludeRepos filters to only these repositories.
	IncludeRepos []string `json:"include_repos,omitempty"`

	// ExcludeRepos skips these repositories.
	ExcludeRepos []string `json:"exclude_repos,omitempty"`

	// SkipBinaries skips binary file content.
	SkipBinaries bool `json:"skip_binaries" example:"false"`
}
