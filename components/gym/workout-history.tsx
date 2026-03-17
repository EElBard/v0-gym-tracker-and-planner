'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { calculateVolume } from '@/lib/utils/weight-suggestion'

interface WorkoutSet {
  id: string
  set_number: number
  reps: number
  weight_lbs: number
}

interface Workout {
  id: string
  workout_date: string
  notes: string | null
  sets: WorkoutSet[]
}

interface WorkoutHistoryProps {
  workouts: Workout[]
}

export function WorkoutHistory({ workouts }: WorkoutHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    workouts.length > 0 ? workouts[0].id : null
  )

  if (workouts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No workouts logged yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Log your first workout to start tracking your progress!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout) => {
        const isExpanded = expandedId === workout.id
        const volume = calculateVolume(workout.sets)
        const maxWeight = Math.max(...workout.sets.map(s => s.weight_lbs))

        return (
          <Card key={workout.id}>
            <CardHeader className="p-4">
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setExpandedId(isExpanded ? null : workout.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {format(new Date(workout.workout_date), 'EEEE, MMM d, yyyy')}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {workout.sets.length} sets | Max: {maxWeight} lbs | Volume: {volume.toLocaleString()} lbs
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </button>
            </CardHeader>
            {isExpanded && (
              <CardContent className="px-4 pb-4 pt-0">
                <div className="border-t pt-4">
                  <div className="grid grid-cols-3 gap-2 text-sm font-medium text-muted-foreground mb-2 px-2">
                    <span>Set</span>
                    <span>Reps</span>
                    <span>Weight</span>
                  </div>
                  <div className="space-y-1">
                    {workout.sets
                      .sort((a, b) => a.set_number - b.set_number)
                      .map((set) => (
                        <div
                          key={set.id}
                          className="grid grid-cols-3 gap-2 text-sm py-2 px-2 rounded-md hover:bg-muted/50"
                        >
                          <span className="font-medium">{set.set_number}</span>
                          <span>{set.reps}</span>
                          <span>{set.weight_lbs} lbs</span>
                        </div>
                      ))}
                  </div>
                  {workout.notes && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-md">
                      <p className="text-sm text-muted-foreground">{workout.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
