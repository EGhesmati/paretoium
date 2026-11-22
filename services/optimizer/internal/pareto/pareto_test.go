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

// TestRunPareto_DynamicConstraintsAndDistinctPaths verifies that a realistic curriculum DAG
// produces distinct Express (fastest) and Deep Mastery (deepest) routes, and that tightening
// Time Budget, Difficulty Cap, or Max Depth dynamically shifts the recommended Deep Mastery route.
func TestRunPareto_DynamicConstraintsAndDistinctPaths(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "CS101", Name: "Intro CS", StudyHours: 20, Difficulty: 1},
		{ID: "WEB101", Name: "Web Basics", StudyHours: 15, Difficulty: 1},
		{ID: "WEB102", Name: "Full-Stack", StudyHours: 35, Difficulty: 3},
		{ID: "CS102", Name: "DSA", StudyHours: 40, Difficulty: 2},
		{ID: "CS203", Name: "Databases", StudyHours: 30, Difficulty: 2},
		{ID: "CS201", Name: "Arch", StudyHours: 35, Difficulty: 3},
		{ID: "CS202", Name: "OS", StudyHours: 45, Difficulty: 4},
		{ID: "CS301", Name: "Networking", StudyHours: 30, Difficulty: 3},
		{ID: "CS302", Name: "Distributed", StudyHours: 50, Difficulty: 5},
		{ID: "CAP500", Name: "Capstone", StudyHours: 60, Difficulty: 5},
	}
	edges := []domain.PrerequisiteEdge{
		{FromID: "CS101", ToID: "WEB101", GroupType: domain.PrereqGroupAND},
		{FromID: "WEB101", ToID: "WEB102", GroupType: domain.PrereqGroupAND},
		{FromID: "WEB102", ToID: "CAP500", GroupType: domain.PrereqGroupAND},
		{FromID: "CS101", ToID: "CS102", GroupType: domain.PrereqGroupAND},
		{FromID: "CS102", ToID: "CS203", GroupType: domain.PrereqGroupAND},
		{FromID: "CS203", ToID: "WEB102", GroupType: domain.PrereqGroupOR},
		{FromID: "CS102", ToID: "CS201", GroupType: domain.PrereqGroupAND},
		{FromID: "CS201", ToID: "CS202", GroupType: domain.PrereqGroupAND},
		{FromID: "CS202", ToID: "CS301", GroupType: domain.PrereqGroupAND},
		{FromID: "CS301", ToID: "CS302", GroupType: domain.PrereqGroupAND},
		{FromID: "CS302", ToID: "CAP500", GroupType: domain.PrereqGroupAND},
	}
	g := buildGraph(t, nodes, edges)

	// Generous budget with MaxDepth=7: Express should take 4-course Web route; Deep Mastery should take 7-course Systems route
	labels, err := pareto.RunPareto(g, domain.ConstraintSet{
		TargetCourseIDs:    []string{"CAP500"},
		CompletedCourseIDs: []string{"CS101"},
		MaxStudyHours:      300,
		MaxDifficulty:      30,
		MaxDepth:           7,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	express, deep := pareto.SelectPaths(labels)
	if express == nil || deep == nil {
		t.Fatalf("expected both express and deep mastery paths, got express=%v deep=%v", express, deep)
	}
	wantExpress := []string{"CS101", "WEB101", "WEB102", "CAP500"}
	wantDeep := []string{"CS101", "CS102", "CS201", "CS202", "CS301", "CS302", "CAP500"}
	if !equalStringSlice(express.Path, wantExpress) {
		t.Errorf("expected express=%v, got %v", wantExpress, express.Path)
	}
	if !equalStringSlice(deep.Path, wantDeep) {
		t.Errorf("expected deep=%v, got %v", wantDeep, deep.Path)
	}
	if express.TotalHours != 110 {
		t.Errorf("expected completed CS101 to reduce express hours to 110, got %.1f", express.TotalHours)
	}

	// Tightening MaxDepth to 5 with 200h budget should shift Deep Mastery to a 5-course route
	labelsMid, err := pareto.RunPareto(g, domain.ConstraintSet{
		TargetCourseIDs:    []string{"CAP500"},
		CompletedCourseIDs: []string{"CS101"},
		MaxStudyHours:      200,
		MaxDifficulty:      30,
		MaxDepth:           5,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	_, deepMid := pareto.SelectPaths(labelsMid)
	if deepMid == nil || len(deepMid.Path) != 5 {
		t.Errorf("expected mid-budget 5-course deep path, got %v", deepMid)
	}

	// Increasing MaxDepth to 8 should expand the study plan to 8 courses and increase CoveragePct
	labelsExpanded, err := pareto.RunPareto(g, domain.ConstraintSet{
		TargetCourseIDs:    []string{"CAP500"},
		CompletedCourseIDs: []string{"CS101"},
		MaxStudyHours:      350,
		MaxDifficulty:      35,
		MaxDepth:           8,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expShort, deepExpanded := pareto.SelectPaths(labelsExpanded)
	if deepExpanded == nil || len(deepExpanded.Path) != 8 {
		t.Errorf("expected expanded 8-course deep path, got %v", deepExpanded)
	}
	if expShort != nil && deepExpanded != nil && deepExpanded.CoveragePct <= expShort.CoveragePct {
		t.Errorf("expected deep mastery coverage (%.0f%%) > express coverage (%.0f%%)", deepExpanded.CoveragePct, expShort.CoveragePct)
	}
	if expShort != nil && len(expShort.MissingPrereqs) == 0 {
		t.Errorf("expected express shortcut to flag skipped core foundations in MissingPrereqs")
	}

	// Tightening MaxDepth to 4 should shift Deep Mastery to the 4-course route
	labelsShallow, err := pareto.RunPareto(g, domain.ConstraintSet{
		TargetCourseIDs:    []string{"CAP500"},
		CompletedCourseIDs: []string{"CS101"},
		MaxStudyHours:      300,
		MaxDifficulty:      30,
		MaxDepth:           4,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	_, deepShallow := pareto.SelectPaths(labelsShallow)
	if deepShallow == nil || !equalStringSlice(deepShallow.Path, wantExpress) {
		t.Errorf("expected shallow-depth deep=%v, got %v", wantExpress, deepShallow)
	}
}
