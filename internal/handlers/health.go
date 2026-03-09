package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HealthResponse is the response body for the health check endpoint.
type HealthResponse struct {
	Status  string `json:"status"  example:"ok"`
	Version string `json:"version" example:"1.0.0"`
}

// Health godoc
//
//	@Summary		Health check
//	@Description	Returns the service health status.
//	@Tags			health
//	@Produce		json
//	@Success		200	{object}	HealthResponse
//	@Router			/health [get]
func Health(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{
		Status:  "ok",
		Version: "1.0.0",
	})
}
