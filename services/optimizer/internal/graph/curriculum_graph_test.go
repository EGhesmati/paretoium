package graph_test

import (
	"testing"

	"paretoium/services/optimizer/domain"
	internalgraph "paretoium/services/optimizer/internal/graph"
)

// ─── NewCurriculumGraph ───────────────────────────────────────────────────────

func TestNewCurriculumGraph_Empty(t *testing.T) {
	g := internalgraph.NewCurriculumGraph()
	if g.NodeCount() != 0 {
		t.Errorf("expected 0 nodes in empty graph, got %d", g.NodeCount())
	}
	if g.EdgeCount() != 0 {
		t.Errorf("expected 0 edges in empty graph, got %d", g.EdgeCount())
	}
}

// ─── BuildFromDomain ─────────────────────────────────────────────────────────

func TestBuildFromDomain_ValidDAG(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "CS101", Name: "Intro to CS", StudyHours: 20, Difficulty: 1},
		{ID: "CS102", Name: "Data Structures", StudyHours: 40, Difficulty: 2},
		{ID: "CS201", Name: "Algorithms", StudyHours: 35, Difficulty: 3},
	}
	edges := []domain.PrerequisiteEdge{
		{From: "CS101", To: "CS102"},
		{From: "CS102", To: "CS201"},
	}

	g := internalgraph.NewCurriculumGraph()
	if err := g.BuildFromDomain(nodes, edges); err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if g.NodeCount() != 3 {
		t.Errorf("expected 3 nodes, got %d", g.NodeCount())
	}
	if g.EdgeCount() != 2 {
		t.Errorf("expected 2 edges, got %d", g.EdgeCount())
	}
}

func TestBuildFromDomain_NodeRegisteredAsSimpleNode(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "CS101", Name: "Intro to CS", StudyHours: 20, Difficulty: 1},
	}

	g := internalgraph.NewCurriculumGraph()
	if err := g.BuildFromDomain(nodes, nil); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	id, ok := g.GonumIDFor("CS101")
	if !ok {
		t.Fatalf("expected Gonum ID for CS101 to be registered")
	}

	// Verify the underlying DirectedGraph holds the node
	if g.Node(id) == nil {
		t.Errorf("expected Gonum DirectedGraph to contain node with ID %d", id)
	}

	course, ok := g.CourseByNodeID(id)
	if !ok {
		t.Fatalf("expected CourseByNodeID to return a course")
	}
	if course.ID != "CS101" {
		t.Errorf("expected course ID CS101, got %s", course.ID)
	}
}

func TestBuildFromDomain_DirectedEdgeDirection(t *testing.T) {
	// Edge should go: Prerequisite (CS101) → Dependent (CS102)
	nodes := []domain.CourseNode{
		{ID: "CS101", Name: "Intro to CS", StudyHours: 20, Difficulty: 1},
		{ID: "CS102", Name: "Data Structures", StudyHours: 40, Difficulty: 2},
	}
	edges := []domain.PrerequisiteEdge{
		{From: "CS101", To: "CS102"},
	}

	g := internalgraph.NewCurriculumGraph()
	if err := g.BuildFromDomain(nodes, edges); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	fromID, _ := g.GonumIDFor("CS101")
	toID, _ := g.GonumIDFor("CS102")

	// Forward edge CS101 → CS102 must exist
	if !g.HasEdgeFromTo(fromID, toID) {
		t.Errorf("expected directed edge CS101 -> CS102 to exist in the Gonum graph")
	}

	// Reverse edge must NOT exist (this is a DAG, not undirected)
	if g.HasEdgeFromTo(toID, fromID) {
		t.Errorf("unexpected reverse edge CS102 -> CS101 found in directed graph")
	}
}

