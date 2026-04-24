import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { calculateVolume, calculateEstimated1RM } from '@/lib/utils/weight-suggestion'
import { ArrowLeft, Calendar, Dumbbell, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function WorkoutDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch session with exercises, machines, and sets
  const { data: workoutSession, error } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      session_date,
      notes,
      workout_exercises (
        id,
        machine_id,
        machines (
          id,
          name
        ),
        workout_sets (
          id,
          set_number,
          reps,
          weight_lbs
        )
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !workoutSession) notFound()

  const exercises = (workoutSession.workout_exercises || []).map(exercise => ({
    id: exercise.id,
    machine: exercise.machines as unknown as { id: string; name: string },
    sets: (exercise.workout_sets || [])
      .map(s => ({
        id: s.id,
        set_number: s.set_number,
        reps: s.reps,
        weight_lbs: Number(s.weight_lbs),
      }))
      .sort((a, b) => a.set_number - b.set_number),
  }))

  const allSets = exercises.flatMap(exercise => exercise.sets)
  const volume = calculateVolume(allSets)
  const maxWeight = allSets.length > 0 ? Math.max(...allSets.map(s => s.weight_lbs)) : 0
  const maxWeightSet = allSets.find(s => s.weight_lbs === maxWeight)
  const estimated1RM = maxWeightSet 
    ? calculateEstimated1RM(maxWeightSet.weight_lbs, maxWeightSet.reps)
    : null

  const primaryMachine = exercises[0]?.machine

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="container px-4 md:px-6 mx-auto py-6 max-w-2xl">
        <div className="flex flex-col gap-6">
          <Link 
            href={primaryMachine ? `/machines/${primaryMachine.id}` : '/machines'}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {primaryMachine?.name ?? 'machines'}
          </Link>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">Workout Session</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(workoutSession.session_date), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{volume.toLocaleString()} lbs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Max Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{maxWeight === 0 ? 'BW' : `${maxWeight} lbs`}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Est. 1RM</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{estimated1RM ?? '-'} lbs</p>
              </CardContent>
            </Card>
          </div>

          {/* Exercises and sets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Exercises ({exercises.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {exercises.map((exercise) => (
                  <div key={exercise.id} className="mb-4">
                    <h3 className="font-medium mb-2">{exercise.machine?.name ?? 'Unknown machine'}</h3>
                    <div className="grid grid-cols-3 gap-2 text-sm font-medium text-muted-foreground mb-2 px-2">
                      <span>Set</span>
                      <span>Reps</span>
                      <span>Weight</span>
                    </div>
                    {exercise.sets.map((set) => (
                      <div
                        key={set.id}
                        className="grid grid-cols-3 gap-2 py-2 px-2 rounded-md hover:bg-muted/50"
                      >
                        <span className="font-semibold">{set.set_number}</span>
                        <span>{set.reps}</span>
                        <span>{set.weight_lbs === 0 ? 'BW' : `${set.weight_lbs} lbs`}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {workoutSession.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{workoutSession.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link href={primaryMachine ? `/machines/${primaryMachine.id}/progress` : '/machines'}>
                <TrendingUp className="h-4 w-4 mr-2" />
                View Progress
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
