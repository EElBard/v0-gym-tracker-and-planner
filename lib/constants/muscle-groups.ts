export const MUSCLE_GROUPS = [
  { id: 'chest', name: 'Chest', color: 'bg-rose-500', textColor: 'text-rose-500' },
  { id: 'back', name: 'Back', color: 'bg-blue-500', textColor: 'text-blue-500' },
  { id: 'shoulders', name: 'Shoulders', color: 'bg-purple-500', textColor: 'text-purple-500' },
  { id: 'biceps', name: 'Biceps', color: 'bg-amber-500', textColor: 'text-amber-500' },
  { id: 'triceps', name: 'Triceps', color: 'bg-orange-500', textColor: 'text-orange-500' },
  { id: 'forearms', name: 'Forearms', color: 'bg-yellow-600', textColor: 'text-yellow-600' },
  { id: 'core', name: 'Core', color: 'bg-teal-500', textColor: 'text-teal-500' },
  { id: 'quads', name: 'Quads', color: 'bg-green-500', textColor: 'text-green-500' },
  { id: 'hamstrings', name: 'Hamstrings', color: 'bg-emerald-600', textColor: 'text-emerald-600' },
  { id: 'glutes', name: 'Glutes', color: 'bg-lime-600', textColor: 'text-lime-600' },
  { id: 'calves', name: 'Calves', color: 'bg-green-700', textColor: 'text-green-700' },
] as const

export type MuscleGroupId = typeof MUSCLE_GROUPS[number]['id']

export function getMuscleGroupColor(id: string) {
  const group = MUSCLE_GROUPS.find(g => g.id === id)
  return group?.color ?? 'bg-gray-500'
}

export function getMuscleGroupName(id: string) {
  const group = MUSCLE_GROUPS.find(g => g.id === id)
  return group?.name ?? id
}
