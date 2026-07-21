'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PetSprite } from '@/components/PetSprite'
import { getPetMood, getMoodDetails, SPECIES_CONFIG, PetData, PetSpecies, MoodDetails } from '@/lib/utils/pet-utils'
import { Sparkles, Settings, Heart, Shield, RefreshCw, EyeOff } from 'lucide-react'

interface PetDashboardWidgetProps {
  initialPet?: PetData | null
  lastWorkoutDate?: string | null
}

export function PetDashboardWidget({ initialPet, lastWorkoutDate }: PetDashboardWidgetProps) {
  const [pet, setPet] = useState<PetData | null>(initialPet || null)
  const [loading, setLoading] = useState<boolean>(!initialPet)
  const [workoutDate, setWorkoutDate] = useState<string | null>(lastWorkoutDate || null)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editName, setEditName] = useState<string>('')
  const [editSpecies, setEditSpecies] = useState<PetSpecies>('dragon')
  const [saving, setSaving] = useState<boolean>(false)

  const supabase = createClient()

  useEffect(() => {
    async function loadPetData() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // Fetch last workout date if not provided as prop
        if (lastWorkoutDate === undefined) {
          const { data: sessions } = await supabase
            .from('workout_sessions')
            .select('session_date')
            .eq('user_id', user.id)
            .order('session_date', { ascending: false })
            .limit(1)

          if (sessions && sessions.length > 0) {
            setWorkoutDate(sessions[0].session_date)
          }
        }

        // Fetch pet from user_pets or pets table
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

        // If no pet exists yet, create default pet for user
        if (!petRecord) {
          const defaultPetPayload = {
            user_id: user.id,
            name: 'Ignis',
            species: 'dragon',
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
            // Fallback try pets table
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
          setPet(petRecord)
          setEditName(petRecord.name)
          setEditSpecies((petRecord.species as PetSpecies) || 'dragon')
        } else {
          // Local fallback pet object if DB table is uninitialized
          setPet({
            id: 'local-pet',
            user_id: user.id,
            name: 'Ignis',
            species: 'dragon',
            level: 1,
            experience: 25,
            is_enabled: true,
            enabled: true,
          })
        }
      } catch (err) {
        console.error('Error fetching pet data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (!initialPet) {
      loadPetData()
    }
  }, [initialPet, lastWorkoutDate])

  const mood = getPetMood(workoutDate)
  const moodDetails: MoodDetails = getMoodDetails(mood)

  const isEnabled = pet?.is_enabled ?? pet?.enabled ?? true
  const currentSpecies = (pet?.species || 'dragon') as PetSpecies
  const speciesMeta = SPECIES_CONFIG[currentSpecies] || SPECIES_CONFIG['dragon']

  const handleToggleEnable = async (checked: boolean) => {
    if (!pet) return
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

  const handleSavePetCustomization = async () => {
    if (!pet) return
    setSaving(true)
    const updatedPet = { ...pet, name: editName.trim() || speciesMeta.defaultPetName, species: editSpecies }

    try {
      if (pet.id && pet.id !== 'local-pet') {
        await supabase
          .from('user_pets')
          .update({
            name: updatedPet.name,
            species: updatedPet.species,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pet.id)

        await supabase
          .from('pets')
          .update({
            name: updatedPet.name,
            species: updatedPet.species,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pet.id)
      }
      setPet(updatedPet)
      setIsEditing(false)
    } catch (e) {
      console.error('Failed to save pet customization:', e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full shadow-sm border border-border">
        <CardContent className="p-6 flex items-center justify-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">Summoning your IronFamiliar...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={`w-full overflow-hidden transition-all duration-300 border ${isEnabled ? moodDetails.borderColor : 'border-border'}`}>
        <CardHeader className="py-3 px-4 sm:px-6 bg-muted/40 border-b border-border flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <CardTitle className="text-base sm:text-lg font-semibold tracking-tight">IronFamiliar</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            {isEnabled && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setEditName(pet?.name || speciesMeta.defaultPetName)
                  setEditSpecies(currentSpecies)
                  setIsEditing(true)
                }}
                title="Customize Familiar"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggleEnable}
                aria-label="Toggle IronFamiliar feature"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {!isEnabled ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-muted/20 border border-dashed border-muted-foreground/30">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="p-3 rounded-full bg-muted text-muted-foreground">
                  <EyeOff className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">IronFamiliar Pet Disabled</h4>
                  <p className="text-xs text-muted-foreground">Enable to view your companion, track workout mood, and gain fitness XP.</p>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => handleToggleEnable(true)}>
                Enable Companion
              </Button>
            </div>
          ) : (
            <div className={`rounded-xl p-4 sm:p-5 bg-gradient-to-r ${moodDetails.bgGradient} flex flex-col md:flex-row items-center gap-6`}>
              {/* Pet Sprite */}
              <div className="relative group flex items-center justify-center">
                <PetSprite species={pet?.species || 'dragon'} mood={mood} size={130} />
                <Badge className="absolute -bottom-2 px-2.5 py-0.5 text-xs font-bold shadow-md" variant="secondary">
                  Lvl {pet?.level || 1}
                </Badge>
              </div>

              {/* Pet Details & Mood Status */}
              <div className="flex-1 w-full space-y-3 text-center md:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <h3 className="text-xl font-bold tracking-tight text-foreground">{pet?.name || 'Iron Buddy'}</h3>
                      <Badge variant="outline" className="text-xs capitalize font-medium">
                        {speciesMeta.name}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{speciesMeta.element} Companion</p>
                  </div>

                  {/* Mood Badge */}
                  <div className="flex items-center justify-center md:justify-end gap-1.5">
                    <Badge variant={moodDetails.badgeVariant} className={`text-xs px-3 py-1 font-bold ${moodDetails.textColor}`}>
                      <span className="mr-1">{moodDetails.emoji}</span> {moodDetails.label}
                    </Badge>
                  </div>
                </div>

                {/* Mood Description */}
                <p className="text-sm font-medium text-foreground/90 bg-background/50 p-2.5 rounded-lg border border-border/50">
                  {moodDetails.description}
                </p>

                {/* Experience Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-primary" /> Fitness XP
                    </span>
                    <span>{pet?.experience || 0} / 100 XP</span>
                  </div>
                  <Progress value={(pet?.experience || 0) % 100} className="h-2" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customization Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Customize IronFamiliar
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="flex justify-center py-2">
              <PetSprite species={editSpecies} mood={mood} size={110} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Companion Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Name your familiar..."
                maxLength={24}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Species</label>
              <Select value={editSpecies} onValueChange={(val) => setEditSpecies(val as PetSpecies)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SPECIES_CONFIG).map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      <span className="font-semibold">{sp.name}</span> - <span className="text-muted-foreground text-xs">{sp.element}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground italic pt-1">
                {SPECIES_CONFIG[editSpecies]?.description}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePetCustomization} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
