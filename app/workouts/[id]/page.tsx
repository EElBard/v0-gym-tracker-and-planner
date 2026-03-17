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

  // Fetch workout with machine and sets
  const { data: workout, error } = await supabase
    .from('workouts')
    .select(`
      id,
      workout_date,
      notes,
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
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !workout) notFound()

  const sets = (workout.workout_sets || [])
    .map(s => ({
      id: s.id,
      set_number: s.set_number,
      reps: s.reps,
      weight_lbs: Number(s.weight_lbs),
    }))
    .sort((a, b) => a.set_number - b.set_number)

  const volume = calculateVolume(sets)
  const maxWeight = Math.max(...sets.map(s => s.weight_lbs))
  const maxWeightSet = sets.find(s => s.weight_lbs === maxWeight)
  const estimated1RM = maxWeightSet 
    ? calculateEstimated1RM(maxWeightSet.weight_lbs, maxWeightSet.reps)
    : null

  const machine = workout.machines as unknown as { id: string; name: string }

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="container py-6 max-w-2xl">
        <div className="flex flex-col gap-6">
          <Link 
            href={`/machines/${machine.id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {machine.name}
          </Link>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{machine.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(workout.workout_date), 'EEEE, MMMM d, yyyy')}
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
                <p className="text-2xl font-bold">{maxWeight} lbs</p>
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

          {/* Sets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Sets ({sets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-sm font-medium text-muted-foreground mb-3 px-2">
                <span>Set</span>
                <span>Reps</span>
                <span>Weight</span>
              </div>
              <div className="space-y-1">
                {sets.map((set) => (
                  <div
                    key={set.id}
                    className="grid grid-cols-3 gap-2 py-3 px-2 rounded-md hover:bg-muted/50"
                  >
                    <span className="font-semibold">{set.set_number}</span>
                    <span>{set.reps}</span>
                    <span>{set.weight_lbs} lbs</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {workout.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{workout.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/machines/${machine.id}/progress`}>
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
