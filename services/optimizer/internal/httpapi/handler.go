package httpapi

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"paretoium/services/optimizer/domain"
	"paretoium/services/optimizer/internal/graph"
	"paretoium/services/optimizer/internal/pareto"
	"paretoium/services/optimizer/internal/validator"

	"github.com/go-chi/chi/v5"
)

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
	router.Get("/healthz", health)
	router.Post("/api/v1/optimize", optimize)
	return router
}

func health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func optimize(w http.ResponseWriter, r *http.Request) {
	var request optimizeRequest
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("invalid JSON request: %v", err))
		return
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		writeError(w, http.StatusBadRequest, "request body must contain a single JSON value")
		return
	}

	if err := request.Constraints.Validate(); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := validator.ValidateGraph(request.Nodes, request.Edges); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	curriculum, err := graph.FromDomain(request.Nodes, request.Edges)
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
