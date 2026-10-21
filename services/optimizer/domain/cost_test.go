package domain_test

import (
	"testing"

	"paretoium/services/optimizer/domain"
)

func TestCalculateCost(t *testing.T) {
	tests := []struct {
		name             string
		studyHours       float64
		difficulty       float64
		studyHoursWeight float64
		difficultyWeight float64
		expectedCost     float64
	}{
		{
			name:             "equal weights",
			studyHours:       10,
			difficulty:       2,
			studyHoursWeight: 1,
			difficultyWeight: 1,
			expectedCost:     12,
		},
		{
			name:             "prioritize study hours",
			studyHours:       10,
			difficulty:       2,
			studyHoursWeight: 2,
			difficultyWeight: 1,
			expectedCost:     22,
		},
		{
			name:             "prioritize difficulty",
			studyHours:       10,
			difficulty:       2,
			studyHoursWeight: 1,
			difficultyWeight: 3,
			expectedCost:     16,
		},
		{
			name:             "zero study hours weight",
			studyHours:       10,
			difficulty:       2,
			studyHoursWeight: 0,
			difficultyWeight: 3,
			expectedCost:     6,
		},
		{
			name:             "zero difficulty weight",
			studyHours:       10,
			difficulty:       2,
			studyHoursWeight: 2,
			difficultyWeight: 0,
			expectedCost:     20,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			cost := domain.CalculateCost(
				tc.studyHours,
				tc.difficulty,
				tc.studyHoursWeight,
				tc.difficultyWeight,
			)
			if cost != tc.expectedCost {
				t.Errorf("CalculateCost() = %v, want %v", cost, tc.expectedCost)
			}
		})
	}
}
