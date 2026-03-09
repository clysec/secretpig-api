package handlers

import (
	"io/fs"
	"net/http"
	"strings"
)

// NewSPAHandler returns an http.Handler that serves files from an embedded FS.
// Unknown paths fall back to index.html so that client-side routing works.
func NewSPAHandler(efs fs.FS) http.Handler {
	fileServer := http.FileServer(http.FS(efs))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}
		_, err := fs.Stat(efs, path)
		if err != nil {
			// Not a real file — serve the SPA entry point.
			r.URL.Path = "/"
		}
		fileServer.ServeHTTP(w, r)
	})
}
