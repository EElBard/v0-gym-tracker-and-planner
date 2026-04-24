import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, ChevronRight, Dumbbell, Layers, Weight } from 'lucide-react'
import { SessionActions } from './session-actions'

type SessionRow = {
  id: string
  session_date: string
  notes: string | null
  workout_exercises: {
    id: string
    machine_id: string
    machines: {
      id: string
      name: string
    } | null
    workout_sets: {
      reps: number
      weight_lbs: number
    }[]
  }[]
}

export default async function SessionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: sessions } = await supabase
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
          reps,
          weight_lbs
        )
      )
    `)
    .eq('user_id', user.id)
    .order('session_date', { ascending: false })
    .limit(50)

  const formattedSessions = ((sessions || []) as unknown as SessionRow[]).map((session) => {
    const exerciseRows = session.workout_exercises || []
    const machineNames = Array.from(
      new Set(
        exerciseRows
          .map((exercise) => exercise.machines?.name)
          .filter((name): name is string => Boolean(name))
      )
    )
    const totalSets = exerciseRows.reduce((sum, exercise) => sum + (exercise.workout_sets?.length || 0), 0)
    const totalVolume = exerciseRows.reduce((sum, exercise) => {
      const exerciseVolume = (exercise.workout_sets || []).reduce(
        (exerciseSum, set) => exerciseSum + set.reps * Number(set.weight_lbs),
        0
      )
      return sum + exerciseVolume
    }, 0)

    return {
      id: session.id,
      sessionDate: session.session_date,
      notes: session.notes,
      machineNames,
      totalSets,
      totalVolume,
    }
  })

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="container px-4 md:px-6 mx-auto py-6 max-w-4xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">Session History</h1>
            <p className="text-sm text-muted-foreground">Review each workout session and the machines you used.</p>
          </div>

          {formattedSessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                <Dumbbell className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="font-medium">No sessions yet</p>
                <p className="text-sm text-muted-foreground mt-1">Start a workout session to build your history.</p>
                <Button asChild className="mt-4">
                  <Link href="/session/live">Start Workout</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {formattedSessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Calendar className="h-4 w-4 text-primary" />
                          {format(new Date(session.sessionDate), 'EEEE, MMM d, yyyy')}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5" />
                            {session.totalSets} sets
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Dumbbell className="h-3.5 w-3.5" />
                            {session.machineNames.length} machines
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Weight className="h-3.5 w-3.5" />
                            {session.totalVolume.toLocaleString()} lbs volume
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/workouts/${session.id}`}>
                            Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                        <SessionActions sessionId={session.id} initialDate={session.sessionDate} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {session.machineNames.map((machineName) => (
                        <Badge key={`${session.id}-${machineName}`} variant="secondary">
                          {machineName}
                        </Badge>
                      ))}
                    </div>
                    {session.notes ? (
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">{session.notes}</p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
