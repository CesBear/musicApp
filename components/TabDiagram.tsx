"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { playGuitarString, getAudioTime, getVisualLatencyMs } from "@/lib/audio"
import { GUITAR_TUNING_MIDI, STRING_LABELS } from "@/data/scales"

export type TabNote  = { string: number; fret: number }   // string: 0 = low E ... 5 = high e
export type TieType  = "h" | "p" | "s" | "t" | "b"        // hammer-on, pull-off, slide, tap, bend
export type PickDir  = "d" | "u"                          // downstroke, upstroke
export type TabStep  = {
  notes: TabNote[]
  tie?:  TieType
  pick?: PickDir
  bend?: 1 | 2          // semitonos del bend (tie "b"): suena la nota objetivo
}

export interface TabExercise {
  id:             string
  title:          string
  desc?:          string
  timeSignature?: string
  bpmHint?:       number
  subdivision?:   number     // steps por pulso — 2 = corcheas, 3 = tresillo, 4 = semicorcheas... (default 2)
  beatsPerGroup?: number     // steps por grupo de compás, default = subdivision * 4
  hidden?:        boolean    // ejercicio de oído: la tab queda oculta hasta revelarla
  steps:          TabStep[]
}

const TIE_LABEL: Record<TieType, string> = { h: "H", p: "P", s: "S", t: "T", b: "B" }
const TIE_COLOR: Record<TieType, string> = {
  h: "oklch(0.78 0.12 240)",
  p: "oklch(0.78 0.12 240)",
  s: "oklch(0.80 0.14 150)",
  t: "oklch(0.80 0.15 70)",
  b: "oklch(0.80 0.14 350)",
}
// Legato (hammer/pull) has no pick attack → quieter. Taps hit harder. Picked notes are the loudest.
const TIE_GAIN: Partial<Record<TieType, number>> = { h: 0.065, p: 0.065, t: 0.115, s: 0.10, b: 0.10 }

const ACCENT = "oklch(0.80 0.15 70)"
// "oklch(L C H)" → "oklch(L C H / a)" — the only valid way to add alpha to an oklch() string.
const alpha = (color: string, a: number) => `${color.slice(0, -1)} / ${a})`

// Standard tab picking symbols: ⊓ (staple, open at the bottom) for a downstroke,
// V (open at the top) for an upstroke.
function PickGlyph({ x, y, dir, color }: { x: number; y: number; dir: PickDir; color: string }) {
  const d = dir === "d"
    ? `M ${x - 3.5} ${y + 3} L ${x - 3.5} ${y - 3} L ${x + 3.5} ${y - 3} L ${x + 3.5} ${y + 3}`
    : `M ${x - 3.5} ${y - 3} L ${x} ${y + 3} L ${x + 3.5} ${y - 3}`
  return <path d={d} fill="none" stroke={color} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round" />
}

