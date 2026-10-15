package domain_test

import (
	"encoding/json"
	"errors"
	"testing"

	"paretoium/services/optimizer/domain"
)

func TestCourseNode_Validation(t *testing.T) {
	tests := []struct {
		name        string
		node        domain.CourseNode
		expectedErr error
	}{
		{
			name: "valid node with all fields",
			node: domain.CourseNode{
				ID:          "cs101",
				Name:        "Introduction to Computer Science",
				Code:        "CS101",
				Description: "Fundamental concepts of CS",
				StudyHours:  45.0,
				Difficulty:  3.5,
				Status:      domain.StatusAvailable,
				Depth:       1,
				Tags:        []string{"cs", "intro"},
			},
			expectedErr: nil,
		},
		{
			name: "empty node ID",
			node: domain.CourseNode{
				ID:         "",
				Name:       "Intro",
				StudyHours: 10,
				Difficulty: 1,
			},
			expectedErr: domain.ErrEmptyNodeID,
		},
		{
			name: "whitespace node ID",
			node: domain.CourseNode{
				ID:         "   ",
				Name:       "Intro",
				StudyHours: 10,
				Difficulty: 1,
			},
			expectedErr: domain.ErrEmptyNodeID,
		},
		{
			name: "empty node name",
			node: domain.CourseNode{
				ID:         "cs101",
				Name:       "",
				StudyHours: 10,
				Difficulty: 1,
			},
			expectedErr: domain.ErrEmptyNodeName,
		},
		{
			name: "negative study hours",
			node: domain.CourseNode{
				ID:         "cs101",
				Name:       "CS 101",
				StudyHours: -5.0,
				Difficulty: 2.0,
			},
			expectedErr: domain.ErrNegativeStudyHours,
		},
		{
			name: "negative difficulty",
			node: domain.CourseNode{
				ID:         "cs101",
				Name:       "CS 101",
				StudyHours: 30.0,
				Difficulty: -1.0,
			},
			expectedErr: domain.ErrNegativeDifficulty,
		},
		{
			name: "invalid status",
			node: domain.CourseNode{
				ID:         "cs101",
				Name:       "CS 101",
				StudyHours: 30.0,
				Difficulty: 2.0,
				Status:     "unknown_status",
			},
			expectedErr: domain.ErrInvalidStatus,
		},
		{
			name: "valid status locked",
			node: domain.CourseNode{
				ID:         "cs101",
				Name:       "CS 101",
				StudyHours: 30.0,
				Difficulty: 2.0,
				Status:     domain.StatusLocked,
			},
			expectedErr: nil,
		},
		{
			name: "valid status completed",
			node: domain.CourseNode{
				ID:         "cs101",
				Name:       "CS 101",
				StudyHours: 30.0,
				Difficulty: 2.0,
				Status:     domain.StatusCompleted,
			},
			expectedErr: nil,
		},
		{
			name: "valid status hard",
			node: domain.CourseNode{
				ID:         "cs101",
				Name:       "CS 101",
				StudyHours: 30.0,
				Difficulty: 2.0,
				Status:     domain.StatusHard,
			},
			expectedErr: nil,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.node.Validate()
			if tc.expectedErr != nil {
				if err == nil {
					t.Fatalf("expected error containing %v, got nil", tc.expectedErr)
				}
				if !errors.Is(err, tc.expectedErr) {
					t.Fatalf("expected error %v, got %v", tc.expectedErr, err)
				}
			} else if err != nil {
				t.Fatalf("expected no error, got %v", err)
			}
		})
	}
}

func TestCourseNode_JSONRoundTrip(t *testing.T) {
	original := domain.CourseNode{
		ID:          "cs201",
		Name:        "Data Structures",
		Code:        "CS201",
		Description: "Data structures and algorithms in Go",
		StudyHours:  60.5,
		Difficulty:  7.0,
		Status:      domain.StatusLocked,
		Depth:       2,
		Tags:        []string{"dsa", "core"},
	}

	bytes, err := json.Marshal(original)
	if err != nil {
		t.Fatalf("failed to marshal CourseNode: %v", err)
	}

	var unmarshaled domain.CourseNode
	if err := json.Unmarshal(bytes, &unmarshaled); err != nil {
		t.Fatalf("failed to unmarshal CourseNode: %v", err)
	}

	if unmarshaled.ID != original.ID ||
		unmarshaled.Name != original.Name ||
		unmarshaled.StudyHours != original.StudyHours ||
		unmarshaled.Difficulty != original.Difficulty ||
		unmarshaled.Status != original.Status ||
		unmarshaled.Depth != original.Depth ||
		len(unmarshaled.Tags) != len(original.Tags) {
		t.Fatalf("unmarshaled CourseNode does not match original: %+v vs %+v", unmarshaled, original)
	}
}

