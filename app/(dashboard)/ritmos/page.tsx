"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { RHYTHM_PRESETS, TRACK_LABELS, DrumPattern, RhythmPreset } from "@/data/rhythms"
import { playKick, playSnare, playHihat, getAudioTime } from "@/lib/audio"
import { DEGREE_COLORS } from "@/data/scales"

const TRACK_COLORS: Record<keyof DrumPattern, string> = {
  kick:      DEGREE_COLORS[0],
  snare:     DEGREE_COLORS[1],
  hihat:     DEGREE_COLORS[2],
  hihatOpen: DEGREE_COLORS[4],
}

const TRACKS: (keyof DrumPattern)[] = ["kick", "snare", "hihat", "hihatOpen"]

function fireTrack(track: keyof DrumPattern, when?: number) {
  if (track === "kick")      playKick(when)
  else if (track === "snare") playSnare(when)
  else if (track === "hihat") playHihat(false, when)
  else                        playHihat(true, when)
}

export default function RitmosPage() {
  const [presetIdx, setPresetIdx] = useState(0)
  const [pattern,   setPattern]   = useState<DrumPattern>(() => structuredClone(RHYTHM_PRESETS[0].pattern))
  const [steps,     setSteps]     = useState(RHYTHM_PRESETS[0].steps)
  const [bpm,       setBpm]       = useState(RHYTHM_PRESETS[0].bpm)
  const [playing,   setPlaying]   = useState(false)
  const [curStep,   setCurStep]   = useState(-1)

  // Load preset
  function loadPreset(preset: RhythmPreset, idx: number) {
    setPresetIdx(idx)
    setPattern(structuredClone(preset.pattern))
    setSteps(preset.steps)
    setBpm(preset.bpm)
    setCurStep(-1)
  }

  // Live refs for scheduler
  const liveRef    = useRef({ bpm, pattern, steps })
  liveRef.current  = { bpm, pattern, steps }
  const schedRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const nextTimeRef = useRef(0)
  const stepIdxRef  = useRef(0)

  const schedule = useCallback(() => {
    const LOOKAHEAD = 0.10
    const { bpm, pattern, steps } = liveRef.current
    const secPerStep = (60 / bpm) / 4   // quarter note / 4 = 16th note
    const audioNow   = getAudioTime()

    while (nextTimeRef.current < audioNow + LOOKAHEAD) {
      const step = stepIdxRef.current % steps
      TRACKS.forEach(track => {
        if (pattern[track][step]) fireTrack(track, nextTimeRef.current)
      })
      const delayMs = Math.max(0, (nextTimeRef.current - audioNow) * 1000)
      const s = step
      setTimeout(() => setCurStep(s), delayMs)
      nextTimeRef.current += secPerStep
      stepIdxRef.current++
    }
  }, [])

  useEffect(() => {
    if (playing) {
      nextTimeRef.current = getAudioTime() + 0.05
      stepIdxRef.current  = 0
      setCurStep(-1)
      schedRef.current = setInterval(schedule, 25)
    } else {
      if (schedRef.current) clearInterval(schedRef.current)
      schedRef.current = null
      setCurStep(-1)
    }
    return () => { if (schedRef.current) clearInterval(schedRef.current) }
  }, [playing, schedule])

  // Tap tempo
  const tapsRef = useRef<number[]>([])
  const handleTap = () => {
    const now = Date.now()
    tapsRef.current = [...tapsRef.current, now].filter(t => now - t < 3000).slice(-6)
    if (tapsRef.current.length >= 2) {
      const gaps = tapsRef.current.slice(1).map((t, i) => t - tapsRef.current[i])
      setBpm(Math.round(60000 / (gaps.reduce((a, b) => a + b) / gaps.length)))
    }
  }

  function toggleCell(track: keyof DrumPattern, i: number) {
    setPattern(prev => {
      const next = structuredClone(prev)
      next[track][i] = !next[track][i]
      return next
    })
  }

  const preset = RHYTHM_PRESETS[presetIdx]

  // Group steps visually in sets of 4
  function renderGrid(track: keyof DrumPattern) {
    const color = TRACK_COLORS[track]
    const cells = pattern[track].slice(0, steps)
    return (
      <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
        {cells.map((active, i) => {
          const isCur    = curStep === i
          const isGroup4 = i > 0 && i % 4 === 0
          return (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              {isGroup4 && <div style={{ width: 5 }} />}
              <button
                onClick={() => toggleCell(track, i)}
                style={{
                  width: 22, height: 22, borderRadius: 4,
                  border: isCur ? `2px solid #fff` : `1px solid ${active ? color + "80" : "rgba(255,255,255,0.08)"}`,
                  background: active
                    ? isCur ? color : color + "55"
                    : isCur ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  transition: "background 0.05s, border 0.05s",
                  flexShrink: 0,
                }}
              />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="mc-hero">
        <div>
          <div className="mc-eyebrow">Estudio · Ritmos</div>
          <h1 className="mc-h1">
            <span style={{ color: DEGREE_COLORS[0] }}>{preset.name}</span>
          </h1>
          <p className="mc-lede">Secuenciador de ritmos. Edita los patrones o toca sobre el loop.</p>
          <div className="mc-meta-row">
            <span className="mc-mono-tag">{preset.genre}</span>
            <span className="mc-meta-sep">·</span>
            <span className="mc-meta-text">{steps === 12 ? "3/4" : "4/4"} · {steps} pasos</span>
          </div>
        </div>

        {/* Transport */}
        <div className="mc-hero-aside">
          <button
            className={`mc-play-btn ${playing ? "on" : ""}`}
            onClick={() => setPlaying(v => !v)}
            style={playing ? { background: "rgba(255,80,80,0.15)", borderColor: "rgba(255,80,80,0.4)", color: "#ff6060" } : undefined}
          >
            {playing
              ? <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="1" width="3" height="10" fill="currentColor"/><rect x="7" y="1" width="3" height="10" fill="currentColor"/></svg> Detener</>
              : <><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2 L11 7 L3 12 Z" fill="currentColor"/></svg> Play</>
            }
          </button>
        </div>
      </div>

      {/* BPM + tap */}
      <div className="mc-section">
        <div className="mc-section-head"><span className="mc-eyebrow">Tempo</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input type="range" min="50" max="200" value={bpm}
            onChange={e => setBpm(+e.target.value)} className="mc-slider" style={{ flex: 1 }}/>
          <span className="mc-mono-tag" style={{ minWidth: 64, textAlign: "right" }}>{bpm} BPM</span>
          <button onClick={handleTap} className="mc-btn-ghost" style={{ fontSize: 11, padding: "5px 12px" }}>Tap</button>
        </div>
      </div>

      {/* Preset selector */}
      <div className="mc-section">
        <div className="mc-section-head">
          <span className="mc-eyebrow">Estilo</span>
          <button
            onClick={() => loadPreset(RHYTHM_PRESETS[presetIdx], presetIdx)}
            className="mc-btn-ghost"
            style={{ fontSize: 10, padding: "3px 8px" }}>
            Resetear patrón
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {RHYTHM_PRESETS.map((p, i) => (
            <button key={i} onClick={() => loadPreset(p, i)}
              className={`mc-pos-chip ${presetIdx === i ? "active" : ""}`}
              style={{ padding: "6px 14px" }}>
              {p.name}
              <span className="mc-pos-range">{p.bpm} BPM</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step sequencer grid */}
      <div className="mc-section">
        <div className="mc-section-head">
          <span className="mc-eyebrow">Secuenciador</span>
          <span className="mc-section-hint">Click en celdas para editar</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {TRACKS.map(track => (
            <div key={track} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{
                width: 58, fontSize: 10, fontFamily: "var(--font-mono)",
                letterSpacing: "0.1em", color: TRACK_COLORS[track],
                textAlign: "right", flexShrink: 0,
              }}>
                {TRACK_LABELS[track]}
              </span>
              {renderGrid(track)}
            </div>
          ))}
        </div>

        {/* Step number ruler */}
        <div style={{ display: "flex", gap: 3, paddingLeft: 72, marginTop: 6 }}>
          {Array.from({ length: steps }, (_, i) => {
            const isGroup4 = i > 0 && i % 4 === 0
            const isBeat   = i % 4 === 0
            return (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                {isGroup4 && <div style={{ width: 5 }} />}
                <span style={{
                  width: 22, textAlign: "center", fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  color: isBeat ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
                }}>
                  {isBeat ? Math.floor(i / 4) + 1 : ""}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mc-section">
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {TRACKS.map(track => (
            <div key={track} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: TRACK_COLORS[track] }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-mono)" }}>
                {TRACK_LABELS[track]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
