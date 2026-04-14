import type { Database } from '@/lib/supabase/database.types'

export interface WorkoutSet {
  reps: number
  weight_lbs: number
}

export interface ProgressionAnalysis {
  metTargets: boolean
  targetSets: number
  targetReps: number
  actualSets: number
  actualAvgReps: number
  actualMaxWeight: number
  suggestedWeight: number | null
  reason: string | null
}

/**
 * Analyzes previous workout against targets and suggests next weight
 */
export function analyzeProgression(
  previousSets: WorkoutSet[],
  targetSets: number = 3,
  targetReps: number = 10,
  currentMaxWeight: number = 0,
  weightIncrement: number = 5.0
): ProgressionAnalysis {
  if (previousSets.length === 0) {
    return {
      metTargets: false,
      targetSets,
      targetReps,
      actualSets: 0,
      actualAvgReps: 0,
      actualMaxWeight: 0,
      suggestedWeight: null,
      reason: null,
    }
  }

  const actualSets = previousSets.length
  const actualAvgReps = Math.round(
    previousSets.reduce((sum, s) => sum + s.reps, 0) / previousSets.length
  )
  const actualMaxWeight = Math.max(...previousSets.map(s => s.weight_lbs))

  // Check if targets were met
  const metTargets =
    actualSets >= targetSets && actualAvgReps >= targetReps

  let suggestedWeight: number | null = null
  let reason: string | null = null

  if (metTargets && actualMaxWeight > 0) {
    // If targets were met and using weights, suggest increase
    suggestedWeight = Math.round((actualMaxWeight + weightIncrement) * 2) / 2
    reason = `Great job! Met your targets of ${targetSets}x${targetReps}. Time to increase weight.`
  } else if (actualMaxWeight > 0 && actualAvgReps >= targetReps && actualSets < targetSets) {
    // Reps are good but not enough sets
    reason = `Add more sets to reach your target of ${targetSets} sets.`
  } else if (actualSets >= targetSets && actualAvgReps < targetReps) {
    // Right number of sets but reps are low
    reason = `Focus on hitting ${targetReps} reps per set to progress.`
  }

  return {
    metTargets,
    targetSets,
    targetReps,
    actualSets,
    actualAvgReps,
    actualMaxWeight,
    suggestedWeight,
    reason,
  }
}

/**
 * Formats a time duration in seconds to HH:MM:SS format
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
