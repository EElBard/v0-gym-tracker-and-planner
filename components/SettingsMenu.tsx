'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePet } from '@/lib/context/pet-context'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { PetSprite } from '@/components/PetSprite'
import { SPECIES_CONFIG, normalizeSpecies } from '@/lib/utils/pet-utils'
import {
  User,
  Settings,
  Sparkles,
  LogOut,
  Sliders,
  Shield,
  Volume2,
  Gamepad2,
  Check,
} from 'lucide-react'

interface SettingsMenuProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  userEmail?: string | null
  trigger?: React.ReactNode
}

export function SettingsMenu({ open, onOpenChange, userEmail: initialUserEmail, trigger }: SettingsMenuProps) {
  const router = useRouter()
  const { pet, isEnabled, toggleEnabled } = usePet()
  const [internalEmail, setInternalEmail] = useState<string>(initialUserEmail || 'Gym Member')
  const [internalOpen, setInternalOpen] = useState(false)
  const [retroEffect, setRetroEffect] = useState<boolean>(true)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }

  const userEmail = initialUserEmail || internalEmail

  const supabase = createClient()

  useEffect(() => {
    if (initialUserEmail) return
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.email) {
        setInternalEmail(user.email)
      }
    }
    loadUser()
  }, [supabase, initialUserEmail])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsOpen(false)
    router.push('/')
  }

  const activeSpeciesNorm = pet?.species ? normalizeSpecies(pet.species) : 'Owlbear'
  const activeSpecMeta = SPECIES_CONFIG[activeSpeciesNorm]
  const userInitials = userEmail && userEmail !== 'Gym Member'
    ? userEmail.slice(0, 2).toUpperCase()
    : 'GM'

  const defaultTrigger = (
    <Button
      variant="ghost"
      className="relative h-9 w-9 rounded-full ring-2 ring-primary/20 hover:ring-primary/50 transition-all focus-visible:outline-none"
      aria-label="Open user settings menu"
    >
      <Avatar className="h-9 w-9 border border-border">
        <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userEmail)}`} alt="User Avatar" />
        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
          {userInitials}
        </AvatarFallback>
      </Avatar>
    </Button>
  )

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md bg-background border-l border-border flex flex-col justify-between p-0 overflow-y-auto">
        <div>
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-primary/15 via-accent/30 to-background p-6 border-b border-border">
            <SheetHeader className="text-left space-y-1">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] font-mono uppercase bg-background/80 backdrop-blur">
                  Profile & Settings
                </Badge>
                <Badge variant="default" className="text-[10px] font-bold font-mono bg-primary text-primary-foreground gap-1">
                  <Gamepad2 className="h-3 w-3" /> GBA Edition
                </Badge>
              </div>
              <SheetTitle className="text-xl font-bold flex items-center gap-2 pt-2">
                <Settings className="h-5 w-5 text-primary" /> User Preferences
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Customize your gym companion, account settings, and display options.
              </SheetDescription>
            </SheetHeader>

            {/* Profile Info Card */}
            <div className="mt-5 flex items-center gap-3.5 p-3.5 rounded-xl bg-background/90 border border-border shadow-sm backdrop-blur">
              <Avatar className="h-12 w-12 border-2 border-primary/30">
                <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userEmail)}`} alt="Avatar" />
                <AvatarFallback className="bg-primary/20 text-primary font-bold">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{userEmail}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground font-medium">Gym Member</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Companion / Pet Toggle Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">IronFamiliars Companion</h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {isEnabled ? 'ACTIVE' : 'OFF'}
                </Badge>
              </div>

              {/* Main Switch Card */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 transition-all">
                <div className="space-y-0.5 pr-4">
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    Show IronFamiliar Pet
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Display GBA LeafGreen pets on your dashboard to track workout mood and earn XP.
                  </p>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={toggleEnabled}
                  aria-label="Toggle IronFamiliars companion"
                />
              </div>

              {/* Active Pet Preview Card */}
              {isEnabled && pet && (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-4 transition-all">
                  <PetSprite species={activeSpeciesNorm} size={70} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground truncate">{pet.name}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                        {activeSpecMeta.name}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{activeSpecMeta.element}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] font-medium text-primary">
                      <Shield className="h-3 w-3" /> Lvl {pet.level || 1} • {pet.experience || 0} XP
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Retro UI Pass & Sound Settings */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Interface Aesthetics</h3>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      Retro Scanlines & Glow
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Enable subtle GBA pixel styling and CRT scanlines.
                    </p>
                  </div>
                  <Switch
                    checked={retroEffect}
                    onCheckedChange={setRetroEffect}
                    aria-label="Toggle retro effects"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Sign Out Button */}
        <div className="p-6 border-t border-border bg-muted/20">
          <Button
            variant="destructive"
            className="w-full flex items-center justify-center gap-2 font-semibold shadow-sm"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
