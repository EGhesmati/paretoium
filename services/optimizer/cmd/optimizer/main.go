package main

import (
	"errors"
	"log"
	"net/http"
	"os"

	"paretoium/services/optimizer/internal/httpapi"
)

func main() {
	addr := ":8080"
	if port := os.Getenv("PORT"); port != "" {
		addr = ":" + port
	}

	server := &http.Server{
		Addr:    addr,
		Handler: httpapi.NewRouter(),
	}
	log.Printf("optimizer listening on %s", addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("optimizer server failed: %v", err)
	}
}
