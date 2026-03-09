// Package store provides an in-memory job store for async scan jobs.
package store

import (
	"fmt"
	"sync"
	"time"

	"github.com/clysec/secretpig-api/internal/models"
	"github.com/google/uuid"
)

// Store holds all scan jobs in memory.
type Store struct {
	mu   sync.RWMutex
	jobs map[string]*models.Job
}

// New returns an initialised Store.
func New() *Store {
	return &Store{jobs: make(map[string]*models.Job)}
}

// Create allocates a new job for the given request and returns it.
func (s *Store) Create(req *models.ScanRequest) *models.Job {
	job := &models.Job{
		ID:        uuid.New().String(),
		Status:    models.JobStatusPending,
		CreatedAt: time.Now().UTC(),
		Request:   req,
		Findings:  []models.Finding{},
	}

	s.mu.Lock()
	s.jobs[job.ID] = job
	s.mu.Unlock()

	return job
}

// Get returns the job with the given ID or an error when not found.
func (s *Store) Get(id string) (*models.Job, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	job, ok := s.jobs[id]
	if !ok {
		return nil, fmt.Errorf("job %q not found", id)
	}
	return job, nil
}

// List returns a summary slice of all known jobs.
func (s *Store) List() []models.JobSummary {
	s.mu.RLock()
	defer s.mu.RUnlock()

	out := make([]models.JobSummary, 0, len(s.jobs))
	for _, j := range s.jobs {
		out = append(out, models.JobSummary{
			ID:            j.ID,
			Status:        j.Status,
			CreatedAt:     j.CreatedAt,
			EndedAt:       j.EndedAt,
			FindingsCount: len(j.Findings),
			Source:        j.Request.Source,
		})
	}
	return out
}

// Delete removes the job with the given ID. Returns an error when not found.
func (s *Store) Delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.jobs[id]; !ok {
		return fmt.Errorf("job %q not found", id)
	}
	delete(s.jobs, id)
	return nil
}

// MarkRunning transitions a job to the running state.
func (s *Store) MarkRunning(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if j, ok := s.jobs[id]; ok {
		now := time.Now().UTC()
		j.Status = models.JobStatusRunning
		j.StartedAt = &now
	}
}

// MarkCompleted transitions a job to the completed state and stores results.
func (s *Store) MarkCompleted(id string, findings []models.Finding, metrics *models.ScanMetrics) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if j, ok := s.jobs[id]; ok {
		now := time.Now().UTC()
		j.Status = models.JobStatusCompleted
		j.EndedAt = &now
		j.Findings = findings
		j.Metrics = metrics
	}
}

// MarkFailed transitions a job to the failed state with an error message.
func (s *Store) MarkFailed(id string, err error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if j, ok := s.jobs[id]; ok {
		now := time.Now().UTC()
		j.Status = models.JobStatusFailed
		j.EndedAt = &now
		j.Error = err.Error()
	}
}
