package graph_test

import (
	"testing"

	"paretoium/services/optimizer/domain"
	internalgraph "paretoium/services/optimizer/internal/graph"
)

func TestFromDomain_ValidGraph(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "CS101", Name: "Intro to CS", StudyHours: 20, Difficulty: 1},
		{ID: "CS102", Name: "Data Structures", StudyHours: 40, Difficulty: 2},
		{ID: "CS201", Name: "Algorithms", StudyHours: 35, Difficulty: 3},
	}
	edges := []domain.PrerequisiteEdge{
		{From: "CS101", To: "CS102"},
		{From: "CS102", To: "CS201"},
	}

	g, err := internalgraph.FromDomain(nodes, edges)
	if err != nil {
		t.Fatalf("expected valid graph, got error: %v", err)
	}

	if g.NodeCount() != 3 {
		t.Errorf("expected 3 nodes, got %d", g.NodeCount())
	}
	if g.EdgeCount() != 2 {
		t.Errorf("expected 2 edges, got %d", g.EdgeCount())
	}

	// Verify Gonum ID lookup works for a known course
	id, ok := g.GonumIDFor("CS101")
	if !ok {
		t.Fatalf("expected Gonum ID for CS101")
	}
	course, ok := g.CourseByNodeID(id)
	if !ok {
		t.Fatalf("expected course for Gonum ID %d", id)
	}
	if course.ID != "CS101" {
		t.Errorf("expected course ID CS101, got %s", course.ID)
	}
}

func TestFromDomain_UnknownEdgeEndpoint(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "CS101", Name: "Intro to CS", StudyHours: 20, Difficulty: 1},
	}
	edges := []domain.PrerequisiteEdge{
		{From: "CS101", To: "MISSING"},
	}

	_, err := internalgraph.FromDomain(nodes, edges)
	if err == nil {
		t.Error("expected error for unknown target node, got nil")
	}
}

func TestFromDomain_DuplicateEdgesSkipped(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "A", Name: "Course A", StudyHours: 10, Difficulty: 1},
		{ID: "B", Name: "Course B", StudyHours: 10, Difficulty: 1},
	}
	edges := []domain.PrerequisiteEdge{
		{From: "A", To: "B"},
		{From: "A", To: "B"}, // duplicate
	}

	g, err := internalgraph.FromDomain(nodes, edges)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if g.NodeCount() != 2 {
		t.Errorf("expected 2 nodes, got %d", g.NodeCount())
	}
}

func TestCurriculumGraph_EmptyGraph(t *testing.T) {
	g := internalgraph.NewCurriculumGraph()
	if g.NodeCount() != 0 {
		t.Errorf("expected 0 nodes in empty graph, got %d", g.NodeCount())
	}
}

