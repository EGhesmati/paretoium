package validator_test

import (
	"encoding/json"
	"os"
	"testing"

	"paretoium/services/optimizer/domain"
	"paretoium/services/optimizer/internal/validator"
)

// GraphPayload mirrors the structure of curriculum.json
type GraphPayload struct {
	Nodes []domain.CourseNode      `json:"nodes"`
	Edges []domain.PrerequisiteEdge `json:"edges"`
}

// TestValidate_Valid15NodeGraph verifies that a valid 15-node DAG passes cycle detection.
func TestValidate_Valid15NodeGraph(t *testing.T) {
	data, err := os.ReadFile("testdata/curriculum.json")
	if err != nil {
		data, err = os.ReadFile("../../testdata/curriculum.json")
	}
	if err != nil {
		t.Fatalf("Failed to read sample curriculum JSON: %v", err)
	}

	var payload GraphPayload
	if err := json.Unmarshal(data, &payload); err != nil {
		t.Fatalf("Failed to parse JSON: %v", err)
	}

	err = validator.ValidateGraph(payload.Nodes, payload.Edges)
	if err != nil {
		t.Errorf("Expected valid DAG, but got error: %v", err)
	}
}

func TestValidate_EmptyGraph(t *testing.T) {
	if err := validator.ValidateGraph(nil, nil); err == nil {
		t.Fatal("expected error for empty graph, got nil")
	}
}

func TestValidate_SingleNodeNoEdges(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "CS101", Name: "Intro to CS", StudyHours: 20, Difficulty: 1},
	}

	if err := validator.ValidateGraph(nodes, nil); err != nil {
		t.Fatalf("expected single isolated node to be valid, got error: %v", err)
	}
}

// TestValidate_DetectDirectCycle verifies that a simple A -> B -> A cycle is detected.
func TestValidate_DetectDirectCycle(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "A", Name: "Course A"},
		{ID: "B", Name: "Course B"},
	}
	edges := []domain.PrerequisiteEdge{
		{From: "A", To: "B"},
		{From: "B", To: "A"}, // Direct cycle
	}

	err := validator.ValidateGraph(nodes, edges)
	if err == nil {
		t.Error("Expected error for direct cycle A -> B -> A, but got nil")
	}
}

// TestValidate_DetectIndirectCycle verifies that a deeper cyclic path A -> B -> C -> A is detected.
func TestValidate_DetectIndirectCycle(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "A", Name: "Course A"},
		{ID: "B", Name: "Course B"},
		{ID: "C", Name: "Course C"},
	}
	edges := []domain.PrerequisiteEdge{
		{From: "A", To: "B"},
		{From: "B", To: "C"},
		{From: "C", To: "A"}, // Indirect cycle
	}

	err := validator.ValidateGraph(nodes, edges)
	if err == nil {
		t.Error("Expected error for indirect cycle A -> B -> C -> A, but got nil")
	}
}

// TestValidate_SelfLoop verifies that a self-referencing edge A -> A is detected.
func TestValidate_SelfLoop(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "A", Name: "Course A"},
	}
	edges := []domain.PrerequisiteEdge{
		{From: "A", To: "A"}, // Self-loop
	}

	err := validator.ValidateGraph(nodes, edges)
	if err == nil {
		t.Error("Expected error for self-loop edge A -> A, but got nil")
	}
}
