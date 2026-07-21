'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePet } from '@/lib/context/pet-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel'
import { PetSprite } from '@/components/PetSprite'
import {
  getPetMood,
  getMoodDetails,
  SPECIES_CONFIG,
  ALL_SPECIES,
  normalizeSpecies,
  PetData,
  PetSpecies,
  MoodDetails,
} from '@/lib/utils/pet-utils'
import { Sparkles, Shield, RefreshCw, Check, Edit2 } from 'lucide-react'

interface PetDashboardWidgetProps {
  initialPet?: PetData | null
  lastWorkoutDate?: string | null
}

export function PetDashboardWidget({ lastWorkoutDate }: PetDashboardWidgetProps) {
  const { pet, loading, isEnabled, selectSpecies, saveName } = usePet()
  const [workoutDate, setWorkoutDate] = useState<string | null>(lastWorkoutDate || null)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editName, setEditName] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)

  const supabase = createClient()

  useEffect(() => {
    async function fetchLastWorkout() {
      if (lastWorkoutDate !== undefined) return
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
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
      } catch (err) {
        console.error('Error fetching last workout date:', err)
      }
    }
    fetchLastWorkout()
  }, [lastWorkoutDate, supabase])

  // Sync carousel slide position to current active pet when carousel API is ready
  useEffect(() => {
    if (!carouselApi || !pet) return
    const currentSpeciesNorm = normalizeSpecies(pet.species)
    const targetIdx = ALL_SPECIES.findIndex((sp) => sp === currentSpeciesNorm)
    if (targetIdx !== -1) {
      carouselApi.scrollTo(targetIdx)
      setActiveSlideIndex(targetIdx)
    }
  }, [carouselApi, pet])

  // Listen to carousel slide changes
  useEffect(() => {
    if (!carouselApi) return
    const onSelect = () => {
      setActiveSlideIndex(carouselApi.selectedScrollSnap())
    }
    carouselApi.on('select', onSelect)
    return () => {
      carouselApi.off('select', onSelect)
    }
  }, [carouselApi])

  const mood = getPetMood(workoutDate)
  const moodDetails: MoodDetails = getMoodDetails(mood)

  const handleSelectSpecies = async (selectedSpecies: PetSpecies) => {
    setSaving(true)
    try {
      await selectSpecies(selectedSpecies)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveName = async () => {
    setSaving(true)
    try {
      await saveName(editName)
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full shadow-xs border border-border/80">
        <CardContent className="p-6 flex items-center justify-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">Summoning your IronFamiliar...</span>
        </CardContent>
      </Card>
    )
  }

  // If pet companion is disabled in SettingsMenu, do not display widget on dashboard
  if (!isEnabled) {
    return null
  }

  const currentActiveSpeciesNorm = normalizeSpecies(pet?.species)

  return (
    <>
      <Card className="w-full overflow-hidden border border-primary/30 shadow-sm transition-all duration-300 bg-card/90 backdrop-blur-xs">
        {/* Header */}
        <CardHeader className="py-3 px-4 sm:px-6 bg-muted/40 border-b border-border/80 flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <CardTitle className="text-base sm:text-lg font-bold tracking-tight">IronFamiliars</CardTitle>
            <Badge variant="outline" className="text-[10px] uppercase font-mono px-2 py-0.5 ml-1 bg-primary/10 text-primary border-primary/20">
              GBA Edition
            </Badge>
          </div>
          {pet && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/60"
              onClick={() => {
                setEditName(pet.name)
                setIsEditing(true)
              }}
              title="Rename Companion"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Rename</span>
            </Button>
          )}
        </CardHeader>

        {/* Content Body */}
        <CardContent className="p-4 sm:p-6">
          <div className="relative px-2 sm:px-10">
            {/* Carousel Container */}
            <Carousel
              setApi={setCarouselApi}
              opts={{
                loop: true,
                align: 'center',
              }}
              className="w-full"
            >
              <CarouselContent>
                {ALL_SPECIES.map((speciesKey) => {
                  const specMeta = SPECIES_CONFIG[speciesKey]
                  const isActive = currentActiveSpeciesNorm === speciesKey
                  const displayName = isActive ? pet?.name || specMeta.defaultPetName : specMeta.defaultPetName

                  return (
                    <CarouselItem key={speciesKey} className="basis-full md:basis-full">
                      <div
                        className={`rounded-xl p-4 sm:p-5 transition-all duration-300 border ${
                          isActive
                            ? 'bg-gradient-to-br from-primary/10 via-muted/30 to-background border-primary/50 shadow-md'
                            : 'bg-muted/15 border-border/60 opacity-90'
                        } flex flex-col md:flex-row items-center gap-6`}
                      >
                        {/* Pet Sprite Rendering */}
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <PetSprite species={speciesKey} mood={isActive ? mood : 'happy'} size={140} />
                          <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-bold font-mono">
                            Lvl {pet?.level || 1}
                          </Badge>
                        </div>

                        {/* Companion Info & Controls */}
                        <div className="flex-1 w-full space-y-3 text-center md:text-left">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                                <h3 className="text-xl font-bold tracking-tight text-foreground">{displayName}</h3>
                                <Badge variant="outline" className="text-xs font-medium">
                                  {specMeta.name}
                                </Badge>
                                {isActive && (
                                  <Badge variant="default" className="text-[11px] bg-primary text-primary-foreground gap-1 font-semibold">
                                    <Check className="h-3 w-3" /> Active Companion
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{specMeta.element} Companion</p>
                            </div>

                            {/* Mood Badge (for active pet) or Default Status */}
                            {isActive ? (
                              <div className="flex items-center justify-center md:justify-end">
                                <Badge variant={moodDetails.badgeVariant} className="text-xs px-3 py-1 font-bold">
                                  <span className="mr-1">{moodDetails.emoji}</span> {moodDetails.label}
                                </Badge>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center md:justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSelectSpecies(speciesKey)}
                                  disabled={saving}
                                  className="text-xs h-8 border-primary/40 hover:bg-primary/10 font-medium"
                                >
                                  Select {specMeta.name}
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-xs sm:text-sm font-medium text-foreground/80 bg-background/60 p-2.5 rounded-lg border border-border/50">
                            {isActive ? moodDetails.description : specMeta.description}
                          </p>

                          {/* Fitness XP Bar */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground font-mono">
                              <span className="flex items-center gap-1">
                                <Shield className="h-3.5 w-3.5 text-primary" /> Fitness XP
                              </span>
                              <span>{pet?.experience || 0} / 100 XP</span>
                            </div>
                            <Progress value={(pet?.experience || 0) % 100} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  )
                })}
              </CarouselContent>

              {/* Carousel Navigation Buttons */}
              <CarouselPrevious className="left-0 -translate-x-1/2 sm:-translate-x-4 bg-background border-border shadow-xs hover:bg-accent" />
              <CarouselNext className="right-0 translate-x-1/2 sm:translate-x-4 bg-background border-border shadow-xs hover:bg-accent" />
            </Carousel>

            {/* Carousel Indicators / Dots */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {ALL_SPECIES.map((speciesKey, idx) => {
                const isActiveSlide = activeSlideIndex === idx
                const isSelectedPet = currentActiveSpeciesNorm === speciesKey
                return (
                  <button
                    key={speciesKey}
                    type="button"
                    onClick={() => carouselApi?.scrollTo(idx)}
                    className={`h-2 rounded-full transition-all ${
                      isActiveSlide
                        ? 'w-6 bg-primary'
                        : isSelectedPet
                        ? 'w-2 bg-primary/60'
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Go to ${speciesKey}`}
                  />
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rename Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Rename {pet?.species ? SPECIES_CONFIG[currentActiveSpeciesNorm]?.name : 'Companion'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="flex justify-center py-2">
              <PetSprite species={currentActiveSpeciesNorm} mood={mood} size={120} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Companion Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Give your pet a unique name..."
                maxLength={24}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveName} disabled={saving}>
              {saving ? 'Saving...' : 'Save Name'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