func TestPrerequisiteEdge_Validation(t *testing.T) {
	tests := []struct {
		name        string
		edge        domain.PrerequisiteEdge
		expectedErr error
	}{
		{
			name: "valid AND edge",
			edge: domain.PrerequisiteEdge{
				FromID:    "cs101",
				ToID:      "cs102",
				GroupType: domain.PrereqGroupAND,
			},
			expectedErr: nil,
		},
		{
			name: "valid OR edge with group ID",
			edge: domain.PrerequisiteEdge{
				FromID:    "cs101",
				ToID:      "cs102",
				GroupType: domain.PrereqGroupOR,
				GroupID:   "intro_elective",
			},
			expectedErr: nil,
		},
		{
			name: "empty from_id",
			edge: domain.PrerequisiteEdge{
				FromID:    "",
				ToID:      "cs102",
				GroupType: domain.PrereqGroupAND,
			},
			expectedErr: domain.ErrEmptyEdgeEndpoints,
		},
		{
			name: "empty to_id",
			edge: domain.PrerequisiteEdge{
				FromID:    "cs101",
				ToID:      "",
				GroupType: domain.PrereqGroupAND,
			},
			expectedErr: domain.ErrEmptyEdgeEndpoints,
		},
		{
			name: "self prerequisite",
			edge: domain.PrerequisiteEdge{
				FromID:    "cs101",
				ToID:      "cs101",
				GroupType: domain.PrereqGroupAND,
			},
			expectedErr: domain.ErrSelfPrerequisite,
		},
		{
			name: "invalid group type",
			edge: domain.PrerequisiteEdge{
				FromID:    "cs101",
				ToID:      "cs102",
				GroupType: "XOR",
			},
			expectedErr: domain.ErrInvalidGroupType,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.edge.Validate()
			if tc.expectedErr != nil {
				if err == nil {
					t.Fatalf("expected error containing %v, got nil", tc.expectedErr)
				}
				if !errors.Is(err, tc.expectedErr) {
					t.Fatalf("expected error %v, got %v", tc.expectedErr, err)
				}
			} else if err != nil {
				t.Fatalf("expected no error, got %v", err)
			}
		})
	}
}

func TestPrerequisites_AND_OR_Evaluation(t *testing.T) {
	// Scenario: Course cs301 requires:
	// - math101 (AND requirement)
	// - cs201 (AND requirement)
	// - Either (cs210 OR cs220) as an elective requirement (GroupID: "algo_track", GroupType: OR)
	edges := []domain.PrerequisiteEdge{
		{FromID: "math101", ToID: "cs301", GroupType: domain.PrereqGroupAND},
		{FromID: "cs201", ToID: "cs301", GroupType: domain.PrereqGroupAND},
		{FromID: "cs210", ToID: "cs301", GroupType: domain.PrereqGroupOR, GroupID: "algo_track"},
		{FromID: "cs220", ToID: "cs301", GroupType: domain.PrereqGroupOR, GroupID: "algo_track"},
	}

	groups := domain.GroupPrerequisitesForNode("cs301", edges)
	if len(groups) != 2 {
		t.Fatalf("expected 2 prerequisite groups (1 default AND group, 1 OR group), got %d", len(groups))
	}

	t.Run("no courses completed", func(t *testing.T) {
		completed := map[string]bool{}
		if domain.CheckPrerequisitesSatisfied("cs301", edges, completed) {
			t.Errorf("expected prerequisites to not be satisfied")
		}
	})

	t.Run("only AND requirements completed, OR missing", func(t *testing.T) {
		completed := map[string]bool{
			"math101": true,
			"cs201":   true,
		}
		if domain.CheckPrerequisitesSatisfied("cs301", edges, completed) {
			t.Errorf("expected prerequisites to not be satisfied because OR group was not met")
		}
	})

	t.Run("only OR requirement completed, AND missing", func(t *testing.T) {
		completed := map[string]bool{
			"cs210": true,
		}
		if domain.CheckPrerequisitesSatisfied("cs301", edges, completed) {
			t.Errorf("expected prerequisites to not be satisfied because AND group was not met")
		}
	})

	t.Run("all AND satisfied and first OR branch satisfied", func(t *testing.T) {
		completed := map[string]bool{
			"math101": true,
			"cs201":   true,
			"cs210":   true,
		}
		if !domain.CheckPrerequisitesSatisfied("cs301", edges, completed) {
			t.Errorf("expected prerequisites to be fully satisfied")
		}
	})

	t.Run("all AND satisfied and second OR branch satisfied", func(t *testing.T) {
		completed := map[string]bool{
			"math101": true,
			"cs201":   true,
			"cs220":   true,
		}
		if !domain.CheckPrerequisitesSatisfied("cs301", edges, completed) {
			t.Errorf("expected prerequisites to be fully satisfied")
		}
	})

	t.Run("all AND satisfied and both OR branches satisfied", func(t *testing.T) {
		completed := map[string]bool{
			"math101": true,
			"cs201":   true,
			"cs210":   true,
			"cs220":   true,
		}
		if !domain.CheckPrerequisitesSatisfied("cs301", edges, completed) {
			t.Errorf("expected prerequisites to be fully satisfied")
		}
	})
}

