package handlers

import (
	"net/http"

	"github.com/clysec/secretpig-api/internal/config"
	"github.com/gin-gonic/gin"
)

// CheckAuthResponse is the response body for the check_auth endpoint.
type CheckAuthResponse struct {
	AuthRequired bool   `json:"auth_required" example:"false"`
	Mode         string `json:"mode"          example:"none"`
}

// CheckAuth godoc
//
//	@Summary		Check authentication requirements
//	@Description	Returns whether authentication is required and which mode is active.
//	@Description	This endpoint is always public (no auth required).
//	@Tags			health
//	@Produce		json
//	@Success		200	{object}	CheckAuthResponse
//	@Router			/api/check_auth [get]
func CheckAuth(cfg config.AuthConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, CheckAuthResponse{
			AuthRequired: cfg.Mode != "none",
			Mode:         cfg.Mode,
		})
	}
}
