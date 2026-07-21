'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dumbbell, LayoutDashboard, ListPlus, TrendingUp, User, LogOut, Menu, History, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SettingsMenu } from '@/components/SettingsMenu'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/machines', label: 'Machines', icon: ListPlus },
  { href: '/sessions', label: 'Sessions', icon: History },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false)

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    loadUser()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : null

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 md:px-6 mx-auto max-w-6xl">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <Dumbbell className="h-5 w-5" />
              </div>
              <span className="font-bold tracking-tight text-base sm:inline-block">GymTracker</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                      isActive
                        ? 'bg-primary/15 text-primary shadow-xs font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile Avatar Trigger (Desktop & Mobile) */}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="relative flex items-center justify-center rounded-full p-0.5 transition-transform hover:scale-105 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              title="Open Settings & Profile"
              aria-label="User Profile Settings"
            >
              <Avatar className="h-9 w-9 border-2 border-primary/30 hover:border-primary transition-colors shadow-xs">
                <AvatarFallback className="bg-primary/15 text-primary font-bold text-xs">
                  {initials ? initials : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </button>

            {/* Mobile navigation menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 border-border/80 bg-background/95 backdrop-blur-md">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center gap-2.5 text-xs font-medium py-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setSettingsOpen(true)}
                  className="flex items-center gap-2.5 text-xs font-medium py-2"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Settings & Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive text-xs font-medium py-2">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Settings Menu Dialog */}
      <SettingsMenu open={settingsOpen} onOpenChange={setSettingsOpen} userEmail={userEmail} />
    </>
  )
}
