import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { PerformanceChart } from '@/components/gym/performance-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { calculateVolume, calculateEstimated1RM } from '@/lib/utils/weight-suggestion'
import { ArrowLeft, TrendingUp, Weight, BarChart3 } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MachineProgressPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch machine
  const { data: machine, error } = await supabase
    .from('machines')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !machine) notFound()

  // Fetch all workouts with sets for this machine
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      session_date,
      workout_exercises!inner (
        machine_id,
        workout_sets (
          reps,
          weight_lbs
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('workout_exercises.machine_id', id)
    .order('session_date', { ascending: true })

  // Process data for charts
  const weightData: { date: string; value: number }[] = []
  const volumeData: { date: string; value: number }[] = []
  const oneRMData: { date: string; value: number }[] = []

  let totalWorkouts = 0
  let maxWeightEver = 0
  let maxVolumeEver = 0
  let currentEstimated1RM = 0

  ;(sessions || []).forEach(session => {
    const exercise = session.workout_exercises?.[0]
    const sets = (exercise?.workout_sets || []).map(s => ({
      reps: s.reps,
      weight_lbs: Number(s.weight_lbs),
    }))

    if (sets.length === 0) return

    totalWorkouts++
    
    const maxWeight = Math.max(...sets.map(s => s.weight_lbs))
    const volume = calculateVolume(sets)
    
    // Find set with max weight for 1RM calculation
    const maxWeightSet = sets.find(s => s.weight_lbs === maxWeight)
    const estimated1RM = maxWeightSet 
      ? calculateEstimated1RM(maxWeightSet.weight_lbs, maxWeightSet.reps)
      : 0

    weightData.push({ date: session.session_date, value: maxWeight })
    volumeData.push({ date: session.session_date, value: volume })
    oneRMData.push({ date: session.session_date, value: estimated1RM })

    maxWeightEver = Math.max(maxWeightEver, maxWeight)
    maxVolumeEver = Math.max(maxVolumeEver, volume)
    currentEstimated1RM = estimated1RM
  })

  // Calculate progress
  const firstWeight = weightData[0]?.value ?? 0
  const lastWeight = weightData[weightData.length - 1]?.value ?? 0
  const weightProgress = firstWeight > 0 ? ((lastWeight - firstWeight) / firstWeight * 100).toFixed(1) : '0'

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="container px-4 md:px-6 mx-auto py-6 max-w-4xl">
        <div className="flex flex-col gap-6">
          <Link 
            href={`/machines/${id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {machine.name}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{machine.name} Progress</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Track your strength gains over time</p>
            </div>
            <Button asChild size="sm" className="w-fit">
              <Link href={`/workouts/new?machineId=${id}`}>Log Workout</Link>
            </Button>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
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
                  <Weight className="h-4 w-4" />
                  Max Weight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{maxWeightEver} lbs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Est. 1RM
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{currentEstimated1RM} lbs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${Number(weightProgress) > 0 ? 'text-green-600' : Number(weightProgress) < 0 ? 'text-red-600' : ''}`}>
                  {Number(weightProgress) > 0 ? '+' : ''}{weightProgress}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6">
            <PerformanceChart
              title="Max Weight Over Time"
              description="Your heaviest lift per workout session"
              data={weightData}
              valueLabel="Weight"
              valueSuffix=" lbs"
              color="var(--chart-1)"
              emptyMessage="Log workouts to see your weight progression"
            />
            <PerformanceChart
              title="Total Volume"
              description="Sets x Reps x Weight per session"
              data={volumeData}
              valueLabel="Volume"
              valueSuffix=" lbs"
              color="var(--chart-2)"
              emptyMessage="Log workouts to see your volume progression"
            />
            <PerformanceChart
              title="Estimated 1RM"
              description="Calculated using the Epley formula"
              data={oneRMData}
              valueLabel="Est. 1RM"
              valueSuffix=" lbs"
              color="var(--chart-3)"
              emptyMessage="Log workouts to see your estimated 1RM"
            />
          </div>
        </div>
      </main>
    </div>
  )
}
