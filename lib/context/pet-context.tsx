'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  PetData,
  PetSpecies,
  normalizeSpecies,
  getDefaultNameForSpecies,
} from '@/lib/utils/pet-utils'

interface PetContextType {
  pet: PetData | null
  loading: boolean
  isEnabled: boolean
  toggleEnabled: (enabled: boolean) => Promise<void>
  selectSpecies: (species: PetSpecies) => Promise<void>
  saveName: (name: string) => Promise<void>
  refetchPet: () => Promise<void>
}

const PetContext = createContext<PetContextType | undefined>(undefined)

const LOCAL_STORAGE_ENABLED_KEY = 'ironfamiliars_enabled'

export function PetProvider({ children }: { children: React.ReactNode }) {
  const [pet, setPet] = useState<PetData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isEnabled, setIsEnabledState] = useState<boolean>(true)

  const supabase = createClient()

  // Initialize pet state
  const loadPetData = useCallback(async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Read local storage initial preference
      if (typeof window !== 'undefined') {
        const storedEnabled = localStorage.getItem(LOCAL_STORAGE_ENABLED_KEY)
        if (storedEnabled !== null) {
          setIsEnabledState(storedEnabled === 'true')
        }
      }

      if (!user) {
        setLoading(false)
        return
      }

      let petRecord: PetData | null = null

      const { data: userPetData, error: userPetErr } = await supabase
        .from('user_pets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!userPetErr && userPetData) {
        petRecord = userPetData as PetData
      } else {
        const { data: petData, error: petErr } = await supabase
          .from('pets')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!petErr && petData) {
          petRecord = petData as PetData
        }
      }

      // If no pet exists yet, create default pet ('Owlbear' -> 'Barnaby')
      if (!petRecord) {
        const defaultPetPayload = {
          user_id: user.id,
          name: 'Barnaby',
          species: 'Owlbear',
          level: 1,
          experience: 25,
          is_enabled: true,
          enabled: true,
        }

        const { data: newPet, error: insertErr } = await supabase
          .from('user_pets')
          .insert(defaultPetPayload)
          .select()
          .single()

        if (!insertErr && newPet) {
          petRecord = newPet as PetData
        } else {
          const { data: newPetAlt } = await supabase
            .from('pets')
            .insert(defaultPetPayload)
            .select()
            .single()
          if (newPetAlt) {
            petRecord = newPetAlt as PetData
          }
        }
      }

      if (petRecord) {
        const norm = normalizeSpecies(petRecord.species)
        petRecord.species = norm
        setPet(petRecord)
        const activeState = petRecord.is_enabled ?? petRecord.enabled ?? true
        setIsEnabledState(activeState)
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_ENABLED_KEY, String(activeState))
        }
      } else {
        // Fallback local pet
        const fallbackPet: PetData = {
          id: 'local-pet',
          user_id: user.id,
          name: 'Barnaby',
          species: 'Owlbear',
          level: 1,
          experience: 25,
          is_enabled: true,
          enabled: true,
        }
        setPet(fallbackPet)
      }
    } catch (err) {
      console.error('Error in PetProvider loadPetData:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadPetData()
  }, [loadPetData])

  const toggleEnabled = async (checked: boolean) => {
    setIsEnabledState(checked)
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_ENABLED_KEY, String(checked))
    }

    if (pet) {
      const updatedPet = { ...pet, is_enabled: checked, enabled: checked }
      setPet(updatedPet)

      try {
        if (pet.id && pet.id !== 'local-pet') {
          await supabase
            .from('user_pets')
            .update({ is_enabled: checked, enabled: checked, updated_at: new Date().toISOString() })
            .eq('id', pet.id)

          await supabase
            .from('pets')
            .update({ is_enabled: checked, enabled: checked, updated_at: new Date().toISOString() })
            .eq('id', pet.id)
        }
      } catch (e) {
        console.error('Failed to update pet enable state:', e)
      }
    }
  }

  const selectSpecies = async (selectedSpecies: PetSpecies) => {
    if (!pet) return
    const currentNorm = normalizeSpecies(pet.species)
    const isDefault = pet.name === getDefaultNameForSpecies(currentNorm)
    const newName = isDefault ? getDefaultNameForSpecies(selectedSpecies) : pet.name

    const updatedPet: PetData = {
      ...pet,
      species: selectedSpecies,
      name: newName,
    }
    setPet(updatedPet)

    try {
      if (pet.id && pet.id !== 'local-pet') {
        await supabase
          .from('user_pets')
          .update({
            species: selectedSpecies,
            name: newName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pet.id)

        await supabase
          .from('pets')
          .update({
            species: selectedSpecies,
            name: newName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pet.id)
      }
    } catch (e) {
      console.error('Failed to select pet species:', e)
    }
  }

  const saveName = async (name: string) => {
    if (!pet) return
    const currentNorm = normalizeSpecies(pet.species)
    const finalName = name.trim() || getDefaultNameForSpecies(currentNorm)
    const updatedPet = { ...pet, name: finalName }
    setPet(updatedPet)

    try {
      if (pet.id && pet.id !== 'local-pet') {
        await supabase
          .from('user_pets')
          .update({ name: finalName, updated_at: new Date().toISOString() })
          .eq('id', pet.id)

        await supabase
          .from('pets')
          .update({ name: finalName, updated_at: new Date().toISOString() })
          .eq('id', pet.id)
      }
    } catch (e) {
      console.error('Failed to save pet name:', e)
    }
  }

  return (
    <PetContext.Provider
      value={{
        pet,
        loading,
        isEnabled,
        toggleEnabled,
        selectSpecies,
        saveName,
        refetchPet: loadPetData,
      }}
    >
      {children}
    </PetContext.Provider>
  )
}

export function usePet() {
  const context = useContext(PetContext)
  if (!context) {
    throw new Error('usePet must be used within a PetProvider')
  }
  return context
}
