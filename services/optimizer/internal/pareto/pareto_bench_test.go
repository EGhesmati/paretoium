package pareto_test

import (
	"fmt"
	"testing"

	"paretoium/services/optimizer/domain"
	"paretoium/services/optimizer/internal/graph"
	"paretoium/services/optimizer/internal/pareto"
)

func BenchmarkRunPareto(b *testing.B) {
	for nodeCount := 50; nodeCount <= 500; nodeCount += 50 {
		b.Run(fmt.Sprintf("%d_nodes", nodeCount), func(b *testing.B) {
			nodes := make([]domain.CourseNode, nodeCount)
			edges := make([]domain.PrerequisiteEdge, 0, nodeCount-1)
			for i := range nodes {
				id := fmt.Sprintf("course-%03d", i)
				nodes[i] = domain.CourseNode{
					ID:         id,
					Name:       id,
					StudyHours: 1,
					Difficulty: 1,
				}
				if i > 0 {
					edges = append(edges, domain.PrerequisiteEdge{
						FromID:    nodes[i-1].ID,
						ToID:      id,
						GroupType: domain.PrereqGroupAND,
					})
				}
			}

			curriculum, err := graph.FromDomain(nodes, edges)
			if err != nil {
				b.Fatalf("build %d-node benchmark graph: %v", nodeCount, err)
			}
			constraints := domain.ConstraintSet{TargetCourseIDs: []string{nodes[nodeCount-1].ID}}

			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				if _, err := pareto.RunPareto(curriculum, constraints); err != nil {
					b.Fatalf("run Pareto optimizer: %v", err)
				}
			}
		})
	}
}
