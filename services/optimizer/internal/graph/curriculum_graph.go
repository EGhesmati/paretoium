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
// String course IDs (e.g. "CS101") are mapped to int64 Gonum node IDs using a sequential index,
// because Gonum's simple.Node is just an int64.
type CurriculumGraph struct {
	*simple.DirectedGraph

	// courseMap maps int64 Gonum ID → original domain.CourseNode
	courseMap map[int64]domain.CourseNode

	// idIndex maps string course ID → int64 Gonum ID
	idIndex map[string]int64

	// Edges retains the original domain edges for downstream use (cycle detection, pathfinding)
	Edges []domain.PrerequisiteEdge
}

// NewCurriculumGraph initializes an empty Gonum-backed curriculum graph.
func NewCurriculumGraph() *CurriculumGraph {
	return &CurriculumGraph{
		DirectedGraph: simple.NewDirectedGraph(),
		courseMap:     make(map[int64]domain.CourseNode),
		idIndex:       make(map[string]int64),
	}
}

// BuildFromDomain populates the graph from domain node and edge slices.
//
// Each domain.CourseNode is registered as a simple.Node (int64) in Gonum's directed graph.
// Each domain.PrerequisiteEdge is added as a simple.WeightedEdge (weight = 1.0).
// Edge direction: Prerequisite → Target Course (i.e. FromID → ToID).
func (g *CurriculumGraph) BuildFromDomain(nodes []domain.CourseNode, edges []domain.PrerequisiteEdge) error {
	// Step 1: Register all nodes first so edges can safely reference them
	for i, course := range nodes {
		id := int64(i + 1) // Gonum reserves 0; start sequential IDs at 1
		g.courseMap[id] = course
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

		// Skip duplicate edges silently — simple.DirectedGraph panics on duplicates
		if g.DirectedGraph.HasEdgeBetween(fromID, toID) {
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

// CourseByNodeID returns the domain.CourseNode for a Gonum int64 node ID.
func (g *CurriculumGraph) CourseByNodeID(id int64) (domain.CourseNode, bool) {
	course, ok := g.courseMap[id]
	return course, ok
}

// GonumIDFor returns the Gonum int64 node ID for a string course ID.
func (g *CurriculumGraph) GonumIDFor(courseID string) (int64, bool) {
	id, ok := g.idIndex[courseID]
	return id, ok
}

// NodeCount returns the number of registered course nodes.
func (g *CurriculumGraph) NodeCount() int {
	return len(g.courseMap)
}

// EdgeCount returns the number of domain edges stored on the graph.
func (g *CurriculumGraph) EdgeCount() int {
	return len(g.Edges)
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

// Compile-time interface checks
var _ gonumgraph.Node = simple.Node(0)
var _ gonumgraph.Directed = (*simple.DirectedGraph)(nil)

