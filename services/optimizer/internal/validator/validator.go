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

// ValidateGraph checks that the given nodes and edges form a valid Directed Acyclic Graph (DAG).
//
// Delegates to CurriculumGraph.Validate() which enforces:
//   - Non-empty graph
//   - No self-loop prerequisites
//   - No duplicate edges
//   - No missing node references
//   - No directed cycles (via gonum/graph/topo)
//   - Valid topological ordering
func ValidateGraph(nodes []domain.CourseNode, edges []domain.PrerequisiteEdge) error {
	// 1. Pre-build self-loop check (before FromDomain, which skips edges to the same node)
	for _, edge := range edges {
		if edge.Source() == edge.Target() {
			return fmt.Errorf("%w: self-loop on node %q", ErrCycleDetected, edge.Source())
		}
	}

	// 2. Build Gonum-backed curriculum graph
	g, err := internalgraph.FromDomain(nodes, edges)
	if err != nil {
		return fmt.Errorf("failed to build curriculum graph: %w", err)
	}

	// 3. Run full domain validation (empty check, duplicates, cycles, topo sort)
	if err := g.Validate(); err != nil {
		return fmt.Errorf("%w: %s", ErrCycleDetected, err.Error())
	}

	return nil
}
