package handlers

import (
	"context"
	"net/http"

	"github.com/clysec/secretpig-api/internal/models"
	"github.com/clysec/secretpig-api/internal/scanner"
	"github.com/clysec/secretpig-api/internal/store"
	"github.com/gin-gonic/gin"
)

// ScanHandler holds dependencies for scan-related endpoints.
type ScanHandler struct {
	store *store.Store
}

// NewScanHandler constructs a ScanHandler.
func NewScanHandler(s *store.Store) *ScanHandler {
	return &ScanHandler{store: s}
}

// Instant godoc
//
//	@Summary		Run a synchronous scan
//	@Description	Runs a TruffleHog scan and blocks until it completes, returning all findings inline.
//	@Description	Use this for short-lived scans. For large repositories prefer /scan/start.
//	@Tags			scan
//	@Accept			json
//	@Produce		json
//	@Param			request	body		models.ScanRequest			true	"Scan parameters"
//	@Success		200		{object}	models.InstantScanResponse
//	@Failure		400		{object}	models.ErrorResponse
//	@Failure		500		{object}	models.ErrorResponse
//	@Router			/api/v1/scan/instant [post]
func (h *ScanHandler) Instant(c *gin.Context) {
	var req models.ScanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := scanner.Run(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.InstantScanResponse{
		Findings: result.Findings,
		Metrics:  result.Metrics,
	})
}

// Start godoc
//
//	@Summary		Start an asynchronous scan
//	@Description	Enqueues a TruffleHog scan and returns a job ID immediately.
//	@Description	Poll the job status with GET /api/v1/scan/poll/{jobID}.
//	@Tags			scan
//	@Accept			json
//	@Produce		json
//	@Param			request	body		models.ScanRequest		true	"Scan parameters"
//	@Success		202		{object}	models.StartScanResponse
//	@Failure		400		{object}	models.ErrorResponse
//	@Router			/api/v1/scan/start [post]
func (h *ScanHandler) Start(c *gin.Context) {
	var req models.ScanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	job := h.store.Create(&req)

	go func() {
		h.store.MarkRunning(job.ID)

		result, err := scanner.Run(context.Background(), &req)
		if err != nil {
			h.store.MarkFailed(job.ID, err)
			return
		}
		h.store.MarkCompleted(job.ID, result.Findings, &result.Metrics)
	}()

	c.JSON(http.StatusAccepted, models.StartScanResponse{
		JobID:  job.ID,
		Status: job.Status,
	})
}

// Poll godoc
//
//	@Summary		Poll an asynchronous scan job
//	@Description	Returns the current status and, once completed, all findings for the given job.
//	@Tags			scan
//	@Produce		json
//	@Param			jobID	path		string	true	"Job ID"
//	@Success		200		{object}	models.Job
//	@Failure		404		{object}	models.ErrorResponse
//	@Router			/api/v1/scan/poll/{jobID} [get]
func (h *ScanHandler) Poll(c *gin.Context) {
	jobID := c.Param("jobID")
	job, err := h.store.Get(jobID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, job)
}
