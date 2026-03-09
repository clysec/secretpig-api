// Package scanner wraps the TruffleHog engine to provide source-agnostic
// scanning driven by the API request models.
package scanner

import (
	"context"
	"fmt"

	"github.com/clysec/secretpig-api/internal/dispatcher"
	"github.com/clysec/secretpig-api/internal/models"
	"github.com/trufflesecurity/trufflehog/v3/pkg/decoders"
	"github.com/trufflesecurity/trufflehog/v3/pkg/engine"
	"github.com/trufflesecurity/trufflehog/v3/pkg/engine/defaults"
	"github.com/trufflesecurity/trufflehog/v3/pkg/sources"

	thctx "github.com/trufflesecurity/trufflehog/v3/pkg/context"
)

// Result bundles the findings and aggregate metrics from a completed scan.
type Result struct {
	Findings []models.Finding
	Metrics  models.ScanMetrics
}

// Run executes a TruffleHog scan for the given request and blocks until it
// completes. It returns the collected findings and scan metrics.
func Run(ctx context.Context, req *models.ScanRequest) (*Result, error) {
	// Wrap the standard context into TruffleHog's extended context (adds Logger).
	thCtx := thctx.AddLogger(ctx)

	col := dispatcher.New()

	cfg := &engine.Config{
		Concurrency:      req.GetConcurrency(),
		Detectors:        defaults.DefaultDetectors(),
		Decoders:         decoders.DefaultDecoders(),
		Verify:           req.Verify,
		FilterUnverified: req.FilterUnverified,
		Dispatcher:       col,
		SourceManager:    sources.NewManager(sources.WithConcurrentTargets(req.GetConcurrency())),
	}

	eng, err := engine.NewEngine(thCtx, cfg)
	if err != nil {
		return nil, fmt.Errorf("creating engine: %w", err)
	}

	// Start does not return an error; it panics on misconfiguration.
	eng.Start(thCtx)

	if err := startSource(thCtx, eng, req); err != nil {
		// Best-effort shutdown before returning.
		_ = eng.Finish(thCtx) //nolint:errcheck
		return nil, err
	}

	if err := eng.Finish(thCtx); err != nil {
		return nil, fmt.Errorf("finishing engine: %w", err)
	}

	metrics := eng.GetMetrics()
	findings := col.Findings()

	return &Result{
		Findings: findings,
		Metrics: models.ScanMetrics{
			ChunksScanned: metrics.ChunksScanned,
			BytesScanned:  metrics.BytesScanned,
			FindingsCount: len(findings),
		},
	}, nil
}

// startSource dispatches to the correct engine Scan* method based on the
// request's Source field.
func startSource(ctx thctx.Context, eng *engine.Engine, req *models.ScanRequest) error {
	switch req.Source {
	case models.SourceGit:
		return scanGit(ctx, eng, req)
	case models.SourceGitHub:
		return scanGitHub(ctx, eng, req)
	case models.SourceFilesystem:
		return scanFilesystem(ctx, eng, req)
	case models.SourceS3:
		return scanS3(ctx, eng, req)
	case models.SourceDocker:
		return scanDocker(ctx, eng, req)
	case models.SourceGitLab:
		return scanGitLab(ctx, eng, req)
	default:
		return fmt.Errorf("unknown source type %q", req.Source)
	}
}

func scanGit(ctx thctx.Context, eng *engine.Engine, req *models.ScanRequest) error {
	if req.Git == nil {
		return fmt.Errorf("git config is required for source type %q", req.Source)
	}
	c := req.Git
	_, err := eng.ScanGit(ctx, sources.GitConfig{
		URI:              c.URI,
		HeadRef:          c.HeadRef,
		BaseRef:          c.BaseRef,
		MaxDepth:         c.MaxDepth,
		Bare:             c.Bare,
		SkipBinaries:     c.SkipBinaries,
		ExcludeGlobs:     c.ExcludeGlobs,
		IncludePathsFile: c.IncludePathsFile,
		ExcludePathsFile: c.ExcludePathsFile,
	})
	return err
}

func scanGitHub(ctx thctx.Context, eng *engine.Engine, req *models.ScanRequest) error {
	if req.GitHub == nil {
		return fmt.Errorf("github config is required for source type %q", req.Source)
	}
	c := req.GitHub
	_, err := eng.ScanGitHub(ctx, sources.GithubConfig{
		Endpoint:                   c.Endpoint,
		Token:                      c.Token,
		Orgs:                       c.Orgs,
		Repos:                      c.Repos,
		IncludeMembers:             c.IncludeMembers,
		IncludeForks:               c.IncludeForks,
		IncludeIssueComments:       c.IncludeIssueComments,
		IncludePullRequestComments: c.IncludePullRequestComments,
		IncludeGistComments:        c.IncludeGistComments,
		IncludeWikis:               c.IncludeWikis,
		IncludeRepos:               c.IncludeRepos,
		ExcludeRepos:               c.ExcludeRepos,
		SkipBinaries:               c.SkipBinaries,
		Concurrency:                c.Concurrency,
		CommentsTimeframeDays:      c.CommentsTimeframeDays,
	})
	return err
}

func scanFilesystem(ctx thctx.Context, eng *engine.Engine, req *models.ScanRequest) error {
	if req.Filesystem == nil {
		return fmt.Errorf("filesystem config is required for source type %q", req.Source)
	}
	c := req.Filesystem
	_, err := eng.ScanFileSystem(ctx, sources.FilesystemConfig{
		Paths:            c.Paths,
		IncludePathsFile: c.IncludePathsFile,
		ExcludePathsFile: c.ExcludePathsFile,
	})
	return err
}

func scanS3(ctx thctx.Context, eng *engine.Engine, req *models.ScanRequest) error {
	if req.S3 == nil {
		return fmt.Errorf("s3 config is required for source type %q", req.Source)
	}
	c := req.S3
	_, err := eng.ScanS3(ctx, sources.S3Config{
		Key:           c.Key,
		Secret:        c.Secret,
		SessionToken:  c.SessionToken,
		CloudCred:     c.CloudCred,
		Buckets:       c.Buckets,
		IgnoreBuckets: c.IgnoreBuckets,
		Roles:         c.Roles,
	})
	return err
}

func scanDocker(ctx thctx.Context, eng *engine.Engine, req *models.ScanRequest) error {
	if req.Docker == nil {
		return fmt.Errorf("docker config is required for source type %q", req.Source)
	}
	c := req.Docker
	_, err := eng.ScanDocker(ctx, sources.DockerConfig{
		Images:            c.Images,
		BearerToken:       c.BearerToken,
		UseDockerKeychain: c.UseDockerKeychain,
	})
	return err
}

func scanGitLab(ctx thctx.Context, eng *engine.Engine, req *models.ScanRequest) error {
	if req.GitLab == nil {
		return fmt.Errorf("gitlab config is required for source type %q", req.Source)
	}
	c := req.GitLab
	_, err := eng.ScanGitLab(ctx, sources.GitlabConfig{
		Token:        c.Token,
		Endpoint:     c.Endpoint,
		Repos:        c.Repos,
		IncludeRepos: c.IncludeRepos,
		ExcludeRepos: c.ExcludeRepos,
		SkipBinaries: c.SkipBinaries,
	})
	return err
}
