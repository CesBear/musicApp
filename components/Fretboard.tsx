"use client"

import FretboardNeck from "@/components/FretboardNeck"
import {
  GUITAR_TUNING, GUITAR_TUNING_MIDI, DEGREE_COLORS,
  getIntervalLabel,
} from "@/data/scales"

type DisplayMode = "notes" | "intervals" | "degrees"

interface FretboardProps {
  rootIdx:         number
  intervals:       number[]
  position?:       { startFret: number; endFret: number } | null
  displayMode?:    DisplayMode
  focusMode?:      boolean
  highlightNotes?: Set<number> | null
  activeStrings?:  Set<number> | null   // triad string-set filter (indices 0-5, low E=0)
  emphasizeNotes?: Set<number> | null   // notas objetivo: se resaltan y el resto de la escala queda tenue
  onNoteClick?:    (n: { semi: number; fret: number; string: number; midi: number }) => void
}

export default function Fretboard({
  rootIdx, intervals,
  position = null,
  displayMode = "notes",
  focusMode = false,
  highlightNotes = null,
  activeStrings = null,
  emphasizeNotes = null,
  onNoteClick,
}: FretboardProps) {
  const R = 13.5
  const scaleSet = new Set(intervals.map(i => (rootIdx + i) % 12))

  return (
    <FretboardNeck
      numFrets={24}
      activeStrings={activeStrings}
      underlay={position ? ({ sx, sy, FW, SS }) => (
        <rect
          x={sx(position.startFret) - FW + 3}
          y={sy(5) - SS * 0.5}
          width={(position.endFret - position.startFret + 1) * FW - 6}
          height={5 * SS + SS}
          rx={8} fill="rgba(255,255,255,0.07)" stroke="oklch(0.80 0.15 70 / 0.45)" strokeWidth={1} />
      ) : undefined}
    >
      {({ sy, noteX, noteShadow }) => (<>
        {/* Note dots */}
        {GUITAR_TUNING.map((openNote, s) =>
          Array.from({ length: 25 }).map((_, fret) => {
            const semi = (openNote + fret) % 12
            const norm = ((semi % 12) + 12) % 12
            if (!scaleSet.has(norm)) return null

            const isRoot      = norm === ((rootIdx % 12) + 12) % 12
            const inPos       = !position || (fret >= position.startFret && fret <= position.endFret)
            const inChord     = !highlightNotes || highlightNotes.has(norm)
            const inStringSet = !activeStrings || activeStrings.has(s)

            let opacity = 1
            if (!inStringSet) opacity = 0
            else if (focusMode && !inPos) opacity = 0
            else if (!inPos) opacity = 0.14
            if (highlightNotes && !inChord) opacity = Math.min(opacity, 0.08)
            const emphasized = !!emphasizeNotes?.has(norm)
            if (emphasizeNotes && !emphasized) opacity = Math.min(opacity, 0.32)
            if (opacity === 0) return null

            const x = noteX(fret)
            const y = sy(s)

            const degreeIdx = intervals.indexOf(((semi - rootIdx) % 12 + 12) % 12)
            const color = isRoot ? DEGREE_COLORS[0] : (degreeIdx >= 0 ? DEGREE_COLORS[degreeIdx] : "rgba(255,255,255,0.85)")

            const r = isRoot ? R + 1 : R
            const label = getIntervalLabel(semi, rootIdx, displayMode)

            return (
              <g key={`${s}-${fret}`} style={{ transition: "opacity 0.22s ease", cursor: onNoteClick ? "pointer" : "default" }} opacity={opacity}
                 onClick={() => onNoteClick?.({ semi, fret, string: s, midi: GUITAR_TUNING_MIDI[s] + fret })}>
                {isRoot && <circle cx={x} cy={y} r={r + 6} fill={DEGREE_COLORS[0]} opacity={0.18} />}
                {isRoot && (
                  <circle cx={x} cy={y} r={r + 3} fill="none"
                    stroke={DEGREE_COLORS[0]} strokeWidth={1.2} opacity={0.55} />
                )}
                <circle cx={x} cy={y} r={r} fill={color} filter={`url(#${noteShadow})`} />
                {emphasized && <circle cx={x} cy={y} r={r + 2.5} fill="none" stroke="#fff" strokeWidth={2} opacity={0.9} />}
                <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle"
                  fontSize={label.length > 1 ? 9.5 : 11}
                  fontWeight="700" fill="#0c0a08"
                  style={{ fontFamily: "var(--font-mono)", pointerEvents: "none", userSelect: "none", letterSpacing: "-0.02em" }}>
                  {label}
                </text>
              </g>
            )
          })
        )}
      </>)}
    </FretboardNeck>
  )
}
