// Package pareto implements a Pareto label-setting algorithm for multi-objective
// curriculum path optimization. It finds all non-dominated paths through a DAG
// that balance total study hours against total difficulty.
package pareto

import (
	"fmt"
	"sort"

	"gonum.org/v1/gonum/graph/topo"

	"paretoium/services/optimizer/domain"
	"paretoium/services/optimizer/internal/graph"
)

// MaxLabelsPerNode caps the Pareto frontier size per node to prevent exponential blowup
// in curricula with many parallel paths. When the frontier exceeds this limit the labels
// with the highest hours (then highest difficulty) are dropped. (Day 12)
const MaxLabelsPerNode = 500

// Label represents a Pareto-optimal path prefix ending at a specific node.
// Lower TotalHours and lower TotalDifficulty are both desirable objectives.
type Label struct {
	NodeID          string   `json:"node_id"`          // Current node at the end of the path prefix
	TotalHours      float64  `json:"total_hours"`      // Cumulative study hours along the path
	TotalDifficulty float64  `json:"total_difficulty"` // Cumulative difficulty along the path
	Path            []string `json:"path"`             // Ordered list of course IDs from start to NodeID (inclusive)
}

// dominates reports whether label a dominates label b.
// a dominates b when a is at least as good on BOTH objectives and strictly better on at least one.
func dominates(a, b Label) bool {
	return a.TotalHours <= b.TotalHours &&
		a.TotalDifficulty <= b.TotalDifficulty &&
		(a.TotalHours < b.TotalHours || a.TotalDifficulty < b.TotalDifficulty)
}

// ParetoSet maintains a pruned frontier of non-dominated labels for a single node.
type ParetoSet struct {
	labels []Label
}

// Add inserts newLabel into the frontier, removing any labels it dominates.
// If the new label is dominated by any existing label it is discarded.
// The frontier is capped at MaxLabelsPerNode after insertion.
// Returns true if the label was accepted into the frontier.
func (ps *ParetoSet) Add(newLabel Label) bool {
	for _, existing := range ps.labels {
		if dominates(existing, newLabel) {
			// newLabel is dominated — discard it
			return false
		}
	}

	// Remove all labels that newLabel dominates
	kept := make([]Label, 0, len(ps.labels))
	for _, existing := range ps.labels {
		if !dominates(newLabel, existing) {
			kept = append(kept, existing)
		}
	}
	kept = append(kept, newLabel)
	ps.labels = kept

	// Cap frontier size (Day 12) — keep lowest-hours then lowest-difficulty
	if len(ps.labels) > MaxLabelsPerNode {
		sort.Slice(ps.labels, func(i, j int) bool {
			if ps.labels[i].TotalHours != ps.labels[j].TotalHours {
				return ps.labels[i].TotalHours < ps.labels[j].TotalHours
			}
			if ps.labels[i].TotalDifficulty != ps.labels[j].TotalDifficulty {
				return ps.labels[i].TotalDifficulty < ps.labels[j].TotalDifficulty
			}
			return pathLess(ps.labels[i].Path, ps.labels[j].Path)
		})
		ps.labels = ps.labels[:MaxLabelsPerNode]
	}

	return true
}

// Labels returns a copy of the current frontier.
func (ps *ParetoSet) Labels() []Label {
	out := make([]Label, len(ps.labels))
	copy(out, ps.labels)
	return out
}

// Len returns the number of labels in the frontier.
func (ps *ParetoSet) Len() int { return len(ps.labels) }

// SelectPaths returns the fastest and least-difficult labels in a Pareto frontier.
// Ties are resolved by the other objective and then lexicographically by path.
func SelectPaths(labels []Label) (express, deepMastery *Label) {
	for i := range labels {
		label := labels[i]
		if express == nil ||
			label.TotalHours < express.TotalHours ||
			(label.TotalHours == express.TotalHours &&
				(label.TotalDifficulty < express.TotalDifficulty ||
					(label.TotalDifficulty == express.TotalDifficulty && pathLess(label.Path, express.Path)))) {
			express = &label
		}
		if deepMastery == nil ||
			label.TotalDifficulty < deepMastery.TotalDifficulty ||
			(label.TotalDifficulty == deepMastery.TotalDifficulty &&
				(label.TotalHours < deepMastery.TotalHours ||
					(label.TotalHours == deepMastery.TotalHours && pathLess(label.Path, deepMastery.Path)))) {
			deepMastery = &label
		}
	}
	return express, deepMastery
}

func pathLess(a, b []string) bool {
	for i := 0; i < len(a) && i < len(b); i++ {
		if a[i] != b[i] {
			return a[i] < b[i]
		}
	}
	return len(a) < len(b)
}

// buildAdjacency constructs a string-keyed adjacency list (node → successors) from the
// domain edges. Edge direction: prerequisite → dependent (the direction of unlocking).
func buildAdjacency(g *graph.CurriculumGraph) map[string][]string {
	adj := make(map[string][]string)
	for _, edge := range g.Edges {
		src := edge.Source()
		tgt := edge.Target()
		adj[src] = append(adj[src], tgt)
	}
	return adj
}

// rootNodes returns the course IDs that have no incoming prerequisite edges (in-degree 0).
func rootNodes(g *graph.CurriculumGraph) []string {
	hasIncoming := make(map[string]bool, len(g.Edges))
	for _, edge := range g.Edges {
		hasIncoming[edge.Target()] = true
	}
	var roots []string
	for _, id := range g.CourseIDs() {
		if !hasIncoming[id] {
			roots = append(roots, id)
		}
	}
	return roots
}

