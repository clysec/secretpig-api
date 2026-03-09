// SecretPig API - A fully-featured REST API for the TruffleHog secret scanning tool.
//
//	@title			SecretPig API
//	@version		1.0.0
//	@description	A REST API wrapper around the TruffleHog v3 secret scanner.
//	@description	Supports Git, GitHub, GitLab, Filesystem, S3, and Docker sources.
//	@description	Scans can be run synchronously (/scan/instant) or asynchronously (/scan/start + /scan/poll/{jobID}).
//
//	@contact.name	SecretPig API
//	@contact.url	https://github.com/clysec/secretpig-api
//
//	@license.name	MIT
//	@license.url	https://opensource.org/licenses/MIT
//
//	@BasePath	/
//	@schemes	http https
package main

import (
	"embed"
	"io/fs"
	"log"

	"github.com/clysec/secretpig-api/internal/config"
	"github.com/clysec/secretpig-api/internal/handlers"
	"github.com/clysec/secretpig-api/internal/middleware"
	"github.com/clysec/secretpig-api/internal/store"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	// Import generated swagger docs (populated after running `swag init`).
	_ "github.com/clysec/secretpig-api/docs"
)

//go:embed ui/dist
var uiFS embed.FS

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("loading config: %v", err)
	}

	r := setupRouter(cfg)

	log.Printf("SecretPig API listening on %s (auth: %s)", cfg.ListenAddr, cfg.Auth.Mode)
	log.Printf("Swagger UI: http://localhost%s/swagger/index.html", cfg.ListenAddr)

	if err := r.Run(cfg.ListenAddr); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

// setupRouter builds and returns the Gin router. It is extracted so that tests
// can call it without starting the HTTP listener.
func setupRouter(cfg *config.Config) *gin.Engine {
	jobStore := store.New()

	scanHandler := handlers.NewScanHandler(jobStore)
	jobHandler := handlers.NewJobHandler(jobStore)

	r := gin.Default()

	// ── Health (public) ───────────────────────────────────────────────────────
	r.GET("/health", handlers.Health)

	// ── Swagger UI (public) ───────────────────────────────────────────────────
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// ── API v1 (auth-protected) ───────────────────────────────────────────────
	v1 := r.Group("/api/v1", middleware.Auth(cfg.Auth))
	{
		// Scan endpoints
		scan := v1.Group("/scan")
		{
			scan.POST("/instant", scanHandler.Instant)
			scan.POST("/start", scanHandler.Start)
			scan.GET("/poll/:jobID", scanHandler.Poll)
		}

		// Job management
		jobs := v1.Group("/jobs")
		{
			jobs.GET("", jobHandler.List)
			jobs.GET("/:jobID", jobHandler.Get)
			jobs.DELETE("/:jobID", jobHandler.Delete)
		}
	}

	// ── UI (SPA) ──────────────────────────────────────────────────────────────
	// Strip the "ui/dist" prefix so the embedded FS root maps to "/".
	sub, err := fs.Sub(uiFS, "ui/dist")
	if err != nil {
		panic(err)
	}
	r.NoRoute(gin.WrapH(handlers.NewSPAHandler(sub)))

	return r
}
