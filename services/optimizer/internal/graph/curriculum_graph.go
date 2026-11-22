package graph

import (
	"fmt"

	gonumgraph "gonum.org/v1/gonum/graph"
	"gonum.org/v1/gonum/graph/simple"
	"gonum.org/v1/gonum/graph/topo"

	"paretoium/services/optimizer/domain"
)

// CurriculumGraph wraps simple.DirectedGraph and bridges domain models to Gonum's directed graph interfaces.
//
// String course IDs (e.g. "CS101") are mapped to int64 Gonum node IDs (1..N) and 0-based dense slice
// indices (0..N-1) for O(1) array access during pathfinding.
type CurriculumGraph struct {
	*simple.DirectedGraph

	// courses stores nodes in dense 0-based order (index = gonumID - 1) for O(1) slice lookups.
	courses []domain.CourseNode

	// idIndex maps string course ID → int64 Gonum ID (1..N).
	idIndex map[string]int64

	// topoIndices caches the 0-based topological node ordering once computed.
	topoIndices []int

	// Edges retains the original domain edges for downstream use (cycle detection, pathfinding).
	Edges []domain.PrerequisiteEdge
}

// NewCurriculumGraph initializes an empty Gonum-backed curriculum graph.
func NewCurriculumGraph() *CurriculumGraph {
	return &CurriculumGraph{
		DirectedGraph: simple.NewDirectedGraph(),
		idIndex:       make(map[string]int64),
	}
}

// BuildFromDomain populates the graph from domain node and edge slices.
//
// Each domain.CourseNode is registered as a simple.Node (int64) in Gonum's directed graph.
// Each domain.PrerequisiteEdge is added as a simple.WeightedEdge (weight = 1.0).
// Edge direction: Prerequisite → Target Course (i.e. FromID → ToID).
func (g *CurriculumGraph) BuildFromDomain(nodes []domain.CourseNode, edges []domain.PrerequisiteEdge) error {
	if _, err := domain.NewCurriculumGraph(nodes, edges); err != nil {
		return fmt.Errorf("invalid curriculum: %w", err)
	}

	g.courses = make([]domain.CourseNode, len(nodes))
	g.idIndex = make(map[string]int64, len(nodes))
	g.topoIndices = nil

	// Step 1: Register all nodes first so edges can safely reference them
	for i, course := range nodes {
		id := int64(i + 1) // Gonum reserves 0; start sequential IDs at 1
		g.courses[i] = course
		g.idIndex[course.ID] = id
		g.DirectedGraph.AddNode(simple.Node(id))
	}

	// Step 2: Add directed weighted edges (Prerequisite → Dependent)
	for _, edge := range edges {
		fromID, ok := g.idIndex[edge.Source()]
		if !ok {
			return fmt.Errorf("BuildFromDomain: unknown source course %q", edge.Source())
		}
		toID, ok := g.idIndex[edge.Target()]
		if !ok {
			return fmt.Errorf("BuildFromDomain: unknown target course %q", edge.Target())
		}

		// Skip only if this exact directed edge already exists
		if g.DirectedGraph.HasEdgeFromTo(fromID, toID) {
			continue
		}

		g.DirectedGraph.SetEdge(simple.WeightedEdge{
			F: simple.Node(fromID),
			T: simple.Node(toID),
			W: 1.0,
		})
	}

	g.Edges = edges
	return nil
}

// FromDomain is a convenience constructor: creates a new graph and calls BuildFromDomain.
func FromDomain(nodes []domain.CourseNode, edges []domain.PrerequisiteEdge) (*CurriculumGraph, error) {
	g := NewCurriculumGraph()
	if err := g.BuildFromDomain(nodes, edges); err != nil {
		return nil, err
	}
	return g, nil
}

// CourseByNodeID returns the domain.CourseNode for a Gonum int64 node ID in O(1).
func (g *CurriculumGraph) CourseByNodeID(id int64) (domain.CourseNode, bool) {
	idx := int(id - 1)
	if idx < 0 || idx >= len(g.courses) {
		return domain.CourseNode{}, false
	}
	return g.courses[idx], true
}

// Courses returns the dense 0-indexed slice of courses registered in the graph.
func (g *CurriculumGraph) Courses() []domain.CourseNode {
	return g.courses
}

// IndexFor returns the 0-based dense index (0..N-1) for a string course ID.
func (g *CurriculumGraph) IndexFor(courseID string) (int, bool) {
	id, ok := g.idIndex[courseID]
	if !ok {
		return -1, false
	}
	return int(id - 1), true
}

// GonumIDFor returns the Gonum int64 node ID for a string course ID.
func (g *CurriculumGraph) GonumIDFor(courseID string) (int64, bool) {
	id, ok := g.idIndex[courseID]
	return id, ok
}

// NodeCount returns the number of registered course nodes.
func (g *CurriculumGraph) NodeCount() int {
	return len(g.courses)
}