// gonumTopoSort returns course IDs in topological order using the Gonum topo package.
// It maps Gonum int64 node IDs back to string course IDs via the graph's CourseByNodeID helper.
func gonumTopoSort(g *graph.CurriculumGraph) ([]string, error) {
	sorted, err := topo.Sort(g)
	if err != nil {
		return nil, fmt.Errorf("topological sort failed (graph has cycles): %w", err)
	}
	ids := make([]string, 0, len(sorted))
	for _, n := range sorted {
		course, ok := g.CourseByNodeID(n.ID())
		if !ok {
			return nil, fmt.Errorf("topoSort: unknown Gonum node id %d", n.ID())
		}
		ids = append(ids, course.ID)
	}
	return ids, nil
}

// RunPareto executes the Pareto label-setting algorithm on a validated DAG.
//
// Algorithm:
//  1. Build an adjacency list (prerequisite → dependent).
//  2. Obtain a topological ordering to ensure each node is processed after all
//     of its predecessors, so frontier labels are fully populated before propagation.
//  3. Seed every root node (in-degree 0) with an initial label for that single course.
//  4. Walk the topological order: for each node, extend each of its frontier labels
//     to each successor, accumulating costs and pruning budget violations.
//  5. Collect the global Pareto frontier from all target nodes (or all nodes if none specified).
//
// A label dominates another if it has ≤ hours AND ≤ difficulty, with strict
// improvement on at least one dimension.
//
// Returns all non-dominated labels reaching any target node, or an error if the
// graph is nil or contains cycles.
func RunPareto(g *graph.CurriculumGraph, constraints domain.ConstraintSet) ([]Label, error) {
	if g == nil {
		return nil, fmt.Errorf("RunPareto: graph must not be nil")
	}
	if g.NodeCount() == 0 {
		return nil, fmt.Errorf("RunPareto: graph has no nodes")
	}

	// Build adjacency list from domain edges
	adj := buildAdjacency(g)

	// Topological order — also validates the DAG invariant
	topoOrder, err := gonumTopoSort(g)
	if err != nil {
		return nil, fmt.Errorf("RunPareto: %w", err)
	}

	// Per-node Pareto frontiers
	courseIDs := g.CourseIDs()
	frontiers := make(map[string]*ParetoSet, len(courseIDs))
	for _, id := range courseIDs {
		frontiers[id] = &ParetoSet{}
	}

	// Seed root nodes (no incoming edges) with their own cost
	roots := rootNodes(g)
	for _, id := range roots {
		node, ok := g.CourseByStringID(id)
		if !ok {
			continue
		}
		seed := Label{
			NodeID:          id,
			TotalHours:      node.StudyHours,
			TotalDifficulty: node.Difficulty,
			Path:            []string{id},
		}
		// Prune seed if it already exceeds the budget
		if constraints.MaxStudyHours > 0 && seed.TotalHours > constraints.MaxStudyHours {
			continue
		}
		if constraints.MaxDifficulty > 0 && seed.TotalDifficulty > constraints.MaxDifficulty {
			continue
		}
		if constraints.MaxDepth > 0 && len(seed.Path) > constraints.MaxDepth {
			continue
		}
		frontiers[id].Add(seed)
	}

	// Process nodes in topological order, propagating labels forward to successors
	for _, nodeID := range topoOrder {
		successors := adj[nodeID]
		if len(successors) == 0 {
			continue
		}

		currentLabels := frontiers[nodeID].Labels()
		if len(currentLabels) == 0 {
			continue
		}

		for _, succID := range successors {
			succNode, ok := g.CourseByStringID(succID)
			if !ok {
				continue
			}

			for _, lbl := range currentLabels {
				newHours := lbl.TotalHours + succNode.StudyHours
				newDiff := lbl.TotalDifficulty + succNode.Difficulty

				// Budget pruning — drop labels that exceed hard limits
				if constraints.MaxStudyHours > 0 && newHours > constraints.MaxStudyHours {
					continue
				}
				if constraints.MaxDifficulty > 0 && newDiff > constraints.MaxDifficulty {
					continue
				}
				if constraints.MaxDepth > 0 && len(lbl.Path)+1 > constraints.MaxDepth {
					continue
				}

				// Build extended path (copy to avoid slice aliasing)
				newPath := make([]string, len(lbl.Path)+1)
				copy(newPath, lbl.Path)
				newPath[len(lbl.Path)] = succID

				extended := Label{
					NodeID:          succID,
					TotalHours:      newHours,
					TotalDifficulty: newDiff,
					Path:            newPath,
				}
				frontiers[succID].Add(extended)
			}
		}
	}

	// Collect results: gather labels from target nodes and merge into a global frontier
	targetMap := constraints.TargetMap()
	collectAll := len(targetMap) == 0

	var global ParetoSet
	for _, id := range courseIDs {
		if !collectAll && !targetMap[id] {
			continue
		}
		for _, lbl := range frontiers[id].Labels() {
			global.Add(lbl)
		}
	}

	labels := global.Labels()
	sort.Slice(labels, func(i, j int) bool {
		if labels[i].TotalHours != labels[j].TotalHours {
			return labels[i].TotalHours < labels[j].TotalHours
		}
		if labels[i].TotalDifficulty != labels[j].TotalDifficulty {
			return labels[i].TotalDifficulty < labels[j].TotalDifficulty
		}
		return pathLess(labels[i].Path, labels[j].Path)
	})
	return labels, nil
}
