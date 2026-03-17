import { z } from 'zod'

export const muscleGroupSchema = z.object({
  muscle_group_id: z.string().min(1, "Muscle group is required"),
  is_primary: z.boolean(),
})

export const machineSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional().nullable(),
  muscle_groups: z.array(muscleGroupSchema).min(1, "Select at least one muscle group"),
})

export const workoutSetSchema = z.object({
  reps: z.coerce.number().min(1, "At least 1 rep required").max(999, "Max 999 reps"),
  weight_lbs: z.coerce.number().min(0, "Weight cannot be negative").max(9999, "Max 9999 lbs"),
})

export const workoutSchema = z.object({
  machine_id: z.string().uuid("Invalid machine"),
  workout_date: z.string().min(1, "Date is required"),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional().nullable(),
  sets: z.array(workoutSetSchema).min(1, "At least one set required"),
})

export type MachineFormData = z.infer<typeof machineSchema>
export type WorkoutFormData = z.infer<typeof workoutSchema>
export type WorkoutSetData = z.infer<typeof workoutSetSchema>