// CourseIDs returns a slice of all string course IDs registered in the graph.
func (g *CurriculumGraph) CourseIDs() []string {
	ids := make([]string, len(g.courses))
	for i := range g.courses {
		ids[i] = g.courses[i].ID
	}
	return ids
}

// CourseByStringID returns the domain.CourseNode for a string course ID.
func (g *CurriculumGraph) CourseByStringID(courseID string) (domain.CourseNode, bool) {
	gonumID, ok := g.idIndex[courseID]
	if !ok {
		return domain.CourseNode{}, false
	}
	return g.CourseByNodeID(gonumID)
}

// EdgeCount returns the number of domain edges stored on the graph.
func (g *CurriculumGraph) EdgeCount() int {
	return len(g.Edges)
}

// InjectEdgesForTest replaces the Edges slice for white-box testing of Validate().
// This allows tests to inject self-loops or duplicates that BuildFromDomain would reject.
func (g *CurriculumGraph) InjectEdgesForTest(edges []domain.PrerequisiteEdge) {
	g.Edges = edges
	g.topoIndices = nil
}

// TopoSortIndices returns 0-based node indices in topological order using gonum/graph/topo,
// caching the result so subsequent calls do not re-run Tarjan/Kahn sorting.
func (g *CurriculumGraph) TopoSortIndices() ([]int, error) {
	if len(g.topoIndices) == len(g.courses) && len(g.courses) > 0 {
		return g.topoIndices, nil
	}
	sorted, err := topo.Sort(g)
	if err != nil {
		return nil, fmt.Errorf("topological sort failed (graph has cycles): %w", err)
	}
	indices := make([]int, 0, len(sorted))
	for _, n := range sorted {
		idx := int(n.ID() - 1)
		if idx < 0 || idx >= len(g.courses) {
			return nil, fmt.Errorf("topoSort: unknown Gonum node id %d", n.ID())
		}
		indices = append(indices, idx)
	}
	g.topoIndices = indices
	return indices, nil
}

// DetectCycles uses gonum/graph/topo to find all directed cycles in the curriculum graph.
//
// Returns a slice of cycles (each cycle is a slice of int64 node IDs) and an error
// if any cycle exists. Returns (nil, nil) for a valid DAG.
func (g *CurriculumGraph) DetectCycles() ([][]int64, error) {
	cycles := topo.DirectedCyclesIn(g)

	if len(cycles) == 0 {
		return nil, nil
	}

	formattedCycles := make([][]int64, 0, len(cycles))
	for _, cycle := range cycles {
		path := make([]int64, 0, len(cycle))
		for _, node := range cycle {
			path = append(path, node.ID())
		}
		formattedCycles = append(formattedCycles, path)
	}
	return formattedCycles, fmt.Errorf("curriculum contains %d cycle(s)", len(cycles))
}

// Validate performs full domain validation of the curriculum graph:
//
//  1. Empty graph guard — a graph with no nodes is meaningless.
//  2. Duplicate edge detection — every (from, to) pair must appear at most once.
//  3. Self-loop detection — a course cannot list itself as a prerequisite.
//  4. Missing node reference — every edge endpoint must have a corresponding node.
//  5. Topological sort & cycle detection — confirms the DAG property in O(V+E) and caches
//     the topological order; only runs Johnson's cycle enumeration if a cycle is present.
func (g *CurriculumGraph) Validate() error {
	// 1. Empty graph guard
	if len(g.courses) == 0 {
		return fmt.Errorf("graph contains no nodes")
	}

	// 2 & 3. Scan domain edges for duplicate and self-referential prerequisites
	seen := make(map[[2]string]bool, len(g.Edges))
	for _, edge := range g.Edges {
		src, tgt := edge.Source(), edge.Target()

		// Self-loop
		if src == tgt {
			return fmt.Errorf("self-referential prerequisite: course %q lists itself", src)
		}

		// Missing source node reference
		if _, ok := g.idIndex[src]; !ok {
			return fmt.Errorf("missing node reference: edge source %q has no corresponding node", src)
		}

		// Missing target node reference
		if _, ok := g.idIndex[tgt]; !ok {
			return fmt.Errorf("missing node reference: edge target %q has no corresponding node", tgt)
		}

		// Duplicate edge
		key := [2]string{src, tgt}
		if seen[key] {
			return fmt.Errorf("duplicate prerequisite edge: %q → %q appears more than once", src, tgt)
		}
		seen[key] = true
	}

	// 4. Verify DAG property via O(V+E) topological sort (and cache the order).
	// Only invoke Johnson's cycle enumeration when a cycle actually exists.
	if _, topoErr := g.TopoSortIndices(); topoErr != nil {
		if cycles, err := g.DetectCycles(); err != nil {
			return fmt.Errorf("validation failed — cycles detected %v: %w", cycles, err)
		}
		return fmt.Errorf("topological sort failed: %w", topoErr)
	}

	return nil
}

// Compile-time interface checks
var _ gonumgraph.Node = simple.Node(0)
var _ gonumgraph.Directed = (*simple.DirectedGraph)(nil)
