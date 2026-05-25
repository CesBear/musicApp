"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { playGuitarString, getAudioTime } from "@/lib/audio"

// ─── Types ────────────────────────────────────────────────────────────────────

type Stroke = "D" | "U" | "-"

interface StruPattern {
  label: string
  timeSignature: string
  subs: number
  strokes: Stroke[]
}

// ─── Pattern bank ─────────────────────────────────────────────────────────────

const PATTERNS: StruPattern[] = [
  { label: "Básico",   timeSignature: "4/4", subs: 8, strokes: ["D","-","D","-","D","-","D","-"] },
  { label: "Down-Up",  timeSignature: "4/4", subs: 8, strokes: ["D","U","D","U","D","U","D","U"] },
  { label: "Pop",      timeSignature: "4/4", subs: 8, strokes: ["D","-","D","U","-","U","D","U"] },
  { label: "Reggae",   timeSignature: "4/4", subs: 8, strokes: ["-","U","-","U","-","U","-","U"] },
  { label: "Balada",   timeSignature: "4/4", subs: 8, strokes: ["D","-","D","U","D","U","D","U"] },
  { label: "Rock",     timeSignature: "4/4", subs: 8, strokes: ["D","D","U","-","U","D","D","U"] },
  { label: "Folk",     timeSignature: "4/4", subs: 8, strokes: ["D","U","-","U","D","U","-","U"] },
  { label: "Vals 3/4", timeSignature: "3/4", subs: 6, strokes: ["D","-","U","D","U","-"] },
]

// ─── Audio ────────────────────────────────────────────────────────────────────

const GUITAR_BASE = [40, 45, 50, 55, 59, 64]
const E_MAJOR     = [0, 2, 2, 1, 0, 0]

function playDown(absWhen: number, now: number) {
  const rel = absWhen - now
  E_MAJOR.forEach((fret, i) => {
    playGuitarString(GUITAR_BASE[i] + fret, rel + i * 0.034, Math.max(0.090 - i * 0.007, 0.048))
  })
}

