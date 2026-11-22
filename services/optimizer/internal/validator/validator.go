package validator

import (
	"fmt"

	"paretoium/services/optimizer/domain"
	internalgraph "paretoium/services/optimizer/internal/graph"
)

var (
	// ErrCycleDetected is returned when the curriculum graph contains one or more directed cycles.
	ErrCycleDetected = fmt.Errorf("cycle detected in graph")
)

// BuildValidatedGraph constructs and validates a CurriculumGraph in a single pass,
// caching its topological order so downstream pathfinding does not rebuild or re-sort the graph.
func BuildValidatedGraph(nodes []domain.CourseNode, edges []domain.PrerequisiteEdge) (*internalgraph.CurriculumGraph, error) {
	// 1. Pre-build self-loop check (before FromDomain, which skips edges to the same node)
	for _, edge := range edges {
		if edge.Source() == edge.Target() {
			return nil, fmt.Errorf("%w: self-loop on node %q", ErrCycleDetected, edge.Source())
		}
	}

	// 2. Build Gonum-backed curriculum graph
	g, err := internalgraph.FromDomain(nodes, edges)
	if err != nil {
		return nil, fmt.Errorf("failed to build curriculum graph: %w", err)
	}

	// 3. Run full domain validation (empty check, duplicates, cycles, cached topo sort)
	if err := g.Validate(); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrCycleDetected, err.Error())
	}

	return g, nil
}

// ValidateGraph checks that the given nodes and edges form a valid Directed Acyclic Graph (DAG).
func ValidateGraph(nodes []domain.CourseNode, edges []domain.PrerequisiteEdge) error {
	_, err := BuildValidatedGraph(nodes, edges)
	return err
}
