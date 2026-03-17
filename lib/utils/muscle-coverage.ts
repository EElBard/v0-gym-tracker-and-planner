import { MUSCLE_GROUPS, type MuscleGroupId } from '@/lib/constants/muscle-groups'

interface WorkoutWithMuscles {
  workout_date: string
  muscle_groups: { muscle_group_id: string; is_primary: boolean }[]
}

interface MuscleGroupCoverage {
  id: MuscleGroupId
  name: string
  color: string
  lastWorked: Date | null
  daysSinceWorked: number | null
  status: 'recent' | 'moderate' | 'neglected' | 'never'
}

export function analyzeMuscleGroupCoverage(
  workouts: WorkoutWithMuscles[],
  dayThreshold = 7
): MuscleGroupCoverage[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Build a map of muscle group -> last workout date
  const lastWorkedMap = new Map<string, Date>()

  for (const workout of workouts) {
    const workoutDate = new Date(workout.workout_date)
    
    for (const mg of workout.muscle_groups) {
      const existing = lastWorkedMap.get(mg.muscle_group_id)
      if (!existing || workoutDate > existing) {
        lastWorkedMap.set(mg.muscle_group_id, workoutDate)
      }
    }
  }

  // Analyze each muscle group
  return MUSCLE_GROUPS.map(group => {
    const lastWorked = lastWorkedMap.get(group.id) ?? null
    let daysSinceWorked: number | null = null
    let status: MuscleGroupCoverage['status'] = 'never'

    if (lastWorked) {
      daysSinceWorked = Math.floor((today.getTime() - lastWorked.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceWorked <= 3) {
        status = 'recent'
      } else if (daysSinceWorked <= dayThreshold) {
        status = 'moderate'
      } else {
        status = 'neglected'
      }
    }

    return {
      id: group.id as MuscleGroupId,
      name: group.name,
      color: group.color,
      lastWorked,
      daysSinceWorked,
      status,
    }
  })
}

export function getNeglectedMuscleGroups(coverage: MuscleGroupCoverage[]): MuscleGroupCoverage[] {
  return coverage.filter(c => c.status === 'neglected' || c.status === 'never')
}

export function getMuscleGroupsWorkedThisWeek(coverage: MuscleGroupCoverage[]): number {
  return coverage.filter(c => c.status === 'recent' || c.status === 'moderate').length
}
