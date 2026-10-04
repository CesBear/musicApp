"use client"

import { useState, useEffect, useMemo, useCallback, useRef, useSyncExternalStore } from "react"
import { playTone, getAudioTime } from "@/lib/audio"
import { getPracticeSessions, addPracticeSession, deletePracticeSession, type PracticeSession } from "@/lib/storage"
import Metronome from "@/components/Metronome"
import TabDiagram, { type TabExercise } from "@/components/TabDiagram"
import {
  WORKOUT_PLAN, TOTAL_WORKOUT_HOURS, LEVELS, TAG_PREFIX, REST_NOTE, WORKOUT_PRINCIPLES, WORKOUT_QUOTES,
  blockMinutes, type PlannedSession, type SessionBlock,
} from "@/data/workout"

const alpha = (color: string, a: number) => `${color.slice(0, -1)} / ${a})`
const LEN_KEY = "mm-workout-len"

const INTERVALS: Record<number, string> = {
  1: "2ª menor", 2: "2ª mayor", 3: "3ª menor", 4: "3ª mayor", 5: "4ª justa", 6: "tritono",
  7: "5ª justa", 8: "6ª menor", 9: "6ª mayor", 10: "7ª menor", 11: "7ª mayor", 12: "octava",
}

const nowMs = () => Date.now()
const noopSubscribe = () => () => {}
const savedLen = (): 60 | 30 => {
  try { return localStorage.getItem(LEN_KEY) === "30" ? 30 : 60 } catch { return 60 }
}

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.max(0, Math.floor(sec % 60))).padStart(2, "0")}`

function chime(last: boolean) {
  const t0 = getAudioTime()
  playTone(76, t0 + 0.02, 0.4, 0.12)
  playTone(last ? 84 : 83, t0 + 0.22, 0.6, 0.12)
}

// ─── Entrenador de intervalos (con el subconjunto de cada nivel) ─────────────

function EarTrainer({ pool }: { pool: number[] }) {
  const [target, setTarget]     = useState<number | null>(null)
  const [guess, setGuess]       = useState<number | null>(null)
  const [score, setScore]       = useState({ ok: 0, total: 0 })
  const rootRef = useRef(60)

  const playInterval = (semi: number) => {
    const root = 55 + Math.floor(Math.random() * 8)
    const t0 = getAudioTime()
    playTone(root, t0 + 0.02, 0.55, 0.16)
    playTone(root + semi, t0 + 0.75, 0.55, 0.16)
    rootRef.current = root
  }

  const newRound = () => {
    const semi = pool[Math.floor(Math.random() * pool.length)]
    setTarget(semi); setGuess(null)
    playInterval(semi)
  }

  const pick = (semi: number) => {
    if (guess !== null || target === null) return
    setGuess(semi)
    setScore(s => ({ ok: s.ok + (semi === target ? 1 : 0), total: s.total + 1 }))
  }

  const replay = () => {
    if (target === null) return
    const t0 = getAudioTime()
    playTone(rootRef.current, t0 + 0.02, 0.55, 0.16)
    playTone(rootRef.current + target, t0 + 0.75, 0.55, 0.16)
  }

  return (
    <div className="mm-ear">
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button onClick={newRound} className="mc-play-btn" style={{ padding: "8px 16px" }}>
          {target === null ? "▶ Escuchar intervalo" : guess === null ? "↻ Otro" : "▶ Siguiente"}
        </button>
        {target !== null && <button onClick={replay} className="mc-btn-ghost">Repetir</button>}
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>
          {score.ok} / {score.total} correctas
        </span>
      </div>
      {target !== null && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {pool.map(semi => {
            const right = guess !== null && semi === target
            const wrong = guess === semi && semi !== target
            return (
              <button key={semi} onClick={() => pick(semi)} className="mm-chip" data-state={right ? "ok" : wrong ? "bad" : undefined}
                style={{ cursor: guess === null ? "pointer" : "default" }}>
                {INTERVALS[semi]}
              </button>
            )
          })}
        </div>
      )}
      {guess !== null && target !== null && (
        <div style={{ fontSize: 13, color: guess === target ? "oklch(0.80 0.16 145)" : "oklch(0.76 0.17 25)" }}>
          {guess === target ? "✓ Correcto." : `✕ Era ${INTERVALS[target]}.`}
        </div>
      )}
    </div>
  )
}

// ─── Ejercicio con su propio tempo ───────────────────────────────────────────

function Exercise({ exercise }: { exercise: TabExercise }) {
  const [bpm, setBpm] = useState(exercise.bpmHint ?? 70)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <TabDiagram exercise={exercise} bpm={bpm} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="mc-eyebrow">Tempo</span>
        <button className="mm-step-btn" onClick={() => setBpm(b => Math.max(30, b - 5))}>−5</button>
        <input type="range" min={30} max={180} value={bpm} onChange={e => setBpm(+e.target.value)} className="mc-slider" style={{ maxWidth: 200 }} />
        <button className="mm-step-btn" onClick={() => setBpm(b => Math.min(180, b + 5))}>+5</button>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-1)", minWidth: 64 }}>{bpm} BPM</span>
      </div>
    </div>
  )
}

function BlockBody({ block }: { block: SessionBlock }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--text-1)" }}>{block.do}</p>
      {block.goal && (
        <div className="mm-goal">
          <span className="mm-goal-label">Meta</span>
          <span>{block.goal}</span>
        </div>
      )}
      {block.exercise && <Exercise key={block.exercise.id} exercise={block.exercise} />}
      {block.earPool && <EarTrainer key={block.earPool.join(",")} pool={block.earPool} />}
      {block.link && (
        <a href={block.link.href} className="mc-btn-ghost" style={{ alignSelf: "flex-start", textDecoration: "none" }}>
          {block.link.label}
        </a>
      )}
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function EntrenamientoPage() {
  const [sessions, setSessions]     = useState<PracticeSession[]>([])
  const [loaded, setLoaded]         = useState(false)
  const [optimistic, setOptimistic] = useState<Set<string>>(new Set())
  const [pending, setPending]       = useState<Set<string>>(new Set())
  const [chosenHour, setChosenHour] = useState<number | null>(null)
  // Duración preferida: localStorage vía useSyncExternalStore (en el servidor, 60).
  const savedLenValue = useSyncExternalStore(noopSubscribe, savedLen, () => 60 as const)
  const [lenOverride, setLenOverride] = useState<60 | 30 | null>(null)
  const len = lenOverride ?? savedLenValue

  // Temporizador de la sesión
  const [running, setRunning]   = useState(false)
  const [blockIdx, setBlockIdx] = useState(0)
  const [remaining, setRemaining] = useState<number | null>(null)   // null = bloque sin empezar
  const [finished, setFinished] = useState(false)
  const endAtRef = useRef(0)

  useEffect(() => {
    getPracticeSessions().then(setSessions).catch(() => {}).finally(() => setLoaded(true))
  }, [])


  const tagToIds = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const s of sessions) {
      if (!s.what?.startsWith(TAG_PREFIX)) continue
      m.set(s.what, [...(m.get(s.what) ?? []), s.id])
    }
    return m
  }, [sessions])

  const isDone = useCallback((p: PlannedSession) =>
    optimistic.has(p.tag) || tagToIds.has(p.tag) || tagToIds.has(p.legacyTag), [optimistic, tagToIds])

  const doneCount = WORKOUT_PLAN.filter(isDone).length
  const nextPending = WORKOUT_PLAN.find(p => !isDone(p)) ?? null
  const current = WORKOUT_PLAN.find(p => p.hour === chosenHour) ?? nextPending ?? WORKOUT_PLAN[0]
  const blocks = current.session.blocks
  const blockSecs = (i: number) => blockMinutes(blocks[i], len) * 60

  // Al cambiar de sesión o de duración, el temporizador vuelve al inicio.
  const resetTimer = () => { setRunning(false); setFinished(false); setBlockIdx(0); setRemaining(null) }
  const left = remaining ?? blockSecs(blockIdx)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const secsLeft = Math.round((endAtRef.current - nowMs()) / 1000)
      if (secsLeft > 0) { setRemaining(secsLeft); return }
      setBlockIdx(i => {
        const next = i + 1
        if (next >= blocks.length) {
          chime(true); setRunning(false); setFinished(true); setRemaining(0)
          return i
        }
        chime(false)
        const secs = blockMinutes(blocks[next], len) * 60
        endAtRef.current = nowMs() + secs * 1000
        setRemaining(secs)
        return next
      })
    }, 250)
    return () => clearInterval(id)
  }, [running, blocks, len])

  const startPause = () => {
    if (running) { setRunning(false); return }
    if (finished) { setFinished(false); setBlockIdx(0); endAtRef.current = nowMs() + blockSecs(0) * 1000; setRemaining(blockSecs(0)) }
    else endAtRef.current = nowMs() + left * 1000
    setRunning(true)
  }

  const goToBlock = (i: number) => {
    setBlockIdx(i); setFinished(false)
    const secs = blockSecs(i)
    setRemaining(secs)
    endAtRef.current = nowMs() + secs * 1000
  }

  const totalLeft = left + blocks.slice(blockIdx + 1).reduce((a, _, k) => a + blockSecs(blockIdx + 1 + k), 0)

  const toggleDone = useCallback(async (p: PlannedSession) => {
    if (pending.has(p.tag)) return
    setChosenHour(p.hour)   // la sesión se queda abierta; "Siguiente" lleva a la próxima
    setPending(prev => new Set(prev).add(p.tag))
    try {
      if (isDone(p)) {
        const ids = [...(tagToIds.get(p.tag) ?? []), ...(tagToIds.get(p.legacyTag) ?? [])]
        await Promise.all(ids.map(id => deletePracticeSession(id)))
        setSessions(prev => prev.filter(s => s.what !== p.tag && s.what !== p.legacyTag))
        setOptimistic(prev => { const n = new Set(prev); n.delete(p.tag); return n })
      } else {
        setOptimistic(prev => new Set(prev).add(p.tag))
        const entry = await addPracticeSession({
          date:         new Date().toISOString().slice(0, 10),
          duration_min: len,
          what:         p.tag,
          notes:        `30 Horas · Hora ${p.hour} · ${p.cat.title}: ${p.session.title}`,
          bpm:          null,
          mood:         null,
        })
        setSessions(prev => [entry, ...prev])
      }
    } catch {
      setOptimistic(prev => { const n = new Set(prev); n.delete(p.tag); return n })
    } finally {
      setPending(prev => { const n = new Set(prev); n.delete(p.tag); return n })
    }
  }, [pending, isDone, tagToIds, len])

  const playerRef = useRef<HTMLDivElement>(null)
  const openHour = (hour: number) => {
    if (hour !== current.hour) resetTimer()
    setChosenHour(hour)
    requestAnimationFrame(() => playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }

  const setLength = (v: 60 | 30) => {
    if (v !== len) resetTimer()
    setLenOverride(v)
    try { localStorage.setItem(LEN_KEY, String(v)) } catch { /**/ }
  }

  const color = current.cat.color
  const done = isDone(current)
  const pct = Math.round((doneCount / TOTAL_WORKOUT_HOURS) * 100)
  const quote = WORKOUT_QUOTES[new Date().getDate() % WORKOUT_QUOTES.length]

  return (
    <div className="flex flex-col gap-8">

      {/* Hero */}
      <div className="mc-hero">
        <div>
          <div className="mc-eyebrow">Guitarra · Entrenamiento</div>
          <h1 className="mc-h1">30 Horas</h1>
          <p className="mc-lede">
            30 sesiones guiadas en 3 niveles. Cada una dura una hora (o media), viene dividida en bloques con
            temporizador y te dice exactamente qué tocar y cuándo está logrado.
          </p>
          <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
            Inspirado en el «30-Hour Path to Virtuoso Enlightenment» de Steve Vai · contenido propio de MaestroMusic
          </p>
        </div>
        <div className="mc-hero-aside" style={{ minWidth: 260 }}>
          <div className="mm-progress-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="mc-eyebrow">Tu progreso</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-1)" }}>
                {loaded ? `${doneCount} / ${TOTAL_WORKOUT_HOURS} h` : "…"}
              </span>
            </div>
            <div className="mm-bar"><div style={{ width: `${pct}%` }} /></div>
            <div style={{ display: "flex", gap: 6 }}>
              {LEVELS.map((lv, c) => {
                const total = WORKOUT_PLAN.filter(p => p.cycle === c).length
                const d = WORKOUT_PLAN.filter(p => p.cycle === c && isDone(p)).length
                return (
                  <div key={lv.name} style={{ flex: 1, fontSize: 11.5, color: "var(--text-3)" }}>
                    <div style={{ color: d === total ? "var(--mc-accent)" : "var(--text-2)" }}>{lv.name}</div>
                    <div style={{ fontFamily: "var(--font-mono)" }}>{d}/{total}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Cómo funciona */}
      <div className="mm-how">
        {[
          ["1", "Abre la sesión", "La siguiente hora pendiente ya está abierta abajo. También puedes elegir otra en el recorrido."],
          ["2", "Sigue los bloques", "Dale a Iniciar: el temporizador avanza solo de bloque en bloque y suena al cambiar."],
          ["3", "Cumple la meta", "Cada bloque dice cuándo está logrado. Al final, márcala como hecha."],
        ].map(([n, t, d]) => (
          <div key={n} className="mm-how-step">
            <span className="mm-how-num">{n}</span>
            <div>
              <div style={{ fontSize: 14, color: "var(--text-1)", fontWeight: 600 }}>{t}</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, marginTop: 2 }}>{d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Reproductor de sesión */}
      <div ref={playerRef} className="mm-player" style={{ borderColor: alpha(color, 0.4), scrollMarginTop: 24 }}>
        <div className="mm-player-head" style={{ background: `linear-gradient(135deg, ${alpha(color, 0.16)}, transparent 70%)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="mm-tag" style={{ color, borderColor: alpha(color, 0.45), background: alpha(color, 0.12) }}>{current.cat.title}</span>
            <span className="mc-eyebrow">Hora {current.hour} de {TOTAL_WORKOUT_HOURS} · Nivel {current.cycle + 1} · {LEVELS[current.cycle].name}</span>
            {current === nextPending && <span className="mc-eyebrow" style={{ color: "var(--mc-accent)" }}>· Siguiente</span>}
            {done && <span className="mc-eyebrow" style={{ color: "oklch(0.80 0.16 145)" }}>· ✓ Hecha</span>}
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 34, lineHeight: 1.05, margin: "10px 0 6px", color: "#fff" }}>
            {current.session.title}
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: "var(--text-2)", lineHeight: 1.5 }}>{current.session.focus}</p>

          {/* Controles */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
            <button onClick={startPause} className="mc-play-btn">
              {running ? "❚❚ Pausa" : finished ? "↻ Reiniciar" : blockIdx === 0 && remaining === null ? "▶ Iniciar sesión" : "▶ Continuar"}
            </button>
            <div style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
              <span style={{ fontSize: 26, color: "#fff" }}>{fmt(left)}</span>
              <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: 8 }}>bloque · {fmt(totalLeft)} total</span>
            </div>
            <div className="mm-seg" style={{ marginLeft: "auto" }} role="group" aria-label="Duración">
              {([60, 30] as const).map(v => (
                <button key={v} data-on={len === v || undefined} onClick={() => setLength(v)}>{v} min</button>
              ))}
            </div>
          </div>

          {/* Línea de tiempo */}
          <div className="mm-timeline">
            {blocks.map((b, i) => (
              <button key={i} onClick={() => goToBlock(i)} title={`${b.title} · ${blockMinutes(b, len)} min`}
                style={{ flex: blockMinutes(b, len) }}
                data-state={i < blockIdx || finished ? "past" : i === blockIdx ? "now" : undefined}>
                <span style={i === blockIdx && !finished ? { background: color } : undefined} />
              </button>
            ))}
          </div>
        </div>

        {/* Bloques */}
        <ol className="mm-blocks">
          {blocks.map((b, i) => {
            const isNow = i === blockIdx && !finished
            return (
              <li key={i} data-now={isNow || undefined} data-past={i < blockIdx || finished || undefined}>
                <button className="mm-block-head" onClick={() => goToBlock(i)}>
                  <span className="mm-block-num" style={isNow ? { background: color, color: "#0a0a08", borderColor: color } : undefined}>
                    {i < blockIdx || finished ? "✓" : i + 1}
                  </span>
                  <span style={{ fontSize: 15, color: "var(--text-1)", fontWeight: isNow ? 600 : 500 }}>{b.title}</span>
                  <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)" }}>
                    {blockMinutes(b, len)} min
                  </span>
                </button>
                {isNow && <div className="mm-block-body"><BlockBody block={b} /></div>}
              </li>
            )
          })}
        </ol>

        {/* Cierre */}
        <div className="mm-player-foot">
          <div>
            <div className="mc-eyebrow" style={{ marginBottom: 8 }}>Antes de marcarla</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
              {current.session.check.map(c => <li key={c} style={{ fontSize: 13.5, color: "var(--text-2)" }}>{c}</li>)}
            </ul>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => toggleDone(current)} disabled={pending.has(current.tag)}
              className={done ? "mc-btn-ghost" : "mc-play-btn"} style={{ opacity: pending.has(current.tag) ? 0.5 : 1 }}>
              {done ? "✓ Hecha · deshacer" : `✓ Marcar hora ${current.hour} como hecha`}
            </button>
            {done && nextPending && (
              <button onClick={() => openHour(nextPending.hour)} className="mc-play-btn">
                Siguiente: hora {nextPending.hour} →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recorrido */}
      <div className="mc-section">
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Recorrido</span>
          <span className="mc-section-hint">elige cualquier hora para abrirla</span>
        </div>
        <div className="mm-route">
          {LEVELS.map((lv, c) => (
            <div key={lv.name} className="mm-route-col">
              <div style={{ padding: "0 4px 8px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#fff" }}>Nivel {c + 1} · {lv.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>{lv.desc}</div>
              </div>
              {WORKOUT_PLAN.filter(p => p.cycle === c).map(p => {
                const d = isDone(p)
                return (
                  <button key={p.hour} onClick={() => openHour(p.hour)} className="mm-route-row"
                    data-current={p.hour === current.hour || undefined}>
                    <span className="mm-route-hour" style={d ? { background: alpha(p.cat.color, 0.2), color: p.cat.color, borderColor: alpha(p.cat.color, 0.5) } : undefined}>
                      {d ? "✓" : p.hour}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase", color: p.cat.color }}>
                        {p.cat.title}
                      </span>
                      <span style={{ display: "block", fontSize: 13.5, color: d ? "var(--text-3)" : "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.session.title}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Metrónomo libre */}
      <div className="mc-section">
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Metrónomo</span>
          <span className="mc-section-hint">para bloques sin tablatura e improvisación</span>
        </div>
        <Metronome />
      </div>

      {/* Principios */}
      <div className="mm-principles">
        <div>
          <span className="mc-eyebrow">Tres reglas</span>
          <ol style={{ margin: "10px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            {WORKOUT_PRINCIPLES.map(p => <li key={p} style={{ fontSize: 14, color: "var(--text-1)", lineHeight: 1.5 }}>{p}</li>)}
          </ol>
        </div>
        <div>
          <span className="mc-eyebrow">Frase del día</span>
          <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 21, color: "#fff", lineHeight: 1.35, margin: "8px 0 12px" }}>
            &ldquo;{quote}&rdquo;
          </p>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>{REST_NOTE}</p>
        </div>
      </div>

    </div>
  )
}
