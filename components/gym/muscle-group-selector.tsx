'use client'

import { useMemo, useState } from 'react'
import { MUSCLE_GROUPS } from '@/lib/constants/muscle-groups'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

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
  const [customMuscleGroupName, setCustomMuscleGroupName] = useState('')
  const [customMuscleGroups, setCustomMuscleGroups] = useState<Array<{ id: string; name: string }>>([])

  const selectedCustomMuscleGroups = useMemo(
    () =>
      selected
        .filter(
          (group) =>
            !MUSCLE_GROUPS.some((defaultGroup) => defaultGroup.id === group.muscle_group_id)
        )
        .map((group) => ({
          id: group.muscle_group_id,
          name: formatCustomGroupLabel(group.muscle_group_id),
        })),
    [selected]
  )

  const allCustomMuscleGroups = useMemo(() => {
    const combinedGroups = [...customMuscleGroups, ...selectedCustomMuscleGroups]
    return combinedGroups.filter(
      (group, index, groups) => groups.findIndex((candidate) => candidate.id === group.id) === index
    )
  }, [customMuscleGroups, selectedCustomMuscleGroups])

  const muscleGroups = [...MUSCLE_GROUPS, ...allCustomMuscleGroups.map((group) => ({
    id: group.id,
    name: group.name,
    color: 'bg-slate-500',
  }))]

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

  const handleAddCustomMuscleGroup = () => {
    const normalizedId = customMuscleGroupName.trim().toLowerCase().replace(/\s+/g, '_')
    if (!normalizedId) return

    const alreadyExists = muscleGroups.some((group) => group.id === normalizedId)
    if (!alreadyExists) {
      setCustomMuscleGroups((previous) => [
        ...previous,
        { id: normalizedId, name: formatCustomGroupLabel(normalizedId) },
      ])
    }

    if (!isSelected(normalizedId)) {
      onChange([...selected, { muscle_group_id: normalizedId, is_primary: true }])
    }

    setCustomMuscleGroupName('')
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="custom-muscle-group">Add custom muscle group</Label>
        <div className="flex gap-2">
          <Input
            id="custom-muscle-group"
            value={customMuscleGroupName}
            onChange={(event) => setCustomMuscleGroupName(event.target.value)}
            placeholder="e.g., traps"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleAddCustomMuscleGroup()
              }
            }}
          />
          <Button type="button" variant="outline" onClick={handleAddCustomMuscleGroup}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {muscleGroups.map((group) => {
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

const formatCustomGroupLabel = (value: string) =>
  value
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
