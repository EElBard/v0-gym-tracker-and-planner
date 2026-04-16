'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { machineSchema, type MachineFormData } from '@/lib/validations/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MuscleGroupSelector } from './muscle-group-selector'
import { Camera, Loader2, X } from 'lucide-react'

interface MachineFormProps {
  machine?: {
    id: string
    name: string
    notes: string | null
    photo_pathname: string | null
    muscle_groups: { muscle_group_id: string; is_primary: boolean }[]
  }
}

export function MachineForm({ machine }: MachineFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    machine?.photo_pathname ? `/api/file?pathname=${encodeURIComponent(machine.photo_pathname)}` : null
  )
  const [removePhoto, setRemovePhoto] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MachineFormData>({
    resolver: zodResolver(machineSchema),
    defaultValues: {
      name: machine?.name ?? '',
      notes: machine?.notes ?? '',
      muscle_groups: machine?.muscle_groups ?? [],
      target_sets: (machine as any)?.target_sets ?? 3,
      target_reps: (machine as any)?.target_reps ?? 10,
      weight_increment: (machine as any)?.weight_increment ?? 5.0,
    },
  })

  const muscleGroups = watch('muscle_groups')

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
      setRemovePhoto(false)
    }
  }

  const handleRemovePhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
    setRemovePhoto(true)
  }

  const onSubmit = async (data: MachineFormData) => {
    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let photoPathname = machine?.photo_pathname ?? null

      // Upload new photo if selected
      if (photo) {
        const formData = new FormData()
        formData.append('file', photo)
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (!uploadRes.ok) throw new Error('Failed to upload photo')
        const { pathname } = await uploadRes.json()
        photoPathname = pathname
      } else if (removePhoto) {
        photoPathname = null
      }

      if (machine) {
        // Update existing machine
        const { error: updateError } = await supabase
          .from('machines')
          .update({
            name: data.name,
            notes: data.notes || null,
            photo_pathname: photoPathname,
            target_sets: data.target_sets || 3,
            target_reps: data.target_reps || 10,
            weight_increment: data.weight_increment || 5.0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', machine.id)

        if (updateError) throw updateError

        // Delete existing muscle groups
        await supabase
          .from('machine_muscle_groups')
          .delete()
          .eq('machine_id', machine.id)

        // Insert new muscle groups
        if (data.muscle_groups.length > 0) {
          const { error: mgError } = await supabase
            .from('machine_muscle_groups')
            .insert(
              data.muscle_groups.map(mg => ({
                machine_id: machine.id,
                muscle_group_id: mg.muscle_group_id,
                is_primary: mg.is_primary,
              }))
            )
          if (mgError) throw mgError
        }

        router.push(`/machines/${machine.id}`)
      } else {
        // Create new machine
        const { data: newMachine, error: insertError } = await supabase
          .from('machines')
          .insert({
            user_id: user.id,
            name: data.name,
            notes: data.notes || null,
            photo_pathname: photoPathname,
            target_sets: data.target_sets || 3,
            target_reps: data.target_reps || 10,
            weight_increment: data.weight_increment || 5.0,
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Insert muscle groups
        if (data.muscle_groups.length > 0) {
          const { error: mgError } = await supabase
            .from('machine_muscle_groups')
            .insert(
              data.muscle_groups.map(mg => ({
                machine_id: newMachine.id,
                muscle_group_id: mg.muscle_group_id,
                is_primary: mg.is_primary,
              }))
            )
          if (mgError) throw mgError
        }

        router.push('/machines')
      }

      router.refresh()
    } catch (error) {
      console.error('Error saving machine:', error)
      alert('Failed to save machine. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Photo upload */}
      <div className="space-y-2">
        <Label>Photo</Label>
        <div className="flex items-start gap-4">
          <div className="relative w-40 h-40 rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
            {photoPreview ? (
              <>
                <img src={photoPreview} alt="Preview" className="object-cover w-full h-full" />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-2 p-4">
                <Camera className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground text-center">Click to upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          {!photoPreview && (
            <p className="text-sm text-muted-foreground">
              Upload a photo of the machine to help you identify it later.
            </p>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Machine Name</Label>
        <Input
          id="name"
          placeholder="e.g., Bench Press, Lat Pulldown"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Muscle Groups */}
      <div className="space-y-2">
        <Label>Target Muscle Groups</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Select the muscles this machine works. Mark primary muscles that are the main focus.
        </p>
        <MuscleGroupSelector
          selected={muscleGroups}
          onChange={(selected) => setValue('muscle_groups', selected, { shouldValidate: true })}
          error={errors.muscle_groups?.message}
        />
      </div>

      {/* Progression Targets */}
      <div className="space-y-3">
        <Label>Progression Targets</Label>
        <p className="text-sm text-muted-foreground">
          Set your goals for this machine. These help track progress and suggest weight increases.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="target_sets" className="text-sm">Target Sets</Label>
            <Input
              id="target_sets"
              type="number"
              min={1}
              max={50}
              placeholder="3"
              {...register('target_sets')}
            />
            {errors.target_sets && (
              <p className="text-xs text-destructive">{errors.target_sets.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_reps" className="text-sm">Target Reps</Label>
            <Input
              id="target_reps"
              type="number"
              min={1}
              max={999}
              placeholder="10"
              {...register('target_reps')}
            />
            {errors.target_reps && (
              <p className="text-xs text-destructive">{errors.target_reps.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight_increment" className="text-sm">Weight Increment (lbs)</Label>
            <Input
              id="weight_increment"
              type="number"
              min={0.5}
              step={0.5}
              max={100}
              placeholder="5.0"
              {...register('weight_increment')}
            />
            {errors.weight_increment && (
              <p className="text-xs text-destructive">{errors.weight_increment.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any notes about this machine, settings, etc."
          {...register('notes')}
          rows={3}
        />
        {errors.notes && (
          <p className="text-sm text-destructive">{errors.notes.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {machine ? 'Save Changes' : 'Add Machine'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
