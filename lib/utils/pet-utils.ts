export type PetMood = 'hyped' | 'happy' | 'neutral' | 'sad' | 'sleeping'

export type PetSpecies =
  | 'Owlbear'
  | 'Wyrmling'
  | 'Strix-Wolf'
  | 'Intellect Devourer'
  | 'Gelatinous Cube'
  | 'Phoenix'
  | 'Minotaur'
  | 'Chimera'

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
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
}

export interface SpeciesInfo {
  id: PetSpecies
  name: string
  defaultPetName: string
  description: string
  element: string
  palette: {
    outline: string
    shade: string
    main: string
    highlight: string
  }
}

export const SPECIES_CONFIG: Record<PetSpecies, SpeciesInfo> = {
  Owlbear: {
    id: 'Owlbear',
    name: 'Owlbear',
    defaultPetName: 'Barnaby',
    description: 'A fierce hybrid beast combining keen owl sight with massive bear strength.',
    element: 'Nature & Steel',
    palette: {
      outline: '#151c14',
      shade: '#3f6212',
      main: '#84cc16',
      highlight: '#fef08a',
    },
  },
  Wyrmling: {
    id: 'Wyrmling',
    name: 'Wyrmling',
    defaultPetName: 'Ignis',
    description: 'A spirited dragon kin breathing fire into your daily fitness routines.',
    element: 'Fire & Iron',
    palette: {
      outline: '#1a0904',
      shade: '#991b1b',
      main: '#ef4444',
      highlight: '#fbbf24',
    },
  },
  'Strix-Wolf': {
    id: 'Strix-Wolf',
    name: 'Strix-Wolf',
    defaultPetName: 'Sylva',
    description: 'A legendary winged wolf with swift endurance and moonlight reflexes.',
    element: 'Wind & Lightning',
    palette: {
      outline: '#071521',
      shade: '#1e3a8a',
      main: '#06b6d4',
      highlight: '#a5f3fc',
    },
  },
  'Intellect Devourer': {
    id: 'Intellect Devourer',
    name: 'Intellect Devourer',
    defaultPetName: 'Synapse',
    description: 'A quadrupedal mental master minding your workout strategies and PRs.',
    element: 'Psionic Metal',
    palette: {
      outline: '#1f051b',
      shade: '#831843',
      main: '#ec4899',
      highlight: '#fbcfe8',
    },
  },
  'Gelatinous Cube': {
    id: 'Gelatinous Cube',
    name: 'Gelatinous Cube',
    defaultPetName: 'Squishy',
    description: 'An iconic translucent slime absorbing heavy reps and iron willpower.',
    element: 'Acid & Ooze',
    palette: {
      outline: '#041f16',
      shade: '#047857',
      main: '#10b981',
      highlight: '#6ee7b7',
    },
  },
  Phoenix: {
    id: 'Phoenix',
    name: 'Phoenix',
    defaultPetName: 'Sol',
    description: 'A radiant sunbird reborn stronger after every intense training session.',
    element: 'Solar Flame',
    palette: {
      outline: '#1c1503',
      shade: '#b45309',
      main: '#eab308',
      highlight: '#fef08a',
    },
  },
  Minotaur: {
    id: 'Minotaur',
    name: 'Minotaur',
    defaultPetName: 'Asterion',
    description: 'A brute force labyrinth titan charging through heavy lifts.',
    element: 'Earth & Granite',
    palette: {
      outline: '#13091f',
      shade: '#581c87',
      main: '#a855f7',
      highlight: '#f0abfc',
    },
  },
  Chimera: {
    id: 'Chimera',
    name: 'Chimera',
    defaultPetName: 'Triad',
    description: 'A multi-headed mythic predator with unyielding versatility.',
    element: 'Tri-Element',
    palette: {
      outline: '#1c0609',
      shade: '#881337',
      main: '#f43f5e',
      highlight: '#fed7aa',
    },
  },
}

export const ALL_SPECIES: PetSpecies[] = [
  'Owlbear',
  'Wyrmling',
  'Strix-Wolf',
  'Intellect Devourer',
  'Gelatinous Cube',
  'Phoenix',
  'Minotaur',
  'Chimera',
]

/**
 * Normalizes any species string to one of the 8 canonical PetSpecies types.
 */
export function normalizeSpecies(rawSpecies?: string | null): PetSpecies {
  if (!rawSpecies) return 'Owlbear'
  const clean = rawSpecies.trim().toLowerCase()

  if (clean.includes('owl') || clean.includes('bear')) return 'Owlbear'
  if (clean.includes('wyrm') || clean.includes('dragon') || clean.includes('ignis')) return 'Wyrmling'
  if (clean.includes('strix') || clean.includes('wolf')) return 'Strix-Wolf'
  if (clean.includes('intellect') || clean.includes('devourer') || clean.includes('brain')) return 'Intellect Devourer'
  if (clean.includes('gelatinous') || clean.includes('cube') || clean.includes('golem') || clean.includes('ooze')) return 'Gelatinous Cube'
  if (clean.includes('phoenix') || clean.includes('bird')) return 'Phoenix'
  if (clean.includes('minotaur') || clean.includes('bull')) return 'Minotaur'
  if (clean.includes('chimera') || clean.includes('cat') || clean.includes('dog')) return 'Chimera'

  return 'Owlbear'
}

/**
 * Gets default pet name for a species.
 */
export function getDefaultNameForSpecies(species: PetSpecies): string {
  return SPECIES_CONFIG[species]?.defaultPetName || 'Barnaby'
}

/**
 * Calculates pet mood state based on recency of user's last workout date.
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
        badgeVariant: 'default',
      }
    case 'happy':
      return {
        mood,
        label: 'Happy',
        emoji: '⚡',
        description: 'Feeling motivated and ready for your next session.',
        badgeVariant: 'default',
      }
    case 'neutral':
      return {
        mood,
        label: 'Resting',
        emoji: '🧘',
        description: 'Cooling down. A workout soon will restore peak stamina.',
        badgeVariant: 'secondary',
      }
    case 'sad':
      return {
        mood,
        label: 'Sluggish',
        emoji: '🌧️',
        description: 'Needs gym time! Complete a workout to boost morale.',
        badgeVariant: 'outline',
      }
    case 'sleeping':
    default:
      return {
        mood: 'sleeping',
        label: 'Sleeping',
        emoji: '💤',
        description: 'In hibernation mode. Log a workout session to wake up!',
        badgeVariant: 'secondary',
      }
  }
}
