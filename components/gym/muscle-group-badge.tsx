import { cn } from '@/lib/utils'
import { getMuscleGroupColor, getMuscleGroupName } from '@/lib/constants/muscle-groups'

interface MuscleGroupBadgeProps {
  muscleGroupId: string
  isPrimary?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function MuscleGroupBadge({ 
  muscleGroupId, 
  isPrimary = true, 
  size = 'sm',
  className 
}: MuscleGroupBadgeProps) {
  const color = getMuscleGroupColor(muscleGroupId)
  const name = getMuscleGroupName(muscleGroupId)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        isPrimary ? color : 'bg-muted',
        isPrimary ? 'text-white' : 'text-muted-foreground',
        className
      )}
    >
      {name}
    </span>
  )
}
