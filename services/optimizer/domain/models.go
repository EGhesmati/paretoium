package domain

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

// CourseStatus represents the current state of a course in the learner's journey.
type CourseStatus string

const (
	StatusLocked    CourseStatus = "locked"
	StatusAvailable CourseStatus = "available"
	StatusCompleted CourseStatus = "completed"
	StatusHard      CourseStatus = "hard"
)

// PrereqGroupType defines the boolean relationship between prerequisite requirements.
type PrereqGroupType string

const (
	PrereqGroupAND PrereqGroupType = "AND"
	PrereqGroupOR  PrereqGroupType = "OR"
)

// Common domain validation errors.
var (
	ErrEmptyNodeID         = errors.New("course node ID cannot be empty")
	ErrEmptyNodeName       = errors.New("course node name cannot be empty")
	ErrNegativeStudyHours  = errors.New("study hours cannot be negative")
	ErrNegativeDifficulty  = errors.New("difficulty score cannot be negative")
	ErrInvalidStatus       = errors.New("invalid course status")
	ErrEmptyEdgeEndpoints  = errors.New("prerequisite edge from_id and to_id must both be non-empty")
	ErrSelfPrerequisite    = errors.New("a course cannot be a prerequisite of itself")
	ErrInvalidGroupType    = errors.New("invalid prerequisite group type (must be AND or OR)")
	ErrNegativeMaxHours    = errors.New("maximum study hours constraint cannot be negative")
	ErrNegativeMaxDiff     = errors.New("maximum difficulty constraint cannot be negative")
	ErrNegativeMaxDepth    = errors.New("maximum depth constraint cannot be negative")
	ErrNodeNotFound        = errors.New("course node not found in graph")
)

// CourseNode represents an individual course node in the optimization graph.
type CourseNode struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Code        string       `json:"code,omitempty"`
	Description string       `json:"description,omitempty"`
	StudyHours  float64      `json:"study_hours"`
	Difficulty  float64      `json:"difficulty"`
	Status      CourseStatus `json:"status"`
	Depth       int          `json:"depth,omitempty"`
	Tags        []string     `json:"tags,omitempty"`
}

// Validate checks whether the course node attributes are valid.
func (c CourseNode) Validate() error {
	if strings.TrimSpace(c.ID) == "" {
		return ErrEmptyNodeID
	}
	if strings.TrimSpace(c.Name) == "" {
		return ErrEmptyNodeName
	}
	if c.StudyHours < 0 {
		return ErrNegativeStudyHours
	}
	if c.Difficulty < 0 {
		return ErrNegativeDifficulty
	}
	if c.Status != "" {
		switch c.Status {
		case StatusLocked, StatusAvailable, StatusCompleted, StatusHard:
			// valid
		default:
			return fmt.Errorf("%w: %s", ErrInvalidStatus, c.Status)
		}
	}
	return nil
}

