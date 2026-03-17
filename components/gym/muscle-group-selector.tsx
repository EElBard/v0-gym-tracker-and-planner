'use client'

import { MUSCLE_GROUPS } from '@/lib/constants/muscle-groups'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface SelectedMuscleGroup {
  muscle_group_id: string
  is_primary: boolean
}

interface MuscleGroupSelectorProps {
  selected: SelectedMuscleGroup[]
  onChange: (selected: SelectedMuscleGroup[]) => void
  error?: string
}

export function MuscleGroupSelector({ selected, onChange, error }: MuscleGroupSelectorProps) {
  const isSelected = (id: string) => selected.some(s => s.muscle_group_id === id)
  const isPrimary = (id: string) => selected.find(s => s.muscle_group_id === id)?.is_primary ?? true

  const toggleMuscleGroup = (id: string) => {
    if (isSelected(id)) {
      onChange(selected.filter(s => s.muscle_group_id !== id))
    } else {
      onChange([...selected, { muscle_group_id: id, is_primary: true }])
    }
  }

  const togglePrimary = (id: string) => {
    onChange(
      selected.map(s =>
        s.muscle_group_id === id ? { ...s, is_primary: !s.is_primary } : s
      )
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {MUSCLE_GROUPS.map((group) => {
          const checked = isSelected(group.id)
          const primary = isPrimary(group.id)

          return (
            <div
              key={group.id}
              className={cn(
                'flex flex-col gap-2 rounded-lg border p-3 transition-colors',
                checked ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
              )}
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`muscle-${group.id}`}
                  checked={checked}
                  onCheckedChange={() => toggleMuscleGroup(group.id)}
                />
                <Label
                  htmlFor={`muscle-${group.id}`}
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  {group.name}
                </Label>
                <div
                  className={cn('w-3 h-3 rounded-full', group.color)}
                  aria-hidden="true"
                />
              </div>
              {checked && (
                <div className="flex items-center gap-2 pl-6">
                  <Checkbox
                    id={`primary-${group.id}`}
                    checked={primary}
                    onCheckedChange={() => togglePrimary(group.id)}
                  />
                  <Label
                    htmlFor={`primary-${group.id}`}
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    Primary muscle
                  </Label>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
