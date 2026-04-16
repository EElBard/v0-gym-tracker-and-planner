'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Timer, SkipForward, Pause, Play } from 'lucide-react'
import { formatTime } from '@/lib/utils/progression'

interface RestTimerProps {
  defaultSeconds?: number
  isActive: boolean
  onTimerStart: () => void
  onTimerEnd: () => void
}

export function RestTimer({
  defaultSeconds = 60,
  isActive,
  onTimerStart,
  onTimerEnd,
}: RestTimerProps) {
  const [seconds, setSeconds] = useState(defaultSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isActive) {
      setIsRunning(false)
      setSeconds(defaultSeconds)
      return
    }
  }, [isActive, defaultSeconds])

  useEffect(() => {
    if (!isRunning || !isActive) return

    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          setIsRunning(false)
          onTimerEnd()
          return defaultSeconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, isActive, defaultSeconds, onTimerEnd])

  // Request focus when timer ends
  useEffect(() => {
    if (!isRunning && isActive && isFocused) {
      // Timer ended and we were running
      window.focus()
    }
  }, [isRunning, isActive, isFocused])

  const handleStart = () => {
    setIsRunning(true)
    onTimerStart()
  }

  const handleSkip = () => {
    setIsRunning(false)
    setSeconds(defaultSeconds)
    onTimerEnd()
  }

  if (!isActive) return null

  const progress = ((defaultSeconds - seconds) / defaultSeconds) * 100
  const isTimeUp = seconds <= 0

  return (
    <Card className={`border-primary/50 ${isTimeUp ? 'bg-amber-500/10 border-amber-500/50' : ''}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Rest Timer</span>
            </div>
            {isTimeUp && (
              <span className="text-xs font-semibold text-amber-600 animate-pulse">
                Time&apos;s up!
              </span>
            )}
          </div>

          <div className="text-center">
            <div
              className={`text-4xl sm:text-5xl font-bold font-mono ${
                isTimeUp ? 'text-amber-600 animate-pulse' : 'text-foreground'
              }`}
            >
              {formatTime(seconds)}
            </div>
          </div>

          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${
                isTimeUp ? 'bg-amber-500' : 'bg-primary'
              } transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex gap-2">
            {!isRunning ? (
              <Button
                onClick={handleStart}
                size="sm"
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Rest
              </Button>
            ) : (
              <Button
                onClick={() => setIsRunning(false)}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            <Button
              onClick={handleSkip}
              size="sm"
              variant="outline"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