// UnmarshalJSON supports both study_hours and estimated_hours JSON keys.
func (c *CourseNode) UnmarshalJSON(data []byte) error {
	type Alias CourseNode
	aux := struct {
		*Alias
		EstimatedHours *float64 `json:"estimated_hours,omitempty"`
	}{
		Alias: (*Alias)(c),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if aux.EstimatedHours != nil && c.StudyHours == 0 {
		c.StudyHours = *aux.EstimatedHours
	}
	return nil
}

// PrerequisiteEdge represents dependencies between courses.
// GroupType and GroupID allow modeling both AND and OR prerequisite logic.
// If GroupID is empty, it acts as a standalone AND prerequisite.
// Multiple edges sharing the same ToID and GroupID with GroupType="OR"
// mean that satisfying ANY one of the FromID courses in that group satisfies the requirement.
type PrerequisiteEdge struct {
	FromID    string          `json:"from_id"`            // Prerequisite course ID
	ToID      string          `json:"to_id"`              // Target course ID
	From      string          `json:"from,omitempty"`     // Ergonomic alias for FromID
	To        string          `json:"to,omitempty"`       // Ergonomic alias for ToID
	GroupType PrereqGroupType `json:"group_type"`         // AND or OR
	Type      PrereqGroupType `json:"type,omitempty"`     // Ergonomic alias for GroupType
	GroupID   string          `json:"group_id,omitempty"` // Group identifier for grouped requirements
}

// Source returns the prerequisite origin course ID.
func (e PrerequisiteEdge) Source() string {
	if e.FromID != "" {
		return e.FromID
	}
	return e.From
}

// Target returns the dependent target course ID.
func (e PrerequisiteEdge) Target() string {
	if e.ToID != "" {
		return e.ToID
	}
	return e.To
}

// PrereqType returns the logical relationship type (defaults to AND).
func (e PrerequisiteEdge) PrereqType() PrereqGroupType {
	if e.GroupType != "" {
		return e.GroupType
	}
	if e.Type != "" {
		return e.Type
	}
	return PrereqGroupAND
}

// UnmarshalJSON supports both from/to/type and from_id/to_id/group_type JSON keys.
func (e *PrerequisiteEdge) UnmarshalJSON(data []byte) error {
	type Alias PrerequisiteEdge
	aux := struct {
		*Alias
		From string          `json:"from,omitempty"`
		To   string          `json:"to,omitempty"`
		Type PrereqGroupType `json:"type,omitempty"`
	}{
		Alias: (*Alias)(e),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if aux.From != "" && e.FromID == "" {
		e.FromID = aux.From
	}
	if aux.To != "" && e.ToID == "" {
		e.ToID = aux.To
	}
	if aux.Type != "" && e.GroupType == "" {
		e.GroupType = aux.Type
	}
	return nil
}

// Validate checks whether the prerequisite edge attributes are valid.
func (e PrerequisiteEdge) Validate() error {
	from := e.Source()
	to := e.Target()
	if strings.TrimSpace(from) == "" || strings.TrimSpace(to) == "" {
		return ErrEmptyEdgeEndpoints
	}
	if from == to {
		return fmt.Errorf("%w: node %q cannot require itself", ErrSelfPrerequisite, from)
	}
	pType := e.PrereqType()
	switch pType {
	case PrereqGroupAND, PrereqGroupOR:
		// valid
	default:
		return fmt.Errorf("%w: %s", ErrInvalidGroupType, pType)
	}
	return nil
}

// PrerequisiteGroup represents an aggregated collection of prerequisite course IDs for a target course.
type PrerequisiteGroup struct {
	GroupID string          `json:"group_id"`
	Type    PrereqGroupType `json:"type"`
	NodeIDs []string        `json:"node_ids"`
}

// IsSatisfied evaluates whether the prerequisite group requirements are satisfied
// given a lookup map of completed course IDs.
func (pg PrerequisiteGroup) IsSatisfied(completed map[string]bool) bool {
	if len(pg.NodeIDs) == 0 {
		return true
	}
	if pg.Type == PrereqGroupOR {
		for _, id := range pg.NodeIDs {
			if completed[id] {
				return true
			}
		}
		return false
	}

	// Default: AND logic (all courses in group must be completed)
	for _, id := range pg.NodeIDs {
		if !completed[id] {
			return false
		}
	}
	return true
}

// GroupPrerequisitesForNode extracts and organizes all incoming prerequisite edges for a target course into groups.
func GroupPrerequisitesForNode(targetID string, edges []PrerequisiteEdge) []PrerequisiteGroup {
	groupMap := make(map[string]*PrerequisiteGroup)
	var standaloneANDs []string

	for _, edge := range edges {
		if edge.Target() != targetID {
			continue
		}

		groupType := edge.PrereqType()
		fromID := edge.Source()

		if edge.GroupID == "" {
			if groupType == PrereqGroupAND {
				standaloneANDs = append(standaloneANDs, fromID)
			} else {
				// Standalone OR treated as a single-element group with synthetic ID
				key := fmt.Sprintf("or_single_%s", fromID)
				groupMap[key] = &PrerequisiteGroup{
					GroupID: key,
					Type:    PrereqGroupOR,
					NodeIDs: []string{fromID},
				}
			}
			continue
		}

		group, exists := groupMap[edge.GroupID]
		if !exists {
			group = &PrerequisiteGroup{
				GroupID: edge.GroupID,
				Type:    groupType,
				NodeIDs: make([]string, 0),
			}
			groupMap[edge.GroupID] = group
		}
		group.NodeIDs = append(group.NodeIDs, fromID)
	}

	initialCap := len(groupMap)
	if len(standaloneANDs) > 0 {
		initialCap++
	}
	result := make([]PrerequisiteGroup, 0, initialCap)
	if len(standaloneANDs) > 0 {
		result = append(result, PrerequisiteGroup{
			GroupID: "default_and",
			Type:    PrereqGroupAND,
			NodeIDs: standaloneANDs,
		})
	}
	for _, group := range groupMap {
		result = append(result, *group)
	}

	return result
}

// CheckPrerequisitesSatisfied checks if all prerequisite groups for a given node are satisfied
// by the provided completed courses.
func CheckPrerequisitesSatisfied(targetID string, edges []PrerequisiteEdge, completed map[string]bool) bool {
	groups := GroupPrerequisitesForNode(targetID, edges)
	for _, g := range groups {
		if !g.IsSatisfied(completed) {
			return false
		}
	}
	return true
}

// ConstraintSet defines the optimization constraints provided by the user.
type ConstraintSet struct {
	MaxStudyHours      float64  `json:"max_study_hours"`
	MaxDifficulty      float64  `json:"max_difficulty"`
	MaxDepth           int      `json:"max_depth,omitempty"`
	TargetCourseIDs    []string `json:"target_course_ids,omitempty"`
	CompletedCourseIDs []string `json:"completed_course_ids,omitempty"`
}

// Validate checks whether the constraint values are valid.
func (cs ConstraintSet) Validate() error {
	if cs.MaxStudyHours < 0 {
		return ErrNegativeMaxHours
	}
	if cs.MaxDifficulty < 0 {
		return ErrNegativeMaxDiff
	}
	if cs.MaxDepth < 0 {
		return ErrNegativeMaxDepth
	}
	return nil
}

// CompletedMap returns a map lookup of completed course IDs for fast membership checks.
func (cs ConstraintSet) CompletedMap() map[string]bool {
	lookup := make(map[string]bool, len(cs.CompletedCourseIDs))
	for _, id := range cs.CompletedCourseIDs {
		lookup[id] = true
	}
	return lookup
}

// TargetMap returns a map lookup of target course IDs for fast membership checks.
func (cs ConstraintSet) TargetMap() map[string]bool {
	lookup := make(map[string]bool, len(cs.TargetCourseIDs))
	for _, id := range cs.TargetCourseIDs {
		lookup[id] = true
	}
	return lookup
}

// WithinBudget evaluates if the accumulated metrics comply with this constraint set.
func (cs ConstraintSet) WithinBudget(hours, difficulty float64, depth int) bool {
	if cs.MaxStudyHours > 0 && hours > cs.MaxStudyHours {
		return false
	}
	if cs.MaxDifficulty > 0 && difficulty > cs.MaxDifficulty {
		return false
	}
	if cs.MaxDepth > 0 && depth > cs.MaxDepth {
		return false
	}
	return true
}

// CurriculumGraph encapsulates a collection of course nodes and prerequisite edges.
type CurriculumGraph struct {
	Nodes map[string]CourseNode `json:"nodes"`
	Edges []PrerequisiteEdge    `json:"edges"`
}

// NewCurriculumGraph creates a validated CurriculumGraph from nodes and edges.
func NewCurriculumGraph(nodes []CourseNode, edges []PrerequisiteEdge) (*CurriculumGraph, error) {
	nodeMap := make(map[string]CourseNode, len(nodes))
	for _, node := range nodes {
		if err := node.Validate(); err != nil {
			return nil, fmt.Errorf("invalid node %q: %w", node.ID, err)
		}
		if _, exists := nodeMap[node.ID]; exists {
			return nil, fmt.Errorf("duplicate node ID: %s", node.ID)
		}
		nodeMap[node.ID] = node
	}

	for i, edge := range edges {
		if err := edge.Validate(); err != nil {
			return nil, fmt.Errorf("invalid edge index %d: %w", i, err)
		}
		if _, exists := nodeMap[edge.Source()]; !exists {
			return nil, fmt.Errorf("%w: from_id %q", ErrNodeNotFound, edge.Source())
		}
		if _, exists := nodeMap[edge.Target()]; !exists {
			return nil, fmt.Errorf("%w: to_id %q", ErrNodeNotFound, edge.Target())
		}
	}

	return &CurriculumGraph{
		Nodes: nodeMap,
		Edges: edges,
	}, nil
}

// CurriculumPayload represents raw curriculum JSON containing slices of nodes and edges.
type CurriculumPayload struct {
	Nodes []CourseNode       `json:"nodes"`
	Edges []PrerequisiteEdge `json:"edges"`
}

// ToGraph validates and converts the payload into a CurriculumGraph.
func (cp CurriculumPayload) ToGraph() (*CurriculumGraph, error) {
	return NewCurriculumGraph(cp.Nodes, cp.Edges)
}

// LoadCurriculumFromJSON parses JSON bytes into a validated CurriculumGraph.
func LoadCurriculumFromJSON(data []byte) (*CurriculumGraph, error) {
	var payload CurriculumPayload
	if err := json.Unmarshal(data, &payload); err != nil {
		return nil, fmt.Errorf("failed to parse curriculum JSON: %w", err)
	}
	return payload.ToGraph()
}

