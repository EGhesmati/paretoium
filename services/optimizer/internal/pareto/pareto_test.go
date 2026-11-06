package pareto_test

import (
	"fmt"
	"testing"

	"paretoium/services/optimizer/domain"
	"paretoium/services/optimizer/internal/graph"
	"paretoium/services/optimizer/internal/pareto"
)

// helpers ----------------------------------------------------------------

// buildGraph creates a CurriculumGraph from inline nodes and edges.
func buildGraph(t *testing.T, nodes []domain.CourseNode, edges []domain.PrerequisiteEdge) *graph.CurriculumGraph {
	t.Helper()
	g, err := graph.FromDomain(nodes, edges)
	if err != nil {
		t.Fatalf("buildGraph: %v", err)
	}
	return g
}

// noConstraints returns a ConstraintSet with no limits and the given targets.
func noConstraints(targets ...string) domain.ConstraintSet {
	return domain.ConstraintSet{TargetCourseIDs: targets}
}

// containsPath reports whether labels includes a label whose Path matches want.
func containsPath(labels []pareto.Label, want []string) bool {
	for _, lbl := range labels {
		if equalStringSlice(lbl.Path, want) {
			return true
		}
	}
	return false
}

func equalStringSlice(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func TestRunPareto_MaxDepthConstraint(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "A", Name: "A", StudyHours: 1, Difficulty: 1},
		{ID: "B", Name: "B", StudyHours: 1, Difficulty: 1},
		{ID: "C", Name: "C", StudyHours: 1, Difficulty: 1},
	}
	edges := []domain.PrerequisiteEdge{
		{FromID: "A", ToID: "B", GroupType: domain.PrereqGroupAND},
		{FromID: "B", ToID: "C", GroupType: domain.PrereqGroupAND},
	}
	g := buildGraph(t, nodes, edges)

	labels, err := pareto.RunPareto(g, domain.ConstraintSet{
		MaxDepth:        2,
		TargetCourseIDs: []string{"C"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(labels) != 0 {
		t.Fatalf("expected no labels deeper than 2 courses, got %+v", labels)
	}
}

func TestSelectPaths(t *testing.T) {
	labels := []pareto.Label{
		{Path: []string{"deep"}, TotalHours: 60, TotalDifficulty: 3},
		{Path: []string{"express"}, TotalHours: 20, TotalDifficulty: 7},
	}
	express, deep := pareto.SelectPaths(labels)
	if express == nil || !equalStringSlice(express.Path, []string{"express"}) {
		t.Fatalf("expected express path, got %v", express)
	}
	if deep == nil || !equalStringSlice(deep.Path, []string{"deep"}) {
		t.Fatalf("expected deep mastery path, got %v", deep)
	}
	if express, deep := pareto.SelectPaths(nil); express != nil || deep != nil {
		t.Fatalf("expected nil paths for an empty frontier, got %v and %v", express, deep)
	}
}

// Day 10–11 tests --------------------------------------------------------

// TestRunPareto_LinearChain verifies that a simple A → B → C chain produces
// exactly one Pareto-optimal label (the only possible path).
func TestRunPareto_LinearChain(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "A", Name: "A", StudyHours: 10, Difficulty: 1},
		{ID: "B", Name: "B", StudyHours: 20, Difficulty: 2},
		{ID: "C", Name: "C", StudyHours: 30, Difficulty: 3},
	}
	edges := []domain.PrerequisiteEdge{
		{FromID: "A", ToID: "B", GroupType: domain.PrereqGroupAND},
		{FromID: "B", ToID: "C", GroupType: domain.PrereqGroupAND},
	}
	g := buildGraph(t, nodes, edges)

	labels, err := pareto.RunPareto(g, noConstraints("C"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(labels) != 1 {
		t.Fatalf("expected 1 label, got %d: %+v", len(labels), labels)
	}
	lbl := labels[0]
	if lbl.TotalHours != 60 {
		t.Errorf("expected TotalHours=60, got %.1f", lbl.TotalHours)
	}
	if lbl.TotalDifficulty != 6 {
		t.Errorf("expected TotalDifficulty=6, got %.1f", lbl.TotalDifficulty)
	}
	if !equalStringSlice(lbl.Path, []string{"A", "B", "C"}) {
		t.Errorf("unexpected path: %v", lbl.Path)
	}
}

// TestRunPareto_TwoBranches tests a diamond graph where two non-dominated paths exist:
//
//	Root → Fast (low hours, high difficulty) → Goal
//	Root → Deep (high hours, low difficulty) → Goal
//
// Both should appear in the Pareto frontier.
func TestRunPareto_TwoBranches(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "Root", Name: "Root", StudyHours: 5, Difficulty: 1},
		{ID: "Fast", Name: "Fast", StudyHours: 10, Difficulty: 5}, // fewer hours, harder
		{ID: "Deep", Name: "Deep", StudyHours: 50, Difficulty: 1}, // more hours, easier
		{ID: "Goal", Name: "Goal", StudyHours: 5, Difficulty: 1},
	}
	edges := []domain.PrerequisiteEdge{
		{FromID: "Root", ToID: "Fast", GroupType: domain.PrereqGroupAND},
		{FromID: "Root", ToID: "Deep", GroupType: domain.PrereqGroupAND},
		{FromID: "Fast", ToID: "Goal", GroupType: domain.PrereqGroupAND},
		{FromID: "Deep", ToID: "Goal", GroupType: domain.PrereqGroupAND},
	}
	g := buildGraph(t, nodes, edges)

	labels, err := pareto.RunPareto(g, noConstraints("Goal"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Both paths should be non-dominated because neither is strictly better on both axes
	wantFast := []string{"Root", "Fast", "Goal"} // hours=20, diff=7
	wantDeep := []string{"Root", "Deep", "Goal"} // hours=60, diff=3

	if !containsPath(labels, wantFast) {
		t.Errorf("expected fast path %v in frontier, got: %+v", wantFast, labels)
	}
	if !containsPath(labels, wantDeep) {
		t.Errorf("expected deep path %v in frontier, got: %+v", wantDeep, labels)
	}
}

// TestRunPareto_BudgetConstraint verifies that labels exceeding MaxStudyHours are pruned.
func TestRunPareto_BudgetConstraint(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "A", Name: "A", StudyHours: 100, Difficulty: 1},
		{ID: "B", Name: "B", StudyHours: 200, Difficulty: 2},
	}
	edges := []domain.PrerequisiteEdge{
		{FromID: "A", ToID: "B", GroupType: domain.PrereqGroupAND},
	}
	g := buildGraph(t, nodes, edges)

	cs := domain.ConstraintSet{
		MaxStudyHours:   50, // both nodes exceed this individually
		TargetCourseIDs: []string{"B"},
	}

	labels, err := pareto.RunPareto(g, cs)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(labels) != 0 {
		t.Errorf("expected 0 labels with budget=50h, got %d: %+v", len(labels), labels)
	}
}

