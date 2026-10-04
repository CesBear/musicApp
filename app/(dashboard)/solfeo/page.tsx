"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Staff, { type StaffItem } from "@/components/Staff"
import FretboardNeck from "@/components/FretboardNeck"
import { playTone, playGuitarString } from "@/lib/audio"
import { GUITAR_TUNING_MIDI } from "@/data/scales"
import {
  LESSONS, MODES, LEVELS, FIGURES, SOLFEGE, LETTERS,
  n, midiOf, noteName, staffPos, placeName, makeQuestion,
  type Mode, type Question, type Acc, type Lesson,
} from "@/data/solfeo"

type NameSystem = "solfege" | "letters"
const TONE: Record<"a" | "b" | "c", string> = {
  a: "oklch(0.80 0.15 70)",
  b: "oklch(0.78 0.12 240)",
  c: "oklch(0.80 0.14 150)",
}
const OK = "oklch(0.80 0.16 145)"
const BAD = "oklch(0.74 0.17 25)"
const CHALLENGE_SECS = 60

function loadPref<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  try { const v = localStorage.getItem(key) as T | null; return v && allowed.includes(v) ? v : fallback } catch { return fallback }
}
function savePref(key: string, v: string) { try { localStorage.setItem(key, v) } catch { /**/ } }
const nowMs = () => Date.now()

function playWritten(q: Question, mode: Mode) {
  const midi = midiOf(q.note)
  // La guitarra suena una octava más grave de lo escrito
  if (mode === "guitar") playGuitarString(midi - 12, 0.02, 0.11, 1.6)
  else playTone(midi, 0.02, 0.9, 0.16)   // playTone recibe tiempo relativo (segundos desde ahora)
}

// ─── Aprender ─────────────────────────────────────────────────────────────────

function FiguresTable() {
  const play = (dur: number) => {
    // Un compás de 4/4 a 80 BPM lleno de la figura elegida
    const beat = 60 / 80
    const count = Math.round(4 / dur)
    for (let i = 0; i < count; i++) playTone(i === 0 ? 72 : 67, 0.05 + i * dur * beat, Math.max(0.08, dur * beat * 0.85), 0.14)
  }
  return (
    <div className="sf-figures">
      {FIGURES.map(f => (
        <div key={f.name} className="sf-figure">
          <span className="sf-glyph">{f.note}</span>
          <span className="sf-glyph sf-glyph-rest">{f.rest}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14.5, color: "var(--text-1)", fontWeight: 600 }}>{f.name}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>{f.beats} {f.beats === "1" ? "pulso" : "pulsos"}</div>
          </div>
          <button className="mc-btn-ghost" style={{ marginLeft: "auto", padding: "6px 12px" }} onClick={() => play(f.dur)}>▶ Compás</button>
        </div>
      ))}
    </div>
  )
}

function LessonCard({ lesson, index, system }: { lesson: Lesson; index: number; system: NameSystem }) {
  const items: StaffItem[] = (lesson.staff?.notes ?? []).map(ln => {
    const note = n(ln.note)
    return { note, clef: ln.clef, color: TONE[ln.tone ?? "a"], label: ln.label ?? noteName(note, system), stem: false }
  })
  return (
    <article className="sf-lesson">
      <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--mc-accent)" }}>{String(index + 1).padStart(2, "0")}</span>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 400, color: "#fff", margin: 0 }}>{lesson.title}</h2>
      </div>
      {lesson.body.map((p, i) => <p key={i} style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: "var(--text-1)" }}>{p}</p>)}
      {lesson.staff && (
        <div className="sf-staff-box">
          <Staff clef={lesson.staff.clef} items={items} numbering={lesson.staff.numbering} spacing={52}
            minWidth={lesson.staff.numbering ? 460 : 0} />
        </div>
      )}
      {lesson.figures && <FiguresTable />}
      {lesson.tip && (
        <div className="mm-goal"><span className="mm-goal-label">Clave</span><span>{lesson.tip}</span></div>
      )}
    </article>
  )
}

// ─── Practicar ────────────────────────────────────────────────────────────────

type Feedback = { ok: boolean; answer: string; place: string } | null

