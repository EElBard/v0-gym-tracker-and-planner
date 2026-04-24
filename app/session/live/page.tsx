'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/layout/header'
import { RestTimer } from '@/components/gym/rest-timer'
import { SessionHistory } from '@/components/gym/session-history'
import { ChevronLeft, Plus, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

type Step = 'select-machine' | 'logging' | 'complete'

interface SessionSet {
  set_number: number
  reps: number
  weight_lbs: number
}

interface LoggedExercise {
  machine: Machine
  sets: SessionSet[]
}

interface Machine {
  id: string
  name: string
  target_sets: number
  target_reps: number
  weight_increment: number
  muscle_groups: { muscle_group_id: string; is_primary: boolean }[]
}

interface MachineRow {
  id: string
  name: string
  target_sets: number
  target_reps: number
  weight_increment: number
  machine_muscle_groups: { muscle_group_id: string; is_primary: boolean }[] | null
}

function LiveWorkoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>('select-machine')
  const [machines, setMachines] = useState<Machine[]>([])
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [sessionSets, setSessionSets] = useState<SessionSet[]>([])
  const [loggedExercises, setLoggedExercises] = useState<LoggedExercise[]>([])
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const supabase = createClient()

  // Load initial data
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setCurrentUserId(user.id)

        // Fetch machines
        const { data: machinesList, error: machinesError } = await supabase
          .from('machines')
          .select('id, name, target_sets, target_reps, weight_increment, machine_muscle_groups(muscle_group_id, is_primary)')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })

        if (machinesError) throw machinesError
        const formattedMachines = ((machinesList ?? []) as MachineRow[]).map(machine => ({
          id: machine.id,
          name: machine.name,
          target_sets: machine.target_sets,
          target_reps: machine.target_reps,
          weight_increment: machine.weight_increment,
          muscle_groups: machine.machine_muscle_groups ?? [],
        }))
        setMachines(formattedMachines)
        setError(null)

        // If machineId is in query params, auto-select it
        const machineId = searchParams.get('machineId')
        if (machineId && formattedMachines.length > 0) {
          const machine = formattedMachines.find(m => m.id === machineId)
          if (machine) {
            selectMachine(machine, user.id)
          }
        }
      } catch (err) {
        setError('Failed to load workout data')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, [])

  const selectMachine = async (machine: Machine, userIdOverride?: string) => {
    const userId = userIdOverride ?? currentUserId
    if (!userId) return
    setSelectedMachine(machine)

    const alreadyLoggedExercise = loggedExercises.find(exercise => exercise.machine.id === machine.id)
    if (alreadyLoggedExercise) {
      setSessionSets(alreadyLoggedExercise.sets)
      setStep('logging')
      return
    }

    // Fetch previous workout for this machine
    try {
      const { data: previousSessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          workout_exercises!inner (
            id,
            machine_id,
            workout_sets (
              set_number,
              reps,
              weight_lbs
            )
          )
        `)
        .eq('user_id', userId)
        .eq('workout_exercises.machine_id', machine.id)
        .order('session_date', { ascending: false })
        .limit(1)

      if (!sessionsError && previousSessions && previousSessions.length > 0) {
        const exercise = previousSessions[0].workout_exercises?.[0]
        const sets = (exercise?.workout_sets as unknown as SessionSet[]) || []
        // Pre-fill session with previous workout data
        setSessionSets(sets)
      } else {
        setSessionSets([])
      }

      setStep('logging')
    } catch (err) {
      console.error('Error loading previous workout:', err)
      setSessionSets([])
      setStep('logging')
    }
  }

  const updateSet = (index: number, field: 'reps' | 'weight_lbs', value: number) => {
    const newSets = [...sessionSets]
    newSets[index] = { ...newSets[index], [field]: value }
    setSessionSets(newSets)
  }

  const addSet = () => {
    const nextSetNumber = sessionSets.length + 1
    const lastSet = sessionSets[sessionSets.length - 1]
    setSessionSets([
      ...sessionSets,
      {
        set_number: nextSetNumber,
        reps: lastSet?.reps || 10,
        weight_lbs: lastSet?.weight_lbs || 0,
      },
    ])
  }

  const removeSet = (index: number) => {
    const newSets = sessionSets
      .filter((_, i) => i !== index)
      .map((set, i) => ({ ...set, set_number: i + 1 }))
    setSessionSets(newSets)
  }

  const normalizeSets = (sets: SessionSet[]) =>
    sets.map((set, index) => ({
      set_number: index + 1,
      reps: set.reps,
      weight_lbs: set.weight_lbs,
    }))

  const saveCurrentMachineToSession = () => {
    if (!selectedMachine || sessionSets.length === 0) {
      setError('Please log at least one set before adding a machine')
      return false
    }

    const normalizedSets = normalizeSets(sessionSets)

    setLoggedExercises(prev => {
      const existingIndex = prev.findIndex(exercise => exercise.machine.id === selectedMachine.id)
      if (existingIndex === -1) {
        return [...prev, { machine: selectedMachine, sets: normalizedSets }]
      }

      const updated = [...prev]
      updated[existingIndex] = { machine: selectedMachine, sets: normalizedSets }
      return updated
    })
    setSessionSets(normalizedSets)
    setError(null)
    return true
  }

  const handleAddAnotherMachine = () => {
    if (!saveCurrentMachineToSession()) return
    setStep('select-machine')
  }

  const handleSubmit = async () => {
    if (!selectedMachine || sessionSets.length === 0) {
      setError('Please log at least one set before completing your session')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const currentExercise: LoggedExercise = {
        machine: selectedMachine,
        sets: normalizeSets(sessionSets),
      }

      const sessionExercisesMap = new Map(
        loggedExercises.map(exercise => [exercise.machine.id, exercise] as const)
      )
      sessionExercisesMap.set(currentExercise.machine.id, currentExercise)
      const allSessionExercises = Array.from(sessionExercisesMap.values())

      if (allSessionExercises.length === 0) {
        throw new Error('No exercises to save')
      }

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          session_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      for (const [index, exercise] of allSessionExercises.entries()) {
        // Create exercise (new normalized schema)
        const { data: workoutExercise, error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert({
            session_id: session.id,
            machine_id: exercise.machine.id,
            display_order: index,
          })
          .select()
          .single()

        // If the new schema is not fully applied yet, fallback to legacy workouts flow
        if (exerciseError || !workoutExercise) {
          const { data: workout, error: workoutError } = await supabase
            .from('workouts')
            .insert({
              user_id: user.id,
              machine_id: exercise.machine.id,
              workout_date: new Date().toISOString().split('T')[0],
              session_id: session.id,
            })
            .select()
            .single()

          if (workoutError || !workout) throw workoutError ?? new Error('Failed to create legacy workout')

          const { error: legacySetsError } = await supabase
            .from('workout_sets')
            .insert(
              exercise.sets.map(set => ({
                workout_id: workout.id,
                set_number: set.set_number,
                reps: set.reps,
                weight_lbs: set.weight_lbs,
              }))
            )

          if (legacySetsError) throw legacySetsError
          continue
        }

        // Create sets
        const { error: setsError } = await supabase
          .from('workout_sets')
          .insert(
            exercise.sets.map(set => ({
              exercise_id: workoutExercise.id,
              set_number: set.set_number,
              reps: set.reps,
              weight_lbs: set.weight_lbs,
            }))
          )

        if (setsError) throw setsError
      }

      setStep('complete')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save workout'
      setError(`Failed to save workout: ${message}`)
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComplete = () => {
    router.push(`/machines/${selectedMachine?.id}`)
  }

  const groupedMachines = machines.reduce<Record<string, Machine[]>>((groups, machine) => {
    const primaryMuscleGroup = machine.muscle_groups.find(group => group.is_primary)?.muscle_group_id ?? 'other'
    if (!groups[primaryMuscleGroup]) {
      groups[primaryMuscleGroup] = []
    }
    groups[primaryMuscleGroup].push(machine)
    return groups
  }, {})

  const muscleGroupOrder = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'core', 'forearms', 'other']
  const orderedGroupKeys = Object.keys(groupedMachines).sort((a, b) => {
    const indexA = muscleGroupOrder.indexOf(a)
    const indexB = muscleGroupOrder.indexOf(b)
    const safeIndexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA
    const safeIndexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB
    if (safeIndexA !== safeIndexB) return safeIndexA - safeIndexB
    return a.localeCompare(b)
  })

  const formatMuscleGroupLabel = (value: string) =>
    value
      .split('_')
      .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(' ')

  const loggedMachineIds = new Set(loggedExercises.map(exercise => exercise.machine.id))

  const handleBack = () => {
    if (step === 'logging') {
      setStep('select-machine')
      return
    }

    if (step === 'complete') {
      router.push(`/machines/${selectedMachine?.id}`)
      return
    }

    router.back()
  }

  if (isLoading) {
    return (
      <div className="min-h-svh bg-background">
        <Header />
        <main className="container px-4 md:px-6 mx-auto py-6 max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="container px-4 md:px-6 mx-auto py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={handleBack}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Live Workout</h1>
          <p className="text-muted-foreground">Track your workout in real-time</p>
        </div>

        {/* Error message */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5 mb-6">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Select Machine */}
        {step === 'select-machine' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Select Machine</h2>
            {machines.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    No machines found. Add a machine to start tracking workouts.
                  </p>
                  <Button asChild>
                    <Link href="/machines/new">Add Machine</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {orderedGroupKeys.map(groupKey => (
                  <div key={groupKey} className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {formatMuscleGroupLabel(groupKey)}
                    </h3>
                    <div className="grid gap-3">
                      {groupedMachines[groupKey].map(machine => {
                        const isLoggedInSession = loggedMachineIds.has(machine.id)

                        return (
                          <Button
                            key={machine.id}
                            onClick={() => selectMachine(machine)}
                            variant="outline"
                            className={`h-auto p-4 text-left justify-start ${
                              isLoggedInSession
                                ? 'border-primary/60 bg-primary/5 hover:bg-primary/10'
                                : ''
                            }`}
                          >
                            <div className="w-full">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-lg font-semibold">{machine.name}</div>
                                {isLoggedInSession && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    In session
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Target: {machine.target_sets}x{machine.target_reps}
                              </div>
                            </div>
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Logging Sets */}
        {step === 'logging' && selectedMachine && (
          <div className="space-y-6">
            <div>
              {loggedExercises.length > 0 && (
                <div className="mb-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Machines in this session</p>
                  <div className="flex flex-wrap gap-2">
                    {loggedExercises.map(exercise => (
                      <div
                        key={exercise.machine.id}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          exercise.machine.id === selectedMachine.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {exercise.machine.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <h2 className="text-2xl font-bold">{selectedMachine.name}</h2>
            </div>

            {/* Sets Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Log Sets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground px-2 mb-2">
                  <span>Set</span>
                  <span>Reps</span>
                  <span>Weight</span>
                  <span></span>
                </div>

                <div className="space-y-3">
                  {sessionSets.map((set, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-end">
                      <div className="flex items-center justify-center h-10 rounded-md bg-muted font-semibold">
                        {set.set_number}
                      </div>
                      <Input
                        type="number"
                        min={1}
                        value={set.reps}
                        onChange={(e) => updateSet(index, 'reps', parseInt(e.target.value) || 0)}
                        placeholder="Reps"
                        className="h-10"
                      />
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        value={set.weight_lbs}
                        onChange={(e) => updateSet(index, 'weight_lbs', parseFloat(e.target.value) || 0)}
                        placeholder="Weight"
                        className="h-10"
                      />
                      {sessionSets.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSet(index)}
                          className="h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addSet}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Set
                </Button>
              </CardContent>
            </Card>

            {/* Session History */}
            {sessionSets.length > 0 && (
              <SessionHistory
                sets={sessionSets}
                machineTargets={{
                  target_sets: selectedMachine.target_sets,
                  target_reps: selectedMachine.target_reps,
                }}
              />
            )}

            {/* Rest Timer */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-timer"
                checked={showRestTimer}
                onChange={(e) => setShowRestTimer(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <Label htmlFor="show-timer" className="cursor-pointer">
                Enable rest timer
              </Label>
            </div>

            {showRestTimer && (
              <RestTimer
                defaultSeconds={60}
                isActive={true}
                onTimerStart={() => {}}
                onTimerEnd={() => {}}
              />
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleAddAnotherMachine}
                disabled={isSubmitting}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Machine to Session
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Complete Session
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 'complete' && selectedMachine && (
          <Card className="border-green-600/50 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Workout Saved!</h2>
              <p className="text-muted-foreground mb-6">
                Great job! Your full workout session has been recorded.
              </p>
              <Button onClick={handleComplete} className="w-full">
                View Machine Details
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

export default function LiveWorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh bg-background">
          <Header />
          <main className="container px-4 md:px-6 mx-auto py-6 max-w-2xl">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </main>
        </div>
      }
    >
      <LiveWorkoutContent />
    </Suspense>
  )
}
