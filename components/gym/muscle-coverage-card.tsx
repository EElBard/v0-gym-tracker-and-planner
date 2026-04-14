import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react'

interface MuscleGroupCoverage {
  id: string
  name: string
  color: string
  lastWorked: Date | null
  daysSinceWorked: number | null
  status: 'recent' | 'moderate' | 'neglected' | 'never'
}

interface MuscleCoverageCardProps {
  coverage: MuscleGroupCoverage[]
  className?: string
}

const statusConfig = {
  recent: {
    icon: CheckCircle2,
    label: 'Trained recently',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-600',
  },
  moderate: {
    icon: Clock,
    label: 'Could use attention',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-600',
  },
  neglected: {
    icon: AlertTriangle,
    label: 'Needs training',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-600',
  },
  never: {
    icon: XCircle,
    label: 'Never trained',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-600',
  },
}

export function MuscleCoverageCard({ coverage, className }: MuscleCoverageCardProps) {
  const recentCount = coverage.filter(c => c.status === 'recent').length
  const neglectedCount = coverage.filter(c => c.status === 'neglected' || c.status === 'never').length
  const totalCount = coverage.length

  return (
    <Card className={className}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-semibold">Muscle Coverage</h3>
          <div className="text-sm text-muted-foreground">
            {recentCount}/{totalCount} trained this week
          </div>
        </div>
        {neglectedCount > 0 && (
          <div className="flex items-center gap-2 mb-4 p-2 rounded-md bg-orange-500/10 text-orange-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">
              {neglectedCount} muscle group{neglectedCount > 1 ? 's' : ''} need{neglectedCount === 1 ? 's' : ''} attention
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {coverage.map((muscle) => {
            const config = statusConfig[muscle.status]
            const StatusIcon = config.icon

            return (
              <div
                key={muscle.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-md',
                  config.bgColor
                )}
              >
                <div className={cn('w-3 h-3 rounded-full', muscle.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{muscle.name}</p>
                  <p className={cn('text-xs', config.textColor)}>
                    {muscle.daysSinceWorked !== null
                      ? `${muscle.daysSinceWorked}d ago`
                      : 'Never'}
                  </p>
                </div>
                <StatusIcon className={cn('h-4 w-4 shrink-0', config.textColor)} />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