export default function TabDiagram({ exercise, bpm }: { exercise: TabExercise; bpm: number }) {
  const [playing, setPlaying]       = useState(false)
  const [activeStep, setActiveStep] = useState(-1)
  const [revealed, setRevealed]     = useState(!exercise.hidden)

  const bpmRef      = useRef(bpm)
  const schedRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const nextTimeRef = useRef(0)
  const stepRef     = useRef(0)

  useEffect(() => { bpmRef.current = bpm }, [bpm])

  const subdiv = exercise.subdivision ?? 2

  const stop = useCallback(() => {
    if (schedRef.current) clearInterval(schedRef.current)
    schedRef.current = null
    setPlaying(false)
    setActiveStep(-1)
  }, [])

  const start = useCallback(() => {
    nextTimeRef.current = getAudioTime() + 0.06
    stepRef.current = 0
    setPlaying(true)

    schedRef.current = setInterval(() => {
      const now = getAudioTime()
      const secPerStep = 60 / bpmRef.current / subdiv

      while (nextTimeRef.current < now + 0.12) {
        const i    = stepRef.current % exercise.steps.length
        const step = exercise.steps[i]
        const rel  = nextTimeRef.current - now
        const gain = (step.tie && TIE_GAIN[step.tie]) ?? 0.10

        // Simultaneous notes in one step (a chord/sweep column) get a small
        // strum stagger — a real pick pass never hits every string at once.
        const STRUM_STAGGER = Math.min(0.018, secPerStep * 0.3)
        step.notes.forEach((n, k) => {
          const midi = GUITAR_TUNING_MIDI[n.string] + n.fret + (step.bend ?? 0)
          playGuitarString(midi, rel + k * STRUM_STAGGER, gain, secPerStep * 1.6)
        })

        const delayMs = Math.max(0, (nextTimeRef.current - now) * 1000 + getVisualLatencyMs())
        setTimeout(() => setActiveStep(i), delayMs)

        nextTimeRef.current += secPerStep
        stepRef.current++
      }
    }, 25)
  }, [exercise, subdiv])

  useEffect(() => () => stop(), [stop])

  const toggle = () => (playing ? stop() : start())

  // ─── Layout ────────────────────────────────────────────────────────────────
  const STEP_W   = 34
  const PAD_L    = 52   // clave TAB + nombre de cada cuerda
  const PAD_R    = 16
  const LINE_GAP = 14
  const TOP      = 26
  const groupSize = exercise.beatsPerGroup ?? subdiv * 4

  const W = PAD_L + exercise.steps.length * STEP_W + PAD_R
  const H = TOP + LINE_GAP * 5 + 22

  // Precompute x/y for each step's primary note (used to draw h/p/s ties)
  const pos = (i: number) => PAD_L + i * STEP_W + STEP_W / 2
  const rowY = (str: number) => TOP + (5 - str) * LINE_GAP

  // Pick direction per step: ties have no pick attack (no symbol). Otherwise use an
  // explicit override if given, else alternate down/up like real alternate picking —
  // resuming the alternation naturally after any explicit override.
  const pickDirs: (PickDir | null)[] = []
  let expectedPick: PickDir = "d"
  for (const step of exercise.steps) {
    if (step.tie && step.tie !== "b") { pickDirs.push(null); continue }
    const dir: PickDir = step.pick ?? expectedPick
    expectedPick = dir === "d" ? "u" : "d"
    // un silencio conserva la alternancia (la mano sigue el pulso) pero no se dibuja
    pickDirs.push(step.notes.length === 0 ? null : dir)
  }


  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
      background: "rgba(255,255,255,0.035)", padding: "10px 12px",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 14.5, color: "#fff", lineHeight: 1.2 }}>
            {exercise.title}
          </div>
          {exercise.desc && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.616)", marginTop: 2, lineHeight: 1.4 }}>
              {exercise.desc}
            </div>
          )}
        </div>
        <button onClick={toggle} style={{
          flexShrink: 0,
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 999,
          fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em",
          border: playing ? "1px solid oklch(0.68 0.18 25 / 0.5)" : `1px solid ${alpha(ACCENT, 0.6)}`,
          background: playing ? "oklch(0.68 0.18 25 / 0.14)" : alpha(ACCENT, 0.14),
          color: playing ? "oklch(0.75 0.18 25)" : ACCENT,
          cursor: "pointer", transition: "all 0.15s",
        }}>
          {playing ? "◼ PARAR" : "▶ TOCAR"}
        </button>
      </div>

      <div style={{ overflowX: "auto", position: "relative" }}>
        {!revealed && (
          <button onClick={() => setRevealed(true)} style={{
            position: "absolute", inset: 0, zIndex: 1, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "color-mix(in oklch, var(--surface-1) 70%, transparent)", border: "1px dashed var(--border-2)", borderRadius: 8,
            fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", color: "var(--text-2)",
          }}>
            TAB OCULTA · ESCUCHA Y BÚSCALA · CLIC PARA REVELAR
          </button>
        )}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", minWidth: W, filter: revealed ? undefined : "blur(7px)", transition: "filter 0.2s" }}>
          {/* "TAB" clef, stacked vertically like real tab notation */}
          {["T", "A", "B"].map((ch, k) => (
            <text key={ch} x={6} y={TOP + (1 + k * 2) * LINE_GAP + 4} fontSize={10} fontWeight={700}
              fill="rgba(255,255,255,0.527)" style={{ fontFamily: "var(--font-mono)" }}>
              {ch}
            </text>
          ))}

          {/* Afinación: nombre de cada cuerda al inicio de su línea */}
          {[0, 1, 2, 3, 4, 5].map(s => (
            <text key={`lbl-${s}`} x={PAD_L - 16} y={rowY(s) + 3.5} textAnchor="end" fontSize={10.5} fontWeight={600}
              fill="var(--text-2)" style={{ fontFamily: "var(--font-mono)" }}>
              {STRING_LABELS[s]}
            </text>
          ))}

          {/* 6 string lines — string 5 (high e) on top, string 0 (low E) on bottom */}
          {[0, 1, 2, 3, 4, 5].map(s => (
            <line key={s}
              x1={PAD_L - 10} y1={rowY(s)}
              x2={W - PAD_R} y2={rowY(s)}
              stroke="rgba(255,255,255,0.247)" strokeWidth={1} />
          ))}

          {/* bar lines */}
          {Array.from({ length: Math.floor(exercise.steps.length / groupSize) + 1 }).map((_, g) => {
            const i = g * groupSize
            if (i === 0 || i > exercise.steps.length) return null
            const x = pos(i) - STEP_W / 2
            return (
              <line key={g} x1={x} y1={TOP - 6} x2={x} y2={TOP + LINE_GAP * 5 + 6}
                stroke="rgba(255,255,255,0.343)" strokeWidth={1} />
            )
          })}
          {/* closing bar line */}
          <line x1={pos(exercise.steps.length - 1) + STEP_W / 2} y1={TOP - 6}
            x2={pos(exercise.steps.length - 1) + STEP_W / 2} y2={TOP + LINE_GAP * 5 + 6}
            stroke="rgba(255,255,255,0.343)" strokeWidth={1} />

          {/* tie arcs (hammer-on / pull-off) and slide lines, drawn under the note badges */}
          {exercise.steps.map((step, i) => {
            if (!step.tie || i === 0 || step.tie === "t" || step.tie === "b") return null
            const from = exercise.steps[i - 1].notes[0]
            const to   = step.notes[0]
            if (!from || !to) return null
            const x1 = pos(i - 1), x2 = pos(i)
            const y1 = rowY(from.string), y2 = rowY(to.string)

            if (step.tie === "s") {
              return (
                <line key={i} x1={x1 + 8} y1={y1 - (y1 === y2 ? 5 : 0)} x2={x2 - 8} y2={y2 - (y1 === y2 ? 5 : 0)}
                  stroke={TIE_COLOR.s} strokeWidth={1.4} opacity={0.8} />
              )
            }
            // hammer-on / pull-off: shallow arc above the note row
            const midX = (x1 + x2) / 2
            const arcY = Math.min(y1, y2) - 7
            return (
              <path key={i} d={`M ${x1 + 6} ${y1 - 3} Q ${midX} ${arcY} ${x2 - 6} ${y2 - 3}`}
                fill="none" stroke={TIE_COLOR[step.tie]} strokeWidth={1.3} opacity={0.75} />
            )
          })}

          {exercise.steps.map((step, i) => {
            const x = pos(i)
            const active = i === activeStep

            return (
              <g key={i}>
                {active && (
                  <rect x={x - STEP_W / 2 + 2} y={TOP - 12} width={STEP_W - 4} height={LINE_GAP * 5 + 24}
                    rx={5} fill={alpha(ACCENT, 0.14)} />
                )}
                {step.tie ? (
                  <text x={x} y={TOP - 14} textAnchor="middle" fontSize={8.5} fontWeight={700}
                    fill={TIE_COLOR[step.tie]} style={{ fontFamily: "var(--font-mono)" }}>
                    {TIE_LABEL[step.tie]}{step.bend ? (step.bend === 1 ? "½" : "1") : ""}
                  </text>
                ) : pickDirs[i] && (
                  <PickGlyph x={x} y={TOP - 15} dir={pickDirs[i]!} color={active ? ACCENT : "rgba(255,255,255,0.6)"} />
                )}
                {step.notes.map((n, j) => {
                  const y = rowY(n.string)
                  return (
                    <g key={j}>
                      <rect x={x - 8} y={y - 6.5} width={16} height={13} style={{ fill: "var(--bg-1)" }} />
                      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={10.5} fontWeight={700}
                        fill={active ? ACCENT : "rgba(255,255,255,0.92)"}
                        style={{ fontFamily: "var(--font-mono)", transition: "fill 0.05s" }}>
                        {n.fret}
                      </text>
                      {step.bend && (
                        <path d={`M ${x + 8} ${y - 1} Q ${x + 14} ${y - 2} ${x + 15} ${y - 10}`} fill="none"
                          stroke={TIE_COLOR.b} strokeWidth={1.3} />
                      )}
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
