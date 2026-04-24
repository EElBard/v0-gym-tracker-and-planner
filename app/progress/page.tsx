import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { PerformanceChart } from '@/components/gym/performance-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { calculateEstimated1RM } from '@/lib/utils/weight-suggestion'
import { Dumbbell, TrendingUp, Calendar, BarChart3 } from 'lucide-react'

export default async function ProgressPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch all machines
  const { data: machines } = await supabase
    .from('machines')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name')

  // Fetch all workouts
  const { data: allSessions } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      session_date,
      workout_exercises (
        machine_id,
        workout_sets (
          reps,
          weight_lbs
        )
      )
    `)
    .eq('user_id', user.id)
    .order('session_date', { ascending: true })

  const allWorkoutExercises = (allSessions || []).flatMap(session =>
    (session.workout_exercises || []).map(exercise => ({
      machine_id: exercise.machine_id,
      workout_date: session.session_date,
      workout_sets: exercise.workout_sets || [],
    }))
  )

  // Group workout exercises by machine
  const workoutsByMachine = new Map<string, typeof allWorkoutExercises>()
  allWorkoutExercises.forEach(exercise => {
    const existing = workoutsByMachine.get(exercise.machine_id) || []
    workoutsByMachine.set(exercise.machine_id, [...existing, exercise])
  })

  // Calculate overall stats
  const totalWorkouts = allWorkoutExercises.length
  const uniqueDays = new Set(allWorkoutExercises.map(w => w.workout_date)).size
  const uniqueMachines = workoutsByMachine.size

  // Process data for each machine
  const machineProgress = (machines || []).map(machine => {
    const workouts = workoutsByMachine.get(machine.id) || []
    
    const weightData: { date: string; value: number }[] = []
    let maxWeightEver = 0
    let latestEstimated1RM = 0

    workouts.forEach(workout => {
      const sets = (workout.workout_sets || []).map(s => ({
        reps: s.reps,
        weight_lbs: Number(s.weight_lbs),
      }))

      if (sets.length === 0) return

      const maxWeight = Math.max(...sets.map(s => s.weight_lbs))
      weightData.push({ date: workout.workout_date, value: maxWeight })
      
      maxWeightEver = Math.max(maxWeightEver, maxWeight)
      
      const maxWeightSet = sets.find(s => s.weight_lbs === maxWeight)
      if (maxWeightSet) {
        latestEstimated1RM = calculateEstimated1RM(maxWeightSet.weight_lbs, maxWeightSet.reps)
      }
    })

    // Calculate progress percentage
    const firstWeight = weightData[0]?.value ?? 0
    const lastWeight = weightData[weightData.length - 1]?.value ?? 0
    const progressPercent = firstWeight > 0 
      ? ((lastWeight - firstWeight) / firstWeight * 100)
      : 0

    return {
      id: machine.id,
      name: machine.name,
      workoutCount: workouts.length,
      maxWeight: maxWeightEver,
      estimated1RM: latestEstimated1RM,
      progressPercent,
      weightData,
    }
  }).filter(m => m.workoutCount > 0)

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="container px-4 md:px-6 mx-auto py-6 max-w-6xl">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold">Progress Overview</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Track your overall gym performance</p>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Total Workouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalWorkouts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Days Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{uniqueDays}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Machines Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{uniqueMachines}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Avg Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {machineProgress.length > 0 
                    ? `${(machineProgress.reduce((sum, m) => sum + m.progressPercent, 0) / machineProgress.length).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Machine progress cards */}
          {machineProgress.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Progress by Machine</h2>
              <div className="grid gap-6">
                {machineProgress.map(machine => (
                  <div key={machine.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{machine.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {machine.workoutCount} workouts | Max: {machine.maxWeight} lbs | Est. 1RM: {machine.estimated1RM} lbs
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${machine.progressPercent > 0 ? 'text-green-600' : machine.progressPercent < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {machine.progressPercent > 0 ? '+' : ''}{machine.progressPercent.toFixed(1)}%
                        </span>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/machines/${machine.id}/progress`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                    <PerformanceChart
                      title=""
                      data={machine.weightData}
                      valueLabel="Max Weight"
                      valueSuffix=" lbs"
                      color="var(--chart-1)"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold mb-2">No progress data yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Log workouts to start tracking your progress
                </p>
                <Button asChild>
                  <Link href="/machines">Go to Machines</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