function playUp(absWhen: number, now: number) {
  const rel = absWhen - now
  ;[5, 4, 3, 2].forEach((si, j) => {
    playGuitarString(GUITAR_BASE[si] + E_MAJOR[si], rel + j * 0.025, Math.max(0.060 - j * 0.005, 0.038))
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function beatLabel(i: number): string {
  return i % 2 === 0 ? String(Math.floor(i / 2) + 1) : "+"
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RasgeosPage() {
  const [patternIdx, setPatternIdx] = useState(0)
  const [bpm, setBpm]               = useState(80)
  const [playing, setPlaying]       = useState(false)
  const [activeSub, setActiveSub]   = useState(-1)

  const pattern = PATTERNS[patternIdx]

  const schedulerRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const rafRef            = useRef<number>(0)
  const nextNoteTimeRef   = useRef(0)
  const currentSubRef     = useRef(0)
  const loopStartRef      = useRef(0)
  const subDurRef         = useRef(0)
  const bpmRef            = useRef(bpm)
  const patternRef        = useRef(pattern)
  const playingRef        = useRef(false)

  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { patternRef.current = pattern }, [pattern])

  const stop = useCallback(() => {
    playingRef.current = false
    if (schedulerRef.current) { clearInterval(schedulerRef.current); schedulerRef.current = null }
    if (rafRef.current)       { cancelAnimationFrame(rafRef.current); rafRef.current = 0 }
    setActiveSub(-1)
    setPlaying(false)
  }, [])

  const start = useCallback(() => {
    const dur = 60 / (bpmRef.current * 2)
    subDurRef.current       = dur
    loopStartRef.current    = getAudioTime() + 0.05
    nextNoteTimeRef.current = loopStartRef.current
    currentSubRef.current   = 0
    playingRef.current      = true

    schedulerRef.current = setInterval(() => {
      const now = getAudioTime()
      const p   = patternRef.current
      const d   = 60 / (bpmRef.current * 2)
      subDurRef.current = d
      while (nextNoteTimeRef.current < now + 0.1) {
        const s      = currentSubRef.current % p.subs
        const stroke = p.strokes[s]
        if (stroke === "D") playDown(nextNoteTimeRef.current, now)
        else if (stroke === "U") playUp(nextNoteTimeRef.current, now)
        currentSubRef.current++
        nextNoteTimeRef.current += d
      }
    }, 25)

    const tick = () => {
      if (!playingRef.current) return
      const elapsed = getAudioTime() - loopStartRef.current
      const d = subDurRef.current
      if (d > 0 && elapsed >= 0) {
        setActiveSub(Math.floor(elapsed / d) % patternRef.current.subs)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    setPlaying(true)
  }, [])

  useEffect(() => () => { stop() }, [stop])

  const toggle = useCallback(() => {
    if (playingRef.current) stop()
    else start()
  }, [stop, start])

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 720, margin: "0 auto" }}>

      {/* Hero */}
      <div style={{ paddingBottom: 4 }}>
        <div className="mc-eyebrow" style={{ marginBottom: 6 }}>Guitarra</div>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 400,
          color: "#fff", letterSpacing: "-0.03em", lineHeight: 1, margin: 0,
        }}>
          Patrones de Rasgueo
        </h1>
        <p style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
          ↓ bajada · ↑ subida · · silencio · acorde ref: E mayor
        </p>
      </div>

      {/* Pattern selector */}
      <div className="mc-section">
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Patrón</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {PATTERNS.map((p, i) => (
            <button key={i} onClick={() => setPatternIdx(i)}
              style={{
                background: patternIdx === i ? "oklch(0.80 0.14 40 / 0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${patternIdx === i ? "oklch(0.80 0.14 40 / 0.4)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 8, padding: "10px 8px", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                transition: "all 0.15s",
              }}>
              <span style={{
                fontFamily: "var(--font-display)", fontSize: 13,
                color: patternIdx === i ? "oklch(0.80 0.14 40)" : "#fff",
              }}>
                {p.label}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>
                {p.timeSignature}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Visualizer */}
      <div className="mc-section">
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Compás</span>
          <span className="mc-section-hint">{pattern.timeSignature} · octavos</span>
        </div>
        <div style={{ display: "flex", gap: 5, padding: "4px 0 8px" }}>
          {pattern.strokes.map((stroke, i) => {
            const isActive = activeSub === i
            const isBeat   = i % 2 === 0
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.06em",
                  color: isBeat ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                  fontWeight: isBeat ? 700 : 400,
                }}>
                  {beatLabel(i)}
                </span>
                <div style={{
                  width: "100%", aspectRatio: "1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 9,
                  background: isActive
                    ? stroke === "D"  ? "oklch(0.80 0.14 40  / 0.22)"
                    : stroke === "U"  ? "oklch(0.65 0.18 230 / 0.22)"
                    : "rgba(255,255,255,0.05)"
                    : stroke !== "-"  ? "rgba(255,255,255,0.05)" : "transparent",
                  border: `1.5px solid ${
                    isActive
                      ? stroke === "D"  ? "oklch(0.80 0.14 40  / 0.7)"
                      : stroke === "U"  ? "oklch(0.65 0.18 230 / 0.7)"
                      : "rgba(255,255,255,0.15)"
                    : stroke !== "-"  ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"
                  }`,
                  transition: "background 0.05s, border-color 0.05s",
                }}>
                  {stroke === "D" && (
                    <span style={{
                      fontSize: 24, lineHeight: 1, userSelect: "none",
                      color: isActive ? "oklch(0.80 0.14 40)" : "rgba(255,255,255,0.65)",
                      transition: "color 0.05s",
                    }}>↓</span>
                  )}
                  {stroke === "U" && (
                    <span style={{
                      fontSize: 24, lineHeight: 1, userSelect: "none",
                      color: isActive ? "oklch(0.65 0.18 230)" : "rgba(255,255,255,0.45)",
                      transition: "color 0.05s",
                    }}>↑</span>
                  )}
                  {stroke === "-" && (
                    <span style={{ fontSize: 16, lineHeight: 1, userSelect: "none", color: "rgba(255,255,255,0.1)" }}>·</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tempo + Play */}
      <div className="mc-section">
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Tempo</span>
          <span className="mc-section-hint" style={{ fontVariantNumeric: "tabular-nums" }}>{bpm} BPM</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="range" min={40} max={200} value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            style={{ flex: 1, accentColor: "oklch(0.80 0.14 40)" }}
          />
          <button onClick={toggle} style={{
            background: playing ? "oklch(0.68 0.18 25 / 0.14)" : "oklch(0.80 0.14 40 / 0.14)",
            border: `1px solid ${playing ? "oklch(0.68 0.18 25 / 0.5)" : "oklch(0.80 0.14 40 / 0.45)"}`,
            borderRadius: 10, padding: "10px 28px",
            color: playing ? "oklch(0.75 0.18 25)" : "oklch(0.80 0.14 40)",
            fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.08em",
            cursor: "pointer", fontWeight: 700, minWidth: 110,
            transition: "all 0.15s",
          }}>
            {playing ? "◼  PARAR" : "▶  TOCAR"}
          </button>
        </div>
      </div>

    </div>
  )
}
