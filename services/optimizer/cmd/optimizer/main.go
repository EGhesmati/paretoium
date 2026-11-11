package main

import (
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"paretoium/services/optimizer/internal/httpapi"
)

func main() {
	addr := ":8080"
	if port := os.Getenv("PORT"); port != "" {
		addr = ":" + port
	}

	server := newHTTPServer(addr)
	log.Printf("optimizer listening on %s", addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("optimizer server failed: %v", err)
	}
}

func newHTTPServer(addr string) *http.Server {
	return &http.Server{
		Addr:              addr,
		Handler:           httpapi.NewRouter(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
}
