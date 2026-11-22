package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"paretoium/services/optimizer/domain"
	"paretoium/services/optimizer/internal/pareto"
	"paretoium/services/optimizer/internal/validator"

	"github.com/go-chi/chi/v5"
)

const maxRequestBodyBytes = 1 << 20

type optimizeRequest struct {
	Nodes       []domain.CourseNode       `json:"nodes"`
	Edges       []domain.PrerequisiteEdge `json:"edges"`
	Constraints domain.ConstraintSet      `json:"constraints"`
}

type optimizeResponse struct {
	ParetoFrontier  []pareto.Label `json:"pareto_frontier"`
	ExpressPath     *pareto.Label  `json:"express_path"`
	DeepMasteryPath *pareto.Label  `json:"deep_mastery_path"`
}

// NewRouter creates the optimizer's HTTP routes.
func NewRouter() http.Handler {
	router := chi.NewRouter()
	router.Use(corsMiddleware)
	router.Get("/healthz", health)
	router.Post("/api/v1/optimize", optimize)
	return router
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		allowedOrigin := strings.TrimSpace(os.Getenv("OPTIMIZER_CORS_ORIGIN"))
		if allowedOrigin == "" {
			allowedOrigin = "http://localhost:3000"
		}

		if origin == allowedOrigin {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func optimize(w http.ResponseWriter, r *http.Request) {
	var request optimizeRequest
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxRequestBodyBytes))
	if err := decoder.Decode(&request); err != nil {
		if isRequestBodyTooLarge(err) {
			writeError(w, http.StatusRequestEntityTooLarge, "request body exceeds 1 MiB limit")
			return
		}
		writeError(w, http.StatusBadRequest, fmt.Sprintf("invalid JSON request: %v", err))
		return
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		if isRequestBodyTooLarge(err) {
			writeError(w, http.StatusRequestEntityTooLarge, "request body exceeds 1 MiB limit")
			return
		}
		writeError(w, http.StatusBadRequest, "request body must contain a single JSON value")
		return
	}

	if err := request.Constraints.Validate(); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	curriculum, err := validator.BuildValidatedGraph(request.Nodes, request.Edges)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	labels, err := pareto.RunPareto(curriculum, request.Constraints)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	express, deepMastery := pareto.SelectPaths(labels)
	writeJSON(w, http.StatusOK, optimizeResponse{
		ParetoFrontier:  labels,
		ExpressPath:     express,
		DeepMasteryPath: deepMastery,
	})
}

func isRequestBodyTooLarge(err error) bool {
	var maxBytesError *http.MaxBytesError
	return errors.As(err, &maxBytesError)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("failed to encode optimizer response: %v", err)
	}
}