func TestBuildFromDomain_DuplicateEdgesSkipped(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "A", Name: "Course A", StudyHours: 10, Difficulty: 1},
		{ID: "B", Name: "Course B", StudyHours: 10, Difficulty: 1},
	}
	edges := []domain.PrerequisiteEdge{
		{From: "A", To: "B"},
		{From: "A", To: "B"}, // duplicate — should be silently skipped
	}

	g := internalgraph.NewCurriculumGraph()
	if err := g.BuildFromDomain(nodes, edges); err != nil {
		t.Fatalf("expected no error on duplicate edges, got: %v", err)
	}

	aID, _ := g.GonumIDFor("A")
	bID, _ := g.GonumIDFor("B")

	// Gonum's DirectedGraph.From returns edges from a node — should only have 1
	fromEdges := g.From(aID)
	count := 0
	for fromEdges.Next() {
		if fromEdges.Node().ID() == bID {
			count++
		}
	}
	if count != 1 {
		t.Errorf("expected exactly 1 edge A->B in the Gonum graph, got %d", count)
	}
}

func TestBuildFromDomain_UnknownSourceReturnsError(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "CS101", Name: "Intro to CS", StudyHours: 20, Difficulty: 1},
	}
	edges := []domain.PrerequisiteEdge{
		{From: "MISSING", To: "CS101"},
	}

	g := internalgraph.NewCurriculumGraph()
	err := g.BuildFromDomain(nodes, edges)
	if err == nil {
		t.Error("expected error for unknown source node, got nil")
	}
}

func TestBuildFromDomain_UnknownTargetReturnsError(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "CS101", Name: "Intro to CS", StudyHours: 20, Difficulty: 1},
	}
	edges := []domain.PrerequisiteEdge{
		{From: "CS101", To: "MISSING"},
	}

	g := internalgraph.NewCurriculumGraph()
	err := g.BuildFromDomain(nodes, edges)
	if err == nil {
		t.Error("expected error for unknown target node, got nil")
	}
}

func TestBuildFromDomain_RejectsInvalidNodesBeforeMutatingGraph(t *testing.T) {
	tests := []struct {
		name  string
		nodes []domain.CourseNode
	}{
		{
			name: "duplicate node ID",
			nodes: []domain.CourseNode{
				{ID: "A", Name: "Course A"},
				{ID: "A", Name: "Duplicate Course A"},
			},
		},
		{
			name: "empty node name",
			nodes: []domain.CourseNode{
				{ID: "A"},
			},
		},
		{
			name: "negative study hours",
			nodes: []domain.CourseNode{
				{ID: "A", Name: "Course A", StudyHours: -1},
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			g := internalgraph.NewCurriculumGraph()
			if err := g.BuildFromDomain(test.nodes, nil); err == nil {
				t.Fatal("expected invalid nodes to be rejected")
			}
			if g.NodeCount() != 0 || g.EdgeCount() != 0 {
				t.Fatalf("invalid input mutated graph: nodes=%d edges=%d", g.NodeCount(), g.EdgeCount())
			}
		})
	}
}

func TestBuildFromDomain_UnknownReferenceDoesNotMutateGraph(t *testing.T) {
	g := internalgraph.NewCurriculumGraph()
	err := g.BuildFromDomain(
		[]domain.CourseNode{{ID: "A", Name: "Course A"}},
		[]domain.PrerequisiteEdge{{From: "A", To: "MISSING"}},
	)
	if err == nil {
		t.Fatal("expected error for unknown target node")
	}
	if g.NodeCount() != 0 || g.EdgeCount() != 0 {
		t.Fatalf("invalid input mutated graph: nodes=%d edges=%d", g.NodeCount(), g.EdgeCount())
	}
}

// ─── FromDomain convenience constructor ──────────────────────────────────────

func TestFromDomain_ConvenienceConstructor(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "X", Name: "Course X", StudyHours: 10, Difficulty: 1},
		{ID: "Y", Name: "Course Y", StudyHours: 10, Difficulty: 2},
	}
	edges := []domain.PrerequisiteEdge{
		{From: "X", To: "Y"},
	}

	g, err := internalgraph.FromDomain(nodes, edges)
	if err != nil {
		t.Fatalf("FromDomain returned error: %v", err)
	}
	if g.NodeCount() != 2 || g.EdgeCount() != 1 {
		t.Errorf("unexpected graph size: nodes=%d edges=%d", g.NodeCount(), g.EdgeCount())
	}
}

