import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MuscleGroupBadge } from '@/components/gym/muscle-group-badge'
import { WorkoutHistory } from '@/components/gym/workout-history'
import { calculateWeightSuggestion } from '@/lib/utils/weight-suggestion'
import { Dumbbell, Edit, Plus, TrendingUp, ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MachineDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch machine with muscle groups
  const { data: machine, error } = await supabase
    .from('machines')
    .select(`
      id,
      name,
      photo_pathname,
      notes,
      machine_muscle_groups (
        muscle_group_id,
        is_primary
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !machine) notFound()

  // Fetch workouts with sets
  const { data: workouts } = await supabase
    .from('workouts')
    .select(`
      id,
      workout_date,
      notes,
      workout_sets (
        id,
        set_number,
        reps,
        weight_lbs
      )
    `)
    .eq('machine_id', id)
    .eq('user_id', user.id)
    .order('workout_date', { ascending: false })
    .limit(20)

  // Format workouts for display and suggestion
  const formattedWorkouts = (workouts || []).map(w => ({
    id: w.id,
    workout_date: w.workout_date,
    notes: w.notes,
    sets: (w.workout_sets || []).map(s => ({
      id: s.id,
      set_number: s.set_number,
      reps: s.reps,
      weight_lbs: Number(s.weight_lbs),
    })),
  }))

  // Calculate weight suggestion based on last 3 workouts
  const recentWorkouts = formattedWorkouts.slice(0, 3)
  const { suggestedWeight, reason } = calculateWeightSuggestion(recentWorkouts)

  const primaryMuscles = machine.machine_muscle_groups?.filter(mg => mg.is_primary) || []
  const secondaryMuscles = machine.machine_muscle_groups?.filter(mg => !mg.is_primary) || []

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="container py-6">
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          {/* Back link */}
          <Link 
            href="/machines" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to machines
          </Link>

          {/* Machine header */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo */}
            <div className="w-full md:w-64 aspect-video md:aspect-square rounded-lg bg-muted overflow-hidden shrink-0">
              {machine.photo_pathname ? (
                <img
                  src={`/api/file?pathname=${encodeURIComponent(machine.photo_pathname)}`}
                  alt={machine.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <Dumbbell className="h-16 w-16 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{machine.name}</h1>
                  {machine.notes && (
                    <p className="text-muted-foreground mt-1">{machine.notes}</p>
                  )}
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/machines/${id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              </div>

              {/* Muscle groups */}
              <div className="flex flex-wrap gap-2">
                {primaryMuscles.map(mg => (
                  <MuscleGroupBadge 
                    key={mg.muscle_group_id} 
                    muscleGroupId={mg.muscle_group_id} 
                    isPrimary 
                    size="md"
                  />
                ))}
                {secondaryMuscles.map(mg => (
                  <MuscleGroupBadge 
                    key={mg.muscle_group_id} 
                    muscleGroupId={mg.muscle_group_id} 
                    isPrimary={false}
                    size="md"
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-auto">
                <Button asChild>
                  <Link href={`/workouts/new?machineId=${id}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Workout
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/machines/${id}/progress`}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Progress
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Weight suggestion */}
          {suggestedWeight !== null && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-primary">
                    Suggested Weight: {suggestedWeight} lbs
                  </p>
                  <p className="text-sm text-muted-foreground">{reason}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workout history */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Workout History</h2>
              <span className="text-sm text-muted-foreground">
                {formattedWorkouts.length} workout{formattedWorkouts.length !== 1 ? 's' : ''}
              </span>
            </div>
            <WorkoutHistory workouts={formattedWorkouts} />
          </div>
        </div>
      </main>
    </div>
  )
}
