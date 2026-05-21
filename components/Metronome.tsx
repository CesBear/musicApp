"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { playMetronomeClick, getAudioTime, ClickSound } from "@/lib/audio"
import { DEGREE_COLORS } from "@/data/scales"

type Subdiv = "none" | "8th"

const DENOMINATORS = [1, 2, 4, 8, 16]
// Beat accent levels: 0 = muted, 1 = normal, 2 = accent
type AccentLevel = 0 | 1 | 2

const SOUNDS: { id: ClickSound; label: string }[] = [
  { id: "classic", label: "Clásico" },
  { id: "wood",    label: "Madera"  },
  { id: "beep",    label: "Beep"    },
  { id: "rim",     label: "Rim"     },
]

const ACCENT_COLOR: Record<AccentLevel, string> = {
  2: DEGREE_COLORS[0],
  1: "rgba(255,255,255,0.55)",
  0: "rgba(255,255,255,0.10)",
}
const ACCENT_BORDER: Record<AccentLevel, string> = {
  2: `${DEGREE_COLORS[0]}80`,
  1: "rgba(255,255,255,0.15)",
  0: "rgba(255,255,255,0.06)",
}
const ACCENT_LABEL: Record<AccentLevel, string> = {
  2: "Acento", 1: "Normal", 0: "Mute",
}

