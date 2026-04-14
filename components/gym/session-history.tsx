'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dumbbell } from 'lucide-react'

interface SessionSet {
  set_number: number
  reps: number
  weight_lbs: number
}

interface SessionHistoryProps {
  sets: SessionSet[]
  machineTargets: {
    target_sets: number
    target_reps: number
  }
}

export function SessionHistory({ sets, machineTargets }: SessionHistoryProps) {
  if (sets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <Dumbbell className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No sets logged yet</p>
        </CardContent>
      </Card>
    )
  }

  const maxWeight = Math.max(...sets.map(s => s.weight_lbs))
  const avgReps = Math.round(sets.reduce((sum, s) => sum + s.reps, 0) / sets.length)
  const metSets = sets.length >= machineTargets.target_sets
  const metReps = avgReps >= machineTargets.target_reps

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Session Progress</CardTitle>
          <div className="flex gap-2">
            {metSets && (
              <Badge variant="default" className="bg-green-600">
                Sets ✓
              </Badge>
            )}
            {metReps && (
              <Badge variant="default" className="bg-green-600">
                Reps ✓
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Sets</p>
            <p className="text-xl font-bold">{sets.length}</p>
            <p className="text-xs text-muted-foreground">
              Target: {machineTargets.target_sets}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Avg Reps</p>
            <p className="text-xl font-bold">{avgReps}</p>
            <p className="text-xs text-muted-foreground">
              Target: {machineTargets.target_reps}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Max Weight</p>
            <p className="text-xl font-bold">{maxWeight === 0 ? 'BW' : `${maxWeight} lbs`}</p>
          </div>
        </div>

        {/* Sets table */}
        <div>
          <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground mb-2 px-2">
            <span>Set</span>
            <span>Reps</span>
            <span>Weight</span>
            <span>Volume</span>
          </div>
          <div className="space-y-1">
            {sets.map((set) => {
              const volume = set.reps * set.weight_lbs
              return (
                <div
                  key={`${set.set_number}`}
                  className="grid grid-cols-4 gap-2 px-2 py-2 rounded-md hover:bg-muted/50 text-sm"
                >
                  <span className="font-semibold text-primary">{set.set_number}</span>
                  <span>{set.reps}</span>
                  <span className="font-medium">
                    {set.weight_lbs === 0 ? 'BW' : `${set.weight_lbs} lbs`}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {volume > 0 ? `${volume.toLocaleString()}` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
