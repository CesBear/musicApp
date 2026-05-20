"use client"

import { useState, useMemo } from "react"
import { NOTE_NAMES, GUITAR_TUNING, DEGREE_COLORS } from "@/data/scales"

// ─── Music theory types ──────────────────────────────────────────────────────

type Quality = "major" | "minor" | "dim" | "aug"
type Inversion = 0 | 1 | 2   // 0=root, 1=1st (3rd in bass), 2=2nd (5th in bass)

interface TriadShape {
  strings:   [number, number, number]  // string indices low→high pitch
  frets:     [number, number, number]  // fret on each string
  notes:     [number, number, number]  // semitone on each string
  inversion: Inversion
  id:        string
}

const QUALITIES: { label: string; value: Quality; intervals: [number, number, number]; symbol: string }[] = [
  { label: "Mayor",       value: "major", intervals: [0, 4, 7], symbol: ""    },
  { label: "Menor",       value: "minor", intervals: [0, 3, 7], symbol: "m"   },
  { label: "Disminuida",  value: "dim",   intervals: [0, 3, 6], symbol: "°"   },
  { label: "Aumentada",   value: "aug",   intervals: [0, 4, 8], symbol: "+"   },
]

const STRING_SETS: { label: string; name: string; strings: [number, number, number] }[] = [
  { label: "e · B · G",  name: "Cuerdas 1–3", strings: [5, 4, 3] },
  { label: "B · G · D",  name: "Cuerdas 2–4", strings: [4, 3, 2] },
  { label: "G · D · A",  name: "Cuerdas 3–5", strings: [3, 2, 1] },
  { label: "D · A · E",  name: "Cuerdas 4–6", strings: [2, 1, 0] },
]

const STRING_LABELS = ["E", "A", "D", "G", "B", "e"]

const INV_COLORS = [
  DEGREE_COLORS[0],  // root position   → amber
  DEGREE_COLORS[1],  // 1st inversion   → sky
  DEGREE_COLORS[2],  // 2nd inversion   → emerald
]
const INV_LABELS = ["R", "1ª", "2ª"]
const INV_NAMES  = ["Posición de raíz", "1ª inversión (3ra en el bajo)", "2ª inversión (5ta en el bajo)"]

// ─── Shape finder ────────────────────────────────────────────────────────────

function fretsForNote(target: number, openNote: number): number[] {
  const frets: number[] = []
  let f = ((target - openNote) % 12 + 12) % 12
  while (f <= 22) { frets.push(f); f += 12 }
  return frets
}

function findShapes(root: number, intervals: [number, number, number], strings: [number, number, number]): TriadShape[] {
  // Sort strings by pitch (ascending = lower number = lower pitch)
  const sorted = [...strings].sort((a, b) => a - b) as [number, number, number]
  const triadNotes = intervals.map(i => (root + i) % 12) as [number, number, number]
  const shapes: TriadShape[] = []
  const seen = new Set<string>()

  // Try all 6 permutations assigning [root, 3rd, 5th] to [s0, s1, s2]
  const perms: [number, number, number][] = [
    [0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]
  ]

  for (const perm of perms) {
    const notePerString = perm.map(p => triadNotes[p]) as [number, number, number]
    const fretsPerString = sorted.map((s, i) => fretsForNote(notePerString[i], GUITAR_TUNING[s]))

    for (const f0 of fretsPerString[0]) {
      for (const f1 of fretsPerString[1]) {
        for (const f2 of fretsPerString[2]) {
          const mn = Math.min(f0, f1, f2)
          const mx = Math.max(f0, f1, f2)
          if (mx - mn > 4) continue

          const id = `${f0}-${f1}-${f2}`
          if (seen.has(id)) continue
          seen.add(id)

          // Inversion = what interval is on the bass string (sorted[0] = lowest pitch)
          const inversion = perm[0] as Inversion

          shapes.push({
            strings: sorted,
            frets: [f0, f1, f2],
            notes: notePerString,
            inversion,
            id,
          })
        }
      }
    }
  }

  return shapes.sort((a, b) => Math.min(...a.frets) - Math.min(...b.frets))
}

// ─── Triad Neck SVG ──────────────────────────────────────────────────────────

