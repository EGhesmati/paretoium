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
// It builds a Gonum-backed CurriculumGraph via the graph adapter and runs
// topo.DirectedCyclesIn to detect:
//   - Self-loops (A → A)
//   - Direct cycles (A → B → A)
//   - Indirect cycles (A → B → C → A)
//
// Returns nil for a valid DAG, or a descriptive error wrapping ErrCycleDetected on failure.
func ValidateGraph(nodes []domain.CourseNode, edges []domain.PrerequisiteEdge) error {
	// 1. Detect self-loops early (before graph build) since simple.DirectedGraph
	//    ignores self-loops in HasEdgeBetween checks
	for _, edge := range edges {
		if edge.Source() == edge.Target() {
			return fmt.Errorf("%w: self-loop on node %q", ErrCycleDetected, edge.Source())
		}
	}

	// 2. Build the Gonum-backed directed graph from domain models
	g, err := internalgraph.FromDomain(nodes, edges)
	if err != nil {
		return fmt.Errorf("failed to build curriculum graph: %w", err)
	}

	// 3. Run Gonum cycle detection via topo.DirectedCyclesIn
	_, cycleErr := g.DetectCycles()
	if cycleErr != nil {
		return fmt.Errorf("%w: %s", ErrCycleDetected, cycleErr.Error())
	}

	return nil
}
