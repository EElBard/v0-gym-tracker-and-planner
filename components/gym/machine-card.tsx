import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MuscleGroupBadge } from './muscle-group-badge'
import { Dumbbell, Plus, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface MachineCardProps {
  machine: {
    id: string
    name: string
    photo_pathname: string | null
    muscle_groups: { muscle_group_id: string; is_primary: boolean }[]
    last_workout_date?: string | null
  }
}

export function MachineCard({ machine }: MachineCardProps) {
  const primaryMuscles = machine.muscle_groups.filter(mg => mg.is_primary)
  const secondaryMuscles = machine.muscle_groups.filter(mg => !mg.is_primary)

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      <Link href={`/machines/${machine.id}`}>
        <div className="aspect-video relative bg-muted">
          {machine.photo_pathname ? (
            <img
              src={`/api/file?pathname=${encodeURIComponent(machine.photo_pathname)}`}
              alt={machine.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <Dumbbell className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/machines/${machine.id}`}>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
            {machine.name}
          </h3>
        </Link>
        <div className="flex flex-wrap gap-1 mb-2">
          {primaryMuscles.map(mg => (
            <MuscleGroupBadge key={mg.muscle_group_id} muscleGroupId={mg.muscle_group_id} isPrimary />
          ))}
          {secondaryMuscles.map(mg => (
            <MuscleGroupBadge key={mg.muscle_group_id} muscleGroupId={mg.muscle_group_id} isPrimary={false} />
          ))}
        </div>
        {machine.last_workout_date && (
          <p className="text-xs text-muted-foreground">
            Last workout: {formatDistanceToNow(new Date(machine.last_workout_date), { addSuffix: true })}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button asChild size="sm" className="flex-1">
          <Link href={`/workouts/new?machineId=${machine.id}`}>
            <Plus className="h-4 w-4 mr-1" />
            Log Workout
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/machines/${machine.id}/progress`}>
            <TrendingUp className="h-4 w-4" />
            <span className="sr-only">View progress</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
