"use client"

import { staffPos, type Clef, type Note } from "@/data/solfeo"

// Pentagrama en SVG: clave de sol, de fa o gran pentagrama, con cabezas de nota,
// plicas, líneas adicionales y alteraciones. Las claves usan la fuente Noto Music.

export interface StaffItem {
  note:   Note
  clef?:  Clef            // solo en gran pentagrama: en qué pentagrama va
  label?: string
  color?: string
  stem?:  boolean         // default true
}

interface Props {
  clef:       Clef | "grand" | "none"
  items:      StaffItem[]
  gap?:       number       // separación entre líneas
  spacing?:   number       // separación horizontal entre notas
  numbering?: boolean      // numera líneas y espacios (lección del pentagrama)
  minWidth?:  number
}

const INK = "rgba(255,255,255,0.86)"
const LINE = "rgba(255,255,255,0.55)"

export default function Staff({ clef, items, gap = 12, spacing = 46, numbering = false, minWidth = 0 }: Props) {
  const G = gap
  const top = G * 4.5                                   // aire para 3–4 líneas adicionales arriba
  const staffH = G * 4
  const between = G * 5                                 // separación entre pentagramas (gran pentagrama)
  const grand = clef === "grand"
  const bottomOf = (c: Clef) => grand ? (c === "treble" ? top + staffH : top + staffH * 2 + between) : top + staffH
  const H = (grand ? top + staffH * 2 + between : top + staffH) + G * 5.2

  const x0 = clef === "none" ? 26 : 70
  const W = Math.max(minWidth, x0 + Math.max(items.length, 1) * spacing + (numbering ? 120 : 24))
  const yOf = (pos: number, c: Clef) => bottomOf(c) - pos * (G / 2)

  const staves: Clef[] = grand ? ["treble", "bass"] : ["treble"]

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", maxWidth: W, minWidth: Math.min(W, 280) }} role="img"
      aria-label="Pentagrama">
      {staves.map(st => {
        const c: Clef = grand ? st : clef === "bass" ? "bass" : "treble"
        return (
          <g key={st}>
            {[0, 2, 4, 6, 8].map(p => (
              <line key={p} x1={8} x2={W - 8} y1={yOf(p, c)} y2={yOf(p, c)} stroke={LINE} strokeWidth={1.2} />
            ))}
            {clef !== "none" && (
              // Noto Music: el origen de la clave de sol cae en la línea de Sol; el de la
              // clave de fa queda ~2.3 líneas por encima, así que se compensa
              <text x={14} y={c === "treble" ? yOf(2, c) + G * 0.25 : yOf(6, c) + G * 2.35} fill={INK}
                fontSize={c === "treble" ? G * 4.1 : G * 3.9}
                style={{ fontFamily: "var(--font-music)" }}>
                {c === "treble" ? "\u{1D11E}" : "\u{1D122}"}
              </text>
            )}
            {numbering && [0, 2, 4, 6, 8].map((p, i) => (
              <text key={`l${p}`} x={W - 104} y={yOf(p, c) + 4} fontSize={11.5} fill="oklch(0.80 0.15 70)"
                style={{ fontFamily: "var(--font-mono)" }}>{i + 1}ª línea</text>
            ))}
            {numbering && [1, 3, 5, 7].map((p, i) => (
              <text key={`s${p}`} x={W - 64} y={yOf(p, c) + 4} fontSize={11.5} fill="oklch(0.78 0.12 240)"
                style={{ fontFamily: "var(--font-mono)" }}>{i + 1}º esp.</text>
            ))}
          </g>
        )
      })}
      {grand && (
        <>
          <line x1={8} x2={8} y1={yOf(8, "treble")} y2={yOf(0, "bass")} stroke={LINE} strokeWidth={1.6} />
          <path d={`M 4 ${yOf(8, "treble")} Q -6 ${(yOf(8, "treble") + yOf(0, "bass")) / 2} 4 ${yOf(0, "bass")}`} fill="none" stroke={LINE} strokeWidth={1.2} />
        </>
      )}

      {items.map((it, i) => {
        const c: Clef = grand ? (it.clef ?? "treble") : clef === "bass" ? "bass" : "treble"
        const pos = staffPos(it.note, c)
        const x = x0 + i * spacing + spacing / 2
        const y = yOf(pos, c)
        const color = it.color ?? INK
        const ledgers: number[] = []
        for (let p = -2; p >= pos; p -= 2) ledgers.push(p)
        for (let p = 10; p <= pos; p += 2) ledgers.push(p)
        const stemUp = pos < 4
        const showStem = it.stem !== false
        return (
          <g key={i}>
            {ledgers.map(p => (
              <line key={p} x1={x - G * 1.05} x2={x + G * 1.05} y1={yOf(p, c)} y2={yOf(p, c)} stroke={LINE} strokeWidth={1.2} />
            ))}
            {it.note.acc !== 0 && (
              <text x={x - G * 1.55} y={y + G * (it.note.acc === -1 ? 0.3 : 0.42)} textAnchor="middle" fill={color}
                fontSize={G * (it.note.acc === -1 ? 1.9 : 1.7)} style={{ fontFamily: "var(--font-music)" }}>
                {it.note.acc === 1 ? "♯" : "♭"}
              </text>
            )}
            <ellipse cx={x} cy={y} rx={G * 0.62} ry={G * 0.44} transform={`rotate(-20 ${x} ${y})`} fill={color} />
            {showStem && (
              stemUp
                ? <line x1={x + G * 0.56} x2={x + G * 0.56} y1={y - 1} y2={y - G * 3.3} stroke={color} strokeWidth={1.4} />
                : <line x1={x - G * 0.56} x2={x - G * 0.56} y1={y + 1} y2={y + G * 3.3} stroke={color} strokeWidth={1.4} />
            )}
            {it.label && (
              <text x={x} y={H - G * 1.2} textAnchor="middle" fontSize={12.5} fontWeight={600} fill={color}
                style={{ fontFamily: "var(--font-mono)" }}>{it.label}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
