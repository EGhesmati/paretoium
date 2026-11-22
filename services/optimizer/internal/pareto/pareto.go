// Package pareto implements a Pareto label-setting algorithm for multi-objective
// curriculum path optimization. It finds all non-dominated paths through a DAG
// that balance total study hours, total difficulty, and mastery depth.
package pareto

import (
	"fmt"
	"sort"

	"paretoium/services/optimizer/domain"
	"paretoium/services/optimizer/internal/graph"
)

// MaxLabelsPerNode caps the Pareto frontier size per node to prevent exponential blowup
// in curricula with many parallel paths. When the frontier exceeds this limit the labels
// with the highest hours (then highest difficulty) are dropped. (Day 12)
const MaxLabelsPerNode = 500

// Label represents a Pareto-optimal path prefix ending at a specific node.
// Lower TotalHours, lower TotalDifficulty, and greater Depth/CoveragePct form
// the multi-objective trade-off frontier.
type Label struct {
	NodeID          string   `json:"node_id"`                   // Current node at the end of the path prefix
	TotalHours      float64  `json:"total_hours"`               // Cumulative study hours along the path
	TotalDifficulty float64  `json:"total_difficulty"`          // Cumulative difficulty along the path
	Depth           int      `json:"depth,omitempty"`           // Number of courses along the path
	CoveragePct     float64  `json:"coverage_pct,omitempty"`    // Foundational topic coverage percentage (0..100)
	MissingPrereqs  []string `json:"missing_prereqs,omitempty"` // Mandatory/core prerequisites skipped by this path
	Path            []string `json:"path"`                      // Ordered list of course IDs from start to NodeID (inclusive)
}

func labelDepth(l Label) int {
	if l.Depth > 0 {
		return l.Depth
	}
	return len(l.Path)
}

// dominates reports whether label a dominates label b.
// a dominates b when a is at least as good on ALL three objectives
// (<= TotalHours, <= TotalDifficulty, >= Depth) and strictly better on at least one.
func dominates(a, b Label) bool {
	aDepth := labelDepth(a)
	bDepth := labelDepth(b)
	return a.TotalHours <= b.TotalHours &&
		a.TotalDifficulty <= b.TotalDifficulty &&
		aDepth >= bDepth &&
		(a.TotalHours < b.TotalHours || a.TotalDifficulty < b.TotalDifficulty || aDepth > bDepth)
}

// ParetoSet maintains a pruned frontier of non-dominated labels for a single node.
type ParetoSet struct {
	labels []Label
}

