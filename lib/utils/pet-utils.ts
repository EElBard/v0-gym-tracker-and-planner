export type PetMood = 'hyped' | 'happy' | 'neutral' | 'sad' | 'sleeping'
export type PetSpecies = 'dragon' | 'bear' | 'wolf' | 'phoenix' | 'golem' | 'cat' | 'dog'

export interface PetData {
  id: string
  user_id: string
  name: string
  species: PetSpecies | string
  level: number
  experience: number
  is_enabled: boolean
  enabled?: boolean
  created_at?: string
  updated_at?: string
}

export interface MoodDetails {
  mood: PetMood
  label: string
  emoji: string
  description: string
  bgGradient: string
  textColor: string
  borderColor: string
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
}

export interface SpeciesInfo {
  id: PetSpecies
  name: string
  defaultPetName: string
  description: string
  element: string
  color: string
}

export const SPECIES_CONFIG: Record<PetSpecies, SpeciesInfo> = {
  dragon: {
    id: 'dragon',
    name: 'Iron Dragon',
    defaultPetName: 'Ignis',
    description: 'A fierce mythical beast fueled by relentless workout intensity.',
    element: 'Fire & Iron',
    color: '#f97316',
  },
  bear: {
    id: 'bear',
    name: 'Grizzly Titan',
    defaultPetName: 'Ursa',
    description: 'A mighty behemoth symbolizing raw strength and heavy compound lifts.',
    element: 'Earth & Steel',
    color: '#84cc16',
  },
  wolf: {
    id: 'wolf',
    name: 'Cyber Wolf',
    defaultPetName: 'Fenrir',
    description: 'An agile cybernetic predator built for endurance and speed.',
    element: 'Lightning & Plasma',
    color: '#06b6d4',
  },
  phoenix: {
    id: 'phoenix',
    name: 'Blaze Phoenix',
    defaultPetName: 'Astra',
    description: 'A radiant creature rising stronger after every grueling session.',
    element: 'Solar Light',
    color: '#ec4899',
  },
  golem: {
    id: 'golem',
    name: 'Obsidian Golem',
    defaultPetName: 'Granite',
    description: 'An indestructible monolith forged from iron willpower.',
    element: 'Stone & Metal',
    color: '#a855f7',
  },
  cat: {
    id: 'cat',
    name: 'Shadow Panther',
    defaultPetName: 'Nyx',
    description: 'Sleek, focused, and quick with cat-like reflexes.',
    element: 'Shadow & Metal',
    color: '#6366f1',
  },
  dog: {
    id: 'dog',
    name: 'Loyal Sentinel',
    defaultPetName: 'Buster',
    description: 'Your ultimate gym buddy, always cheering on your gains.',
    element: 'Kinetic Energy',
    color: '#eab308',
  },
}

/**
 * Calculates pet mood state based on recency of user's last workout date.
 * - Worked out today (0 days): 'hyped'
 * - Worked out 1-2 days ago: 'happy'
 * - Worked out 3-4 days ago: 'neutral'
 * - Worked out 5-6 days ago: 'sad'
 * - 7+ days or no workout: 'sleeping'
 */
export function getPetMood(lastWorkoutDate?: Date | string | null): PetMood {
  if (!lastWorkoutDate) return 'sleeping'

  const lastDate = new Date(lastWorkoutDate)
  if (isNaN(lastDate.getTime())) return 'sleeping'

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const workoutDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate())

  const diffTime = today.getTime() - workoutDay.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'hyped'
  if (diffDays <= 2) return 'happy'
  if (diffDays <= 4) return 'neutral'
  if (diffDays <= 6) return 'sad'
  return 'sleeping'
}

export function getMoodDetails(mood: PetMood): MoodDetails {
  switch (mood) {
    case 'hyped':
      return {
        mood,
        label: 'Hyped!',
        emoji: '🔥',
        description: 'Charged up & pumped from your recent workout!',
        bgGradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
        textColor: 'text-orange-500',
        borderColor: 'border-orange-500/40',
        badgeVariant: 'default',
      }
    case 'happy':
      return {
        mood,
        label: 'Happy',
        emoji: '⚡',
        description: 'Feeling energized and ready for your next session.',
        bgGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
        textColor: 'text-emerald-500',
        borderColor: 'border-emerald-500/40',
        badgeVariant: 'default',
      }
    case 'neutral':
      return {
        mood,
        label: 'Resting',
        emoji: '🧘',
        description: 'Cooling down. A workout soon will restore peak energy.',
        bgGradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
        textColor: 'text-blue-500',
        borderColor: 'border-blue-500/40',
        badgeVariant: 'secondary',
      }
    case 'sad':
      return {
        mood,
        label: 'Sluggish',
        emoji: '🌧️',
        description: 'Needs gym time! Complete a workout to boost morale.',
        bgGradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
        textColor: 'text-amber-500',
        borderColor: 'border-amber-500/40',
        badgeVariant: 'outline',
      }
    case 'sleeping':
    default:
      return {
        mood: 'sleeping',
        label: 'Sleeping',
        emoji: '💤',
        description: 'In hibernation mode. Log a workout session to wake up!',
        bgGradient: 'from-slate-500/20 via-zinc-500/10 to-transparent',
        textColor: 'text-slate-400',
        borderColor: 'border-slate-500/40',
        badgeVariant: 'secondary',
      }
  }
}