// ─── Validate ─────────────────────────────────────────────────────────────────

func TestValidate_EmptyGraph(t *testing.T) {
	g := internalgraph.NewCurriculumGraph()
	if err := g.Validate(); err == nil {
		t.Error("expected error for empty graph, got nil")
	}
}

func TestValidate_ValidDAG(t *testing.T) {
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
		t.Fatalf("unexpected build error: %v", err)
	}
	if err := g.Validate(); err != nil {
		t.Errorf("expected valid DAG, got error: %v", err)
	}
}

func TestValidate_SelfLoop(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "A", Name: "Course A", StudyHours: 10, Difficulty: 1},
	}
	// Self-loops are injected directly to the Edges slice to bypass BuildFromDomain
	g := internalgraph.NewCurriculumGraph()
	_ = g.BuildFromDomain(nodes, nil)
	g.InjectEdgesForTest([]domain.PrerequisiteEdge{
		{From: "A", To: "A"},
	})
	if err := g.Validate(); err == nil {
		t.Error("expected error for self-loop, got nil")
	}
}

func TestValidate_DuplicateEdge(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "A", Name: "Course A", StudyHours: 10, Difficulty: 1},
		{ID: "B", Name: "Course B", StudyHours: 10, Difficulty: 1},
	}
	// Build with one edge, then inject duplicate into Edges list
	g, err := internalgraph.FromDomain(nodes, []domain.PrerequisiteEdge{
		{From: "A", To: "B"},
	})
	if err != nil {
		t.Fatalf("unexpected build error: %v", err)
	}
	// Manually inject duplicate into the Edges list
	g.InjectEdgesForTest([]domain.PrerequisiteEdge{
		{From: "A", To: "B"},
		{From: "A", To: "B"}, // duplicate
	})
	if err := g.Validate(); err == nil {
		t.Error("expected error for duplicate edge, got nil")
	}
}

func TestValidate_DirectCycle(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "A", Name: "Course A", StudyHours: 10, Difficulty: 1},
		{ID: "B", Name: "Course B", StudyHours: 10, Difficulty: 1},
	}
	edges := []domain.PrerequisiteEdge{
		{From: "A", To: "B"},
		{From: "B", To: "A"}, // direct cycle
	}
	g, err := internalgraph.FromDomain(nodes, edges)
	if err != nil {
		t.Fatalf("unexpected build error: %v", err)
	}
	if err := g.Validate(); err == nil {
		t.Error("expected error for direct cycle A->B->A, got nil")
	}
}

func TestValidate_IndirectCycle(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "A", Name: "Course A", StudyHours: 10, Difficulty: 1},
		{ID: "B", Name: "Course B", StudyHours: 10, Difficulty: 1},
		{ID: "C", Name: "Course C", StudyHours: 10, Difficulty: 1},
	}
	edges := []domain.PrerequisiteEdge{
		{From: "A", To: "B"},
		{From: "B", To: "C"},
		{From: "C", To: "A"}, // indirect cycle
	}
	g, err := internalgraph.FromDomain(nodes, edges)
	if err != nil {
		t.Fatalf("unexpected build error: %v", err)
	}
	if err := g.Validate(); err == nil {
		t.Error("expected error for indirect cycle A->B->C->A, got nil")
	}
}

func TestValidate_SingleNodeNoEdges(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "CS101", Name: "Intro to CS", StudyHours: 20, Difficulty: 1},
	}
	g, err := internalgraph.FromDomain(nodes, nil)
	if err != nil {
		t.Fatalf("unexpected build error: %v", err)
	}
	if err := g.Validate(); err != nil {
		t.Errorf("expected single isolated node to be valid, got error: %v", err)
	}
}
