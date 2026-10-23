package domain

// CalculateCost returns the weighted sum of study hours and difficulty.
func CalculateCost(studyHours, difficulty, studyHoursWeight, difficultyWeight float64) float64 {
	return studyHours*studyHoursWeight + difficulty*difficultyWeight
}
