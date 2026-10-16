package validator

import (
	"errors"

	"paretoium/services/optimizer/domain"
)

var (
	// ErrCycleDetected indicates that the curriculum graph contains at least one cycle.
	ErrCycleDetected = errors.New("cycle detected in graph")
)

// ValidateGraph checks that the given graph nodes and edges form a valid Directed Acyclic Graph (DAG).
//
// NOTE: On Day 3, this is an intentional stub to establish failing cycle-detection tests (TDD).
// The complete Gonum topological cycle-detection and validation algorithm will be implemented on Day 4.
func ValidateGraph(nodes []domain.CourseNode, edges []domain.PrerequisiteEdge) error {
	// Day 3 stub: validation returns nil, causing cycle tests to fail as expected.
	return nil
}