func TestConstraintSet_ValidationAndBudget(t *testing.T) {
	tests := []struct {
		name        string
		constraints domain.ConstraintSet
		expectedErr error
	}{
		{
			name: "valid constraint set",
			constraints: domain.ConstraintSet{
				MaxStudyHours:      120.0,
				MaxDifficulty:      25.0,
				MaxDepth:           5,
				TargetCourseIDs:    []string{"cs401"},
				CompletedCourseIDs: []string{"cs101"},
			},
			expectedErr: nil,
		},
		{
			name: "negative max study hours",
			constraints: domain.ConstraintSet{
				MaxStudyHours: -10,
				MaxDifficulty: 20,
			},
			expectedErr: domain.ErrNegativeMaxHours,
		},
		{
			name: "negative max difficulty",
			constraints: domain.ConstraintSet{
				MaxStudyHours: 50,
				MaxDifficulty: -1,
			},
			expectedErr: domain.ErrNegativeMaxDiff,
		},
		{
			name: "negative max depth",
			constraints: domain.ConstraintSet{
				MaxStudyHours: 50,
				MaxDifficulty: 20,
				MaxDepth:      -1,
			},
			expectedErr: domain.ErrNegativeMaxDepth,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.constraints.Validate()
			if tc.expectedErr != nil {
				if err == nil {
					t.Fatalf("expected error containing %v, got nil", tc.expectedErr)
				}
				if !errors.Is(err, tc.expectedErr) {
					t.Fatalf("expected error %v, got %v", tc.expectedErr, err)
				}
			} else if err != nil {
				t.Fatalf("expected no error, got %v", err)
			}
		})
	}

	cs := domain.ConstraintSet{
		MaxStudyHours:      100.0,
		MaxDifficulty:      20.0,
		MaxDepth:           4,
		TargetCourseIDs:    []string{"cs301", "cs302"},
		CompletedCourseIDs: []string{"cs101"},
	}

	// WithinBudget tests
	if !cs.WithinBudget(80.0, 15.0, 3) {
		t.Errorf("expected within budget (80h, 15d, depth 3)")
	}
	if cs.WithinBudget(105.0, 15.0, 3) {
		t.Errorf("expected over budget when hours exceed 100")
	}
	if cs.WithinBudget(80.0, 25.0, 3) {
		t.Errorf("expected over budget when difficulty exceeds 20")
	}
	if cs.WithinBudget(80.0, 15.0, 5) {
		t.Errorf("expected over budget when depth exceeds 4")
	}

	// CompletedMap and TargetMap lookups
	completed := cs.CompletedMap()
	if !completed["cs101"] || completed["cs102"] {
		t.Errorf("CompletedMap lookup failed")
	}

	target := cs.TargetMap()
	if !target["cs301"] || !target["cs302"] || target["cs101"] {
		t.Errorf("TargetMap lookup failed")
	}
}

func TestCurriculumGraph_Instantiation(t *testing.T) {
	nodes := []domain.CourseNode{
		{ID: "cs101", Name: "Intro to CS", StudyHours: 30, Difficulty: 2.0},
		{ID: "cs102", Name: "Data Structures", StudyHours: 40, Difficulty: 3.5},
	}

	edges := []domain.PrerequisiteEdge{
		{FromID: "cs101", ToID: "cs102", GroupType: domain.PrereqGroupAND},
	}

	graph, err := domain.NewCurriculumGraph(nodes, edges)
	if err != nil {
		t.Fatalf("failed to create valid CurriculumGraph: %v", err)
	}

	if len(graph.Nodes) != 2 || len(graph.Edges) != 1 {
		t.Fatalf("unexpected graph contents: %d nodes, %d edges", len(graph.Nodes), len(graph.Edges))
	}

	// Missing edge endpoint from_id
	badEdges := []domain.PrerequisiteEdge{
		{FromID: "non_existent", ToID: "cs102", GroupType: domain.PrereqGroupAND},
	}
	_, err = domain.NewCurriculumGraph(nodes, badEdges)
	if err == nil || !errors.Is(err, domain.ErrNodeNotFound) {
		t.Fatalf("expected ErrNodeNotFound, got %v", err)
	}

	// Duplicate node ID
	duplicateNodes := []domain.CourseNode{
		{ID: "cs101", Name: "Intro to CS", StudyHours: 30, Difficulty: 2.0},
		{ID: "cs101", Name: "Intro to CS Again", StudyHours: 30, Difficulty: 2.0},
	}
	_, err = domain.NewCurriculumGraph(duplicateNodes, edges)
	if err == nil {
		t.Fatalf("expected error for duplicate node ID, got nil")
	}
}
