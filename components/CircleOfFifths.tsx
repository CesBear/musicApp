"use client"

import { CIRCLE_NOTES } from "@/data/circle"

export type CircleSelection = {
  name: string
  kind: "major" | "minor"
  rootIdx: number
  sharps: number
  hue: number
}

interface Props {
  selected: CircleSelection | null
  onSelect: (s: CircleSelection | null) => void
}

export default function CircleOfFifths({ selected, onSelect }: Props) {
  const cx = 300, cy = 300
  const outerR = 268, midR = 188, innerR = 122

  const polar = (r: number, angleDeg: number) => {
    const a = ((angleDeg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  }
  const arcPath = (r1: number, r2: number, startAngle: number, endAngle: number) => {
    const s1 = polar(r2, startAngle)
    const e1 = polar(r2, endAngle)
    const s2 = polar(r1, endAngle)
    const e2 = polar(r1, startAngle)
    return `M ${s1.x} ${s1.y} A ${r2} ${r2} 0 0 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${r1} ${r1} 0 0 0 ${e2.x} ${e2.y} Z`
  }

  const selectedNote = CIRCLE_NOTES.find(n => n.major === selected?.name || n.minor === selected?.name)

  return (
    <svg width="600" height="600" viewBox="0 0 600 600" style={{ maxWidth: "100%", display: "block" }}>
      <defs>
        <radialGradient id="cofCenter" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(255,255,255,0.04)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        <radialGradient id="cofRim" cx="0.5" cy="0.5" r="0.5">
          <stop offset="85%" stopColor="rgba(255,255,255,0)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0.06)"/>
        </radialGradient>
      </defs>

      <circle cx={cx} cy={cy} r={outerR + 2} fill="url(#cofRim)" />

      {CIRCLE_NOTES.map((note, idx) => {
        const angle = idx * 30
        const gap = 1.6
        const startMajor = angle - 15 + gap
        const endMajor   = angle + 15 - gap
        const startMinor = angle - 15 + gap * 1.5
        const endMinor   = angle + 15 - gap * 1.5

        const isSelMajor = selected?.name === note.major
        const isSelMinor = selected?.name === note.minor

        const outerLabel = polar(228, angle)
        const innerLabel = polar(155, angle)
        const sharpsLabel = polar(255, angle)

        const hue = (idx * 30 + 70) % 360
        const baseColor = `oklch(0.74 0.10 ${hue})`
        const minorColor = `oklch(0.58 0.07 ${hue})`

        return (
          <g key={note.major}>
            <path
              d={arcPath(midR + 4, outerR, startMajor, endMajor)}
              fill={isSelMajor ? baseColor : `oklch(0.30 0.04 ${hue} / 0.95)`}
              stroke={isSelMajor ? baseColor : "rgba(255,255,255,0.04)"}
              strokeWidth={isSelMajor ? 0 : 0.5}
              style={{ cursor: "pointer", transition: "fill 0.18s ease, filter 0.25s ease",
                filter: isSelMajor ? `drop-shadow(0 0 12px ${baseColor})` : undefined }}
              onClick={() => onSelect(isSelMajor ? null : { name: note.major, kind: "major", rootIdx: note.rootIdx, sharps: note.sharps, hue })}
            />
            <text x={outerLabel.x} y={outerLabel.y} textAnchor="middle" dominantBaseline="middle"
              fontSize={note.major.length > 2 ? 16 : 22} fontWeight={isSelMajor ? "600" : "500"}
              fill={isSelMajor ? "#0a0a08" : "rgba(255,255,255,0.92)"}
              style={{ fontFamily: "var(--font-display)", fontStyle: "italic", letterSpacing: "-0.02em", pointerEvents: "none", userSelect: "none" }}>
              {note.major}
            </text>

            <text x={sharpsLabel.x} y={sharpsLabel.y} textAnchor="middle" dominantBaseline="middle"
              fontSize={9} fontWeight="600"
              fill={isSelMajor ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.3)"}
              style={{ fontFamily: "var(--font-mono)", pointerEvents: "none", userSelect: "none" }}>
              {note.sharps > 0 ? `${note.sharps}♯` : note.sharps < 0 ? `${Math.abs(note.sharps)}♭` : "—"}
            </text>

            <path
              d={arcPath(innerR + 4, midR - 4, startMinor, endMinor)}
              fill={isSelMinor ? minorColor : `oklch(0.22 0.03 ${hue} / 0.95)`}
              stroke={isSelMinor ? minorColor : "rgba(255,255,255,0.04)"}
              strokeWidth={isSelMinor ? 0 : 0.5}
              style={{ cursor: "pointer", transition: "fill 0.18s ease, filter 0.25s ease",
                filter: isSelMinor ? `drop-shadow(0 0 10px ${minorColor})` : undefined }}
              onClick={() => onSelect(isSelMinor ? null : { name: note.minor, kind: "minor", rootIdx: (note.rootIdx + 9) % 12, sharps: note.sharps, hue })}
            />
            <text x={innerLabel.x} y={innerLabel.y} textAnchor="middle" dominantBaseline="middle"
              fontSize={note.minor.length > 3 ? 12 : 14} fontWeight="500"
              fill={isSelMinor ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)"}
              style={{ fontFamily: "var(--font-display)", fontStyle: "italic", letterSpacing: "-0.02em", pointerEvents: "none", userSelect: "none" }}>
              {note.minor}
            </text>
          </g>
        )
      })}

      <circle cx={cx} cy={cy} r={innerR} fill="#0d0c0b" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={innerR - 1} fill="url(#cofCenter)" />

      <text x={cx} y={cy - 18} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.25)" fontWeight="500"
        style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.18em" }}>SENTIDO HORARIO</text>
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize={28}
        fill="rgba(255,255,255,0.85)"
        style={{ fontFamily: "var(--font-display)", fontStyle: "italic", letterSpacing: "-0.02em" }}>↻ 5tas</text>
      <text x={cx} y={cy + 24} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.25)" fontWeight="500"
        style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.18em" }}>↺ 4TAS</text>

      {selectedNote && (
        <line
          x1={cx} y1={cy}
          x2={polar(outerR, CIRCLE_NOTES.findIndex(n => n.major === selectedNote.major) * 30).x}
          y2={polar(outerR, CIRCLE_NOTES.findIndex(n => n.major === selectedNote.major) * 30).y}
          stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="3 3"
        />
      )}
    </svg>
  )
}
