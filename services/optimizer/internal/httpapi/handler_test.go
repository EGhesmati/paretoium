package httpapi_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"paretoium/services/optimizer/internal/httpapi"
)

func TestHealth(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	response := httptest.NewRecorder()

	httpapi.NewRouter().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, response.Code)
	}
	var body map[string]string
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode health response: %v", err)
	}
	if body["status"] != "ok" {
		t.Fatalf("expected health status ok, got %q", body["status"])
	}
}

func TestOptimizeReturnsFrontierAndRecommendedPaths(t *testing.T) {
	body := `{
		"nodes": [
			{"id":"root","name":"Root","study_hours":5,"difficulty":1},
			{"id":"fast","name":"Fast","study_hours":10,"difficulty":5},
			{"id":"deep","name":"Deep","study_hours":50,"difficulty":1},
			{"id":"goal","name":"Goal","study_hours":5,"difficulty":1}
		],
		"edges": [
			{"from_id":"root","to_id":"fast","group_type":"AND"},
			{"from_id":"root","to_id":"deep","group_type":"AND"},
			{"from_id":"fast","to_id":"goal","group_type":"AND"},
			{"from_id":"deep","to_id":"goal","group_type":"AND"}
		],
		"constraints":{"target_course_ids":["goal"]}
	}`
	request := httptest.NewRequest(http.MethodPost, "/api/v1/optimize", strings.NewReader(body))
	response := httptest.NewRecorder()

	httpapi.NewRouter().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d: %s", http.StatusOK, response.Code, response.Body)
	}
	var result struct {
		ParetoFrontier []struct {
			Path []string `json:"path"`
		} `json:"pareto_frontier"`
		ExpressPath struct {
			Path []string `json:"path"`
		} `json:"express_path"`
		DeepMasteryPath struct {
			Path []string `json:"path"`
		} `json:"deep_mastery_path"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &result); err != nil {
		t.Fatalf("decode optimize response: %v", err)
	}
	if len(result.ParetoFrontier) != 2 {
		t.Fatalf("expected two Pareto paths, got %d", len(result.ParetoFrontier))
	}
	if strings.Join(result.ExpressPath.Path, ",") != "root,fast,goal" {
		t.Fatalf("unexpected express path: %v", result.ExpressPath.Path)
	}
	if strings.Join(result.DeepMasteryPath.Path, ",") != "root,deep,goal" {
		t.Fatalf("unexpected deep mastery path: %v", result.DeepMasteryPath.Path)
	}
}

func TestOptimizeRejectsInvalidRequests(t *testing.T) {
	tests := []struct {
		name string
		body string
	}{
		{name: "invalid json", body: `{"nodes":`},
		{name: "multiple values", body: `{} {}`},
		{name: "invalid graph", body: `{"nodes":[{"id":"a","name":"A","study_hours":1,"difficulty":1},{"id":"b","name":"B","study_hours":1,"difficulty":1}],"edges":[{"from_id":"a","to_id":"b","group_type":"AND"},{"from_id":"b","to_id":"a","group_type":"AND"}]}`},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodPost, "/api/v1/optimize", strings.NewReader(test.body))
			response := httptest.NewRecorder()
			httpapi.NewRouter().ServeHTTP(response, request)

			if response.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d: %s", http.StatusBadRequest, response.Code, response.Body)
			}
		})
	}
}

func FuzzOptimizeHandler(f *testing.F) {
	f.Add([]byte(`{}`))
	f.Add([]byte(`{"nodes":`))
	f.Add([]byte(`{"nodes":[],"edges":[],"constraints":{"max_depth":-1}}`))

	f.Fuzz(func(t *testing.T, body []byte) {
		request := httptest.NewRequest(http.MethodPost, "/api/v1/optimize", strings.NewReader(string(body)))
		response := httptest.NewRecorder()
		httpapi.NewRouter().ServeHTTP(response, request)
		if response.Code < 100 || response.Code > 599 {
			t.Fatalf("invalid HTTP status code %d", response.Code)
		}
	})
}
