"use client"

import { useState } from "react"
import { ChordVoicing } from "@/data/chords"
import { DEGREE_COLORS } from "@/data/scales"

interface Props {
  voicing: ChordVoicing
  name: string
  symbol?: string
  size?: "xs" | "sm" | "md" | "lg"
  onPlay?: () => void
  onStringPlay?: (stringIdx: number, fret: number) => void
}

export default function ChordDiagram({ voicing, name, symbol = "", size = "lg", onPlay, onStringPlay }: Props) {
  const [hoveredStr, setHoveredStr] = useState<number | null>(null)
  const scale = size === "xs" ? 0.54 : size === "sm" ? 0.7 : size === "md" ? 0.88 : 1.05
  const SW = 150 * scale
  const SH = 195 * scale
  const SS = 22 * scale
  const FS = 28 * scale
  const LM = 22 * scale
  const TM = 36 * scale
  const R  = 8.5  * scale

  const stringX = (i: number) => LM + i * SS
  const fretY = (row: number) => TM + row * FS

  const activeFrets = voicing.frets.filter(f => f > 0)
  const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 1
  const baseFret = minFret <= 4 ? 1 : minFret
  const showFretNum = baseFret > 1
  const relFret = (abs: number) => abs - baseFret + 1

  const FINGER_COLORS = ["", DEGREE_COLORS[0], DEGREE_COLORS[1], DEGREE_COLORS[2], DEGREE_COLORS[3]]
  const gradId = `chordNut-${name.replace(/[^a-z0-9]/gi, "")}-${size}`

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="flex items-baseline gap-2 flex-wrap justify-center">
        <span style={{ fontFamily: "var(--font-display)", fontSize: 38 * scale, color: "#fff", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1 }}>{name}</span>
        {symbol && <span style={{ fontFamily: "var(--font-display)", fontSize: 22 * scale, color: "rgba(255,255,255,0.55)", fontStyle: "italic", lineHeight: 1 }}>{symbol}</span>}
        {baseFret > 5 && (
          <span style={{ fontSize: 10 * scale, fontFamily: "var(--font-mono)", letterSpacing: "0.08em", color: "oklch(0.80 0.14 40)", background: "oklch(0.80 0.14 40 / 0.12)", border: "1px solid oklch(0.80 0.14 40 / 0.25)", borderRadius: 4, padding: "2px 6px", alignSelf: "center" }}>
            AVANZADO
          </span>
        )}
      </div>

      <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0.45)"/>
          </linearGradient>
        </defs>

        {/* X / O markers above strings */}
        {voicing.frets.map((fret, i) => {
          if (fret !== -1 && fret !== 0) return null
          return (
            <g key={i}>
              {fret === 0 && (
                <circle cx={stringX(i)} cy={TM - 14 * scale} r={6 * scale}
                  fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.4 * scale}/>
              )}
              {fret === -1 && (
                <g>
                  <line x1={stringX(i) - 4.5*scale} y1={TM - 18*scale} x2={stringX(i) + 4.5*scale} y2={TM - 9*scale}
                    stroke="rgba(255,255,255,0.3)" strokeWidth={1.5*scale} strokeLinecap="round"/>
                  <line x1={stringX(i) + 4.5*scale} y1={TM - 18*scale} x2={stringX(i) - 4.5*scale} y2={TM - 9*scale}
                    stroke="rgba(255,255,255,0.3)" strokeWidth={1.5*scale} strokeLinecap="round"/>
                </g>
              )}
            </g>
          )
        })}

        {/* Nut or fret number */}
        {!showFretNum ? (
          <rect x={stringX(0) - 3*scale} y={TM - 3*scale} width={5 * SS + 6*scale} height={5 * scale}
            rx={2.5*scale} fill={`url(#${gradId})`} />
        ) : (
          <text x={stringX(0) - 10 * scale} y={fretY(1) - FS / 2} textAnchor="end" dominantBaseline="middle"
            fontSize={10 * scale} fill="rgba(255,255,255,0.5)" fontWeight="500"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
            {baseFret}fr
          </text>
        )}

        {/* Fret lines */}
        {[1,2,3,4].map(row => (
          <line key={row} x1={stringX(0)} y1={fretY(row)} x2={stringX(5)} y2={fretY(row)}
            stroke="rgba(255,255,255,0.13)" strokeWidth={1.1*scale} />
        ))}

        {/* String lines */}
        {[0,1,2,3,4,5].map(i => (
          <line key={i} x1={stringX(i)} y1={TM} x2={stringX(i)} y2={fretY(4)}
            stroke="rgba(255,255,255,0.24)" strokeWidth={(2.4 - i * 0.32) * scale} />
        ))}

        {/* Barre */}
        {voicing.barre && (() => {
          const row = relFret(voicing.barre.fret)
          if (row < 1 || row > 4) return null
          const y = fretY(row) - FS / 2
          const x1 = stringX(voicing.barre.from) - R
          const x2 = stringX(voicing.barre.to) + R
          const color = FINGER_COLORS[voicing.fingers[voicing.barre.from]] || "#fff"
          return <rect x={x1} y={y - R} width={x2 - x1} height={R * 2} rx={R} fill={color} opacity={0.92} />
        })()}

        {/* Finger dots */}
        {voicing.frets.map((fret, i) => {
          if (fret <= 0) return null
          const row = relFret(fret)
          if (row < 1 || row > 4) return null
          const isBarre = voicing.barre && fret === voicing.barre.fret && i >= voicing.barre.from && i <= voicing.barre.to
          if (isBarre) return null
          const x = stringX(i)
          const y = fretY(row) - FS / 2
          const color = FINGER_COLORS[voicing.fingers[i]] || "#fff"
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={R} fill={color} opacity={0.95} />
              {voicing.fingers[i] > 0 && (
                <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle"
                  fontSize={9 * scale} fontWeight="700" fill="#0c0a08"
                  style={{ fontFamily: "var(--font-mono)", pointerEvents: "none", letterSpacing: "-0.02em" }}>
                  {voicing.fingers[i]}
                </text>
              )}
            </g>
          )
        })}

        {/* Clickable string hit areas */}
        {onStringPlay && voicing.frets.map((fret, i) => {
          if (fret < 0) return null
          return (
            <rect
              key={`hit-${i}`}
              x={stringX(i) - SS / 2}
              y={0}
              width={SS}
              height={SH}
              rx={3 * scale}
              fill={hoveredStr === i ? "rgba(255,255,255,0.07)" : "transparent"}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredStr(i)}
              onMouseLeave={() => setHoveredStr(null)}
              onClick={() => onStringPlay(i, fret)}
            />
          )
        })}
      </svg>

      {onPlay && (
        <button onClick={onPlay} className="mc-btn-ghost" style={{ fontSize: 11, marginTop: 4, padding: "6px 12px" }}>
          ▷  Rasguear
        </button>
      )}
    </div>
  )
}
