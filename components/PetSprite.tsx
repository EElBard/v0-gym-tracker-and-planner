'use client'

import React from 'react'
import { PetMood, PetSpecies } from '@/lib/utils/pet-utils'

interface PetSpriteProps {
  species: PetSpecies | string
  mood: PetMood
  size?: number
  className?: string
}

export function PetSprite({ species, mood, size = 120, className = '' }: PetSpriteProps) {
  const normSpecies = (species?.toLowerCase() || 'dragon') as PetSpecies

  const getMoodAura = () => {
    switch (mood) {
      case 'hyped':
        return (
          <g className="animate-pulse">
            <circle cx="64" cy="64" r="58" fill="url(#hypedGlow)" opacity="0.6" />
            <path
              d="M30 20 Q35 10 40 20 T50 20"
              stroke="#f97316"
              strokeWidth="2"
              fill="none"
              className="animate-bounce"
            />
            <path
              d="M75 15 Q80 5 85 15 T95 15"
              stroke="#ef4444"
              strokeWidth="2"
              fill="none"
              className="animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
          </g>
        )
      case 'happy':
        return (
          <g>
            <circle cx="64" cy="64" r="54" fill="url(#happyGlow)" opacity="0.4" />
            <text x="95" y="30" fontSize="16" className="animate-bounce" style={{ animationDelay: '200ms' }}>
              ✨
            </text>
            <text x="15" y="35" fontSize="14" className="animate-bounce">
              ⚡
            </text>
          </g>
        )
      case 'neutral':
        return (
          <g>
            <circle cx="64" cy="64" r="52" fill="url(#neutralGlow)" opacity="0.3" />
          </g>
        )
      case 'sad':
        return (
          <g>
            <circle cx="64" cy="64" r="50" fill="url(#sadGlow)" opacity="0.3" />
            <text x="96" y="40" fontSize="14" opacity="0.8">
              🌧️
            </text>
          </g>
        )
      case 'sleeping':
      default:
        return (
          <g>
            <circle cx="64" cy="64" r="50" fill="url(#sleepingGlow)" opacity="0.4" />
            <text x="88" y="28" fontSize="18" className="animate-pulse" opacity="0.9">
              💤
            </text>
          </g>
        )
    }
  }

  const getEyeExpression = () => {
    if (mood === 'sleeping') {
      return (
        <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M44 56 Q48 60 52 56" />
          <path d="M76 56 Q80 60 84 56" />
        </g>
      )
    }
    if (mood === 'sad') {
      return (
        <g fill="#ffffff">
          <ellipse cx="48" cy="54" rx="4" ry="5" />
          <ellipse cx="80" cy="54" rx="4" ry="5" />
          <path d="M42 46 Q48 50 54 48" stroke="#ffffff" strokeWidth="2" fill="none" />
          <path d="M74 48 Q80 50 86 46" stroke="#ffffff" strokeWidth="2" fill="none" />
        </g>
      )
    }
    if (mood === 'hyped') {
      return (
        <g fill="#fbbf24">
          <polygon points="48,46 54,58 42,58" />
          <polygon points="80,46 86,58 74,58" />
          <circle cx="48" cy="54" r="2" fill="#ffffff" />
          <circle cx="80" cy="54" r="2" fill="#ffffff" />
        </g>
      )
    }
    // happy or neutral
    return (
      <g fill="#ffffff">
        <circle cx="48" cy="54" r="5" />
        <circle cx="80" cy="54" r="5" />
        <circle cx="50" cy="52" r="2" fill="#000000" />
        <circle cx="82" cy="52" r="2" fill="#000000" />
      </g>
    )
  }

  const renderDragon = () => (
    <g>
      {/* Wings */}
      <path d="M25 60 Q5 35 35 45 Z" fill="#c2410c" opacity="0.9" />
      <path d="M103 60 Q123 35 93 45 Z" fill="#c2410c" opacity="0.9" />
      {/* Body */}
      <ellipse cx="64" cy="74" rx="32" ry="28" fill="#ea580c" />
      {/* Head */}
      <circle cx="64" cy="52" r="26" fill="#f97316" />
      {/* Horns */}
      <polygon points="46,32 40,16 52,28" fill="#fdba74" />
      <polygon points="82,32 88,16 76,28" fill="#fdba74" />
      {/* Chest plate */}
      <path d="M52 68 Q64 60 76 68 Q64 92 52 68 Z" fill="#fde047" opacity="0.8" />
      {/* Eyes */}
      {getEyeExpression()}
      {/* Snout */}
      <ellipse cx="64" cy="62" rx="10" ry="6" fill="#ea580c" />
      <circle cx="60" cy="61" r="1.5" fill="#7c2d12" />
      <circle cx="68" cy="61" r="1.5" fill="#7c2d12" />
    </g>
  )

  const renderBear = () => (
    <g>
      {/* Body */}
      <ellipse cx="64" cy="76" rx="36" ry="28" fill="#65a30d" />
      {/* Ears */}
      <circle cx="42" cy="34" r="12" fill="#4d7c0f" />
      <circle cx="42" cy="34" r="6" fill="#a3e635" />
      <circle cx="86" cy="34" r="12" fill="#4d7c0f" />
      <circle cx="86" cy="34" r="6" fill="#a3e635" />
      {/* Head */}
      <circle cx="64" cy="52" r="28" fill="#84cc16" />
      {/* Snout */}
      <ellipse cx="64" cy="60" rx="14" ry="10" fill="#ecfccb" />
      <ellipse cx="64" cy="56" rx="6" ry="4" fill="#3f6212" />
      {/* Eyes */}
      {getEyeExpression()}
    </g>
  )

  const renderWolf = () => (
    <g>
      {/* Body */}
      <ellipse cx="64" cy="74" rx="30" ry="26" fill="#0891b2" />
      {/* Ears */}
      <polygon points="40,46 32,20 54,34" fill="#0e7490" />
      <polygon points="88,46 96,20 74,34" fill="#0e7490" />
      <polygon points="42,42 36,25 52,34" fill="#67e8f9" />
      <polygon points="86,42 92,25 76,34" fill="#67e8f9" />
      {/* Head */}
      <polygon points="64,28 42,54 86,54" fill="#06b6d4" />
      <circle cx="64" cy="54" r="24" fill="#06b6d4" />
      {/* Snout */}
      <polygon points="64,70 56,58 72,58" fill="#cffafe" />
      <polygon points="64,68 60,62 68,62" fill="#164e63" />
      {/* Eyes */}
      {getEyeExpression()}
    </g>
  )

  const renderPhoenix = () => (
    <g>
      {/* Tail flames */}
      <path d="M50 90 Q30 110 64 116 Q98 110 78 90 Z" fill="#db2777" />
      {/* Wings */}
      <path d="M30 65 Q0 40 40 30 Z" fill="#f43f5e" />
      <path d="M98 65 Q128 40 88 30 Z" fill="#f43f5e" />
      {/* Body */}
      <ellipse cx="64" cy="70" rx="26" ry="24" fill="#ec4899" />
      {/* Head */}
      <circle cx="64" cy="46" r="22" fill="#f472b6" />
      {/* Crest */}
      <path d="M64 24 Q60 10 64 8 Q68 10 64 24 Z" fill="#fb7185" />
      <path d="M58 26 Q50 14 56 12 Z" fill="#fda4af" />
      <path d="M70 26 Q78 14 72 12 Z" fill="#fda4af" />
      {/* Beak */}
      <polygon points="64,58 56,50 72,50" fill="#fef08a" />
      {/* Eyes */}
      {getEyeExpression()}
    </g>
  )

  const renderGolem = () => (
    <g>
      {/* Shoulders */}
      <rect x="24" y="56" width="80" height="38" rx="8" fill="#7e22ce" />
      {/* Head */}
      <rect x="42" y="30" width="44" height="36" rx="6" fill="#a855f7" />
      {/* Core Gem */}
      <polygon points="64,66 72,76 64,86 56,76" fill="#f0abfc" className="animate-pulse" />
      {/* Eyes */}
      {getEyeExpression()}
    </g>
  )

  const renderFallback = () => (
    <g>
      <circle cx="64" cy="74" r="28" fill="#4f46e5" />
      <circle cx="64" cy="50" r="22" fill="#6366f1" />
      {/* Cat/Dog Ears */}
      <polygon points="46,34 38,18 54,28" fill="#818cf8" />
      <polygon points="82,34 90,18 74,28" fill="#818cf8" />
      {getEyeExpression()}
    </g>
  )

  const renderSpeciesSvg = () => {
    switch (normSpecies) {
      case 'dragon':
        return renderDragon()
      case 'bear':
        return renderBear()
      case 'wolf':
        return renderWolf()
      case 'phoenix':
        return renderPhoenix()
      case 'golem':
        return renderGolem()
      case 'cat':
      case 'dog':
      default:
        return renderFallback()
    }
  }

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 128 128" className="overflow-visible">
        <defs>
          <radialGradient id="hypedGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="happyGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="neutralGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sadGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sleepingGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#64748b" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#334155" stopOpacity="0" />
          </radialGradient>
        </defs>
        {getMoodAura()}
        {renderSpeciesSvg()}
      </svg>
    </div>
  )
}
