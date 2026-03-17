import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MachineCard } from '@/components/gym/machine-card'
import { Plus, Dumbbell } from 'lucide-react'

export default async function MachinesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch all machines with their muscle groups
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
    .order('name', { ascending: true })

  // Get last workout for each machine
  const { data: lastWorkouts } = await supabase
    .from('workouts')
    .select('machine_id, workout_date')
    .eq('user_id', user.id)
    .order('workout_date', { ascending: false })

  const lastWorkoutMap = new Map<string, string>()
  lastWorkouts?.forEach(w => {
    if (!lastWorkoutMap.has(w.machine_id)) {
      lastWorkoutMap.set(w.machine_id, w.workout_date)
    }
  })

  // Format machines for display
  const formattedMachines = (machines || []).map(m => ({
    id: m.id,
    name: m.name,
    photo_pathname: m.photo_pathname,
    muscle_groups: m.machine_muscle_groups || [],
    last_workout_date: lastWorkoutMap.get(m.id) || null,
  }))

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <main className="container py-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Machines</h1>
              <p className="text-muted-foreground">Manage your gym equipment library</p>
            </div>
            <Button asChild>
              <Link href="/machines/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Machine
              </Link>
            </Button>
          </div>

          {formattedMachines.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {formattedMachines.map((machine) => (
                <MachineCard key={machine.id} machine={machine} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Dumbbell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold mb-2">No machines yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add gym machines to start tracking your workouts and progress
                </p>
                <Button asChild>
                  <Link href="/machines/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Machine
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