function Practice({ system }: { system: NameSystem }) {
  const [mode, setMode]   = useState<Mode>("treble")
  const [level, setLevel] = useState<1 | 2 | 3>(1)
  const [sound, setSound] = useState(true)
  const [q, setQ]         = useState<Question>(() => ({ note: n("G4"), clef: "treble" }))
  const [acc, setAcc]     = useState<Acc>(0)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [score, setScore] = useState({ ok: 0, total: 0, streak: 0 })
  const [best, setBest]   = useState(0)
  const [clicked, setClicked] = useState<{ s: number; f: number } | null>(null)
  // Desafío: aciertos en 60 s
  const [challengeEnd, setChallengeEnd] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [challengeResult, setChallengeResult] = useState<number | null>(null)
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bestKey = `mm-solfeo-best-${mode}-${level}`

  const next = useCallback((m: Mode = mode, l: 1 | 2 | 3 = level, prev?: Question) => {
    if (nextTimer.current) clearTimeout(nextTimer.current)
    const nq = makeQuestion(m, l, prev)
    setQ(nq); setFeedback(null); setAcc(0); setClicked(null)
    if (sound) playWritten(nq, m)
  }, [mode, level, sound])

  // Nueva pregunta y mejor racha guardada al cambiar de modo o nivel
  const switchTo = (m: Mode, l: 1 | 2 | 3) => {
    if (nextTimer.current) clearTimeout(nextTimer.current)
    setMode(m); setLevel(l)
    setQ(makeQuestion(m, l)); setFeedback(null); setAcc(0); setClicked(null)
    setScore({ ok: 0, total: 0, streak: 0 }); setChallengeEnd(null); setChallengeResult(null)
    try { setBest(Number(localStorage.getItem(`mm-solfeo-best-${m}-${l}`) ?? 0)) } catch { setBest(0) }
  }
  // Primera pregunta al azar (en el servidor se pinta un Sol fijo) y mejor racha guardada
  const [ready, setReady] = useState(false)
  if (!ready && typeof window !== "undefined") {
    setReady(true)
    setQ(makeQuestion(mode, level))
    try { setBest(Number(localStorage.getItem(bestKey) ?? 0)) } catch { /**/ }
  }
  const scoreRef = useRef(score)
  useEffect(() => { scoreRef.current = score }, [score])

  useEffect(() => {
    if (challengeEnd === null) return
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((challengeEnd - nowMs()) / 1000))
      setTimeLeft(left)
      if (left === 0) {
        setChallengeEnd(null)
        setChallengeResult(scoreRef.current.ok)
      }
    }, 200)
    return () => clearInterval(id)
  }, [challengeEnd])

  const answer = (correct: boolean) => {
    if (feedback) return
    const pos = staffPos(q.note, q.clef)
    setFeedback({ ok: correct, answer: noteName(q.note, system), place: placeName(pos) })
    setScore(s => {
      const streak = correct ? s.streak + 1 : 0
      if (streak > best) { setBest(streak); try { localStorage.setItem(bestKey, String(streak)) } catch { /**/ } }
      return { ok: s.ok + (correct ? 1 : 0), total: s.total + 1, streak }
    })
    if (sound && !correct) playWritten(q, mode)
    // Si acertó avanza solo; si falló, espera a que lea la corrección
    if (correct) nextTimer.current = setTimeout(() => next(mode, level, q), challengeEnd ? 450 : 900)
  }

  const answerStep = (step: number) => answer(step === q.note.step && acc === q.note.acc)

  const answerFret = (s: number, f: number) => {
    if (feedback) return
    setClicked({ s, f })
    answer(GUITAR_TUNING_MIDI[s] + f === midiOf(q.note) - 12)
  }

  // Teclado: C D E F G A B o 1–7; espacio/enter = siguiente
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (feedback && (e.key === " " || e.key === "Enter")) { e.preventDefault(); next(mode, level, q); return }
      if (mode === "guitar") return
      const k = e.key.toUpperCase()
      const step = LETTERS.indexOf(k) >= 0 ? LETTERS.indexOf(k) : "1234567".indexOf(e.key)
      if (step >= 0) answerStep(step)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const startChallenge = () => {
    setScore({ ok: 0, total: 0, streak: 0 }); setChallengeResult(null)
    setChallengeEnd(nowMs() + CHALLENGE_SECS * 1000); setTimeLeft(CHALLENGE_SECS)
    next(mode, level, q)
  }

  const sounding = midiOf(q.note) - 12
  const correctSpots = mode === "guitar"
    ? GUITAR_TUNING_MIDI.flatMap((open, s) => Array.from({ length: 13 }, (_, f) => f).filter(f => open + f === sounding).map(f => ({ s, f })))
    : []

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Modo y nivel */}
      <div className="sf-modes">
        {MODES.map(m => (
          <button key={m.id} className="sf-mode" data-on={mode === m.id || undefined} onClick={() => switchTo(m.id, level)}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)" }}>{m.label}</span>
            <span style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.4 }}>{m.desc}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div className="mm-seg" role="group" aria-label="Nivel">
          {LEVELS.map(l => (
            <button key={l.id} data-on={level === l.id || undefined} onClick={() => switchTo(mode, l.id)} title={l.desc}>{l.label}</button>
          ))}
        </div>
        <span style={{ fontSize: 13, color: "var(--text-2)" }}>{LEVELS.find(l => l.id === level)?.desc}</span>
        <button className="mc-btn-ghost" style={{ marginLeft: "auto" }} onClick={() => setSound(v => !v)}>
          {sound ? "🔊 Sonido" : "🔇 Sin sonido"}
        </button>
      </div>

      {/* Tarjeta del ejercicio */}
      <div className="sf-quiz">
        <div style={{ display: "flex", gap: 18, alignItems: "baseline", flexWrap: "wrap" }}>
          <span className="sf-stat"><b>{score.ok}</b>/{score.total} aciertos</span>
          <span className="sf-stat">racha <b>{score.streak}</b></span>
          <span className="sf-stat">mejor <b>{best}</b></span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {challengeEnd !== null
              ? <span className="sf-stat" style={{ color: "var(--mc-accent)" }}>⏱ <b>{timeLeft}</b> s</span>
              : <button className="mc-btn-ghost" onClick={startChallenge}>⏱ Desafío {CHALLENGE_SECS} s</button>}
            <button className="mc-btn-ghost" onClick={() => playWritten(q, mode)}>▶ Escuchar</button>
          </span>
        </div>

        {challengeResult !== null && challengeEnd === null && (
          <div className="mm-goal"><span className="mm-goal-label">Desafío</span>
            <span>{challengeResult} notas correctas en {CHALLENGE_SECS} segundos. {challengeResult >= 30 ? "¡Lectura fluida!" : challengeResult >= 15 ? "Muy bien, ya lees con soltura." : "Sigue practicando: la meta es 20."}</span>
          </div>
        )}

        <div className="sf-question">
          <Staff clef={mode === "grand" ? "grand" : q.clef} gap={16} spacing={110}
            items={[{ note: q.note, clef: q.clef, color: feedback ? (feedback.ok ? OK : BAD) : undefined }]} />
        </div>

        {mode === "guitar" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-2)" }}>
              Toca en el mástil dónde se toca esta nota (suena una octava más grave de lo escrito). Vale cualquier posición hasta el traste 12.
            </p>
            <FretboardNeck numFrets={12}>
              {({ sy, noteX, FW, SS, noteShadow }) => (
                <>
                  {GUITAR_TUNING_MIDI.map((_, s) => Array.from({ length: 13 }, (_, f) => (
                    <rect key={`${s}-${f}`} x={noteX(f) - FW / 2} y={sy(s) - SS / 2} width={FW} height={SS}
                      fill="transparent" style={{ cursor: feedback ? "default" : "pointer" }} onClick={() => answerFret(s, f)} />
                  )))}
                  {feedback && correctSpots.map(({ s, f }) => (
                    <g key={`ok-${s}-${f}`} style={{ pointerEvents: "none" }}>
                      <circle cx={noteX(f)} cy={sy(s)} r={13} fill={OK} filter={`url(#${noteShadow})`} />
                      <text x={noteX(f)} y={sy(s) + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize={9.5} fontWeight={700}
                        fill="#0a0a08" style={{ fontFamily: "var(--font-mono)" }}>{noteName(q.note, "letters")}</text>
                    </g>
                  ))}
                  {clicked && feedback && !feedback.ok && (
                    <circle cx={noteX(clicked.f)} cy={sy(clicked.s)} r={13} fill="none" stroke={BAD} strokeWidth={3} style={{ pointerEvents: "none" }} />
                  )}
                </>
              )}
            </FretboardNeck>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {level === 3 && (
              <div className="mm-seg" role="group" aria-label="Alteración" style={{ alignSelf: "center" }}>
                {([[-1, "♭ bemol"], [0, "natural"], [1, "♯ sostenido"]] as [Acc, string][]).map(([a, label]) => (
                  <button key={a} data-on={acc === a || undefined} onClick={() => setAcc(a)}>{label}</button>
                ))}
              </div>
            )}
            <div className="sf-answers">
              {SOLFEGE.map((_, step) => {
                const isRight = feedback && step === q.note.step
                return (
                  <button key={step} className="sf-answer" onClick={() => answerStep(step)} disabled={!!feedback}
                    data-state={isRight ? "ok" : undefined}>
                    <span>{system === "solfege" ? SOLFEGE[step] : LETTERS[step]}</span>
                    <small>{system === "solfege" ? LETTERS[step] : SOLFEGE[step]}</small>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="sf-feedback" data-state={feedback ? (feedback.ok ? "ok" : "bad") : undefined}>
          {feedback ? (
            <>
              <span>{feedback.ok ? "✓ Correcto:" : "✕ Era"} <b>{feedback.answer}</b> · {feedback.place}{q.clef === "bass" ? " (clave de fa)" : mode === "grand" ? " (clave de sol)" : ""}</span>
              {!feedback.ok && <button className="mc-play-btn" style={{ padding: "7px 16px" }} onClick={() => next(mode, level, q)}>Siguiente →</button>}
            </>
          ) : (
            <span style={{ color: "var(--text-3)" }}>
              {mode === "guitar" ? "Elige el traste y la cuerda en el mástil." : "Responde con los botones o con el teclado: C D E F G A B (o 1–7)."}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function SolfeoPage() {
  const [tab, setTab] = useState<"aprender" | "practicar">("aprender")
  const [system, setSystem] = useState<NameSystem>("solfege")
  const [prefLoaded, setPrefLoaded] = useState(false)
  if (!prefLoaded && typeof window !== "undefined") {
    setPrefLoaded(true)
    setSystem(loadPref("mm-solfeo-names", "solfege", ["solfege", "letters"] as const))
  }

  const changeSystem = (v: NameSystem) => { setSystem(v); savePref("mm-solfeo-names", v) }

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="mc-hero">
        <div>
          <div className="mc-eyebrow">Lectura · Solfeo</div>
          <h1 className="mc-h1">Solfeo</h1>
          <p className="mc-lede">
            Aprende a leer el pentagrama en clave de sol y en clave de fa, y practica hasta reconocer cada nota
            al instante, también en el mástil de la guitarra.
          </p>
        </div>
        <div className="mc-hero-aside" style={{ minWidth: 0 }}>
          <span className="mc-eyebrow">Nombres</span>
          <div className="mm-seg" role="group" aria-label="Nombres de las notas">
            <button data-on={system === "solfege" || undefined} onClick={() => changeSystem("solfege")}>Do Re Mi</button>
            <button data-on={system === "letters" || undefined} onClick={() => changeSystem("letters")}>C D E</button>
          </div>
        </div>
      </div>

      <div className="mm-seg" role="tablist" style={{ alignSelf: "flex-start" }}>
        <button role="tab" data-on={tab === "aprender" || undefined} onClick={() => setTab("aprender")} style={{ padding: "8px 18px", fontSize: 13 }}>Aprender · {LESSONS.length} lecciones</button>
        <button role="tab" data-on={tab === "practicar" || undefined} onClick={() => setTab("practicar")} style={{ padding: "8px 18px", fontSize: 13 }}>Practicar</button>
      </div>

      {tab === "aprender" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {LESSONS.map((l, i) => <LessonCard key={l.id} lesson={l} index={i} system={system} />)}
          <button className="mc-play-btn" style={{ alignSelf: "center" }} onClick={() => { setTab("practicar"); window.scrollTo({ top: 0, behavior: "smooth" }) }}>
            Empezar a practicar →
          </button>
        </div>
      ) : (
        <Practice system={system} />
      )}
    </div>
  )
}
