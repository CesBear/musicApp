"use client"

import { Fragment, useState, useEffect, useMemo, useCallback, useRef } from "react"
import { playTone, getAudioTime } from "@/lib/audio"
import { getPracticeSessions, addPracticeSession, deletePracticeSession, type PracticeSession } from "@/lib/storage"
import Metronome from "@/components/Metronome"
import TabDiagram from "@/components/TabDiagram"
import {
  WORKOUT_CATEGORIES, WORKOUT_PHILOSOPHY, WORKOUT_QUOTES, REST_BLOCK,
  TOTAL_WORKOUT_HOURS, hourRangeLabel,
  type WorkoutCategory,
} from "@/data/workout"

const alpha = (color: string, a: number) => `${color.slice(0, -1)} / ${a})`
const TAG_PREFIX = "Vai30h:"
const tagFor = (catId: string, cycle: 0 | 1 | 2) => `${TAG_PREFIX}${catId}:c${cycle}`
const CYCLES: (0 | 1 | 2)[] = [0, 1, 2]

const INTERVALS = [
  { semi: 1,  name: "2ª menor" },  { semi: 2,  name: "2ª mayor" },
  { semi: 3,  name: "3ª menor" },  { semi: 4,  name: "3ª mayor" },
  { semi: 5,  name: "4ª justa" },  { semi: 6,  name: "tritono" },
  { semi: 7,  name: "5ª justa" },  { semi: 8,  name: "6ª menor" },
  { semi: 9,  name: "6ª mayor" },  { semi: 10, name: "7ª menor" },
  { semi: 11, name: "7ª mayor" },  { semi: 12, name: "octava" },
]

