'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ChevronDown, ChevronUp, Calendar, Edit, Trash2, Save, X, Loader2 } from 'lucide-react'
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
  onWorkoutUpdated?: () => void
}

export function WorkoutHistory({ workouts, onWorkoutUpdated }: WorkoutHistoryProps) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(
    workouts.length > 0 ? workouts[0].id : null
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingSets, setEditingSets] = useState<WorkoutSet[]>([])
  const [editingNotes, setEditingNotes] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [localWorkouts, setLocalWorkouts] = useState<Workout[]>(workouts)

  const startEditing = (workout: Workout) => {
    setEditingId(workout.id)
    setEditingSets([...workout.sets])
    setEditingNotes(workout.notes || '')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingSets([])
    setEditingNotes('')
  }

  const updateSet = (index: number, field: 'reps' | 'weight_lbs', value: number) => {
    const newSets = [...editingSets]
    newSets[index] = { ...newSets[index], [field]: value }
    setEditingSets(newSets)
  }

  const saveEdits = async (workoutId: string) => {
    setIsSaving(true)
    const supabase = createClient()

    try {
      // Update notes
      const { error: notesError } = await supabase
        .from('workout_sessions')
        .update({ notes: editingNotes || null })
        .eq('id', workoutId)

      if (notesError) throw notesError

      // Update each set
      for (const set of editingSets) {
        const { error: setError } = await supabase
          .from('workout_sets')
          .update({ reps: set.reps, weight_lbs: set.weight_lbs })
          .eq('id', set.id)

        if (setError) throw setError
      }

      // Update local state
      setLocalWorkouts(prev => prev.map(w => {
        if (w.id === workoutId) {
          return { ...w, notes: editingNotes || null, sets: editingSets }
        }
        return w
      }))

      cancelEditing()
      onWorkoutUpdated?.()
      router.refresh()
    } catch (error) {
      console.error('Error saving workout:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteWorkout = async (workoutId: string) => {
    setDeletingId(workoutId)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', workoutId)

      if (error) throw error

      // Optimistically remove from local state
      setLocalWorkouts(prev => prev.filter(w => w.id !== workoutId))
      onWorkoutUpdated?.()
      router.refresh()
    } catch (error) {
      console.error('Error deleting workout:', error)
      alert('Failed to delete workout. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  if (localWorkouts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 md:p-8 text-center">
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
      {localWorkouts.map((workout) => {
        const isExpanded = expandedId === workout.id
        const isEditing = editingId === workout.id
        const volume = calculateVolume(workout.sets)
        const maxWeight = Math.max(...workout.sets.map(s => s.weight_lbs))
        const isBodyweight = maxWeight === 0

        return (
          <Card key={workout.id}>
            <CardHeader className="p-3 sm:p-4">
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setExpandedId(isExpanded ? null : workout.id)}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 shrink-0">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm sm:text-base">
                      {format(new Date(workout.workout_date), 'EEE, MMM d, yyyy')}
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {workout.sets.length} sets | {isBodyweight ? 'Bodyweight' : `Max: ${maxWeight} lbs`} | Vol: {volume.toLocaleString()} lbs
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-9 sm:w-9">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </button>
            </CardHeader>
            {isExpanded && (
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                <div className="border-t pt-3 sm:pt-4">
                  {/* Action buttons */}
                  {!isEditing && (
                    <div className="flex justify-end gap-2 mb-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(workout)}
                        className="h-8 px-2 sm:px-3"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 sm:px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this workout?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This cannot be undone. All sets and data for this workout will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteWorkout(workout.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deletingId === workout.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}

                  {/* Sets display */}
                  <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm font-medium text-muted-foreground mb-2 px-2">
                    <span>Set</span>
                    <span>Reps</span>
                    <span>Weight</span>
                  </div>
                  <div className="space-y-1">
                    {(isEditing ? editingSets : workout.sets)
                      .sort((a, b) => a.set_number - b.set_number)
                      .map((set, index) => (
                        <div
                          key={set.id}
                          className="grid grid-cols-3 gap-2 text-xs sm:text-sm py-2 px-2 rounded-md hover:bg-muted/50"
                        >
                          <span className="font-medium">{set.set_number}</span>
                          {isEditing ? (
                            <>
                              <Input
                                type="number"
                                min={1}
                                value={set.reps}
                                onChange={(e) => updateSet(index, 'reps', parseInt(e.target.value) || 0)}
                                className="h-8 text-xs sm:text-sm"
                              />
                              <Input
                                type="number"
                                min={0}
                                step={0.5}
                                value={set.weight_lbs}
                                onChange={(e) => updateSet(index, 'weight_lbs', parseFloat(e.target.value) || 0)}
                                className="h-8 text-xs sm:text-sm"
                              />
                            </>
                          ) : (
                            <>
                              <span>{set.reps}</span>
                              <span>{set.weight_lbs === 0 ? 'BW' : `${set.weight_lbs} lbs`}</span>
                            </>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Notes */}
                  {isEditing ? (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="edit-notes" className="text-xs sm:text-sm">Notes</Label>
                      <Textarea
                        id="edit-notes"
                        value={editingNotes}
                        onChange={(e) => setEditingNotes(e.target.value)}
                        rows={2}
                        className="text-xs sm:text-sm"
                        placeholder="How did it feel?"
                      />
                    </div>
                  ) : workout.notes ? (
                    <div className="mt-4 p-3 bg-muted/50 rounded-md">
                      <p className="text-xs sm:text-sm text-muted-foreground">{workout.notes}</p>
                    </div>
                  ) : null}

                  {/* Edit actions */}
                  {isEditing && (
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEditing}
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveEdits(workout.id)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </Button>
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
