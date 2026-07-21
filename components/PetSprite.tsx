'use client'

import React from 'react'
import { PetMood, PetSpecies, normalizeSpecies, SPECIES_CONFIG } from '@/lib/utils/pet-utils'

interface PetSpriteProps {
  species: PetSpecies | string
  mood?: PetMood
  size?: number
  className?: string
}

export function PetSprite({ species, mood = 'happy', size = 130, className = '' }: PetSpriteProps) {
  const normSpecies = normalizeSpecies(species)
  const config = SPECIES_CONFIG[normSpecies] || SPECIES_CONFIG.Owlbear
  const { outline, shade, main, highlight } = config.palette

  // GBA Pokemon LeafGreen Status / Mood Icon rendering
  const renderMoodStatusIcon = () => {
    switch (mood) {
      case 'hyped':
        return (
          <g transform="translate(90, 16)">
            {/* Retro 4-color flame icon */}
            <path d="M 0 16 L 4 8 L 8 12 L 12 4 L 16 10 L 20 2 L 24 16 Z" fill={outline} />
            <path d="M 2 15 L 5 9 L 8 13 L 12 6 L 15 11 L 18 4 L 22 15 Z" fill={shade} />
            <path d="M 4 14 L 6 11 L 8 14 L 12 8 L 14 12 L 16 7 L 20 14 Z" fill={main} />
            <path d="M 8 13 L 12 10 L 14 13 L 16 11 L 18 13 Z" fill={highlight} />
          </g>
        )
      case 'happy':
        return (
          <g transform="translate(96, 16)">
            <rect x="0" y="0" width="16" height="16" rx="4" fill={outline} />
            <rect x="2" y="2" width="12" height="12" rx="3" fill={highlight} />
            <path d="M 4 9 L 7 12 L 12 5" stroke={outline} strokeWidth="3" strokeLinecap="square" fill="none" />
          </g>
        )
      case 'neutral':
        return (
          <g transform="translate(98, 16)">
            <rect x="0" y="0" width="16" height="16" rx="4" fill={outline} />
            <rect x="2" y="2" width="12" height="12" rx="3" fill={main} />
            <rect x="4" y="7" width="8" height="3" fill={outline} />
          </g>
        )
      case 'sad':
        return (
          <g transform="translate(96, 18)">
            <path d="M 6 0 L 12 0 L 16 8 L 10 16 L 2 12 Z" fill={outline} />
            <path d="M 7 2 L 11 2 L 14 8 L 9 14 L 4 11 Z" fill={shade} />
            <rect x="6" y="5" width="4" height="4" fill={highlight} />
          </g>
        )
      case 'sleeping':
      default:
        return (
          <g transform="translate(94, 12)" className="animate-pulse">
            {/* Retro pixel Z's */}
            <path d="M 0 0 H 10 L 2 8 H 10 V 10 H 0 L 8 2 H 0 Z" fill={outline} />
            <path d="M 1 1 H 8 L 2 7 H 9 V 9 H 1 L 7 3 H 1 Z" fill={highlight} />
          </g>
        )
    }
  }

  // Eye styles restricted to 4-color palette cel-shading
  const renderEyes = (eyePositions: Array<{ cx: number; cy: number }>) => {
    if (mood === 'sleeping') {
      return eyePositions.map((pos, idx) => (
        <path
          key={idx}
          d={`M ${pos.cx - 6} ${pos.cy} L ${pos.cx} ${pos.cy + 4} L ${pos.cx + 6} ${pos.cy}`}
          stroke={outline}
          strokeWidth="3.5"
          strokeLinecap="square"
          fill="none"
        />
      ))
    }
    if (mood === 'sad') {
      return eyePositions.map((pos, idx) => (
        <g key={idx}>
          <rect x={pos.cx - 5} y={pos.cy - 5} width="10" height="10" fill={outline} rx="1" />
          <rect x={pos.cx - 3} y={pos.cy - 3} width="6" height="6" fill={shade} rx="1" />
          <rect x={pos.cx - 1} y={pos.cy - 1} width="3" height="3" fill={highlight} />
        </g>
      ))
    }
    if (mood === 'hyped') {
      return eyePositions.map((pos, idx) => (
        <g key={idx}>
          <polygon points={`${pos.cx},${pos.cy - 7} ${pos.cx + 6},${pos.cy + 5} ${pos.cx - 6},${pos.cy + 5}`} fill={outline} />
          <polygon points={`${pos.cx},${pos.cy - 4} ${pos.cx + 4},${pos.cy + 3} ${pos.cx - 4},${pos.cy + 3}`} fill={highlight} />
        </g>
      ))
    }
    // Default Happy / Neutral eyes
    return eyePositions.map((pos, idx) => (
      <g key={idx}>
        <rect x={pos.cx - 6} y={pos.cy - 6} width="12" height="12" fill={outline} rx="2" />
        <rect x={pos.cx - 4} y={pos.cy - 4} width="8" height="8" fill={highlight} rx="1" />
        <rect x={pos.cx - 1} y={pos.cy - 2} width="4" height="4" fill={outline} />
      </g>
    ))
  }

  // 1. OWLBEAR GBA LeafGreen Sprite
  const renderOwlbear = () => (
    <g id="owlbear-sprite">
      {/* Body & Feet */}
      <rect x="36" y="58" width="56" height="52" rx="14" fill={outline} />
      <rect x="39" y="61" width="50" height="46" rx="12" fill={shade} />
      <rect x="44" y="68" width="40" height="32" rx="10" fill={main} />

      {/* Feather Belly Patch */}
      <polygon points="64,72 52,94 76,94" fill={highlight} stroke={outline} strokeWidth="2" />

      {/* Head */}
      <rect x="32" y="24" width="64" height="44" rx="16" fill={outline} />
      <rect x="35" y="27" width="58" height="38" rx="14" fill={main} />

      {/* Owl Facial Disc Mask */}
      <path d="M 40 32 H 88 V 56 H 40 Z" fill={highlight} stroke={outline} strokeWidth="2.5" />

      {/* Ears / Feather Tuft Clumps */}
      <polygon points="34,26 24,10 44,22" fill={outline} />
      <polygon points="36,27 28,14 42,24" fill={shade} />
      <polygon points="94,26 104,10 84,22" fill={outline} />
      <polygon points="92,27 100,14 86,24" fill={shade} />

      {/* Owl Beak */}
      <polygon points="64,54 57,44 71,44" fill={outline} />
      <polygon points="64,52 59,46 69,46" fill={shade} />

      {/* Eyes */}
      {renderEyes([{ cx: 50, cy: 40 }, { cx: 78, cy: 40 }])}

      {/* Sharp Bear Claws */}
      <polygon points="38,110 34,118 42,118" fill={outline} />
      <polygon points="46,110 44,118 50,118" fill={outline} />
      <polygon points="82,110 78,118 86,118" fill={outline} />
      <polygon points="90,110 86,118 94,118" fill={outline} />
    </g>
  )

  // 2. WYRMLING GBA LeafGreen Sprite
  const renderWyrmling = () => (
    <g id="wyrmling-sprite">
      {/* Wings */}
      <path d="M 28 50 Q 8 28 38 38 Z" fill={outline} />
      <path d="M 30 52 Q 12 32 36 40 Z" fill={shade} />
      <path d="M 100 50 Q 120 28 90 38 Z" fill={outline} />
      <path d="M 98 52 Q 116 32 92 40 Z" fill={shade} />

      {/* Tail with flame tip */}
      <path d="M 76 90 Q 106 100 100 80 Q 94 66 112 60" stroke={outline} strokeWidth="8" strokeLinecap="square" fill="none" />
      <path d="M 76 90 Q 106 100 100 80 Q 94 66 112 60" stroke={main} strokeWidth="4" strokeLinecap="square" fill="none" />
      <polygon points="112,60 120,54 116,66" fill={highlight} stroke={outline} strokeWidth="2" />

      {/* Dragon Body */}
      <rect x="42" y="60" width="44" height="44" rx="12" fill={outline} />
      <rect x="45" y="63" width="38" height="38" rx="10" fill={main} />
      <rect x="52" y="70" width="24" height="24" rx="6" fill={highlight} stroke={outline} strokeWidth="2" />

      {/* Head */}
      <rect x="36" y="24" width="56" height="44" rx="14" fill={outline} />
      <rect x="39" y="27" width="50" height="38" rx="12" fill={main} />

      {/* Dragon Horns */}
      <polygon points="44,24 34,8 52,20" fill={outline} />
      <polygon points="45,25 38,12 50,22" fill={highlight} />
      <polygon points="84,24 94,8 76,20" fill={outline} />
      <polygon points="83,25 90,12 78,22" fill={highlight} />

      {/* Eyes */}
      {renderEyes([{ cx: 52, cy: 40 }, { cx: 76, cy: 40 }])}

      {/* Snout & Nostrils */}
      <rect x="54" y="52" width="20" height="12" rx="4" fill={shade} stroke={outline} strokeWidth="2" />
      <rect x="58" y="55" width="3" height="3" fill={outline} />
      <rect x="67" y="55" width="3" height="3" fill={outline} />
    </g>
  )

  // 3. STRIX-WOLF GBA LeafGreen Sprite
  const renderStrixWolf = () => (
    <g id="strix-wolf-sprite">
      {/* Feathered Wings */}
      <path d="M 24 54 L 6 36 L 20 28 L 38 46 Z" fill={outline} />
      <path d="M 26 52 L 10 38 L 22 32 L 36 46 Z" fill={highlight} />
      <path d="M 104 54 L 122 36 L 108 28 L 90 46 Z" fill={outline} />
      <path d="M 102 52 L 118 38 L 106 32 L 92 46 Z" fill={highlight} />

      {/* Body */}
      <rect x="38" y="58" width="52" height="46" rx="12" fill={outline} />
      <rect x="41" y="61" width="46" height="40" rx="10" fill={shade} />
      <path d="M 52 64 L 64 80 L 76 64 Z" fill={main} stroke={outline} strokeWidth="2" />

      {/* Wolf Head */}
      <polygon points="64,20 34,50 94,50" fill={outline} />
      <polygon points="64,24 38,48 90,48" fill={main} />

      {/* Wolf Ears */}
      <polygon points="40,32 30,10 50,26" fill={outline} />
      <polygon points="41,33 34,14 48,27" fill={highlight} />
      <polygon points="88,32 98,10 78,26" fill={outline} />
      <polygon points="87,33 94,14 80,27" fill={highlight} />

      {/* Muzzle */}
      <polygon points="64,68 54,52 74,52" fill={outline} />
      <polygon points="64,65 57,54 71,54" fill={highlight} />
      <rect x="61" y="63" width="6" height="4" fill={outline} />

      {/* Eyes */}
      {renderEyes([{ cx: 50, cy: 38 }, { cx: 78, cy: 38 }])}
    </g>
  )

  // 4. INTELLECT DEVOURER GBA LeafGreen Sprite
  const renderIntellectDevourer = () => (
    <g id="intellect-devourer-sprite">
      {/* 4 Clawed Quadruped Legs */}
      <path d="M 28 80 L 16 108 L 26 108 L 36 86 Z" fill={outline} />
      <path d="M 30 82 L 20 106 L 24 106 L 34 86 Z" fill={shade} />
      <path d="M 46 84 L 38 112 L 48 112 L 54 88 Z" fill={outline} />
      <path d="M 82 84 L 90 112 L 80 112 L 74 88 Z" fill={outline} />
      <path d="M 100 80 L 112 108 L 102 108 L 92 86 Z" fill={outline} />
      <path d="M 98 82 L 108 106 L 104 106 L 94 86 Z" fill={shade} />

      {/* Giant Brain Body */}
      <rect x="28" y="24" width="72" height="60" rx="24" fill={outline} />
      <rect x="31" y="27" width="66" height="54" rx="20" fill={main} />

      {/* Brain Sulci / Fissures (GBA Cel Shaded Lines) */}
      <path d="M 64 27 V 81" stroke={outline} strokeWidth="3" />
      <path d="M 40 40 Q 56 46 40 58 Q 58 64 42 74" stroke={outline} strokeWidth="3" fill="none" />
      <path d="M 88 40 Q 72 46 88 58 Q 70 64 86 74" stroke={outline} strokeWidth="3" fill="none" />
      <path d="M 48 34 Q 64 38 48 48" stroke={highlight} strokeWidth="2.5" fill="none" />
      <path d="M 80 34 Q 64 38 80 48" stroke={highlight} strokeWidth="2.5" fill="none" />

      {/* Frontal Mind Eye / Synapse Glow */}
      {renderEyes([{ cx: 52, cy: 56 }, { cx: 76, cy: 56 }])}
    </g>
  )

  // 5. GELATINOUS CUBE GBA LeafGreen Sprite
  const renderGelatinousCube = () => (
    <g id="gelatinous-cube-sprite">
      {/* Outer Outline Block */}
      <polygon points="64,16 112,38 112,88 64,110 16,88 16,38" fill={outline} />
      {/* Front Top Facet */}
      <polygon points="64,20 106,40 64,58 22,40" fill={highlight} />
      {/* Left Front Facet */}
      <polygon points="22,42 62,60 62,104 22,86" fill={main} />
      {/* Right Front Facet */}
      <polygon points="66,60 106,42 106,86 66,104" fill={shade} />

      {/* Inner Suspended Floating Objects / Skeleton / Dumbbell */}
      <rect x="44" y="60" width="40" height="12" rx="4" fill={outline} transform="rotate(-15 64 66)" />
      <rect x="46" y="62" width="36" height="8" rx="2" fill={highlight} transform="rotate(-15 64 66)" />

      {/* Eyes floating inside cube */}
      {renderEyes([{ cx: 50, cy: 52 }, { cx: 78, cy: 52 }])}
    </g>
  )

  // 6. PHOENIX GBA LeafGreen Sprite
  const renderPhoenix = () => (
    <g id="phoenix-sprite">
      {/* Flame Tail Feathers */}
      <polygon points="64,116 44,90 84,90" fill={outline} />
      <polygon points="64,112 48,92 80,92" fill={main} />
      <polygon points="64,106 54,94 74,94" fill={highlight} />

      {/* Wings */}
      <path d="M 24 50 L 4 30 L 22 20 L 40 40 Z" fill={outline} />
      <path d="M 26 48 L 8 32 L 22 24 L 38 40 Z" fill={shade} />
      <path d="M 104 50 L 124 30 L 106 20 L 88 40 Z" fill={outline} />
      <path d="M 102 48 L 120 32 L 106 24 L 90 40 Z" fill={shade} />

      {/* Body */}
      <rect x="44" y="56" width="40" height="40" rx="12" fill={outline} />
      <rect x="47" y="59" width="34" height="34" rx="10" fill={main} />

      {/* Crest Feathers */}
      <polygon points="64,8 56,26 72,26" fill={outline} />
      <polygon points="64,12 58,26 70,26" fill={highlight} />

      {/* Head */}
      <rect x="40" y="24" width="48" height="36" rx="12" fill={outline} />
      <rect x="43" y="27" width="42" height="30" rx="10" fill={main} />

      {/* Sharp Beak */}
      <polygon points="64,52 54,42 74,42" fill={outline} />
      <polygon points="64,50 57,44 71,44" fill={highlight} />

      {/* Eyes */}
      {renderEyes([{ cx: 52, cy: 36 }, { cx: 76, cy: 36 }])}
    </g>
  )

  // 7. MINOTAUR GBA LeafGreen Sprite
  const renderMinotaur = () => (
    <g id="minotaur-sprite">
      {/* Massive Bull Horns */}
      <path d="M 32 30 Q 8 10 24 4 Q 38 2 44 24 Z" fill={outline} />
      <path d="M 32 30 Q 12 14 26 8 Q 36 6 42 22 Z" fill={highlight} />
      <path d="M 96 30 Q 120 10 104 4 Q 90 2 84 24 Z" fill={outline} />
      <path d="M 96 30 Q 116 14 102 8 Q 92 6 86 22 Z" fill={highlight} />

      {/* Broad Shoulders & Body */}
      <rect x="26" y="54" width="76" height="52" rx="12" fill={outline} />
      <rect x="29" y="57" width="70" height="46" rx="10" fill={shade} />
      <rect x="42" y="64" width="44" height="32" rx="8" fill={main} />

      {/* Bull Head */}
      <rect x="36" y="22" width="56" height="42" rx="12" fill={outline} />
      <rect x="39" y="25" width="50" height="36" rx="10" fill={main} />

      {/* Snout & Ring */}
      <rect x="48" y="46" width="32" height="16" rx="6" fill={highlight} stroke={outline} strokeWidth="2.5" />
      <circle cx="64" cy="62" r="5" fill="none" stroke={outline} strokeWidth="3" />

      {/* Eyes */}
      {renderEyes([{ cx: 50, cy: 36 }, { cx: 78, cy: 36 }])}
    </g>
  )

  // 8. CHIMERA GBA LeafGreen Sprite
  const renderChimera = () => (
    <g id="chimera-sprite">
      {/* Serpent Tail */}
      <path d="M 80 90 Q 110 100 110 80 Q 110 60 120 54" stroke={outline} strokeWidth="7" fill="none" strokeLinecap="square" />
      <path d="M 80 90 Q 110 100 110 80 Q 110 60 120 54" stroke={main} strokeWidth="4" fill="none" strokeLinecap="square" />
      <polygon points="120,54 126,48 124,58" fill={highlight} stroke={outline} strokeWidth="2" />

      {/* Goat Horn (Secondary Head) */}
      <path d="M 82 24 Q 96 10 84 4 Z" fill={outline} />
      <path d="M 82 24 Q 92 12 84 6 Z" fill={highlight} />

      {/* Main Lion Body */}
      <rect x="32" y="56" width="64" height="48" rx="14" fill={outline} />
      <rect x="35" y="59" width="58" height="42" rx="12" fill={shade} />

      {/* Mane */}
      <circle cx="64" cy="42" r="30" fill={outline} />
      <circle cx="64" cy="42" r="26" fill={main} />

      {/* Lion Face */}
      <circle cx="64" cy="44" r="18" fill={highlight} stroke={outline} strokeWidth="2" />
      <polygon points="64,52 58,46 70,46" fill={outline} />

      {/* Eyes */}
      {renderEyes([{ cx: 54, cy: 38 }, { cx: 74, cy: 38 }])}
    </g>
  )

  const renderSprite = () => {
    switch (normSpecies) {
      case 'Owlbear':
        return renderOwlbear()
      case 'Wyrmling':
        return renderWyrmling()
      case 'Strix-Wolf':
        return renderStrixWolf()
      case 'Intellect Devourer':
        return renderIntellectDevourer()
      case 'Gelatinous Cube':
        return renderGelatinousCube()
      case 'Phoenix':
        return renderPhoenix()
      case 'Minotaur':
        return renderMinotaur()
      case 'Chimera':
        return renderChimera()
      default:
        return renderOwlbear()
    }
  }

  return (
    <div className={`relative flex items-center justify-center shrink-0 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        className="overflow-visible"
        shapeRendering="geometricPrecision"
      >
        {/* Retro Pokemon GBA Grass/Battle Base Oval */}
        <ellipse cx="64" cy="112" rx="52" ry="12" fill={outline} />
        <ellipse cx="64" cy="112" rx="48" ry="9" fill={shade} />
        <ellipse cx="64" cy="112" rx="40" ry="6" fill={main} />

        {/* Pet Sprite Graphics */}
        {renderSprite()}

        {/* Mood Status Emblem */}
        {renderMoodStatusIcon()}
      </svg>
    </div>
  )
}
