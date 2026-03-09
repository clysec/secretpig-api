package tests

import (
	"github.com/clysec/secretpig-api/internal/handlers"
	"github.com/clysec/secretpig-api/internal/store"
	"github.com/gin-gonic/gin"
)

// setupTestRouter builds the router without importing the main package,
// avoiding the swagger docs import that requires generated code.
func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)

	jobStore := store.New()
	scanHandler := handlers.NewScanHandler(jobStore)
	jobHandler := handlers.NewJobHandler(jobStore)

	r := gin.New()

	r.GET("/health", handlers.Health)

	v1 := r.Group("/api/v1")
	{
		scan := v1.Group("/scan")
		{
			scan.POST("/instant", scanHandler.Instant)
			scan.POST("/start", scanHandler.Start)
			scan.GET("/poll/:jobID", scanHandler.Poll)
		}

		jobs := v1.Group("/jobs")
		{
			jobs.GET("", jobHandler.List)
			jobs.GET("/:jobID", jobHandler.Get)
			jobs.DELETE("/:jobID", jobHandler.Delete)
		}
	}

	// Stub out the swagger route so TestSwaggerRedirect doesn't 404.
	r.GET("/swagger/*any", func(c *gin.Context) {
		c.String(200, "swagger stub")
	})

	return r
}
