"use client"

import { useState } from "react"
import Fretboard from "@/components/Fretboard"
import Metronome from "@/components/Metronome"
import {
  NOTE_NAMES, SCALE_TYPES, SCALE_INFO, DEGREE_COLORS, DEGREE_LABELS,
  INTERVAL_NAMES, getNoteName, getScalePositions,
} from "@/data/scales"
import { playScale, playGuitarString } from "@/lib/audio"

export default function EscalasPage() {
  const [rootIdx,      setRootIdx]      = useState(9)
  const [scaleTypeIdx, setScaleTypeIdx] = useState(4)
  const [positionIdx,  setPositionIdx]  = useState<number | null>(null)
  const [displayMode,  setDisplayMode]  = useState<"notes" | "intervals">("notes")
  const [focusMode,    setFocusMode]    = useState(false)

  const scaleType      = SCALE_TYPES[scaleTypeIdx]
  const info           = SCALE_INFO[scaleType.name]
  const diatonicNotes  = scaleType.intervals.map(i => (rootIdx + i) % 12)
  const positions      = getScalePositions(rootIdx, scaleType.intervals)
  const activePosition = positionIdx !== null ? positions[positionIdx] : null

  const handleRoot  = (i: number) => { setRootIdx(i); setPositionIdx(null) }
  const handleScale = (i: number) => { setScaleTypeIdx(i); setPositionIdx(null) }
  const handlePlay  = () => playScale(rootIdx, scaleType.intervals, 3)

  const groups = [
    { label: "Diatónicas",    items: SCALE_TYPES.map((s, i) => ({ ...s, idx: i })).filter(s => s.group === "major" || s.group === "minor") },
    { label: "Pentatónicas",  items: SCALE_TYPES.map((s, i) => ({ ...s, idx: i })).filter(s => s.group === "pentatonic") },
    { label: "Modos griegos", items: SCALE_TYPES.map((s, i) => ({ ...s, idx: i })).filter(s => s.group === "mode") },
  ]

  return (
    <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>

      {/* ── Main content ── */}
      <div className="flex flex-col gap-6" style={{ flex: 1, minWidth: 0 }}>

        {/* Hero — without aside, just the left block */}
        <div style={{ paddingBottom: 18, borderBottom: "1px solid var(--border-1)" }}>
          <div className="mc-eyebrow">Estudio · Escalas</div>
          <h1 className="mc-h1">
            <span style={{ color: DEGREE_COLORS[0] }}>{NOTE_NAMES[rootIdx]}</span>
            <span style={{ color: "rgba(255,255,255,0.95)", fontStyle: "italic" }}> {scaleType.name}</span>
          </h1>
          <p className="mc-lede">{info.description}</p>
          <div className="mc-meta-row" style={{ alignItems: "center" }}>
            <span className="mc-mono-tag">{info.mood}</span>
            <span className="mc-meta-sep">·</span>
            <span className="mc-meta-text">{info.improv}</span>
            <button className="mc-play-btn" onClick={handlePlay} style={{ marginLeft: "auto", padding: "7px 16px", fontSize: 12 }}>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M3 2 L11 7 L3 12 Z" fill="currentColor"/>
              </svg>
              Escuchar escala
            </button>
          </div>
        </div>

        {/* Tonalidad */}
        <div className="mc-section">
          <div className="mc-section-head">
            <span className="mc-eyebrow">Tonalidad</span>
          </div>
          <div className="mc-note-row">
            {NOTE_NAMES.map((n, i) => (
              <button key={n} onClick={() => handleRoot(i)}
                className={`mc-note-pill ${rootIdx === i ? "active" : ""}`}>{n}</button>
            ))}
          </div>
        </div>

        {/* Escala */}
        <div className="mc-section">
          <div className="mc-section-head">
            <span className="mc-eyebrow">Familia · Escala</span>
          </div>
          <div className="mc-scale-groups">
            {groups.map(g => (
              <div key={g.label} className="mc-scale-group">
                <span className="mc-scale-group-label">{g.label}</span>
                <div className="mc-scale-chips">
                  {g.items.map(s => (
                    <button key={s.idx} onClick={() => handleScale(s.idx)}
                      className={`mc-scale-chip ${scaleTypeIdx === s.idx ? "active" : ""}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anatomy */}
        <div className="mc-scale-anatomy">
          <div className="mc-anatomy-item">
            <p className="mc-anatomy-label">Notas</p>
            <div className="mc-anatomy-notes">
              {diatonicNotes.map((n, i) => (
                <div key={i} className="mc-anatomy-note">
                  <span className="mc-anatomy-deg" style={{ color: DEGREE_COLORS[i] }}>{DEGREE_LABELS[i] ?? (i + 1)}</span>
                  <span className="mc-anatomy-noteName">{getNoteName(n)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mc-anatomy-divider" />
          <div className="mc-anatomy-item" style={{ minWidth: 180 }}>
            <p className="mc-anatomy-label">Fórmula interválica</p>
            <p className="mc-anatomy-intervals">{scaleType.intervals.map(i => INTERVAL_NAMES[i]).join(" · ")}</p>
          </div>
          <div className="mc-anatomy-divider" />
          <div className="mc-anatomy-item">
            <p className="mc-anatomy-label">Semitonos</p>
            <p className="mc-anatomy-intervals">{scaleType.intervals.join(" · ")}</p>
          </div>
        </div>

        {/* Mástil */}
        <div className="mc-section">
          <div className="mc-section-head">
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
              <span className="mc-eyebrow">Mástil · 24 trastes</span>
              <span className="mc-section-hint">{positionIdx !== null ? positions[positionIdx].label : "Vista completa"}</span>
            </div>
            <div className="mc-toolbar">
              <div className="mc-segmented">
                {(["notes", "intervals"] as const).map(mode => (
                  <button key={mode} onClick={() => setDisplayMode(mode)} className={displayMode === mode ? "active" : ""}>
                    {mode === "notes" ? "Notas" : "Intervalos"}
                  </button>
                ))}
              </div>
              <button onClick={() => setFocusMode(v => !v)} className={`mc-toggle ${focusMode ? "on" : ""}`}>
                <span className="mc-toggle-dot" /> Focus
              </button>
            </div>
          </div>

          <div className="mc-position-row">
            <button onClick={() => setPositionIdx(null)} className={`mc-pos-chip ${positionIdx === null ? "active" : ""}`}>Todas</button>
            {positions.map((pos, i) => (
              <button key={i} onClick={() => setPositionIdx(positionIdx === i ? null : i)}
                className={`mc-pos-chip ${positionIdx === i ? "active" : ""}`}>
                Pos. {i + 1}
                <span className="mc-pos-range">tr.{pos.startFret}–{pos.endFret}</span>
              </button>
            ))}
          </div>

          <Fretboard
            rootIdx={rootIdx}
            intervals={scaleType.intervals}
            position={activePosition}
            displayMode={displayMode}
            focusMode={focusMode}
            onNoteClick={(n) => playGuitarString(n.midi + 12, 0, 0.13)}
          />

          <div className="mc-legend">
            {diatonicNotes.map((n, i) => (
              <div key={i} className="mc-legend-item">
                <div className="mc-legend-dot" style={{ background: DEGREE_COLORS[i] }}>
                  <span>{DEGREE_LABELS[i] ?? (i + 1)}</span>
                </div>
                <span className="mc-legend-name">{getNoteName(n)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Metronome sticky column ── */}
      <div style={{ width: 272, flexShrink: 0, position: "sticky", top: 28 }}>
        <Metronome />
      </div>

    </div>
  )
}