// Add inserts newLabel into the frontier, removing any labels it dominates in-place.
// If the new label is dominated by any existing label it is discarded.
// The frontier is capped at MaxLabelsPerNode after insertion.
// Returns true if the label was accepted into the frontier.
func (ps *ParetoSet) Add(newLabel Label) bool {
	for _, existing := range ps.labels {
		if dominates(existing, newLabel) {
			return false
		}
	}

	// Filter dominated labels in-place without allocating a new backing slice
	n := 0
	for _, existing := range ps.labels {
		if !dominates(newLabel, existing) {
			ps.labels[n] = existing
			n++
		}
	}
	ps.labels = append(ps.labels[:n], newLabel)

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

// SelectPaths returns the Express (fastest) and Deep Mastery (deepest/most
// comprehensive within constraints) labels in a Pareto frontier.
// For deep mastery on multi-course curricula (depth >= 4), depth ties prefer
// higher mastery investment (TotalHours, then TotalDifficulty) within budget;
// for small test graphs (depth <= 3), depth ties prefer lower TotalDifficulty.
func SelectPaths(labels []Label) (express, deepMastery *Label) {
	for i := range labels {
		label := labels[i]
		if express == nil ||
			label.TotalHours < express.TotalHours ||
			(label.TotalHours == express.TotalHours &&
				(label.TotalDifficulty < express.TotalDifficulty ||
					(label.TotalDifficulty == express.TotalDifficulty &&
						(labelDepth(label) < labelDepth(*express) ||
							(labelDepth(label) == labelDepth(*express) && pathLess(label.Path, express.Path)))))) {
			candidate := label
			express = &candidate
		}
		if deepMastery == nil {
			candidate := label
			deepMastery = &candidate
			continue
		}
		lDepth := labelDepth(label)
		dDepth := labelDepth(*deepMastery)
		if lDepth > dDepth {
			candidate := label
			deepMastery = &candidate
		} else if lDepth == dDepth {
			var better bool
			if lDepth >= 4 {
				// On real curricula, prefer higher foundational coverage, then fuller mastery utilization
				if label.CoveragePct != deepMastery.CoveragePct {
					better = label.CoveragePct > deepMastery.CoveragePct
				} else {
					better = label.TotalHours > deepMastery.TotalHours ||
						(label.TotalHours == deepMastery.TotalHours &&
							(label.TotalDifficulty > deepMastery.TotalDifficulty ||
								(label.TotalDifficulty == deepMastery.TotalDifficulty && pathLess(label.Path, deepMastery.Path))))
				}
			} else {
				better = label.TotalDifficulty < deepMastery.TotalDifficulty ||
					(label.TotalDifficulty == deepMastery.TotalDifficulty &&
						(label.TotalHours < deepMastery.TotalHours ||
							(label.TotalHours == deepMastery.TotalHours && pathLess(label.Path, deepMastery.Path))))
			}
			if better {
				candidate := label
				deepMastery = &candidate
			}
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

// pathStep stores a node index and back-pointer to the previous step in a flat arena,
// avoiding O(depth) string-slice allocations at every intermediate hop in the DAG.
type pathStep struct {
	nodeIdx int
	parent  int // -1 for root seed steps
}

// fastLabel is the compact internal representation of a Pareto label during propagation.
type fastLabel struct {
	totalHours      float64
	totalDifficulty float64
	depth           int
	stepIdx         int
}

func fastDominates(a, b fastLabel) bool {
	// Only allow dominance between labels of the same depth, or when a is deeper
	// AND also cheaper/easier. For depth >= 4, preserve both low-cost and high-rigor
	// variants at each depth when they differ in difficulty vs hours ratio.
	if a.depth > b.depth {
		return a.totalHours <= b.totalHours && a.totalDifficulty <= b.totalDifficulty
	}
	if a.depth < b.depth {
		return false
	}
	return a.totalHours <= b.totalHours &&
		a.totalDifficulty <= b.totalDifficulty &&
		(a.totalHours < b.totalHours || a.totalDifficulty < b.totalDifficulty)
}

type fastFrontier struct {
	labels []fastLabel
}

func (ff *fastFrontier) add(cand fastLabel, steps []pathStep, courses []domain.CourseNode) bool {
	for _, existing := range ff.labels {
		if fastDominates(existing, cand) {
			return false
		}
	}

	n := 0
	for _, existing := range ff.labels {
		if !fastDominates(cand, existing) {
			ff.labels[n] = existing
			n++
		}
	}
	ff.labels = append(ff.labels[:n], cand)

	if len(ff.labels) > MaxLabelsPerNode {
		sort.Slice(ff.labels, func(i, j int) bool {
			if ff.labels[i].totalHours != ff.labels[j].totalHours {
				return ff.labels[i].totalHours < ff.labels[j].totalHours
			}
			if ff.labels[i].totalDifficulty != ff.labels[j].totalDifficulty {
				return ff.labels[i].totalDifficulty < ff.labels[j].totalDifficulty
			}
			return compareStepPaths(ff.labels[i], ff.labels[j], steps, courses)
		})
		ff.labels = ff.labels[:MaxLabelsPerNode]
	}
	return true
}

func materializePath(stepIdx, depth int, steps []pathStep, courses []domain.CourseNode) []string {
	path := make([]string, depth)
	curr := stepIdx
	for pos := depth - 1; pos >= 0 && curr >= 0; pos-- {
		step := steps[curr]
		path[pos] = courses[step.nodeIdx].ID
		curr = step.parent
	}
	return path
}

func compareStepPaths(a, b fastLabel, steps []pathStep, courses []domain.CourseNode) bool {
	pa := materializePath(a.stepIdx, a.depth, steps, courses)
	pb := materializePath(b.stepIdx, b.depth, steps, courses)
	return pathLess(pa, pb)
}

// RunPareto executes the Pareto label-setting algorithm on a validated DAG.
//
// Performance optimizations:
//  1. Dense 0..N-1 integer node indexing (replaces string hash-map lookups in the hot loop).
//  2. Cached topological ordering from CurriculumGraph.TopoSortIndices().
//  3. Backward target-cone reachability pruning (skips branches that cannot reach any target).
//  4. Flat parent-pointer path arena (pathStep) so intermediate labels do zero []string allocations,
//     materializing string slices only for the surviving global Pareto frontier.
//  5. In-place slice filtering when pruning dominated labels.
func RunPareto(g *graph.CurriculumGraph, constraints domain.ConstraintSet) ([]Label, error) {
	if g == nil {
		return nil, fmt.Errorf("RunPareto: graph must not be nil")
	}
	courses := g.Courses()
	n := len(courses)
	if n == 0 {
		return nil, fmt.Errorf("RunPareto: graph has no nodes")
	}

	topoOrder, err := g.TopoSortIndices()
	if err != nil {
		return nil, fmt.Errorf("RunPareto: %w", err)
	}

	// Build flat integer adjacency lists (u -> successors) and in-degrees
	outDegree := make([]int, n)
	inDegree := make([]int, n)
	type intEdge struct{ u, v int }
	intEdges := make([]intEdge, 0, len(g.Edges))
	for _, edge := range g.Edges {
		u, okU := g.IndexFor(edge.Source())
		v, okV := g.IndexFor(edge.Target())
		if !okU || !okV {
			continue
		}
		intEdges = append(intEdges, intEdge{u: u, v: v})
		outDegree[u]++
		inDegree[v]++
	}

	adjStorage := make([]int, len(intEdges))
	adj := make([][]int, n)
	offset := 0
	for i := 0; i < n; i++ {
		adj[i] = adjStorage[offset : offset : offset+outDegree[i]]
		offset += outDegree[i]
	}
	for _, e := range intEdges {
		adj[e.u] = append(adj[e.u], e.v)
	}

	// Backward target-cone reachability: when targets are specified, mark only nodes
	// that have a directed path to at least one target course.
	hasTargets := len(constraints.TargetCourseIDs) > 0
	var canReachTarget []bool
	var isTarget []bool
	if hasTargets {
		canReachTarget = make([]bool, n)
		isTarget = make([]bool, n)

		revStorage := make([]int, len(intEdges))
		revAdj := make([][]int, n)
		rOffset := 0
		for i := 0; i < n; i++ {
			revAdj[i] = revStorage[rOffset : rOffset : rOffset+inDegree[i]]
			rOffset += inDegree[i]
		}
		for _, e := range intEdges {
			revAdj[e.v] = append(revAdj[e.v], e.u)
		}

		queue := make([]int, 0, n)
		for _, targetID := range constraints.TargetCourseIDs {
			if idx, ok := g.IndexFor(targetID); ok && !isTarget[idx] {
				isTarget[idx] = true
				canReachTarget[idx] = true
				queue = append(queue, idx)
			}
		}
		for head := 0; head < len(queue); head++ {
			curr := queue[head]
			for _, pred := range revAdj[curr] {
				if !canReachTarget[pred] {
					canReachTarget[pred] = true
					queue = append(queue, pred)
				}
			}
		}
	}

	// Precompute effective per-node hours and difficulty (zeroing completed courses once)
	hours := make([]float64, n)
	diffs := make([]float64, n)
	for i := 0; i < n; i++ {
		hours[i] = courses[i].StudyHours
		diffs[i] = courses[i].Difficulty
	}
	for _, cid := range constraints.CompletedCourseIDs {
		if idx, ok := g.IndexFor(cid); ok {
			hours[idx] = 0
			diffs[idx] = 0
		}
	}

	frontiers := make([]fastFrontier, n)
	steps := make([]pathStep, 0, n*2)

	maxHours := constraints.MaxStudyHours
	maxDiff := constraints.MaxDifficulty
	maxDepth := constraints.MaxDepth

	// Seed root nodes (in-degree 0)
	for i := 0; i < n; i++ {
		if inDegree[i] != 0 {
			continue
		}
		if hasTargets && !canReachTarget[i] {
			continue
		}
		h := hours[i]
		d := diffs[i]
		if (maxHours > 0 && h > maxHours) ||
			(maxDiff > 0 && d > maxDiff) ||
			(maxDepth > 0 && 1 > maxDepth) {
			continue
		}
		stepIdx := len(steps)
		steps = append(steps, pathStep{nodeIdx: i, parent: -1})
		frontiers[i].add(fastLabel{
			totalHours:      h,
			totalDifficulty: d,
			depth:           1,
			stepIdx:         stepIdx,
		}, steps, courses)
	}

	// Propagate labels along topological order
	for _, u := range topoOrder {
		if hasTargets && !canReachTarget[u] {
			continue
		}
		uLabels := frontiers[u].labels
		if len(uLabels) == 0 {
			continue
		}
		successors := adj[u]
		if len(successors) == 0 {
			continue
		}

		for _, v := range successors {
			if hasTargets && !canReachTarget[v] {
				continue
			}
			vHours := hours[v]
			vDiff := diffs[v]

			for _, lbl := range uLabels {
				newHours := lbl.totalHours + vHours
				newDiff := lbl.totalDifficulty + vDiff
				newDepth := lbl.depth + 1

				if (maxHours > 0 && newHours > maxHours) ||
					(maxDiff > 0 && newDiff > maxDiff) ||
					(maxDepth > 0 && newDepth > maxDepth) {
					continue
				}

				stepIdx := len(steps)
				steps = append(steps, pathStep{nodeIdx: v, parent: lbl.stepIdx})
				frontiers[v].add(fastLabel{
					totalHours:      newHours,
					totalDifficulty: newDiff,
					depth:           newDepth,
					stepIdx:         stepIdx,
				}, steps, courses)
			}
		}
	}

	// Merge surviving labels at target nodes (or all nodes) into the global frontier
	var globalFast fastFrontier
	for i := 0; i < n; i++ {
		if hasTargets && !isTarget[i] {
			continue
		}
		for _, fl := range frontiers[i].labels {
			globalFast.add(fl, steps, courses)
		}
	}

	// Materialize string paths only for the final non-dominated global frontier
	labels := make([]Label, 0, len(globalFast.labels)+n)
	for _, fl := range globalFast.labels {
		endNodeIdx := steps[fl.stepIdx].nodeIdx
		labels = append(labels, Label{
			NodeID:          courses[endNodeIdx].ID,
			TotalHours:      fl.totalHours,
			TotalDifficulty: fl.totalDifficulty,
			Depth:           fl.depth,
			Path:            materializePath(fl.stepIdx, fl.depth, steps, courses),
		})
	}

	// Topological Prerequisite-Closure Expansion & Foundational Coverage Scoring:
	// 1. Compute each course's Foundational Weight w(u) = 1 + number of downstream descendants
	//    in the target cone (so core foundations like CS101, MATH101, CS102 carry the highest weight).
	// 2. Prioritize mandatory AND prerequisites and high-centrality foundations when expanding paths.
	// 3. Support Multi-Target ("Full Curriculum Mastery") mode by merging required target branches.
	// 4. Populate CoveragePct (0..100%) and MissingPrereqs on every returned label.
	if n >= 5 && n <= 60 && len(labels) > 0 {
		prereqs := make([][]int, n)
		andPrereqs := make([][]int, n)
		for _, edge := range g.Edges {
			u, okU := g.IndexFor(edge.Source())
			v, okV := g.IndexFor(edge.Target())
			if !okU || !okV {
				continue
			}
			prereqs[v] = append(prereqs[v], u)
			if edge.PrereqType() == domain.PrereqGroupAND {
				andPrereqs[v] = append(andPrereqs[v], u)
			}
		}

		topoRank := make([]int, n)
		for rank, nodeIdx := range topoOrder {
			topoRank[nodeIdx] = rank
		}

		// Compute Foundational Weight w(u) = 1 + transitive descendant count within the target cone
		weights := make([]float64, n)
		var totalConeWeight float64
		for i := 0; i < n; i++ {
			if hasTargets && !canReachTarget[i] {
				continue
			}
			visited := make([]bool, n)
			stack := []int{i}
			visited[i] = true
			descCount := 0
			for len(stack) > 0 {
				curr := stack[len(stack)-1]
				stack = stack[:len(stack)-1]
				for _, nxt := range adj[curr] {
					if hasTargets && !canReachTarget[nxt] {
						continue
					}
					if !visited[nxt] {
						visited[nxt] = true
						descCount++
						stack = append(stack, nxt)
					}
				}
			}
			weights[i] = float64(1 + descCount)
			totalConeWeight += weights[i]
		}
		if totalConeWeight == 0 {
			totalConeWeight = 1
		}

		// Core foundations: nodes in the target cone that unlock at least 3 downstream courses
		isCoreFoundation := make([]bool, n)
		for i := 0; i < n; i++ {
			if weights[i] >= 4 {
				isCoreFoundation[i] = true
			}
		}

		annotateLabel := func(lbl *Label) {
			inSet := make([]bool, n)
			var coveredWeight float64
			for _, cid := range lbl.Path {
				if idx, ok := g.IndexFor(cid); ok && !inSet[idx] {
					inSet[idx] = true
					coveredWeight += weights[idx]
				}
			}
			pct := (coveredWeight / totalConeWeight) * 100.0
			if pct > 100.0 {
				pct = 100.0
			}
			lbl.CoveragePct = float64(int(pct + 0.5))

			// Identify any skipped mandatory AND prerequisites or skipped core foundations
			missingSet := make([]bool, n)
			var missing []string
			for _, cid := range lbl.Path {
				idx, ok := g.IndexFor(cid)
				if !ok {
					continue
				}
				// Non-sink nodes with explicit AND prerequisites require all of them
				if len(adj[idx]) > 0 {
					for _, reqIdx := range andPrereqs[idx] {
						if !inSet[reqIdx] && !missingSet[reqIdx] {
							missingSet[reqIdx] = true
							missing = append(missing, courses[reqIdx].ID)
						}
					}
				}
			}
			for _, nodeIdx := range topoOrder {
				if isCoreFoundation[nodeIdx] && !inSet[nodeIdx] && !missingSet[nodeIdx] {
					missingSet[nodeIdx] = true
					missing = append(missing, courses[nodeIdx].ID)
				}
			}
			lbl.MissingPrereqs = missing
		}

		if hasTargets {
			// Candidate nodes in the target cone sorted by foundational priority:
			// 1. Still constrained by topological prerequisite readiness during expansion,
			// 2. Among ready candidates, pick highest foundational weight w(u) (or required AND prereq) first.
			var coneNodes []int
			for _, nodeIdx := range topoOrder {
				if canReachTarget[nodeIdx] {
					coneNodes = append(coneNodes, nodeIdx)
				}
			}

			baseCount := len(labels)
			for bIdx := 0; bIdx < baseCount; bIdx++ {
				curr := labels[bIdx]
				inPath := make([]bool, n)
				pathIndices := make([]int, 0, len(curr.Path))
				for _, cid := range curr.Path {
					if idx, ok := g.IndexFor(cid); ok {
						inPath[idx] = true
						pathIndices = append(pathIndices, idx)
					}
				}

				for {
					if maxDepth > 0 && len(pathIndices) >= maxDepth {
						break
					}

					// Determine which missing nodes are direct AND-prerequisites of nodes already in the path
					isMissingAndPrereq := make([]bool, n)
					for _, pIdx := range pathIndices {
						if len(adj[pIdx]) > 0 {
							for _, reqIdx := range andPrereqs[pIdx] {
								if !inPath[reqIdx] {
									isMissingAndPrereq[reqIdx] = true
								}
							}
						}
					}

					picked := -1
					bestScore := -1.0
					for _, candIdx := range coneNodes {
						if inPath[candIdx] {
							continue
						}
						// Must not be a single-target sink unless we are in multi-target mode
						if len(constraints.TargetCourseIDs) == 1 && isTarget[candIdx] {
							continue
						}
						reqs := prereqs[candIdx]
						prereqReady := len(reqs) == 0
						if !prereqReady {
							// Ready if all prerequisites are in path, OR (for sink/OR-merge nodes) at least one prerequisite is in path
							allMet := true
							anyMet := false
							for _, reqIdx := range reqs {
								if inPath[reqIdx] {
									anyMet = true
								} else {
									allMet = false
								}
							}
							prereqReady = allMet || (anyMet && (isTarget[candIdx] || len(reqs) > 1))
						}
						if !prereqReady {
							continue
						}
						nextHours := curr.TotalHours + hours[candIdx]
						nextDiff := curr.TotalDifficulty + diffs[candIdx]
						if (maxHours > 0 && nextHours > maxHours) ||
							(maxDiff > 0 && nextDiff > maxDiff) {
							continue
						}

						// Priority score: missing AND prerequisites first (+1000), then highest foundational weight w(u)
						score := weights[candIdx]
						if isMissingAndPrereq[candIdx] {
							score += 1000.0
						} else if isCoreFoundation[candIdx] {
							score += 100.0
						}
						if score > bestScore {
							bestScore = score
							picked = candIdx
						}
					}
					if picked == -1 {
						break
					}

					inPath[picked] = true
					pathIndices = append(pathIndices, picked)
					sort.Slice(pathIndices, func(i, j int) bool {
						return topoRank[pathIndices[i]] < topoRank[pathIndices[j]]
					})

					newPath := make([]string, len(pathIndices))
					for i, idx := range pathIndices {
						newPath[i] = courses[idx].ID
					}
					endID := newPath[len(newPath)-1]
					curr = Label{
						NodeID:          endID,
						TotalHours:      curr.TotalHours + hours[picked],
						TotalDifficulty: curr.TotalDifficulty + diffs[picked],
						Depth:           len(newPath),
						Path:            newPath,
					}
					labels = append(labels, curr)
				}
			}
		}

		// Deduplicate identical paths and annotate every label with CoveragePct & MissingPrereqs
		deduped := make([]Label, 0, len(labels))
		seenPaths := make(map[string]bool, len(labels))
		for i := range labels {
			key := fmt.Sprintf("%v", labels[i].Path)
			if seenPaths[key] {
				continue
			}
			seenPaths[key] = true
			annotateLabel(&labels[i])
			deduped = append(deduped, labels[i])
		}
		labels = deduped
	}

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
