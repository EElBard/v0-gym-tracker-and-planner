import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MachineCard } from '@/components/gym/machine-card'
import { MuscleCoverageCard } from '@/components/gym/muscle-coverage-card'
import { PetDashboardWidget } from '@/components/PetDashboardWidget'
import { analyzeMuscleGroupCoverage } from '@/lib/utils/muscle-coverage'
import { Plus, Dumbbell, TrendingUp, Calendar, Zap, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch machines with their muscle groups and last workout
  const { data: machines } = await supabase
    .from('machines')
    .select(`
      id,
      name,
      photo_pathname,
      machine_muscle_groups (
        muscle_group_id,
        is_primary
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(6)

  // Fetch recent workouts for stats
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentSessions } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      session_date,
      workout_exercises (
        machine_id,
        machines!inner (
          machine_muscle_groups (
            muscle_group_id,
            is_primary
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .gte('session_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('session_date', { ascending: false })

  // Get last workout for each machine
  const { data: lastSessions } = await supabase
    .from('workout_sessions')
    .select(`
      session_date,
      workout_exercises (
        machine_id
      )
    `)
    .eq('user_id', user.id)
    .order('session_date', { ascending: false })

  const lastWorkoutMap = new Map<string, string>()
  lastSessions?.forEach((session) => {
    session.workout_exercises?.forEach((exercise) => {
      if (!lastWorkoutMap.has(exercise.machine_id)) {
        lastWorkoutMap.set(exercise.machine_id, session.session_date)
      }
    })
  })

  // Calculate muscle coverage
  const workoutsForCoverage = (recentSessions || []).flatMap((session) =>
    (session.workout_exercises || []).map((exercise) => ({
      workout_date: session.session_date,
      muscle_groups:
        ((exercise.machines as unknown as { machine_muscle_groups: { muscle_group_id: string; is_primary: boolean }[] })
          ?.machine_muscle_groups) || [],
    }))
  )
  const coverage = analyzeMuscleGroupCoverage(workoutsForCoverage)

  // Format machines for display
  const formattedMachines = (machines || []).map((m) => ({
    id: m.id,
    name: m.name,
    photo_pathname: m.photo_pathname,
    muscle_groups: m.machine_muscle_groups || [],
    last_workout_date: lastWorkoutMap.get(m.id) || null,
  }))

  // Stats
  const totalWorkoutsThisMonth = workoutsForCoverage.length
  const uniqueDaysWorkedOut = new Set(workoutsForCoverage.map((w) => w.workout_date)).size
  const machineCount = machines?.length ?? 0

  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col">
      <Header />
      <main className="container px-4 md:px-6 mx-auto py-8 max-w-6xl flex-1">
        <div className="flex flex-col gap-8">
          {/* Hero / Welcome section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-muted/40 to-background border border-border/80 shadow-xs">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Track your gains, level up your IronFamiliar, and stay consistent
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button asChild size="lg" className="flex-1 sm:flex-none font-semibold shadow-xs">
                <Link href="/session/live">
                  <Zap className="h-4 w-4 mr-2" />
                  Start Workout
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-fit font-medium">
                <Link href="/machines/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Machine
                </Link>
              </Button>
            </div>
          </div>

          {/* IronFamiliars Pet Widget */}
          <PetDashboardWidget lastWorkoutDate={recentSessions?.[0]?.session_date || null} />

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="border border-border/80 hover:border-primary/40 transition-colors shadow-xs">
              <CardContent className="p-4 sm:p-5">
                <p className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2">
                  Workouts This Month
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  </div>
                  <span className="text-xl sm:text-2xl font-extrabold font-mono">{totalWorkoutsThisMonth}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border/80 hover:border-primary/40 transition-colors shadow-xs">
              <CardContent className="p-4 sm:p-5">
                <p className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2">
                  Days Active
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  </div>
                  <span className="text-xl sm:text-2xl font-extrabold font-mono">{uniqueDaysWorkedOut}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border/80 hover:border-primary/40 transition-colors shadow-xs">
              <CardContent className="p-4 sm:p-5">
                <p className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2">
                  Machines
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  </div>
                  <span className="text-xl sm:text-2xl font-extrabold font-mono">{machineCount}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border/80 hover:border-primary/40 transition-colors shadow-xs">
              <CardContent className="p-4 sm:p-5">
                <p className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2">
                  Last Workout
                </p>
                <p className="text-sm sm:text-base font-bold truncate text-foreground mt-1">
                  {recentSessions?.[0]
                    ? formatDistanceToNow(new Date(recentSessions[0].session_date), { addSuffix: true })
                    : 'Never'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Muscle Coverage */}
          <MuscleCoverageCard coverage={coverage} />

          {/* Recent Machines */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Your Machines</h2>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-xs font-semibold">
                <Link href="/machines">
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            {formattedMachines.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {formattedMachines.map((machine) => (
                  <MachineCard key={machine.id} machine={machine} />
                ))}
              </div>
            ) : (
              <Card className="border border-dashed border-border/80">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="p-4 rounded-full bg-muted/60 text-muted-foreground mb-4">
                    <Dumbbell className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">No machines yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-5">
                    Add your first gym machine to start logging sets and tracking progression
                  </p>
                  <Button asChild font-semibold>
                    <Link href="/machines/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Machine
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
