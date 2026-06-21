"use client"

import {
  GUITAR_TUNING, GUITAR_TUNING_MIDI, STRING_LABELS, DEGREE_COLORS,
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
  onNoteClick?:    (n: { semi: number; fret: number; string: number; midi: number }) => void
}

export default function Fretboard({
  rootIdx, intervals,
  position = null,
  displayMode = "notes",
  focusMode = false,
  highlightNotes = null,
  activeStrings = null,
  onNoteClick,
}: FretboardProps) {
  const NUM_FRETS = 24
  const SS = 38
  const FW = 50
  const LM = 32
  const TM = 28
  const BM = 38
  const LW = 26
  const R  = 13.5

  const W = LW + LM + NUM_FRETS * FW + 14
  const H = TM + 5 * SS + BM

  const scaleSet = new Set(intervals.map(i => (rootIdx + i) % 12))
  const sx = (fret: number) => LW + LM + fret * FW
  const sy = (str: number) => TM + (5 - str) * SS  // high e at top

  const SINGLE_DOTS = [3, 5, 7, 9, 15, 17, 19, 21]
  const DOUBLE_DOTS = [12, 24]

  return (
    <div className="mc-fretboard-wrap">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ minWidth: W, display: "block" }}>
        <defs>
          <linearGradient id="nutGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.32)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0.18)"/>
          </linearGradient>
          <radialGradient id="rootGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="oklch(0.80 0.15 70)" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="oklch(0.80 0.15 70)" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* String labels */}
        {GUITAR_TUNING.map((_, s) => (
          <text key={s} x={LW / 2} y={sy(s)} textAnchor="middle" dominantBaseline="middle"
            fontSize={10} fontWeight="600" fill="rgba(255,255,255,0.25)"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
            {STRING_LABELS[s]}
          </text>
        ))}

        {/* Position highlight */}
        {position && (
          <rect
            x={sx(position.startFret) - FW / 2 + 3}
            y={TM - SS * 0.5}
            width={(position.endFret - position.startFret + 1) * FW - 6}
            height={5 * SS + SS}
            rx={10} fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        )}

        {/* Nut */}
        <rect x={LW + LM - 5} y={TM - SS * 0.5} width={5}
          height={5 * SS + SS} rx={2.5} fill="url(#nutGrad)" />

        {/* Fret lines */}
        {Array.from({ length: NUM_FRETS }).map((_, f) => {
          const isOctave = f + 1 === 12 || f + 1 === 24
          return (
            <line key={f}
              x1={sx(f + 1)} y1={TM - SS * 0.42}
              x2={sx(f + 1)} y2={sy(5) + SS * 0.42}
              stroke={isOctave ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.05)"}
              strokeWidth={isOctave ? 1.5 : 1} />
          )
        })}

        {/* String lines */}
        {GUITAR_TUNING.map((_, s) => {
          const isActive = !activeStrings || activeStrings.has(s)
          return (
            <line key={s}
              x1={LW + LM} y1={sy(s)} x2={sx(NUM_FRETS)} y2={sy(s)}
              stroke={isActive ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.04)"}
              strokeWidth={isActive ? [2.6, 2.1, 1.7, 1.3, 1.0, 0.85][s] : 0.5}
              style={{ transition: "opacity 0.18s ease" }} />
          )
        })}

        {/* Inlays */}
        {SINGLE_DOTS.filter(f => f <= NUM_FRETS).map(f => (
          <circle key={f} cx={sx(f) - FW / 2} cy={TM + 2.5 * SS} r={3.6}
            fill="rgba(255,255,255,0.10)" />
        ))}
        {DOUBLE_DOTS.filter(f => f <= NUM_FRETS).map(f => (
          <g key={f}>
            <circle cx={sx(f) - FW / 2} cy={TM + 1.5 * SS} r={3.6} fill="rgba(255,255,255,0.15)" />
            <circle cx={sx(f) - FW / 2} cy={TM + 3.5 * SS} r={3.6} fill="rgba(255,255,255,0.15)" />
          </g>
        ))}

        {/* Fret numbers */}
        {[3,5,7,9,12,15,17,19,21,24].filter(f => f <= NUM_FRETS).map(f => {
          const isOctave = f === 12 || f === 24
          return (
            <text key={f} x={sx(f) - FW / 2} y={H - 14} textAnchor="middle"
              fontSize={9} fill={isOctave ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.22)"}
              fontWeight={isOctave ? "700" : "500"}
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
              {f}
            </text>
          )
        })}

        {/* Note dots */}
        {GUITAR_TUNING.map((openNote, s) =>
          Array.from({ length: NUM_FRETS + 1 }).map((_, fret) => {
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
            if (opacity === 0) return null

            const x = fret === 0 ? LW + LM - FW * 0.52 : sx(fret) - FW / 2
            const y = sy(s)

            const degreeIdx = intervals.indexOf(((semi - rootIdx) % 12 + 12) % 12)
            const color = isRoot ? DEGREE_COLORS[0] : (degreeIdx >= 0 ? DEGREE_COLORS[degreeIdx] : "rgba(255,255,255,0.85)")

            const r = isRoot ? R + 1 : R
            const label = getIntervalLabel(semi, rootIdx, displayMode)

            return (
              <g key={`${s}-${fret}`} style={{ transition: "opacity 0.22s ease", cursor: onNoteClick ? "pointer" : "default" }} opacity={opacity}
                 onClick={() => onNoteClick?.({ semi, fret, string: s, midi: GUITAR_TUNING_MIDI[s] + fret })}>
                {isRoot && <circle cx={x} cy={y} r={r + 5} fill="url(#rootGlow)" />}
                {isRoot && (
                  <circle cx={x} cy={y} r={r + 3} fill="none"
                    stroke={DEGREE_COLORS[0]} strokeWidth={1.2} opacity={0.55} />
                )}
                <circle cx={x} cy={y} r={r} fill={color} />
                <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle"
                  fontSize={label.length > 1 ? 8.5 : 10}
                  fontWeight="700" fill="#0c0a08"
                  style={{ fontFamily: "var(--font-mono)", pointerEvents: "none", userSelect: "none", letterSpacing: "-0.02em" }}>
                  {label}
                </text>
              </g>
            )
          })
        )}
      </svg>
    </div>
  )
}
