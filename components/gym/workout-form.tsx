'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { workoutSchema, type WorkoutFormData } from '@/lib/validations/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Plus, Trash2 } from 'lucide-react'

interface WorkoutFormProps {
  machineId: string
  machineName: string
  suggestedWeight?: number | null
  suggestedReason?: string
}

export function WorkoutForm({ machineId, machineName, suggestedWeight, suggestedReason }: WorkoutFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      machine_id: machineId,
      workout_date: new Date().toISOString().split('T')[0],
      notes: '',
      sets: [{ reps: 10, weight_lbs: suggestedWeight ?? 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sets',
  })

  const onSubmit = async (data: WorkoutFormData) => {
    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create workout
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          machine_id: data.machine_id,
          workout_date: data.workout_date,
          notes: data.notes || null,
        })
        .select()
        .single()

      if (workoutError) throw workoutError

      // Create sets
      const setsToInsert = data.sets.map((set, index) => ({
        workout_id: workout.id,
        set_number: index + 1,
        reps: set.reps,
        weight_lbs: set.weight_lbs,
      }))

      const { error: setsError } = await supabase
        .from('workout_sets')
        .insert(setsToInsert)

      if (setsError) throw setsError

      router.push(`/machines/${machineId}`)
      router.refresh()
    } catch (error) {
      console.error('Error saving workout:', error)
      alert('Failed to save workout. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addSet = () => {
    const lastSet = fields[fields.length - 1]
    append({
      reps: lastSet ? 10 : 10,
      weight_lbs: lastSet ? (suggestedWeight ?? 0) : (suggestedWeight ?? 0),
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Weight Suggestion */}
      {suggestedWeight !== null && suggestedWeight !== undefined && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <p className="font-semibold text-primary">
              Suggested Weight: {suggestedWeight} lbs
            </p>
            {suggestedReason && (
              <p className="text-sm text-muted-foreground mt-1">{suggestedReason}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          {...register('workout_date')}
        />
        {errors.workout_date && (
          <p className="text-sm text-destructive">{errors.workout_date.message}</p>
        )}
      </div>

      {/* Sets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Sets</Label>
          <Button type="button" variant="outline" size="sm" onClick={addSet}>
            <Plus className="h-4 w-4 mr-1" />
            Add Set
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor={`sets.${index}.reps`} className="text-xs">Reps</Label>
                      <Input
                        id={`sets.${index}.reps`}
                        type="number"
                        min={1}
                        placeholder="10"
                        {...register(`sets.${index}.reps`)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`sets.${index}.weight_lbs`} className="text-xs">Weight (lbs)</Label>
                      <Input
                        id={`sets.${index}.weight_lbs`}
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder="135"
                        {...register(`sets.${index}.weight_lbs`)}
                      />
                    </div>
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {(errors.sets?.[index]?.reps || errors.sets?.[index]?.weight_lbs) && (
                  <p className="text-sm text-destructive mt-2">
                    {errors.sets?.[index]?.reps?.message || errors.sets?.[index]?.weight_lbs?.message}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {errors.sets?.message && (
          <p className="text-sm text-destructive">{errors.sets.message}</p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="How did it feel? Any adjustments needed?"
          {...register('notes')}
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Log Workout
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