export default function Metronome() {
  const [on,          setOn]         = useState(false)
  const [bpm,         setBpm]        = useState(80)
  const [numerator,   setNumerator]  = useState(4)
  const [denIdx,      setDenIdx]     = useState(2)          // index into DENOMINATORS → 4
  const [subdiv,      setSubdiv]     = useState<Subdiv>("none")
  const [sound,       setSound]      = useState<ClickSound>("classic")
  const [accents,     setAccents]    = useState<AccentLevel[]>([2, 1, 1, 1])
  const [beatViz,     setBeatViz]    = useState(-1)

  const denominator = DENOMINATORS[denIdx]

  // Resize accent array when numerator changes
  useEffect(() => {
    setAccents(prev => Array.from({ length: numerator }, (_, i) =>
      i < prev.length ? prev[i] : (i === 0 ? 2 : 1)
    ) as AccentLevel[])
  }, [numerator])

  // Live ref for scheduler — avoids restarts on every state change
  const liveRef = useRef({ bpm, numerator, subdiv, sound, accents })
  liveRef.current = { bpm, numerator, subdiv, sound, accents }

  const schedRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const nextTimeRef = useRef(0)
  const tickRef     = useRef(0)

  const schedule = useCallback(() => {
    const LOOKAHEAD = 0.10
    const { bpm, numerator, subdiv, sound, accents } = liveRef.current
    const totalTicks = numerator * (subdiv === "8th" ? 2 : 1)
    const secPerTick = 60 / bpm / (subdiv === "8th" ? 2 : 1)
    const audioNow   = getAudioTime()

    while (nextTimeRef.current < audioNow + LOOKAHEAD) {
      const tick      = tickRef.current % totalTicks
      const mainBeat  = subdiv === "8th" ? Math.floor(tick / 2) : tick
      const isSub     = subdiv === "8th" && tick % 2 === 1
      const accent    = accents[mainBeat] ?? 1

      if (isSub) {
        playMetronomeClick("sub", nextTimeRef.current, sound)
      } else if (accent > 0) {
        playMetronomeClick(accent === 2 ? "accent" : "beat", nextTimeRef.current, sound)
      }

      if (!isSub) {
        const delayMs = Math.max(0, (nextTimeRef.current - audioNow) * 1000)
        const beat = mainBeat
        setTimeout(() => setBeatViz(beat), delayMs)
      }

      nextTimeRef.current += secPerTick
      tickRef.current++
    }
  }, [])

  useEffect(() => {
    if (on) {
      nextTimeRef.current = getAudioTime() + 0.05
      tickRef.current = 0
      setBeatViz(-1)
      schedRef.current = setInterval(schedule, 25)
    } else {
      if (schedRef.current) clearInterval(schedRef.current)
      schedRef.current = null
      setBeatViz(-1)
    }
    return () => { if (schedRef.current) clearInterval(schedRef.current) }
  }, [on, schedule])

  // Tap tempo
  const tapsRef = useRef<number[]>([])
  const handleTap = () => {
    const now = Date.now()
    tapsRef.current = [...tapsRef.current, now].filter(t => now - t < 3000).slice(-8)
    if (tapsRef.current.length >= 2) {
      const gaps = tapsRef.current.slice(1).map((t, i) => t - tapsRef.current[i])
      setBpm(Math.max(30, Math.min(240, Math.round(60000 / (gaps.reduce((a, b) => a + b) / gaps.length)))))
    }
  }

  const cycleAccent = (i: number) => {
    setAccents(prev => {
      const next = [...prev] as AccentLevel[]
      next[i] = ((next[i] + 1) % 3) as AccentLevel
      return next
    })
  }

  const changeBpm = (delta: number) => setBpm(b => Math.max(30, Math.min(240, b + delta)))

  // ─── Styles ────────────────────────────────────────────────────────────────
  const pill = (active: boolean): React.CSSProperties => ({
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 10.5,
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.06em",
    border: active ? `1px solid ${DEGREE_COLORS[0]}` : "1px solid rgba(255,255,255,0.1)",
    background: active ? `${DEGREE_COLORS[0]}18` : "rgba(255,255,255,0.04)",
    color: active ? DEGREE_COLORS[0] : "rgba(255,255,255,0.55)",
    cursor: "pointer",
    transition: "all 0.12s",
  })

  const arrowBtn: React.CSSProperties = {
    width: 24, height: 24,
    borderRadius: 5,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, cursor: "pointer",
    transition: "background 0.12s",
  }

  const lbl: React.CSSProperties = {
    fontSize: 9, letterSpacing: "0.14em",
    color: "rgba(255,255,255,0.28)",
    fontFamily: "var(--font-mono)",
  }

  return (
    <div className="mc-metronome" style={{ gap: 8 }}>

      {/* Row 1: header + play */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={lbl}>METRÓNOMO</span>
        <button onClick={() => setOn(v => !v)} style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: "pointer",
          border: on ? "1px solid rgba(255,80,80,0.4)" : `1px solid ${DEGREE_COLORS[0]}60`,
          background: on ? "rgba(255,80,80,0.12)" : `${DEGREE_COLORS[0]}12`,
          color: on ? "#ff6060" : DEGREE_COLORS[0],
          transition: "all 0.15s",
        }}>
          {on
            ? <><svg width="9" height="9" viewBox="0 0 10 10" fill="none"><rect x="1" y="1" width="3" height="8" fill="currentColor"/><rect x="6" y="1" width="3" height="8" fill="currentColor"/></svg>Stop</>
            : <><svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 1L9 5 2 9Z" fill="currentColor"/></svg>Play</>
          }
        </button>
      </div>

      {/* Row 2: slider + BPM inline */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={() => changeBpm(-1)} style={arrowBtn}>−</button>
        <input type="range" min={30} max={240} value={bpm}
          onChange={e => setBpm(+e.target.value)} className="mc-slider" style={{ flex: 1 }} />
        <button onClick={() => changeBpm(1)} style={arrowBtn}>+</button>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3, minWidth: 54 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 22, color: "#fff", lineHeight: 1 }}>{bpm}</span>
          <span style={{ ...lbl, fontSize: 8 }}>BPM</span>
        </div>
        <button onClick={handleTap} style={{ ...pill(false), padding: "3px 8px", fontSize: 9.5 }}>TAP</button>
      </div>

      {/* Row 3: Compás + Subdivisión on same line */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={lbl}>COMPÁS</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={() => setNumerator(n => Math.max(1, n - 1))} style={arrowBtn}>‹</button>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "#fff", minWidth: 20, textAlign: "center" }}>{numerator}</span>
          <button onClick={() => setNumerator(n => Math.min(16, n + 1))} style={arrowBtn}>›</button>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 14, margin: "0 1px" }}>/</span>
          <button onClick={() => setDenIdx(i => Math.max(0, i - 1))} style={arrowBtn}>‹</button>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "#fff", minWidth: 20, textAlign: "center" }}>{denominator}</span>
          <button onClick={() => setDenIdx(i => Math.min(DENOMINATORS.length - 1, i + 1))} style={arrowBtn}>›</button>
        </div>
        <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 10 }}>·</span>
        <div style={{ display: "flex", gap: 3 }}>
          <button onClick={() => setSubdiv("none")} style={{ ...pill(subdiv === "none"), padding: "3px 7px", fontSize: 12 }}>♩</button>
          <button onClick={() => setSubdiv("8th")}  style={{ ...pill(subdiv === "8th"),  padding: "3px 7px", fontSize: 12 }}>♩♪</button>
        </div>
      </div>

      {/* Row 4: Sound */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={lbl}>SONIDO</span>
        <div style={{ display: "flex", gap: 3 }}>
          {SOUNDS.map(s => (
            <button key={s.id} onClick={() => setSound(s.id)} style={{ ...pill(sound === s.id), padding: "3px 8px", fontSize: 10 }}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Row 5: Beat grid */}
      <div>
        <div style={{ ...lbl, marginBottom: 4 }}>TIEMPOS <span style={{ opacity: 0.5, fontWeight: 400 }}>· click = acento / normal / mute</span></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {accents.map((accent, i) => {
            const isActive = on && beatViz === i
            return (
              <button key={i} onClick={() => cycleAccent(i)} title={ACCENT_LABEL[accent]} style={{
                width: 26, height: 26, borderRadius: 5, flexShrink: 0,
                border: isActive ? `1.5px solid ${DEGREE_COLORS[0]}` : `1px solid ${ACCENT_BORDER[accent]}`,
                background: isActive ? DEGREE_COLORS[0]
                  : accent === 2 ? `${DEGREE_COLORS[0]}20`
                  : accent === 1 ? "rgba(255,255,255,0.06)"
                  : "rgba(255,255,255,0.02)",
                color: isActive ? "#0a0a08" : ACCENT_COLOR[accent],
                fontSize: 9, fontFamily: "var(--font-mono)",
                fontWeight: isActive || accent === 2 ? 700 : 400,
                cursor: "pointer",
                transition: "background 0.06s, border 0.06s, color 0.06s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}
