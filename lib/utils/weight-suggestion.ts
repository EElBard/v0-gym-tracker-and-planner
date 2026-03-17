interface WorkoutSet {
  reps: number
  weight_lbs: number
}

interface Workout {
  workout_date: string
  sets: WorkoutSet[]
}

export function calculateWeightSuggestion(recentWorkouts: Workout[]): {
  suggestedWeight: number | null
  reason: string
} {
  if (recentWorkouts.length === 0) {
    return { suggestedWeight: null, reason: "No previous workouts to base suggestion on" }
  }

  // Get all sets from recent workouts
  const allSets = recentWorkouts.flatMap(w => w.sets)
  
  if (allSets.length === 0) {
    return { suggestedWeight: null, reason: "No sets recorded" }
  }

  // Calculate average and max weight used
  const weights = allSets.map(s => s.weight_lbs)
  const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length
  const maxWeight = Math.max(...weights)
  
  // Calculate average reps per set
  const avgReps = allSets.reduce((a, b) => a + b.reps, 0) / allSets.length

  // If consistently doing 8+ reps, suggest increasing weight
  if (avgReps >= 8 && recentWorkouts.length >= 2) {
    const suggestedWeight = Math.ceil((maxWeight + 5) / 5) * 5 // Round up to nearest 5
    return {
      suggestedWeight,
      reason: `You're consistently hitting ${Math.round(avgReps)} reps. Time to increase!`
    }
  }

  // If averaging less than 5 reps, suggest decreasing or maintaining
  if (avgReps < 5) {
    const suggestedWeight = Math.floor((avgWeight - 5) / 5) * 5 // Round down to nearest 5
    return {
      suggestedWeight: Math.max(suggestedWeight, 0),
      reason: "Focus on form with current or slightly lower weight"
    }
  }

  // Otherwise, maintain current weight
  const suggestedWeight = Math.round(avgWeight / 5) * 5 // Round to nearest 5
  return {
    suggestedWeight,
    reason: "You're progressing well. Maintain current weight"
  }
}

export function calculateEstimated1RM(weight: number, reps: number): number {
  // Epley formula: 1RM = weight × (1 + reps/30)
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

export function calculateVolume(sets: WorkoutSet[]): number {
  return sets.reduce((total, set) => total + (set.reps * set.weight_lbs), 0)
}