// TestRunPareto_DifficultyConstraint verifies that labels exceeding MaxDifficulty are pruned.
func TestRunPareto_DifficultyConstraint(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "A", Name: "A", StudyHours: 10, Difficulty: 3},
		{ID: "B", Name: "B", StudyHours: 10, Difficulty: 3},
	}
	edges := []domain.PrerequisiteEdge{
		{FromID: "A", ToID: "B", GroupType: domain.PrereqGroupAND},
	}
	g := buildGraph(t, nodes, edges)

	cs := domain.ConstraintSet{
		MaxDifficulty:   5, // cumulative diff would be 6 — pruned
		TargetCourseIDs: []string{"B"},
	}

	labels, err := pareto.RunPareto(g, cs)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(labels) != 0 {
		t.Errorf("expected 0 labels with max_difficulty=5, got %d", len(labels))
	}
}

// TestRunPareto_NoTargets_AllNodes verifies that when no targets are specified,
// labels are collected from all reachable nodes.
func TestRunPareto_NoTargets_AllNodes(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "X", Name: "X", StudyHours: 5, Difficulty: 1},
		{ID: "Y", Name: "Y", StudyHours: 10, Difficulty: 2},
	}
	edges := []domain.PrerequisiteEdge{
		{FromID: "X", ToID: "Y", GroupType: domain.PrereqGroupAND},
	}
	g := buildGraph(t, nodes, edges)

	labels, err := pareto.RunPareto(g, domain.ConstraintSet{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(labels) == 0 {
		t.Error("expected at least one label when no targets specified")
	}
}

// TestRunPareto_NilGraph verifies that a nil graph returns an error.
func TestRunPareto_NilGraph(t *testing.T) {
	_, err := pareto.RunPareto(nil, domain.ConstraintSet{})
	if err == nil {
		t.Error("expected error for nil graph, got nil")
	}
}

// Day 12 tests -----------------------------------------------------------

// TestMaxLabelsPerNode verifies that the ParetoSet never grows beyond MaxLabelsPerNode.
// We build a wide fan-out graph with many parallel paths to exercise the cap.
func TestMaxLabelsPerNode(t *testing.T) {
	// 1 root → numMiddle middle nodes → 1 target.
	// Each middle node has strictly increasing hours and decreasing difficulty,
	// so no two middle-path labels dominate each other — maximising frontier size.
	const numMiddle = 600

	nodes := make([]domain.CourseNode, 0, numMiddle+2)
	nodes = append(nodes, domain.CourseNode{ID: "root", Name: "Root", StudyHours: 0, Difficulty: 0})
	for i := 0; i < numMiddle; i++ {
		nodes = append(nodes, domain.CourseNode{
			ID:         fmt.Sprintf("m%d", i),
			Name:       fmt.Sprintf("Middle%d", i),
			StudyHours: float64(i + 1),
			Difficulty: float64(numMiddle - i),
		})
	}
	nodes = append(nodes, domain.CourseNode{ID: "target", Name: "Target", StudyHours: 1, Difficulty: 1})

	edges := make([]domain.PrerequisiteEdge, 0, numMiddle*2)
	for i := 0; i < numMiddle; i++ {
		mid := fmt.Sprintf("m%d", i)
		edges = append(edges,
			domain.PrerequisiteEdge{FromID: "root", ToID: mid, GroupType: domain.PrereqGroupAND},
			domain.PrerequisiteEdge{FromID: mid, ToID: "target", GroupType: domain.PrereqGroupAND},
		)
	}

	g := buildGraph(t, nodes, edges)

	labels, err := pareto.RunPareto(g, noConstraints("target"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(labels) > pareto.MaxLabelsPerNode {
		t.Errorf("label count %d exceeds MaxLabelsPerNode=%d", len(labels), pareto.MaxLabelsPerNode)
	}
}