const NUM_FRETS = 22
const FW = 50
const SS = 36   // spacing for 6 strings
const LM = 28
const TM = 22
const BM = 34
const LW = 26
const R  = 12

const W = LW + LM + NUM_FRETS * FW + 12
const H = TM + 5 * SS + BM   // 6 strings

const SINGLE_DOTS = [3, 5, 7, 9, 15, 17, 19, 21]
const DOUBLE_DOT  = 12
const STRING_WIDTHS = [2.6, 2.1, 1.7, 1.3, 1.0, 0.85]

function TriadNeck({ shapes, strings, root }: {
  shapes: TriadShape[]
  strings: [number, number, number]
  root: number
}) {
  const activeSet = new Set(strings)

  // Standard tab orientation: string index 5 (e) at top, 0 (E) at bottom
  const sx = (fret: number) => LW + LM + fret * FW
  const sy = (str: number)  => TM + (5 - str) * SS

  return (
    <div className="mc-fretboard-wrap" style={{ overflowX: "auto" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ minWidth: W, display: "block" }}>
        <defs>
          <linearGradient id="triNut" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.32)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0.18)"/>
          </linearGradient>
        </defs>

        {/* String labels — all 6 */}
        {[0,1,2,3,4,5].map(s => {
          const isActive = activeSet.has(s)
          return (
            <text key={s} x={LW / 2} y={sy(s)} textAnchor="middle" dominantBaseline="middle"
              fontSize={10} fontWeight="600"
              fill={isActive ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.18)"}
              style={{ fontFamily: "var(--font-mono)" }}>
              {STRING_LABELS[s]}
            </text>
          )
        })}

        {/* Nut */}
        <rect x={LW + LM - 5} y={TM - SS * 0.4} width={5}
          height={5 * SS + SS * 0.8} rx={2.5} fill="url(#triNut)" />

        {/* Fret lines */}
        {Array.from({ length: NUM_FRETS }).map((_, f) => {
          const isOct = f + 1 === 12
          return (
            <line key={f}
              x1={sx(f+1)} y1={TM - SS * 0.36}
              x2={sx(f+1)} y2={sy(0) + SS * 0.36}
              stroke={isOct ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.05)"}
              strokeWidth={isOct ? 1.5 : 1} />
          )
        })}

        {/* String lines — all 6, active ones brighter */}
        {[0,1,2,3,4,5].map(s => {
          const isActive = activeSet.has(s)
          return (
            <line key={s}
              x1={LW + LM} y1={sy(s)} x2={sx(NUM_FRETS)} y2={sy(s)}
              stroke={isActive ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.04)"}
              strokeWidth={isActive ? STRING_WIDTHS[s] : 0.6} />
          )
        })}

        {/* Inlays */}
        {SINGLE_DOTS.filter(f => f <= NUM_FRETS).map(f => (
          <circle key={f} cx={sx(f) - FW/2} cy={TM + 2.5 * SS} r={3.5} fill="rgba(255,255,255,0.09)" />
        ))}
        {DOUBLE_DOT <= NUM_FRETS && (
          <>
            <circle cx={sx(DOUBLE_DOT) - FW/2} cy={TM + 1.5 * SS} r={3.5} fill="rgba(255,255,255,0.13)" />
            <circle cx={sx(DOUBLE_DOT) - FW/2} cy={TM + 3.5 * SS} r={3.5} fill="rgba(255,255,255,0.13)" />
          </>
        )}

        {/* Fret numbers */}
        {[3,5,7,9,12,15,17,19,21].filter(f => f <= NUM_FRETS).map(f => (
          <text key={f} x={sx(f) - FW/2} y={H - 12} textAnchor="middle"
            fontSize={9} fill={f === 12 ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.22)"}
            fontWeight={f === 12 ? "700" : "400"}
            style={{ fontFamily: "var(--font-mono)" }}>
            {f}
          </text>
        ))}

        {/* Triad shapes — only on active strings */}
        {shapes.map(shape => {
          const color = INV_COLORS[shape.inversion]
          const sorted = [...shape.strings].sort((a, b) => a - b) as [number,number,number]

          // xs and ys for each string in sorted order
          const xs = sorted.map((_, i) => {
            const f = shape.frets[i]
            return f === 0 ? LW + LM - FW * 0.5 : sx(f) - FW / 2
          })
          const ys = sorted.map(s => sy(s))

          // Thin vertical connector line (no fill rect)
          const minY = Math.min(...ys)
          const maxY = Math.max(...ys)
          const lineX = (Math.min(...xs) + Math.max(...xs)) / 2

          return (
            <g key={shape.id}>
              {/* Connector line */}
              <line x1={lineX} y1={minY} x2={lineX} y2={maxY}
                stroke={color} strokeWidth={1.5} opacity={0.25} strokeDasharray="3 2" />

              {/* Note circles */}
              {sorted.map((s, i) => {
                const x = xs[i]
                const y = ys[i]
                const isRoot = shape.notes[i] === (root % 12)
                return (
                  <g key={s}>
                    {isRoot && (
                      <circle cx={x} cy={y} r={R + 3} fill="none"
                        stroke={color} strokeWidth={1.2} opacity={0.5} />
                    )}
                    <circle cx={x} cy={y} r={R} fill={color} />
                    <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle"
                      fontSize={NOTE_NAMES[shape.notes[i]].length > 1 ? 7.5 : 9.5}
                      fontWeight="700" fill="#0a0806"
                      style={{ fontFamily: "var(--font-mono)", pointerEvents: "none", userSelect: "none" }}>
                      {NOTE_NAMES[shape.notes[i]]}
                    </text>
                  </g>
                )
              })}

              {/* Inversion badge above the top note */}
              <text x={xs[sorted.length - 1]} y={minY - R - 5}
                textAnchor="middle" fontSize={8} fontWeight="700"
                fill={color} opacity={0.8}
                style={{ fontFamily: "var(--font-mono)", pointerEvents: "none" }}>
                {INV_LABELS[shape.inversion]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TriadasPage() {
  const [rootIdx,    setRootIdx]    = useState(9)         // A
  const [quality,    setQuality]    = useState<Quality>("major")
  const [setIdx,     setSetIdx]     = useState(0)

  const qDef      = QUALITIES.find(q => q.value === quality)!
  const stringSet = STRING_SETS[setIdx]
  const shapes    = useMemo(
    () => findShapes(rootIdx, qDef.intervals, stringSet.strings),
    [rootIdx, quality, setIdx]
  )

  const rootNote  = NOTE_NAMES[rootIdx]
  const chordName = `${rootNote}${qDef.symbol}`

  return (
    <div className="flex flex-col gap-8">

      {/* Hero */}
      <div className="mc-hero">
        <div>
          <div className="mc-eyebrow">Estudio · Tríadas</div>
          <h1 className="mc-h1">
            <span style={{ color: DEGREE_COLORS[0] }}>{rootNote}</span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontStyle: "italic" }}>
              {qDef.symbol ? " " + qDef.label.toLowerCase() : " mayor"}
            </span>
          </h1>
          <p className="mc-lede">
            Todas las posiciones e inversiones de la tríada en el mástil.
          </p>
          <div className="mc-meta-row">
            <span className="mc-mono-tag">{qDef.intervals.join(" · ")} semitonos</span>
            <span className="mc-meta-sep">·</span>
            <span className="mc-meta-text">{shapes.length} posiciones en {stringSet.name}</span>
          </div>
        </div>
      </div>

      {/* Root selector */}
      <div className="mc-section">
        <div className="mc-section-head">
          <span className="mc-eyebrow">Nota raíz</span>
        </div>
        <div className="mc-note-row">
          {NOTE_NAMES.map((n, i) => (
            <button key={n} onClick={() => setRootIdx(i)}
              className={`mc-note-pill ${rootIdx === i ? "active" : ""}`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Quality selector */}
      <div className="mc-section">
        <div className="mc-section-head">
          <span className="mc-eyebrow">Tipo de tríada</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {QUALITIES.map(q => (
            <button key={q.value} onClick={() => setQuality(q.value)}
              className={`mc-chord-type ${quality === q.value ? "active" : ""}`}
              style={{ minWidth: 130 }}>
              <span className="mc-chord-type-label">{q.label}</span>
              <span className="mc-chord-type-formula">
                {q.intervals.map(i => i === 0 ? "R" : `+${i}`).join(" · ")}
              </span>
            </button>
          ))}
        </div>

        {/* Symmetry notes */}
        {quality === "aug" && (
          <div className="mc-info-card mc-info-card-quiet" style={{ marginTop: 12 }}>
            <p className="mc-info-label">Tríada simétrica</p>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginTop: 6 }}>
              La tríada aumentada está formada por <strong style={{ color: "rgba(255,255,255,0.8)" }}>3 terceras mayores iguales</strong> (4+4+4 semitonos).
              Esto hace que <strong style={{ color: "rgba(255,255,255,0.8)" }}>C+, E+ y Ab+</strong> contengan exactamente las mismas notas.
              Todas sus inversiones tienen la misma forma geométrica en el mástil — solo cambia el traste de inicio.
            </p>
          </div>
        )}
        {quality === "dim" && (
          <div className="mc-info-card mc-info-card-quiet" style={{ marginTop: 12 }}>
            <p className="mc-info-label">Tríada simétrica</p>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginTop: 6 }}>
              La tríada disminuida está formada por <strong style={{ color: "rgba(255,255,255,0.8)" }}>2 terceras menores apiladas</strong> (3+3 semitonos).
              Esto hace que <strong style={{ color: "rgba(255,255,255,0.8)" }}>C°, Eb° y F#°</strong> contengan las mismas notas.
              La nota raíz que elijas determina cuál es la inversión, pero los shapes en el mástil se repiten cada 3 trastes.
            </p>
          </div>
        )}
      </div>

      {/* String set selector */}
      <div className="mc-section">
        <div className="mc-section-head">
          <span className="mc-eyebrow">Grupo de cuerdas</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STRING_SETS.map((ss, i) => (
            <button key={ss.label} onClick={() => setSetIdx(i)}
              className={`mc-pos-chip ${setIdx === i ? "active" : ""}`}
              style={{ fontSize: 13, padding: "8px 16px" }}>
              {ss.label}
              <span className="mc-pos-range">{ss.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fretboard */}
      <div className="mc-section">
        <div className="mc-section-head">
          <span className="mc-eyebrow">Posiciones en el mástil — {stringSet.label}</span>
          <span className="mc-section-hint">{shapes.length} formas</span>
        </div>

        <TriadNeck shapes={shapes} strings={stringSet.strings} root={rootIdx} />

        {/* Inversion legend */}
        <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
          {[0, 1, 2].map(inv => (
            <div key={inv} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 14,
                background: INV_COLORS[inv],
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: "#0a0806",
                fontFamily: "var(--font-mono)",
              }}>
                {INV_LABELS[inv]}
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                {INV_NAMES[inv]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* All positions table */}
      <div className="mc-section">
        <div className="mc-section-head">
          <span className="mc-eyebrow">Tabla de posiciones</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="mc-table">
            <thead>
              <tr>
                <th>Inversión</th>
                <th>{STRING_LABELS[stringSet.strings[2]]} (1ra)</th>
                <th>{STRING_LABELS[stringSet.strings[1]]} (2da)</th>
                <th>{STRING_LABELS[stringSet.strings[0]]} (3ra)</th>
                <th>Notas</th>
                <th>Posición</th>
              </tr>
            </thead>
            <tbody>
              {shapes.map(s => {
                const sorted = [...s.strings].sort((a, b) => a - b) as [number,number,number]
                const fromHighest = [...sorted].reverse()
                const fretForStr = (str: number) => s.frets[sorted.indexOf(str)]
                const fret = (str: number) => {
                  const f = fretForStr(str)
                  return f === 0 ? "○" : String(f)
                }
                return (
                  <tr key={s.id}>
                    <td>
                      <span style={{ color: INV_COLORS[s.inversion], fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        {INV_LABELS[s.inversion]}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginLeft: 8 }}>
                        {["Raíz","3ra","5ta"][s.inversion]} en bajo
                      </span>
                    </td>
                    {fromHighest.map(str => (
                      <td key={str}>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                          {fret(str)}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginLeft: 6 }}>
                          {NOTE_NAMES[s.notes[sorted.indexOf(str)]]}
                        </span>
                      </td>
                    ))}
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                        {[...new Set(s.notes.map(n => NOTE_NAMES[n]))].join(" · ")}
                      </span>
                    </td>
                    <td>
                      <span className="mc-mono-tag">
                        tr. {Math.min(...s.frets)}–{Math.max(...s.frets)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
