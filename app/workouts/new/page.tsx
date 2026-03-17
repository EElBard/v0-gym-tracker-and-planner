import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { WorkoutForm } from '@/components/gym/workout-form'
import { calculateWeightSuggestion } from '@/lib/utils/weight-suggestion'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ machineId?: string }>
}

export default async function NewWorkoutPage({ searchParams }: PageProps) {
  const { machineId } = await searchParams
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  if (!machineId) {
    redirect('/machines')
  }

  // Fetch machine details
  const { data: machine, error } = await supabase
    .from('machines')
    .select('id, name')
    .eq('id', machineId)
    .eq('user_id', user.id)
    .single()

  if (error || !machine) notFound()

  // Fetch recent workouts for weight suggestion
  const { data: recentWorkouts } = await supabase
    .from('workouts')
    .select(`
      id,
      workout_date,
      workout_sets (
        reps,
        weight_lbs
      )
    `)
    .eq('machine_id', machineId)
    .eq('user_id', user.id)
    .order('workout_date', { ascending: false })
    .limit(3)

  // Format workouts for suggestion calculation
  const formattedWorkouts = (recentWorkouts || []).map(w => ({
    workout_date: w.workout_date,
    sets: (w.workout_sets || []).map(s => ({
      reps: s.reps,
      weight_lbs: Number(s.weight_lbs),
    })),
  }))

  const { suggestedWeight, reason } = calculateWeightSuggestion(formattedWorkouts)

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="container px-4 md:px-6 mx-auto py-6 max-w-xl">
        <div className="flex flex-col gap-6">
          <Link 
            href={`/machines/${machineId}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {machine.name}
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Log Workout</h1>
            <p className="text-muted-foreground">
              Recording workout for <span className="font-medium text-foreground">{machine.name}</span>
            </p>
          </div>
          <WorkoutForm 
            machineId={machine.id}
            machineName={machine.name}
            suggestedWeight={suggestedWeight}
            suggestedReason={reason}
          />
        </div>
      </main>
    </div>
  )
}