function EarTrainer() {
  const [target, setTarget]     = useState<number | null>(null)
  const [guess, setGuess]       = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const playInterval = (semi: number) => {
    const root = 60
    const t0 = getAudioTime()
    playTone(root, t0 + 0.02, 0.55, 0.16)
    playTone(root + semi, t0 + 0.75, 0.55, 0.16)
  }

  const newRound = () => {
    const semi = 1 + Math.floor(Math.random() * 12)
    setTarget(semi); setGuess(null); setRevealed(false)
    playInterval(semi)
  }

  const pickGuess = (semi: number) => {
    if (revealed) return
    setGuess(semi)
    setRevealed(true)
  }

  const correct = target !== null && guess === target

  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
      background: "rgba(255,255,255,0.02)", padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "#fff" }}>Adivina el intervalo</div>
        <button onClick={newRound} style={{
          padding: "6px 14px", borderRadius: 999, cursor: "pointer",
          fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em",
          border: "1px solid oklch(0.78 0.14 295 / 0.5)", background: "oklch(0.78 0.14 295 / 0.14)",
          color: "oklch(0.78 0.14 295)",
        }}>
          {target === null ? "▶ REPRODUCIR" : "↻ OTRO"}
        </button>
      </div>

      {target !== null && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {INTERVALS.map(iv => {
              const isGuess   = guess === iv.semi
              const isTarget  = revealed && target === iv.semi
              const showGreen = isTarget
              const showRed   = revealed && isGuess && !correct
              return (
                <button key={iv.semi} onClick={() => pickGuess(iv.semi)} style={{
                  padding: "6px 10px", borderRadius: 7, cursor: revealed ? "default" : "pointer",
                  fontFamily: "var(--font-mono)", fontSize: 10.5,
                  border: `1px solid ${showGreen ? "oklch(0.75 0.16 145 / 0.6)" : showRed ? "oklch(0.68 0.18 25 / 0.6)" : "rgba(255,255,255,0.10)"}`,
                  background: showGreen ? "oklch(0.75 0.16 145 / 0.16)" : showRed ? "oklch(0.68 0.18 25 / 0.14)" : "rgba(255,255,255,0.04)",
                  color: showGreen ? "oklch(0.78 0.16 145)" : showRed ? "oklch(0.75 0.18 25)" : "rgba(255,255,255,0.65)",
                }}>
                  {iv.name}
                </button>
              )
            })}
          </div>
          <button onClick={() => playInterval(target)} style={{
            alignSelf: "flex-start", background: "none", border: "none", cursor: "pointer", padding: 0,
            fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)",
            textDecoration: "underline", textUnderlineOffset: 3,
          }}>
            repetir intervalo
          </button>
          {revealed && (
            <div style={{ fontSize: 12, color: correct ? "oklch(0.78 0.16 145)" : "oklch(0.75 0.18 25)" }}>
              {correct ? "✓ Correcto." : `✕ Era ${INTERVALS.find(i => i.semi === target)?.name}.`}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function EntrenamientoPage() {
  const [catId, setCatId]           = useState<WorkoutCategory["id"]>(WORKOUT_CATEGORIES[0].id)
  const [sessions, setSessions]     = useState<PracticeSession[]>([])
  const [optimistic, setOptimistic] = useState<Set<string>>(new Set())
  const [pending, setPending]       = useState<Set<string>>(new Set())
  const [bpm, setBpm]               = useState(70)

  useEffect(() => {
    getPracticeSessions().then(setSessions).catch(() => {})
  }, [])

  const category = WORKOUT_CATEGORIES.find(c => c.id === catId) ?? WORKOUT_CATEGORIES[0]

  // tag → ids de las sesiones ya guardadas en el servidor con ese tag
  const tagToIds = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const s of sessions) {
      if (!s.what?.startsWith(TAG_PREFIX)) continue
      const arr = m.get(s.what) ?? []
      arr.push(s.id)
      m.set(s.what, arr)
    }
    return m
  }, [sessions])

  const doneSet = useMemo(() => new Set([...tagToIds.keys(), ...optimistic]), [tagToIds, optimistic])

  const totalDoneHours = useMemo(() => {
    let total = 0
    for (const cat of WORKOUT_CATEGORIES) {
      for (const cycle of CYCLES) {
        if (doneSet.has(tagFor(cat.id, cycle))) total += cat.hoursPerCycle
      }
    }
    return total
  }, [doneSet])

  const markDone = useCallback(async (cat: WorkoutCategory, cycle: 0 | 1 | 2) => {
    const tag = tagFor(cat.id, cycle)
    if (doneSet.has(tag) || pending.has(tag)) return
    setPending(prev => new Set(prev).add(tag))
    setOptimistic(prev => new Set(prev).add(tag))
    try {
      const entry = await addPracticeSession({
        date:         new Date().toISOString().slice(0, 10),
        duration_min: cat.hoursPerCycle * 60,
        what:         tag,
        notes:        `30-Hour Workout · ${cat.title} · Ciclo ${cycle + 1}`,
        bpm:          null,
        mood:         null,
      })
      setSessions(prev => [entry, ...prev])
    } catch {
      setOptimistic(prev => { const n = new Set(prev); n.delete(tag); return n })
    } finally {
      setPending(prev => { const n = new Set(prev); n.delete(tag); return n })
    }
  }, [doneSet, pending])

  const unmarkDone = useCallback(async (cat: WorkoutCategory, cycle: 0 | 1 | 2) => {
    const tag = tagFor(cat.id, cycle)
    const ids = tagToIds.get(tag) ?? []
    if (ids.length === 0 || pending.has(tag)) return
    setPending(prev => new Set(prev).add(tag))
    try {
      await Promise.all(ids.map(id => deletePracticeSession(id)))
      setSessions(prev => prev.filter(s => s.what !== tag))
      setOptimistic(prev => { const n = new Set(prev); n.delete(tag); return n })
    } finally {
      setPending(prev => { const n = new Set(prev); n.delete(tag); return n })
    }
  }, [tagToIds, pending])

  const toggleHour = useCallback((cat: WorkoutCategory, cycle: 0 | 1 | 2) => {
    const tag = tagFor(cat.id, cycle)
    if (doneSet.has(tag)) unmarkDone(cat, cycle)
    else markDone(cat, cycle)
  }, [doneSet, markDone, unmarkDone])

  // Próxima hora pendiente en orden (ciclo → categoría), para dar un solo "qué sigue" claro
  // en vez de obligar a elegir entre 8 categorías × 3 ciclos cada vez.
  const nextPending = useMemo(() => {
    for (const cycle of CYCLES) {
      for (const cat of WORKOUT_CATEGORIES) {
        if (!doneSet.has(tagFor(cat.id, cycle))) return { cat, cycle }
      }
    }
    return null
  }, [doneSet])

  const detailRef = useRef<HTMLDivElement>(null)
  const startNext = useCallback(() => {
    if (!nextPending) return
    setCatId(nextPending.cat.id)
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }, [nextPending])

  const pct = Math.round((totalDoneHours / TOTAL_WORKOUT_HOURS) * 100)
  const motivational =
    totalDoneHours === 0        ? "Todavía no has marcado ninguna hora. Empieza por la que más te intimide."
    : totalDoneHours < 10       ? "Vas arrancando. La constancia importa mucho más que la velocidad."
    : totalDoneHours < 20       ? "Ya llevas un ciclo completo — la mitad del camino se siente distinta."
    : totalDoneHours < 30       ? "Estás cerca. No aflojes el enfoque en el último tramo."
    : "Completaste las 30 horas. Ahora vuelve a empezar, pero un poco más rápido y un poco más limpio."

  const quoteOfDay = WORKOUT_QUOTES[new Date().getDate() % WORKOUT_QUOTES.length]

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 900, margin: "0 auto" }}>

      {/* Hero */}
      <div style={{ paddingBottom: 4 }}>
        <div className="mc-eyebrow" style={{ marginBottom: 6 }}>Guitarra · Entrenamiento</div>
        <h1 className="mc-h1" style={{ fontSize: 44 }}>30 Horas</h1>
        <p className="mc-lede">
          Una rutina de práctica estructurada en 8 categorías repartidas en 3 ciclos de 10 horas —
          dedos, escalas, acordes, oído, lectura, composición, teoría y expresión libre.
        </p>
        <p style={{ marginTop: 8, fontSize: 11.5, color: "rgba(255,255,255,0.32)", fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}>
          Inspirado en el mítico &quot;30-Hour Path to Virtuoso Enlightenment&quot; de Steve Vai (Guitar World, 2004) — contenido y ejercicios propios de MaestroMusic.
        </p>
      </div>

      {/* Siguiente paso — un solo CTA claro en vez de tener que elegir categoría/ciclo */}
      {nextPending ? (
        <div className="mc-section" style={{
          background: `linear-gradient(135deg, ${alpha(nextPending.cat.color, 0.14)}, rgba(255,255,255,0.02))`,
          border: `1px solid ${alpha(nextPending.cat.color, 0.35)}`,
          borderRadius: 14, padding: "18px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        }}>
          <div>
            <span className="mc-eyebrow" style={{ color: nextPending.cat.color }}>Siguiente</span>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "#fff", marginTop: 4 }}>
              {nextPending.cat.title} · Ciclo {nextPending.cycle + 1} · Horas {hourRangeLabel(nextPending.cat, nextPending.cycle)}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{nextPending.cat.tagline}</div>
          </div>
          <button onClick={startNext} style={{
            flexShrink: 0, padding: "10px 22px", borderRadius: 999, cursor: "pointer",
            fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
            border: `1px solid ${alpha(nextPending.cat.color, 0.6)}`,
            background: alpha(nextPending.cat.color, 0.18), color: nextPending.cat.color,
          }}>
            ▶ EMPEZAR
          </button>
        </div>
      ) : (
        <div className="mc-section" style={{
          background: "linear-gradient(135deg, oklch(0.80 0.15 70 / 0.14), rgba(255,255,255,0.02))",
          border: "1px solid oklch(0.80 0.15 70 / 0.35)", borderRadius: 14, padding: "18px 20px",
        }}>
          <span className="mc-eyebrow" style={{ color: "oklch(0.80 0.15 70)" }}>Completaste las 30 horas</span>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "#fff", marginTop: 4 }}>
            Vuelve a empezar, un poco más rápido y un poco más limpio.
          </div>
        </div>
      )}

      {/* Progress summary */}
      <div className="mc-section" style={{
        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, padding: "16px 18px",
      }}>
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Tu progreso</span>
          <span className="mc-section-hint" style={{ fontVariantNumeric: "tabular-nums" }}>
            {totalDoneHours} / {TOTAL_WORKOUT_HOURS} horas
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`, borderRadius: 999,
            background: "linear-gradient(90deg, oklch(0.80 0.15 70), oklch(0.78 0.14 295))",
            transition: "width 0.3s",
          }} />
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{motivational}</p>
      </div>

      {/* Philosophy */}
      <div style={{
        borderLeft: "2px solid oklch(0.80 0.15 70 / 0.5)", paddingLeft: 18,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <span className="mc-eyebrow" style={{ color: "oklch(0.80 0.15 70)" }}>{WORKOUT_PHILOSOPHY.title}</span>
        {WORKOUT_PHILOSOPHY.paragraphs.map((p, i) => (
          <p key={i} style={{ margin: 0, fontSize: 13.5, color: "rgba(255,255,255,0.68)", lineHeight: 1.6 }}>{p}</p>
        ))}
      </div>

      {/* Tracker overview */}
      <div className="mc-section">
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Tracker de 30 horas</span>
          <span className="mc-section-hint">toca una celda para marcarla como completada</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "170px repeat(3, 1fr)", gap: 6, minWidth: 560 }}>
            <div />
            {CYCLES.map(c => (
              <div key={c} style={{
                textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 9.5,
                letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", paddingBottom: 4,
              }}>
                CICLO {c + 1} · HORAS {c * 10 + 1}–{c * 10 + 10}
              </div>
            ))}
            {WORKOUT_CATEGORIES.map(cat => (
              <Fragment key={cat.id}>
                <button onClick={() => setCatId(cat.id)} style={{
                  display: "flex", alignItems: "center", gap: 7, background: "none", border: "none",
                  cursor: "pointer", padding: "6px 4px", textAlign: "left",
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                  <span style={{
                    fontFamily: "var(--font-display)", fontSize: 13,
                    color: cat.id === catId ? cat.color : "rgba(255,255,255,0.75)",
                  }}>
                    {cat.title}
                  </span>
                </button>
                {CYCLES.map(cycle => {
                  const tag  = tagFor(cat.id, cycle)
                  const done = doneSet.has(tag)
                  const busy = pending.has(tag)
                  return (
                    <button key={cycle} onClick={() => toggleHour(cat, cycle)} disabled={busy}
                      title={done ? "Clic para deshacer" : "Marcar como completada"} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4,
                      padding: "7px 6px", borderRadius: 8, cursor: busy ? "wait" : "pointer",
                      fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700,
                      border: `1px solid ${done ? alpha(cat.color, 0.55) : "rgba(255,255,255,0.08)"}`,
                      background: done ? alpha(cat.color, 0.14) : "rgba(255,255,255,0.03)",
                      color: done ? cat.color : "rgba(255,255,255,0.4)",
                      opacity: busy ? 0.5 : 1,
                      transition: "all 0.12s",
                    }}>
                      <span>{done ? "✓ " : ""}{hourRangeLabel(cat, cycle)}</span>
                      {done && <span style={{ opacity: 0.6, fontSize: 9 }}>✕</span>}
                    </button>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="mc-section" style={{ gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {WORKOUT_CATEGORIES.map(c => {
            const active = c.id === catId
            return (
              <button key={c.id} onClick={() => setCatId(c.id)} style={{
                padding: "8px 15px", borderRadius: 999, cursor: "pointer",
                fontFamily: "var(--font-display)", fontSize: 13.5, letterSpacing: "-0.01em",
                border: `1px solid ${active ? alpha(c.color, 0.45) : "rgba(255,255,255,0.09)"}`,
                background: active ? alpha(c.color, 0.13) : "rgba(255,255,255,0.03)",
                color: active ? c.color : "rgba(255,255,255,0.65)",
                transition: "all 0.15s",
              }}>
                {c.title}
              </button>
            )
          })}
        </div>
      </div>

      {/* Category detail */}
      <div ref={detailRef} className="mc-section" style={{
        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, padding: "18px 20px 20px", gap: 16, scrollMarginTop: 24,
      }}>
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow" style={{ color: category.color }}>{category.title}</span>
          <span className="mc-section-hint">{category.tagline}</span>
        </div>

        {/* Hour badges + mark done */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)" }}>
            {category.hoursPerCycle === 1 ? "HORAS" : "BLOQUE DE 3H"}
          </span>
          {CYCLES.map(cycle => {
            const tag  = tagFor(category.id, cycle)
            const done = doneSet.has(tag)
            const busy = pending.has(tag)
            return (
              <button key={cycle} onClick={() => toggleHour(category, cycle)} disabled={busy}
                title={done ? "Clic para deshacer" : "Marcar como completada"} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 999, cursor: busy ? "wait" : "pointer",
                fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em",
                border: `1px solid ${done ? alpha(category.color, 0.55) : "rgba(255,255,255,0.10)"}`,
                background: done ? alpha(category.color, 0.14) : "rgba(255,255,255,0.04)",
                color: done ? category.color : "rgba(255,255,255,0.55)",
                opacity: busy ? 0.5 : 1,
                transition: "all 0.12s",
              }}>
                {done ? "✓" : "○"} Ciclo {cycle + 1} · h.{hourRangeLabel(category, cycle)}
                {done && <span style={{ opacity: 0.6, fontSize: 9 }}>· deshacer ✕</span>}
              </button>
            )
          })}
        </div>

        {/* Intro */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {category.intro.map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: 13.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{p}</p>
          ))}
        </div>

        {/* How to */}
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
            CÓMO HACERLO
          </div>
          <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            {category.howTo.map((step, i) => (
              <li key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.55 }}>{step}</li>
            ))}
          </ol>
        </div>

        {/* Tips */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {category.tips.map((tip, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              background: alpha(category.color, 0.06), border: `1px solid ${alpha(category.color, 0.18)}`,
              borderRadius: 10, padding: "10px 13px",
            }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", color: category.color, fontWeight: 700, paddingTop: 2 }}>
                TIP
              </span>
              <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </div>

        {/* Cross-links */}
        {category.links && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {category.links.map(l => (
              <a key={l.href} href={l.href} className="mc-btn-ghost" style={{ textDecoration: "none", fontSize: 12 }}>
                {l.label}
              </a>
            ))}
          </div>
        )}

        {/* Ear trainer */}
        {category.id === "oido" && <EarTrainer />}

        {/* Tab exercises */}
        {category.exercises && category.exercises.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)" }}>
                EJERCICIOS
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                <input type="range" min={30} max={160} value={bpm} onChange={e => setBpm(+e.target.value)}
                  className="mc-slider" style={{ width: 110 }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.5)", minWidth: 52 }}>
                  {bpm} BPM
                </span>
              </div>
            </div>
            {category.exercises.map(ex => (
              <TabDiagram key={ex.id} exercise={ex} bpm={bpm} />
            ))}
          </div>
        )}
      </div>

      {/* Standalone metronome */}
      <div className="mc-section">
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Metrónomo</span>
          <span className="mc-section-hint">práctica libre · úsalo con cualquier categoría</span>
        </div>
        <Metronome />
      </div>

      {/* Motivation */}
      <div className="mc-section" style={{
        background: "linear-gradient(135deg, oklch(0.80 0.15 70 / 0.07), oklch(0.78 0.14 295 / 0.05))",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px",
      }}>
        <span className="mc-eyebrow">Frase del día</span>
        <p style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 21,
          color: "#fff", lineHeight: 1.35, margin: "4px 0 14px", maxWidth: "60ch",
        }}>
          &ldquo;{quoteOfDay}&rdquo;
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {WORKOUT_QUOTES.filter(q => q !== quoteOfDay).map((q, i) => (
            <p key={i} style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
              — {q}
            </p>
          ))}
        </div>
      </div>

      {/* Rest */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 16,
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        <span className="mc-eyebrow">Horas {REST_BLOCK.hourRange} · {REST_BLOCK.title}</span>
        <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.42)", lineHeight: 1.6, maxWidth: "70ch" }}>
          {REST_BLOCK.text}
        </p>
      </div>

    </div>
  )
}
