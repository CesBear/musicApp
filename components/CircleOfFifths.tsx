"use client"

import { useState } from "react"
import { CIRCLE_NOTES } from "@/data/circle"
import { getNoteName } from "@/data/scales"

// Color by tonal function
const FUNC_COLOR: Record<string, string> = {
  "I":    "#c89535", "vi":   "#c89535",
  "IV":   "#4a7fc4", "ii":   "#4a7fc4",
  "V":    "#c4503a", "iii":  "#c4503a", "vii°": "#8b5ba8",
  "i":    "#c89535", "♭III": "#c89535",
  "iv":   "#4a7fc4", "♭VI":  "#4a7fc4",
  "v":    "#c4503a", "♭VII": "#c4503a", "ii°":  "#8b5ba8",
  "VI":   "#c89535",
}

const MAJOR_IVLS = [0, 2, 4, 5, 7, 9, 11]
const MINOR_IVLS = [0, 2, 3, 5, 7, 8, 10]

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
  const [hovered, setHovered] = useState<{ idx: number; kind: "major" | "minor" } | null>(null)

  const cx = 300, cy = 300
  const outerR = 268, midR = 188, innerR = 122

  const polar = (r: number, angleDeg: number) => {
    const a = ((angleDeg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  }
  const arcPath = (r1: number, r2: number, startAngle: number, endAngle: number) => {
    const s1 = polar(r2, startAngle), e1 = polar(r2, endAngle)
    const s2 = polar(r1, endAngle),  e2 = polar(r1, startAngle)
    return `M ${s1.x} ${s1.y} A ${r2} ${r2} 0 0 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${r1} ${r1} 0 0 0 ${e2.x} ${e2.y} Z`
  }

  const selectedNote = CIRCLE_NOTES.find(n => n.major === selected?.name || n.minor === selected?.name)
  const selIdx       = selected ? CIRCLE_NOTES.findIndex(n => n.major === selected.name || n.minor === selected.name) : -1
  const selMajorIdx  = selected?.kind === "major" ? selIdx : -1
  const selMinorIdx  = selected?.kind === "minor" ? selIdx : -1
  const hasSelection = selMajorIdx >= 0 || selMinorIdx >= 0

  // Per-segment degree labels — all 7 diatonic chords
  const focusMap = new Map<number, { outerDeg?: string; innerDeg?: string }>()
  if (selMajorIdx >= 0) {
    const s = selMajorIdx
    focusMap.set(s,             { outerDeg: "I",    innerDeg: "vi"   })
    focusMap.set((s +  1) % 12, { outerDeg: "V",    innerDeg: "iii"  })
    focusMap.set((s + 11) % 12, { outerDeg: "IV",   innerDeg: "ii"   })
    focusMap.set((s +  5) % 12, { outerDeg: "vii°"                   })
  }
  if (selMinorIdx >= 0) {
    const s = selMinorIdx
    focusMap.set(s,             { outerDeg: "♭III", innerDeg: "i"    })
    focusMap.set((s +  1) % 12, { outerDeg: "♭VII", innerDeg: "v"    })
    focusMap.set((s + 11) % 12, { outerDeg: "♭VI",  innerDeg: "iv"   })
    focusMap.set((s +  5) % 12, { outerDeg: "ii°"                    })
  }

  // Sets for opacity tiers
  const nearSet = new Set<number>()
  const dimSet  = new Set<number>()
  if (selMajorIdx >= 0) {
    nearSet.add((selMajorIdx +  1) % 12)
    nearSet.add((selMajorIdx + 11) % 12)
    dimSet.add( (selMajorIdx +  5) % 12)
  }
  if (selMinorIdx >= 0) {
    nearSet.add((selMinorIdx +  1) % 12)
    nearSet.add((selMinorIdx + 11) % 12)
    dimSet.add( (selMinorIdx +  5) % 12)
  }

  // Scale notes for center panel
  const scaleNotes = selected
    ? (selected.kind === "major" ? MAJOR_IVLS : MINOR_IVLS)
        .map(i => getNoteName((selected.rootIdx + i) % 12))
    : null

  return (
    <svg width="600" height="600" viewBox="0 0 600 600" style={{ maxWidth: "100%", display: "block" }}>
      <defs>
        <radialGradient id="cofCenter" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.04)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        <radialGradient id="cofRim" cx="0.5" cy="0.5" r="0.5">
          <stop offset="85%"  stopColor="rgba(255,255,255,0)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0.06)"/>
        </radialGradient>
        <style>{`
          @keyframes cofBadge { from { opacity:0 } to { opacity:1 } }
          .cof-badge { animation: cofBadge 0.2s ease forwards; }
        `}</style>
      </defs>

      <circle cx={cx} cy={cy} r={outerR + 2} fill="url(#cofRim)" />

      {CIRCLE_NOTES.map((note, idx) => {
        const angle = idx * 30
        const gap   = 1.6
        const startMajor = angle - 15 + gap
        const endMajor   = angle + 15 - gap
        const startMinor = angle - 15 + gap * 1.5
        const endMinor   = angle + 15 - gap * 1.5

        const isSelMajor  = selected?.name === note.major
        const isSelMinor  = selected?.name === note.minor
        const isNearFocus = nearSet.has(idx)
        const isDimFocus  = dimSet.has(idx)
        const isFocused   = isSelMajor || isSelMinor || isNearFocus || isDimFocus

        const focusInfo  = focusMap.get(idx)
        const outerDeg   = focusInfo?.outerDeg ?? null
        const innerDeg   = focusInfo?.innerDeg ?? null

        const isHovMajor = hovered?.idx === idx && hovered?.kind === "major"
        const isHovMinor = hovered?.idx === idx && hovered?.kind === "minor"

        const hue              = (idx * 30 + 70) % 360
        const baseColor        = `oklch(0.74 0.10 ${hue})`
        const minorColor       = `oklch(0.58 0.07 ${hue})`
        const neighborColor    = `oklch(0.42 0.07 ${hue})`
        const neighborMinColor = `oklch(0.32 0.06 ${hue})`
        const hoverGlow        = `drop-shadow(0 0 7px oklch(0.55 0.08 ${hue} / 0.55))`

        const outerFill = isSelMajor
          ? baseColor
          : isNearFocus && outerDeg
            ? neighborColor
            : `oklch(0.30 0.04 ${hue} / 0.95)`

        const innerFill = isSelMinor
          ? minorColor
          : isNearFocus && innerDeg
            ? neighborMinColor
            : `oklch(0.22 0.03 ${hue} / 0.95)`

        const outerFilter = isSelMajor
          ? `drop-shadow(0 0 12px ${baseColor})`
          : isNearFocus ? `drop-shadow(0 0 8px ${neighborColor}88)`
          : isHovMajor  ? hoverGlow
          : undefined

        const innerFilter = isSelMinor
          ? `drop-shadow(0 0 10px ${minorColor})`
          : isNearFocus && innerDeg ? `drop-shadow(0 0 7px ${neighborMinColor}aa)`
          : isHovMinor  ? hoverGlow
          : undefined

        const groupOpacity = !hasSelection   ? 1
          : (isSelMajor || isSelMinor || isNearFocus) ? 1
          : isDimFocus   ? 0.52
          : 0.18

        const outerDegPt = polar(207, angle)
        const innerDegPt = polar(171, angle)
        const outerLabel = polar(228, angle)
        const innerLabel = polar(155, angle)
        const sharpsLabel = polar(255, angle)

        return (
          <g key={note.major} style={{
            opacity:    groupOpacity,
            filter:     hasSelection && !isFocused ? "blur(0.9px)" : undefined,
            transition: "opacity 0.25s ease, filter 0.25s ease",
          }}>
            {/* Outer / major arc */}
            <path
              d={arcPath(midR + 4, outerR, startMajor, endMajor)}
              fill={outerFill}
              stroke={isSelMajor || isNearFocus ? outerFill : "rgba(255,255,255,0.04)"}
              strokeWidth={isSelMajor || isNearFocus ? 0 : 0.5}
              style={{ cursor: "pointer", transition: "fill 0.22s ease, filter 0.25s ease", filter: outerFilter }}
              onMouseEnter={() => setHovered({ idx, kind: "major" })}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(isSelMajor ? null : { name: note.major, kind: "major", rootIdx: note.rootIdx, sharps: note.sharps, hue })}
            />
            <text x={outerLabel.x} y={outerLabel.y} textAnchor="middle" dominantBaseline="middle"
              fontSize={note.major.length > 2 ? 16 : 22} fontWeight={isSelMajor ? "600" : "500"}
              fill={isSelMajor ? "#0a0a08" : isNearFocus || isHovMajor ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.92)"}
              style={{ fontFamily: "var(--font-display)", fontStyle: "italic", letterSpacing: "-0.02em", pointerEvents: "none", userSelect: "none" }}>
              {note.major}
            </text>
            <text x={sharpsLabel.x} y={sharpsLabel.y} textAnchor="middle" dominantBaseline="middle"
              fontSize={9} fontWeight="600"
              fill={isSelMajor ? "rgba(0,0,0,0.55)" : isNearFocus ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.3)"}
              style={{ fontFamily: "var(--font-mono)", pointerEvents: "none", userSelect: "none" }}>
              {note.sharps > 0 ? `${note.sharps}♯` : note.sharps < 0 ? `${Math.abs(note.sharps)}♭` : "—"}
            </text>
            {outerDeg && (
              <text key={`${selected?.name}-o-${idx}`}
                x={outerDegPt.x} y={outerDegPt.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={outerDeg.length > 2 ? 7.5 : 9} fontWeight="800"
                fill={isSelMajor ? "rgba(0,0,0,0.60)" : FUNC_COLOR[outerDeg]}
                className="cof-badge"
                style={{
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.04em",
                  pointerEvents: "none", userSelect: "none",
                  filter: isSelMajor ? undefined
                    : `drop-shadow(0 0 5px ${FUNC_COLOR[outerDeg]}99) drop-shadow(0 1px 3px rgba(0,0,0,0.95))`,
                }}>
                {outerDeg}
              </text>
            )}

            {/* Inner / minor arc */}
            <path
              d={arcPath(innerR + 4, midR - 4, startMinor, endMinor)}
              fill={innerFill}
              stroke={isSelMinor || (isNearFocus && innerDeg) ? innerFill : "rgba(255,255,255,0.04)"}
              strokeWidth={isSelMinor || (isNearFocus && innerDeg) ? 0 : 0.5}
              style={{ cursor: "pointer", transition: "fill 0.22s ease, filter 0.25s ease", filter: innerFilter }}
              onMouseEnter={() => setHovered({ idx, kind: "minor" })}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(isSelMinor ? null : { name: note.minor, kind: "minor", rootIdx: (note.rootIdx + 9) % 12, sharps: note.sharps, hue })}
            />
            <text x={innerLabel.x} y={innerLabel.y} textAnchor="middle" dominantBaseline="middle"
              fontSize={note.minor.length > 3 ? 12 : 14} fontWeight="500"
              fill={isSelMinor ? "rgba(255,255,255,0.95)" : isNearFocus && innerDeg ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.7)"}
              style={{ fontFamily: "var(--font-display)", fontStyle: "italic", letterSpacing: "-0.02em", pointerEvents: "none", userSelect: "none" }}>
              {note.minor}
            </text>
            {innerDeg && (
              <text key={`${selected?.name}-i-${idx}`}
                x={innerDegPt.x} y={innerDegPt.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={innerDeg.length > 2 ? 7.5 : 9} fontWeight="800"
                fill={isSelMinor ? "rgba(255,255,255,0.9)" : FUNC_COLOR[innerDeg]}
                className="cof-badge"
                style={{
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.04em",
                  pointerEvents: "none", userSelect: "none",
                  filter: `drop-shadow(0 0 5px ${FUNC_COLOR[innerDeg]}99) drop-shadow(0 1px 3px rgba(0,0,0,0.95))`,
                }}>
                {innerDeg}
              </text>
            )}
          </g>
        )
      })}

      {/* Center */}
      <circle cx={cx} cy={cy} r={innerR} fill="#0d0c0b" stroke="rgba(255,255,255,0.07)" strokeWidth={1}
        onClick={() => selected && onSelect(null)}
        style={{ cursor: selected ? "pointer" : "default" }} />
      <circle cx={cx} cy={cy} r={innerR - 1} fill="url(#cofCenter)" style={{ pointerEvents: "none" }} />

      {selected ? (
        <g style={{ pointerEvents: "none" }}>
          <text x={cx} y={cy - 28} textAnchor="middle"
            fontSize={selected.name.length > 2 ? 28 : 34} fontWeight="700"
            fill="rgba(255,255,255,0.92)"
            style={{ fontFamily: "var(--font-display)", fontStyle: "italic", letterSpacing: "-0.02em" }}>
            {selected.name}
          </text>
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={9} fontWeight="600"
            fill="rgba(255,255,255,0.35)"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.14em" }}>
            {selected.kind === "major" ? "MAYOR" : "MENOR"}
            {" · "}
            {selected.sharps > 0 ? `${selected.sharps}♯` : selected.sharps < 0 ? `${Math.abs(selected.sharps)}♭` : "NATURAL"}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={9.5} fontWeight="500"
            fill="rgba(255,255,255,0.55)"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
            {scaleNotes?.join("  ")}
          </text>
          <text x={cx} y={cy + 34} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.18)"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
            CLICK PARA CERRAR
          </text>
        </g>
      ) : (
        <g style={{ pointerEvents: "none" }}>
          <text x={cx} y={cy - 18} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.25)" fontWeight="500"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.18em" }}>SENTIDO HORARIO</text>
          <text x={cx} y={cy + 3} textAnchor="middle" fontSize={28}
            fill="rgba(255,255,255,0.85)"
            style={{ fontFamily: "var(--font-display)", fontStyle: "italic", letterSpacing: "-0.02em" }}>↻ 5tas</text>
          <text x={cx} y={cy + 24} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.25)" fontWeight="500"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.18em" }}>↺ 4TAS</text>
        </g>
      )}

      {selectedNote && (
        <line
          x1={cx} y1={cy}
          x2={polar(outerR, CIRCLE_NOTES.findIndex(n => n.major === selectedNote.major) * 30).x}
          y2={polar(outerR, CIRCLE_NOTES.findIndex(n => n.major === selectedNote.major) * 30).y}
          stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="3 3"
          style={{ pointerEvents: "none" }}
        />
      )}
    </svg>
  )
}
