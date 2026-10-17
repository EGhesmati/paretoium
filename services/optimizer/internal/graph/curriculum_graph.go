package graph

import (
	"fmt"

	"gonum.org/v1/gonum/graph"
	"gonum.org/v1/gonum/graph/simple"

	"paretoium/services/optimizer/domain"
)

// CourseNodeID is the unique int64 identifier for a graph node used by Gonum.
type CourseNodeID int64

// gonumNode wraps a domain.CourseNode to satisfy the gonum graph.Node interface.
type gonumNode struct {
	id     int64
	Course domain.CourseNode
}

// ID returns the Gonum-compatible int64 node identifier.
func (n gonumNode) ID() int64 {
	return n.id
}

// CurriculumGraph wraps simple.DirectedGraph and bridges domain models to Gonum's graph interfaces.
type CurriculumGraph struct {
	*simple.DirectedGraph

	// nodeMap maps int64 ID -> gonumNode (for fast lookup)
	nodeMap map[int64]*gonumNode

	// idIndex maps course string ID -> int64 (for edge construction)
	idIndex map[string]int64

	// Edges stores the original domain edges for downstream use
	Edges []domain.PrerequisiteEdge
}

// NewCurriculumGraph initializes an empty Gonum-backed curriculum graph.
func NewCurriculumGraph() *CurriculumGraph {
	return &CurriculumGraph{
		DirectedGraph: simple.NewDirectedGraph(),
		nodeMap:       make(map[int64]*gonumNode),
		idIndex:       make(map[string]int64),
	}
}

// FromDomain builds a CurriculumGraph from validated domain nodes and edges.
// String IDs are mapped to sequential int64 IDs for Gonum compatibility.
func FromDomain(nodes []domain.CourseNode, edges []domain.PrerequisiteEdge) (*CurriculumGraph, error) {
	g := NewCurriculumGraph()

	// Assign sequential int64 IDs and register nodes
	for i, course := range nodes {
		id := int64(i + 1) // Gonum reserves 0; start at 1
		n := &gonumNode{id: id, Course: course}
		g.nodeMap[id] = n
		g.idIndex[course.ID] = id
		g.DirectedGraph.AddNode(n)
	}

	// Add directed edges (from_id -> to_id in Gonum terms: prerequisite -> dependent)
	for _, edge := range edges {
		fromID, ok := g.idIndex[edge.Source()]
		if !ok {
			return nil, fmt.Errorf("graph adapter: unknown source node %q", edge.Source())
		}
		toID, ok := g.idIndex[edge.Target()]
		if !ok {
			return nil, fmt.Errorf("graph adapter: unknown target node %q", edge.Target())
		}

		from := g.nodeMap[fromID]
		to := g.nodeMap[toID]

		// Gonum simple.DirectedGraph panics on duplicate edges; skip if already present
		if g.DirectedGraph.HasEdgeBetween(fromID, toID) {
			continue
		}

		e := g.DirectedGraph.NewEdge(from, to)
		g.DirectedGraph.SetEdge(e)
	}

	g.Edges = edges
	return g, nil
}

// CourseByNodeID returns the domain.CourseNode associated with a Gonum graph.Node.
func (g *CurriculumGraph) CourseByNodeID(id int64) (domain.CourseNode, bool) {
	n, ok := g.nodeMap[id]
	if !ok {
		return domain.CourseNode{}, false
	}
	return n.Course, true
}

// GonumIDFor returns the Gonum int64 ID for a given course string ID.
func (g *CurriculumGraph) GonumIDFor(courseID string) (int64, bool) {
	id, ok := g.idIndex[courseID]
	return id, ok
}

// NodeCount returns the number of nodes in the graph.
func (g *CurriculumGraph) NodeCount() int {
	return len(g.nodeMap)
}

// EdgeCount returns the number of edges in the graph.
func (g *CurriculumGraph) EdgeCount() int {
	return len(g.Edges)
}

// Verify at compile time that gonumNode satisfies graph.Node.
var _ graph.Node = (*gonumNode)(nil)

// Verify at compile time that CurriculumGraph embeds a directed graph.
var _ graph.Directed = (*simple.DirectedGraph)(nil)

