'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { workoutSchema, type WorkoutFormData } from '@/lib/validations/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Plus, Trash2, Bookmark, X } from 'lucide-react'

interface WorkoutFormProps {
  machineId: string
  machineName: string
  suggestedWeight?: number | null
  suggestedReason?: string
}

interface WorkoutTemplate {
  weight: number
  reps: number
  setCount: number
}

const getTemplateKey = (machineId: string) => `gym-template-${machineId}`
const getBodyweightKey = (machineId: string) => `gym-bodyweight-${machineId}`

export function WorkoutForm({ machineId, machineName, suggestedWeight, suggestedReason }: WorkoutFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBodyweight, setIsBodyweight] = useState(false)
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null)
  const [showTemplateBanner, setShowTemplateBanner] = useState(false)

  // Load saved bodyweight preference and template on mount
  useEffect(() => {
    const savedBodyweight = localStorage.getItem(getBodyweightKey(machineId))
    if (savedBodyweight === 'true') {
      setIsBodyweight(true)
    }

    const savedTemplate = localStorage.getItem(getTemplateKey(machineId))
    if (savedTemplate) {
      try {
        const parsed = JSON.parse(savedTemplate) as WorkoutTemplate
        setTemplate(parsed)
        setShowTemplateBanner(true)
      } catch {
        // Invalid template, ignore
      }
    }
  }, [machineId])

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
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

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'sets',
  })

  const sets = watch('sets')

  const handleBodyweightToggle = (checked: boolean) => {
    setIsBodyweight(checked)
    localStorage.setItem(getBodyweightKey(machineId), String(checked))
    
    // If toggling to bodyweight, set all weights to 0
    if (checked) {
      const updatedSets = sets.map(s => ({ ...s, weight_lbs: 0 }))
      replace(updatedSets)
    }
  }

  const applyTemplate = () => {
    if (!template) return
    
    const templateSets = Array.from({ length: template.setCount }, () => ({
      reps: template.reps,
      weight_lbs: isBodyweight ? 0 : template.weight,
    }))
    replace(templateSets)
    setShowTemplateBanner(false)
  }

  const saveAsTemplate = () => {
    if (sets.length === 0) return
    
    const avgWeight = sets.reduce((sum, s) => sum + Number(s.weight_lbs), 0) / sets.length
    const avgReps = Math.round(sets.reduce((sum, s) => sum + Number(s.reps), 0) / sets.length)
    
    const newTemplate: WorkoutTemplate = {
      weight: Math.round(avgWeight * 2) / 2, // Round to nearest 0.5
      reps: avgReps,
      setCount: sets.length,
    }
    
    localStorage.setItem(getTemplateKey(machineId), JSON.stringify(newTemplate))
    setTemplate(newTemplate)
    alert('Template saved! It will be available next time you log a workout for this machine.')
  }

  const clearTemplate = () => {
    localStorage.removeItem(getTemplateKey(machineId))
    setTemplate(null)
    setShowTemplateBanner(false)
  }

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

      // Create sets - force weight to 0 if bodyweight
      const setsToInsert = data.sets.map((set, index) => ({
        workout_id: workout.id,
        set_number: index + 1,
        reps: set.reps,
        weight_lbs: isBodyweight ? 0 : set.weight_lbs,
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
      weight_lbs: isBodyweight ? 0 : (suggestedWeight ?? 0),
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Template banner */}
      {showTemplateBanner && template && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-sm">
                  Template available: {template.setCount} sets x {template.reps} reps @ {isBodyweight ? 'BW' : `${template.weight} lbs`}
                </span>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={applyTemplate}>
                  Use Template
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowTemplateBanner(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weight Suggestion */}
      {suggestedWeight !== null && suggestedWeight !== undefined && !isBodyweight && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-3 sm:p-4">
            <p className="font-semibold text-primary text-sm sm:text-base">
              Suggested Weight: {suggestedWeight} lbs
            </p>
            {suggestedReason && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{suggestedReason}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bodyweight toggle */}
      <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border bg-muted/30">
        <div className="flex flex-col">
          <Label htmlFor="bodyweight-toggle" className="text-sm font-medium">
            Bodyweight exercise
          </Label>
          <span className="text-xs text-muted-foreground">
            Hide weight inputs and record as bodyweight
          </span>
        </div>
        <Switch
          id="bodyweight-toggle"
          checked={isBodyweight}
          onCheckedChange={handleBodyweightToggle}
        />
      </div>

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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Sets</Label>
          <Button type="button" variant="outline" size="sm" onClick={addSet}>
            <Plus className="h-4 w-4 mr-1" />
            Add Set
          </Button>
        </div>

        <div className="space-y-2">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs sm:text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div className={`flex-1 grid gap-3 sm:gap-4 ${isBodyweight ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <div className="space-y-1">
                      <Label htmlFor={`sets.${index}.reps`} className="text-xs">Reps</Label>
                      <Input
                        id={`sets.${index}.reps`}
                        type="number"
                        min={1}
                        placeholder="10"
                        {...register(`sets.${index}.reps`)}
                        className="h-9"
                      />
                    </div>
                    {!isBodyweight && (
                      <div className="space-y-1">
                        <Label htmlFor={`sets.${index}.weight_lbs`} className="text-xs">Weight (lbs)</Label>
                        <Input
                          id={`sets.${index}.weight_lbs`}
                          type="number"
                          min={0}
                          step={0.5}
                          placeholder="135"
                          {...register(`sets.${index}.weight_lbs`)}
                          className="h-9"
                        />
                      </div>
                    )}
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-muted-foreground hover:text-destructive shrink-0 h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {(errors.sets?.[index]?.reps || errors.sets?.[index]?.weight_lbs) && (
                  <p className="text-xs sm:text-sm text-destructive mt-2">
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
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Button type="submit" disabled={isSubmitting} className="flex-1 order-1 sm:order-1">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Log Workout
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={saveAsTemplate}
          className="order-3 sm:order-2"
        >
          <Bookmark className="h-4 w-4 mr-2" />
          Save as Template
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} className="order-2 sm:order-3">
          Cancel
        </Button>
      </div>

      {/* Clear template option */}
      {template && (
        <div className="text-center">
          <button
            type="button"
            onClick={clearTemplate}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear saved template
          </button>
        </div>
      )}
    </form>
  )
}
