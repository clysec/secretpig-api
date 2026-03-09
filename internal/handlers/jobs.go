package handlers

import (
	"net/http"

	"github.com/clysec/secretpig-api/internal/models"
	"github.com/clysec/secretpig-api/internal/store"
	"github.com/gin-gonic/gin"
)

// JobHandler holds dependencies for job-management endpoints.
type JobHandler struct {
	store *store.Store
}

// NewJobHandler constructs a JobHandler.
func NewJobHandler(s *store.Store) *JobHandler {
	return &JobHandler{store: s}
}

// List godoc
//
//	@Summary		List all scan jobs
//	@Description	Returns a summary of every known scan job.
//	@Tags			jobs
//	@Produce		json
//	@Success		200	{object}	models.ListJobsResponse
//	@Router			/api/v1/jobs [get]
func (h *JobHandler) List(c *gin.Context) {
	jobs := h.store.List()
	c.JSON(http.StatusOK, models.ListJobsResponse{
		Jobs:  jobs,
		Total: len(jobs),
	})
}

// Get godoc
//
//	@Summary		Get a scan job
//	@Description	Returns the full details of the specified scan job, including all findings once completed.
//	@Tags			jobs
//	@Produce		json
//	@Param			jobID	path		string	true	"Job ID"
//	@Success		200		{object}	models.Job
//	@Failure		404		{object}	models.ErrorResponse
//	@Router			/api/v1/jobs/{jobID} [get]
func (h *JobHandler) Get(c *gin.Context) {
	jobID := c.Param("jobID")
	job, err := h.store.Get(jobID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, job)
}

// Delete godoc
//
//	@Summary		Delete a scan job
//	@Description	Removes a job and its results from the in-memory store.
//	@Tags			jobs
//	@Produce		json
//	@Param			jobID	path		string	true	"Job ID"
//	@Success		204
//	@Failure		404	{object}	models.ErrorResponse
//	@Router			/api/v1/jobs/{jobID} [delete]
func (h *JobHandler) Delete(c *gin.Context) {
	jobID := c.Param("jobID")
	if err := h.store.Delete(jobID); err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
