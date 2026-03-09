package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/clysec/secretpig-api/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// newRouter returns the Gin engine under test.
// It is imported from the main package via the helper in router_test.go.

// ── Health ────────────────────────────────────────────────────────────────────

func TestHealth(t *testing.T) {
	r := setupTestRouter()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/health", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var body map[string]string
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &body))
	assert.Equal(t, "ok", body["status"])
}

// ── Swagger ───────────────────────────────────────────────────────────────────

func TestSwaggerRedirect(t *testing.T) {
	r := setupTestRouter()
	w := httptest.NewRecorder()
	// The swagger handler redirects /swagger/ to /swagger/index.html.
	req, _ := http.NewRequest(http.MethodGet, "/swagger/index.html", nil)
	r.ServeHTTP(w, req)

	// Either 200 (if docs generated) or 301/302 redirect is acceptable.
	assert.True(t, w.Code == http.StatusOK ||
		w.Code == http.StatusMovedPermanently ||
		w.Code == http.StatusFound,
		"expected 200 or redirect, got %d", w.Code)
}

// ── Jobs – empty store ────────────────────────────────────────────────────────

func TestListJobsEmpty(t *testing.T) {
	r := setupTestRouter()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/jobs", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp models.ListJobsResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, 0, resp.Total)
	assert.NotNil(t, resp.Jobs)
}

func TestGetJobNotFound(t *testing.T) {
	r := setupTestRouter()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/jobs/nonexistent-id", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var resp models.ErrorResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.NotEmpty(t, resp.Error)
}

func TestDeleteJobNotFound(t *testing.T) {
	r := setupTestRouter()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodDelete, "/api/v1/jobs/nonexistent-id", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// ── Scan – validation ─────────────────────────────────────────────────────────

func TestInstantScan_MissingSource(t *testing.T) {
	r := setupTestRouter()
	w := httptest.NewRecorder()

	body, _ := json.Marshal(map[string]interface{}{
		"verify": true,
		// no "source" field → binding should fail
	})
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/scan/instant",
		bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp models.ErrorResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.NotEmpty(t, resp.Error)
}

func TestInstantScan_InvalidJSON(t *testing.T) {
	r := setupTestRouter()
	w := httptest.NewRecorder()

	req, _ := http.NewRequest(http.MethodPost, "/api/v1/scan/instant",
		bytes.NewReader([]byte("not-json")))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestStartScan_MissingSource(t *testing.T) {
	r := setupTestRouter()
	w := httptest.NewRecorder()

	body, _ := json.Marshal(map[string]interface{}{
		"verify": true,
	})
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/scan/start",
		bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ── Scan – async lifecycle ────────────────────────────────────────────────────

func TestStartScan_ReturnsJobID(t *testing.T) {
	r := setupTestRouter()
	w := httptest.NewRecorder()

	// Use filesystem scan on /tmp so it actually runs without any network.
	body, _ := json.Marshal(models.ScanRequest{
		Source: models.SourceFilesystem,
		Verify: false,
		Filesystem: &models.FilesystemConfig{
			Paths: []string{"/tmp"},
		},
	})
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/scan/start",
		bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusAccepted, w.Code)

	var resp models.StartScanResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.NotEmpty(t, resp.JobID)
	assert.Equal(t, models.JobStatusPending, resp.Status)
}

func TestPollScan_NotFound(t *testing.T) {
	r := setupTestRouter()
	w := httptest.NewRecorder()

	req, _ := http.NewRequest(http.MethodGet, "/api/v1/scan/poll/no-such-job", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestStartAndPollScan_Lifecycle(t *testing.T) {
	r := setupTestRouter()

	// 1. Start a filesystem scan on /tmp.
	startBody, _ := json.Marshal(models.ScanRequest{
		Source: models.SourceFilesystem,
		Verify: false,
		Filesystem: &models.FilesystemConfig{
			Paths: []string{"/tmp"},
		},
	})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/scan/start",
		bytes.NewReader(startBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	require.Equal(t, http.StatusAccepted, w.Code)

	var startResp models.StartScanResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &startResp))
	jobID := startResp.JobID

	// 2. Poll until the job is no longer pending/running (max 120 s).
	deadline := time.Now().Add(120 * time.Second)
	var finalJob models.Job
	for time.Now().Before(deadline) {
		w2 := httptest.NewRecorder()
		pollReq, _ := http.NewRequest(http.MethodGet, "/api/v1/scan/poll/"+jobID, nil)
		r.ServeHTTP(w2, pollReq)

		require.Equal(t, http.StatusOK, w2.Code)
		require.NoError(t, json.Unmarshal(w2.Body.Bytes(), &finalJob))

		if finalJob.Status == models.JobStatusCompleted ||
			finalJob.Status == models.JobStatusFailed {
			break
		}
		time.Sleep(500 * time.Millisecond)
	}

	// The scan should have finished (not timed out).
	assert.True(t,
		finalJob.Status == models.JobStatusCompleted ||
			finalJob.Status == models.JobStatusFailed,
		"expected completed or failed, got %s", finalJob.Status)

	// 3. The job must appear in the list.
	w3 := httptest.NewRecorder()
	listReq, _ := http.NewRequest(http.MethodGet, "/api/v1/jobs", nil)
	r.ServeHTTP(w3, listReq)

	require.Equal(t, http.StatusOK, w3.Code)
	var listResp models.ListJobsResponse
	require.NoError(t, json.Unmarshal(w3.Body.Bytes(), &listResp))
	assert.GreaterOrEqual(t, listResp.Total, 1)

	// 4. Delete the job and confirm it is gone.
	w4 := httptest.NewRecorder()
	delReq, _ := http.NewRequest(http.MethodDelete, "/api/v1/jobs/"+jobID, nil)
	r.ServeHTTP(w4, delReq)
	assert.Equal(t, http.StatusNoContent, w4.Code)

	w5 := httptest.NewRecorder()
	getReq, _ := http.NewRequest(http.MethodGet, "/api/v1/jobs/"+jobID, nil)
	r.ServeHTTP(w5, getReq)
	assert.Equal(t, http.StatusNotFound, w5.Code)
}
