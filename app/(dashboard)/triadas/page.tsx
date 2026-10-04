"use client"

import { useState, useMemo } from "react"
import FretboardNeck from "@/components/FretboardNeck"
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

const R = 12.5

function TriadNeck({ shapes, strings, root }: {
  shapes: TriadShape[]
  strings: [number, number, number]
  root: number
}) {
  return (
    <FretboardNeck numFrets={22} activeStrings={new Set(strings)}>
      {({ sy, noteX, noteShadow }) => shapes.map(shape => {
        const color = INV_COLORS[shape.inversion]
        const sorted = [...shape.strings].sort((a, b) => a - b) as [number, number, number]

        const xs = sorted.map((_, i) => noteX(shape.frets[i]))
        const ys = sorted.map(s => sy(s))

        // Conector vertical punteado entre las tres notas de la forma
        const minY  = Math.min(...ys)
        const maxY  = Math.max(...ys)
        const lineX = (Math.min(...xs) + Math.max(...xs)) / 2

        return (
          <g key={shape.id}>
            <line x1={lineX} y1={minY} x2={lineX} y2={maxY}
              stroke={color} strokeWidth={1.5} opacity={0.5} strokeDasharray="3 2" />

            {sorted.map((s, i) => {
              const x = xs[i]
              const y = ys[i]
              const isRoot = shape.notes[i] === (root % 12)
              return (
                <g key={s}>
                  {isRoot && (
                    <circle cx={x} cy={y} r={R + 3} fill="none"
                      stroke={color} strokeWidth={1.4} opacity={0.75} />
                  )}
                  <circle cx={x} cy={y} r={R} fill={color} filter={`url(#${noteShadow})`} />
                  <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle"
                    fontSize={NOTE_NAMES[shape.notes[i]].length > 1 ? 9 : 10.5}
                    fontWeight="700" fill="#0a0806"
                    style={{ fontFamily: "var(--font-mono)", pointerEvents: "none", userSelect: "none" }}>
                    {NOTE_NAMES[shape.notes[i]]}
                  </text>
                </g>
              )
            })}

            {/* Badge de inversión sobre la nota superior */}
            <text x={xs[sorted.length - 1]} y={minY - R - 6}
              textAnchor="middle" fontSize={10} fontWeight="700" fill={color}
              style={{ fontFamily: "var(--font-mono)", pointerEvents: "none" }}>
              {INV_LABELS[shape.inversion]}
            </text>
          </g>
        )
      })}
    </FretboardNeck>
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
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.673)", lineHeight: 1.6, marginTop: 6 }}>
              La tríada aumentada está formada por <strong style={{ color: "rgba(255,255,255,0.86)" }}>3 terceras mayores iguales</strong> (4+4+4 semitonos).
              Esto hace que <strong style={{ color: "rgba(255,255,255,0.86)" }}>C+, E+ y Ab+</strong> contengan exactamente las mismas notas.
              Todas sus inversiones tienen la misma forma geométrica en el mástil — solo cambia el traste de inicio.
            </p>
          </div>
        )}
        {quality === "dim" && (
          <div className="mc-info-card mc-info-card-quiet" style={{ marginTop: 12 }}>
            <p className="mc-info-label">Tríada simétrica</p>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.673)", lineHeight: 1.6, marginTop: 6 }}>
              La tríada disminuida está formada por <strong style={{ color: "rgba(255,255,255,0.86)" }}>2 terceras menores apiladas</strong> (3+3 semitonos).
              Esto hace que <strong style={{ color: "rgba(255,255,255,0.86)" }}>C°, Eb° y F#°</strong> contengan las mismas notas.
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
                fontSize: 11, fontWeight: 700, color: "#0a0806",
                fontFamily: "var(--font-mono)",
              }}>
                {INV_LABELS[inv]}
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.64)" }}>
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
                      <span style={{ color: "rgba(255,255,255,0.56)", fontSize: 11, marginLeft: 8 }}>
                        {["Raíz","3ra","5ta"][s.inversion]} en bajo
                      </span>
                    </td>
                    {fromHighest.map(str => (
                      <td key={str}>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                          {fret(str)}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.505)", fontSize: 11, marginLeft: 6 }}>
                          {NOTE_NAMES[s.notes[sorted.indexOf(str)]]}
                        </span>
                      </td>
                    ))}
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,255,255,0.74)" }}>
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
