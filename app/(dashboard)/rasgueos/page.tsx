"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { playMetronomeClick, getAudioTime, getVisualLatencyMs } from "@/lib/audio"
import { playStroke, progressionOf } from "@/lib/rhythmAudio"
import Metronome from "@/components/Metronome"

import {
  CATEGORIES, THEORY, GENRE_GUIDE, ALL_PATTERNS, categoryOf,
  type Stroke, type StrumPattern,
} from "@/data/rhythms"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCENT = "oklch(0.80 0.14 40)"
const UP_C   = "oklch(0.65 0.18 230)"
const MUTE_C = "oklch(0.78 0.13 90)"
const BASS_C = "oklch(0.76 0.14 150)"

// "oklch(L C H)" → "oklch(L C H / a)"
const alpha = (color: string, a: number) => `${color.slice(0, -1)} / ${a})`

function subLabel(i: number, spb: number): { text: string; strong: boolean } {
  const beat = Math.floor(i / spb) + 1
  const pos  = i % spb
  if (pos === 0) return { text: String(beat), strong: true }
  if (spb === 2) return { text: "+", strong: false }
  if (spb === 3) return { text: pos === 1 ? "y" : "a", strong: false }
  return { text: pos === 1 ? "e" : pos === 2 ? "+" : "a", strong: false }
}

function strokeGlyph(s: Stroke): string {
  switch (s) {
    case "D": case "d": return "↓"
    case "U": case "u": return "↑"
    case "x": return "✕"
    case "B": return "B"
    case "b": return "b"
    case "P": return "P"
    default:  return "·"
  }
}

function strokeColor(s: Stroke, active: boolean): string {
  const dim = s === "d" || s === "u"
  switch (s) {
    case "D": case "d":
      return active ? ACCENT : `rgba(255,255,255,${dim ? 0.32 : 0.68})`
    case "U": case "u":
      return active ? UP_C : `rgba(255,255,255,${dim ? 0.26 : 0.48})`
    case "x":
      return active ? MUTE_C : "rgba(255,255,255,0.64)"
    case "B": case "b": case "P":
      return active ? BASS_C : alpha(BASS_C, s === "b" ? 0.7 : 0.9)
    default:
      return "rgba(255,255,255,0.17)"
  }
}

