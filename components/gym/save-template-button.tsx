'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bookmark, Check } from 'lucide-react'

interface SaveTemplateButtonProps {
  machineId: string
  suggestedWeight: number
  defaultReps: number
  defaultSetCount: number
}

interface WorkoutTemplate {
  weight: number
  reps: number
  setCount: number
}

const getTemplateKey = (machineId: string) => `gym-template-${machineId}`

export function SaveTemplateButton({ 
  machineId, 
  suggestedWeight,
  defaultReps,
  defaultSetCount
}: SaveTemplateButtonProps) {
  const [saved, setSaved] = useState(false)
  const [hasExisting, setHasExisting] = useState(false)

  useEffect(() => {
    const existing = localStorage.getItem(getTemplateKey(machineId))
    setHasExisting(!!existing)
  }, [machineId])

  const saveTemplate = () => {
    const template: WorkoutTemplate = {
      weight: suggestedWeight,
      reps: defaultReps,
      setCount: defaultSetCount,
    }
    
    localStorage.setItem(getTemplateKey(machineId), JSON.stringify(template))
    setSaved(true)
    setHasExisting(true)
    
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={saveTemplate}
      className="shrink-0"
    >
      {saved ? (
        <>
          <Check className="h-4 w-4 mr-2 text-green-600" />
          Saved!
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4 mr-2" />
          {hasExisting ? 'Update Template' : 'Save as Template'}
        </>
      )}
    </Button>
  )
}