const LEVEL_LABEL: Record<1 | 2 | 3, string> = { 1: "Básico", 2: "Medio", 3: "Avanzado" }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RasgeosPage() {
  // "guia" y "teoria" son pestañas de contenido; el resto son categorías de patrones
  const [catId, setCatId]         = useState<string>("guia")
  const [pattern, setPattern]     = useState<StrumPattern>(CATEGORIES[0].patterns[0])
  const [bpm, setBpm]             = useState(70)
  const [playing, setPlaying]     = useState(false)
  const [activeSub, setActiveSub] = useState(-1)
  const [activeBar, setActiveBar] = useState(-1)
  const [clickOn, setClickOn]     = useState(true)
  const [trainerOn, setTrainerOn] = useState(false)

  const category = CATEGORIES.find(c => c.id === catId) ?? null
  const patternPanelRef = useRef<HTMLDivElement>(null)

  const schedulerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const nextNoteTimeRef = useRef(0)
  const currentSubRef   = useRef(0)
  const barsDoneRef     = useRef(0)
  const bpmRef          = useRef(bpm)
  const patternRef      = useRef(pattern)
  const playingRef      = useRef(false)
  const clickRef        = useRef(clickOn)
  const trainerRef      = useRef(trainerOn)

  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { patternRef.current = pattern }, [pattern])
  useEffect(() => { clickRef.current = clickOn }, [clickOn])
  useEffect(() => { trainerRef.current = trainerOn }, [trainerOn])

  const stop = useCallback(() => {
    playingRef.current = false
    if (schedulerRef.current) { clearInterval(schedulerRef.current); schedulerRef.current = null }
    setActiveSub(-1)
    setActiveBar(-1)
    setPlaying(false)
  }, [])

  const start = useCallback(() => {
    const p   = patternRef.current
    const t0  = getAudioTime() + 0.08

    // Count-in: one bar of clicks before the pattern when the click is on
    let loopStart = t0
    if (clickRef.current) {
      const beatDur = 60 / bpmRef.current
      for (let i = 0; i < p.beats; i++) {
        // "rim" is the only click that cuts through the distorted chug (see onset measurements)
        playMetronomeClick(i === 0 ? "accent" : "beat", t0 + i * beatDur, "rim")
      }
      loopStart = t0 + p.beats * beatDur
    }

    nextNoteTimeRef.current = loopStart
    currentSubRef.current   = 0
    barsDoneRef.current     = 0
    playingRef.current      = true

    schedulerRef.current = setInterval(() => {
      const now = getAudioTime()
      const pat = patternRef.current
      const spb = pat.subsPerBeat
      const d   = 60 / (bpmRef.current * spb)
      const total   = pat.strokes.length
      const progLen = progressionOf(pat).length

      while (nextNoteTimeRef.current < now + 0.12) {
        const s   = currentSubRef.current % total
        const bar = Math.floor(currentSubRef.current / total)

        // Tempo trainer: +4 BPM every 4 bars
        if (s === 0 && currentSubRef.current > 0) {
          barsDoneRef.current++
          if (trainerRef.current && barsDoneRef.current % 4 === 0) {
            setBpm(b => Math.min(200, b + 4))
          }
        }

        if (clickRef.current && s % spb === 0) {
          playMetronomeClick(s === 0 ? "accent" : "beat", nextNoteTimeRef.current, "rim")
        }
        playStroke(pat, s, bar, nextNoteTimeRef.current, now, d)

        const delayMs = Math.max(0, (nextNoteTimeRef.current - now) * 1000 + getVisualLatencyMs())
        setTimeout(() => { if (playingRef.current) setActiveSub(s) }, delayMs)
        if (s === 0) {
          const bIdx = bar % progLen
          setTimeout(() => { if (playingRef.current) setActiveBar(bIdx) }, delayMs)
        }

        currentSubRef.current++
        nextNoteTimeRef.current += d
      }
    }, 25)

    setPlaying(true)
  }, [])

  useEffect(() => () => { stop() }, [stop])

  const toggle = useCallback(() => {
    if (playingRef.current) stop()
    else start()
  }, [stop, start])

  // Space bar toggles playback (unless typing in an input / focused button)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (e.code === "Space" && !(t instanceof HTMLInputElement) && !(t instanceof HTMLButtonElement)) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [toggle])

  const selectPattern = (p: StrumPattern) => {
    const wasPlaying = playingRef.current
    stop()
    setPattern(p)
    patternRef.current = p
    if (wasPlaying) start()
  }

  // Desde la guía o la teoría: abre la categoría del patrón y lo selecciona
  const openPattern = (id: string) => {
    const p = ALL_PATTERNS.find(x => x.id === id)
    if (!p) return
    setCatId(categoryOf(id)?.id ?? CATEGORIES[0].id)
    selectPattern(p)
    setBpm(p.bpmHint)
    requestAnimationFrame(() => patternPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }

  const spb = pattern.subsPerBeat
  const beatGroups = Array.from({ length: pattern.beats }, (_, b) =>
    pattern.strokes.slice(b * spb, (b + 1) * spb)
  )
  const progression = progressionOf(pattern)

  const togglePill = (on: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 13px", borderRadius: 999, cursor: "pointer",
    fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.08em", fontWeight: 600,
    border: `1px solid ${on ? alpha(ACCENT, 0.5) : "rgba(255,255,255,0.145)"}`,
    background: on ? alpha(ACCENT, 0.12) : "rgba(255,255,255,0.06)",
    color: on ? ACCENT : "rgba(255,255,255,0.673)",
    transition: "all 0.15s",
  })

  return (
    <div className="flex flex-col gap-7" style={{ maxWidth: 900, margin: "0 auto" }}>

      {/* Hero */}
      <div style={{ paddingBottom: 4 }}>
        <div className="mc-eyebrow" style={{ marginBottom: 6 }}>Guitarra · Ritmo</div>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 400,
          color: "#fff", letterSpacing: "-0.03em", lineHeight: 1, margin: 0,
        }}>
          Rasgueo & Ritmo
        </h1>
        <p className="mc-lede" style={{ marginTop: 10 }}>
          Qué tocar cuando te piden un género: guía rápida, teoría del ritmo y 47 patrones
          con acordes que cambian por compás, metrónomo y entrenador de velocidad.
        </p>
        <p style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.56)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
          ↓ bajada · ↑ subida · pequeño = fantasma · ✕ chuck/scratch · B bajo · b bajo alternado · P pulgar + acorde · [espacio] = play
        </p>
      </div>

      {/* Category tabs */}
      <div className="mc-section" style={{ gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[{ id: "guia", label: "Guía por género" }, { id: "teoria", label: "Teoría" }, ...CATEGORIES].map(c => {
            const active = c.id === catId
            return (
              <button key={c.id} onClick={() => setCatId(c.id)} style={{
                padding: "8px 15px", borderRadius: 999, cursor: "pointer",
                fontFamily: "var(--font-display)", fontSize: 13.5, letterSpacing: "-0.01em",
                border: `1px solid ${active ? alpha(ACCENT, 0.45) : "rgba(255,255,255,0.132)"}`,
                background: active ? alpha(ACCENT, 0.13) : "rgba(255,255,255,0.048)",
                color: active ? ACCENT : "rgba(255,255,255,0.77)",
                transition: "all 0.15s",
              }}>
                {c.label}
              </button>
            )
          })}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
          {catId === "guia" ? "Elige el género que te piden: compás, tempo, dónde va el acento, la técnica y los patrones para tocarlo."
            : catId === "teoria" ? "Lo que hay detrás de cada patrón. Cada lección tiene ejemplos para escucharla."
            : category?.blurb}
        </p>
      </div>

      {/* Guía por género */}
      {catId === "guia" && (
        <div className="rz-guide">
          {GENRE_GUIDE.map(g => (
            <div key={g.genre} className="rz-genre">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 19, color: "#fff", lineHeight: 1.15 }}>{g.genre}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: ACCENT, whiteSpace: "nowrap" }}>{g.meter} · {g.bpm} BPM</span>
              </div>
              <dl className="rz-facts">
                <dt>Sensación</dt><dd>{g.feel}</dd>
                <dt>Acento</dt><dd>{g.accent}</dd>
                <dt>Técnica</dt><dd>{g.technique}</dd>
                <dt>Acordes</dt><dd>{g.chords}</dd>
              </dl>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {g.patterns.map(id => {
                  const p = ALL_PATTERNS.find(x => x.id === id)!
                  return <button key={id} className="rz-chip" onClick={() => openPattern(id)}>▶ {p.label}</button>
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teoría */}
      {catId === "teoria" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {THEORY.map((t, i) => (
            <div key={t.id} className="rz-lesson">
              <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: ACCENT }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 21, color: "#fff" }}>{t.title}</span>
              </div>
              {t.body.map((para, k) => <p key={k} style={{ margin: 0, fontSize: 14, color: "var(--text-1)", lineHeight: 1.6 }}>{para}</p>)}
              {t.count && <div className="rz-count">{t.count}</div>}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span className="mc-eyebrow">Escúchalo</span>
                {t.demos.map(id => {
                  const p = ALL_PATTERNS.find(x => x.id === id)!
                  return <button key={id} className="rz-chip" onClick={() => openPattern(id)}>▶ {p.label}</button>
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pattern cards */}
      {category && (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
        {category.patterns.map(p => {
          const selected = p.id === pattern.id
          return (
            <button key={p.id} onClick={() => selectPattern(p)} style={{
              background: selected ? alpha(ACCENT, 0.10) : "rgba(255,255,255,0.048)",
              border: `1px solid ${selected ? alpha(ACCENT, 0.45) : "rgba(255,255,255,0.12)"}`,
              borderRadius: 12, padding: "12px 13px", cursor: "pointer", textAlign: "left",
              display: "flex", flexDirection: "column", gap: 8,
              transition: "all 0.15s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <span style={{
                  fontFamily: "var(--font-display)", fontSize: 14, lineHeight: 1.2,
                  color: selected ? ACCENT : "#fff",
                }}>
                  {p.label}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "rgba(255,255,255,0.56)", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                  {p.timeSignature}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 2, whiteSpace: "nowrap", overflow: "hidden" }}>
                  {p.strokes.map((s, i) => (
                    <span key={i} style={{
                      color: strokeColor(s, false),
                      fontSize: s === "d" || s === "u" ? 8 : 10,
                      marginRight: (i + 1) % p.subsPerBeat === 0 ? 4 : 0,
                    }}>
                      {strokeGlyph(s)}
                    </span>
                  ))}
                </span>
                <span style={{ display: "flex", gap: 2.5, flexShrink: 0 }} title={LEVEL_LABEL[p.level]}>
                  {[1, 2, 3].map(l => (
                    <span key={l} style={{
                      width: 4.5, height: 4.5, borderRadius: "50%",
                      background: l <= p.level ? ACCENT : "rgba(255,255,255,0.17)",
                    }} />
                  ))}
                </span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.505)", letterSpacing: "0.05em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {progressionOf(p).join(" · ")}
              </span>
            </button>
          )
        })}
      </div>
      )}

      {/* Selected pattern: visualizer + info */}
      <div ref={patternPanelRef} className="mc-section" style={{ scrollMarginTop: 24,
        background: "rgba(255,255,255,0.041)", border: "1px solid rgba(255,255,255,0.105)",
        borderRadius: 14, padding: "16px 18px 18px",
      }}>
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow" style={{ color: ACCENT }}>{pattern.label}</span>
          <span className="mc-section-hint">
            {pattern.timeSignature} · {spb === 2 ? "corcheas" : spb === 3 ? "tresillos" : "semicorcheas"} · {LEVEL_LABEL[pattern.level]}{pattern.staccato ? " · staccato" : ""}{pattern.fingers ? " · con dedos" : ""} · {categoryOf(pattern.id)?.label}
          </span>
        </div>

        {/* Progresión de acordes (un acorde por compás) */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.12em", color: "rgba(255,255,255,0.505)" }}>
            ACORDES
          </span>
          {progression.map((name, i) => {
            const active = playing && activeBar === i
            return (
              <span key={i} style={{
                fontFamily: "var(--font-display)", fontSize: 15, fontStyle: "italic",
                padding: "3px 12px", borderRadius: 7,
                border: `1px solid ${active ? alpha(ACCENT, 0.65) : "rgba(255,255,255,0.132)"}`,
                background: active ? alpha(ACCENT, 0.16) : "rgba(255,255,255,0.048)",
                color: active ? ACCENT : "rgba(255,255,255,0.83)",
                transition: "all 0.1s",
              }}>
                {name}
              </span>
            )
          })}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>
            {progression.length > 1 ? "· 1 por compás" : "· acorde fijo"}
          </span>
        </div>

        {/* Visualizer grouped by beat */}
        <div style={{ display: "flex", gap: 10, padding: "2px 0 4px" }}>
          {beatGroups.map((group, b) => (
            <div key={b} style={{ flex: 1, display: "flex", gap: 4 }}>
              {group.map((stroke, j) => {
                const i        = b * spb + j
                const isActive = activeSub === i
                const label    = pattern.countLabels
                  ? { text: pattern.countLabels[i] || "·", strong: !!pattern.countLabels[i] }
                  : subLabel(i, spb)
                const isGhost  = stroke === "d" || stroke === "u"
                const activeBg =
                  stroke === "D" || stroke === "d" ? alpha(ACCENT, 0.20)
                  : stroke === "U" || stroke === "u" ? alpha(UP_C, 0.20)
                  : stroke === "x" ? alpha(MUTE_C, 0.18)
                  : stroke === "B" || stroke === "b" || stroke === "P" ? alpha(BASS_C, 0.2)
                  : "rgba(255,255,255,0.075)"
                const activeBorder =
                  stroke === "D" || stroke === "d" ? alpha(ACCENT, 0.7)
                  : stroke === "U" || stroke === "u" ? alpha(UP_C, 0.7)
                  : stroke === "x" ? alpha(MUTE_C, 0.65)
                  : stroke === "B" || stroke === "b" || stroke === "P" ? alpha(BASS_C, 0.7)
                  : "rgba(255,255,255,0.22)"
                return (
                  <div key={j} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.04em",
                      color: label.strong ? "rgba(255,255,255,0.707)" : "rgba(255,255,255,0.386)",
                      fontWeight: label.strong ? 700 : 400,
                    }}>
                      {label.text}
                    </span>
                    <div style={{
                      width: "100%", aspectRatio: "1", maxHeight: 52,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: 9,
                      background: isActive ? activeBg : stroke !== "-" ? "rgba(255,255,255,0.067)" : "transparent",
                      border: `1.5px solid ${isActive ? activeBorder : stroke !== "-" ? "rgba(255,255,255,0.145)" : "rgba(255,255,255,0.06)"}`,
                      transition: "background 0.05s, border-color 0.05s",
                    }}>
                      <span style={{
                        fontSize: stroke === "x" ? 15 : isGhost ? 15 : stroke === "-" ? 14 : "BbP".includes(stroke) ? 18 : 22,
                        fontFamily: "BbP".includes(stroke) ? "var(--font-mono)" : undefined, fontWeight: "BbP".includes(stroke) ? 700 : undefined,
                        lineHeight: 1, userSelect: "none",
                        color: strokeColor(stroke, isActive),
                        transition: "color 0.05s",
                      }}>
                        {strokeGlyph(stroke)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Description + tip + songs */}
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.752)", lineHeight: 1.55 }}>
          {pattern.desc}
        </p>
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-start",
          background: alpha(ACCENT, 0.06),
          border: `1px solid ${alpha(ACCENT, 0.18)}`,
          borderRadius: 10, padding: "10px 13px",
        }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.14em", color: ACCENT, fontWeight: 700, paddingTop: 2 }}>
            CONSEJO
          </span>
          <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.74)", lineHeight: 1.5 }}>
            {pattern.tip}
          </span>
        </div>
        {pattern.songs && (
          <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.584)", fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}>
            ♪ {pattern.songs}
          </p>
        )}
      </div>

      {/* Tempo + practice controls */}
      <div className="mc-section">
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Práctica</span>
          <span className="mc-section-hint" style={{ fontVariantNumeric: "tabular-nums" }}>{bpm} BPM</span>
          {bpm !== pattern.bpmHint && (
            <button onClick={() => setBpm(pattern.bpmHint)} style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.05em",
              color: "rgba(255,255,255,0.56)", textDecoration: "underline", textUnderlineOffset: 3,
            }}>
              sugerido: {pattern.bpmHint}
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="range" min={40} max={200} value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="mc-slider" style={{ flex: 1, accentColor: ACCENT }}
          />
          <button onClick={toggle} style={{
            background: playing ? "oklch(0.68 0.18 25 / 0.14)" : alpha(ACCENT, 0.14),
            border: `1px solid ${playing ? "oklch(0.68 0.18 25 / 0.5)" : alpha(ACCENT, 0.45)}`,
            borderRadius: 10, padding: "11px 28px",
            color: playing ? "oklch(0.75 0.18 25)" : ACCENT,
            fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.08em",
            cursor: "pointer", fontWeight: 700, minWidth: 112,
            transition: "all 0.15s",
          }}>
            {playing ? "◼  PARAR" : "▶  TOCAR"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setClickOn(v => !v)} style={togglePill(clickOn)} title="Click de metrónomo sobre el patrón (con 1 compás de conteo)">
            ♩ CLICK {clickOn ? "ON" : "OFF"}
          </button>
          <button onClick={() => setTrainerOn(v => !v)} style={togglePill(trainerOn)} title="Sube 4 BPM automáticamente cada 4 compases">
            ⤴ +BPM AUTO {trainerOn ? "ON" : "OFF"}
          </button>
          {trainerOn && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.56)", letterSpacing: "0.05em" }}>
              +4 BPM cada 4 compases · máx 200
            </span>
          )}
        </div>
      </div>

      {/* Standalone metronome */}
      <div className="mc-section">
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Metrónomo</span>
          <span className="mc-section-hint">práctica libre · compás y acentos configurables</span>
        </div>
        <Metronome />
      </div>

    </div>
  )
}
