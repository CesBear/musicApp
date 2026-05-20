"use client"

import { useState } from "react"
import Fretboard from "@/components/Fretboard"
import {
  NOTE_NAMES, SCALE_TYPES, SCALE_INFO, DEGREE_COLORS, DEGREE_LABELS,
  MAJOR_TRIADS, MINOR_TRIADS, INTERVAL_NAMES,
  getNoteName, getScalePositions,
} from "@/data/scales"
import { playScale, playGuitarString } from "@/lib/audio"
import Metronome from "@/components/Metronome"

export default function EscalasPage() {
  const [rootIdx, setRootIdx] = useState(9)               // A
  const [scaleTypeIdx, setScaleTypeIdx] = useState(4)     // Pentatónica Menor
  const [positionIdx, setPositionIdx] = useState<number | null>(null)
  const [displayMode, setDisplayMode] = useState<"notes" | "intervals">("notes")
  const [focusMode, setFocusMode] = useState(false)
  const [activeStrings, setActiveStrings] = useState<Set<number> | null>(null)

  // String sets for triad visualization (indices: 0=low E … 5=high e)
  const STRING_SETS = [
    { label: "e · B · G",  strings: new Set([5, 4, 3]), name: "Cuerdas 1–3" },
    { label: "B · G · D",  strings: new Set([4, 3, 2]), name: "Cuerdas 2–4" },
    { label: "G · D · A",  strings: new Set([3, 2, 1]), name: "Cuerdas 3–5" },
    { label: "D · A · E",  strings: new Set([2, 1, 0]), name: "Cuerdas 4–6" },
  ]


  const scaleType = SCALE_TYPES[scaleTypeIdx]
  const info = SCALE_INFO[scaleType.name]
  const isMajor = scaleType.name === "Mayor"
  const isMinor = scaleType.name === "Menor Natural"
  const showTriads = isMajor || isMinor
  const triads = isMajor ? MAJOR_TRIADS : MINOR_TRIADS
  const diatonicNotes = scaleType.intervals.map(i => (rootIdx + i) % 12)
  const positions = getScalePositions(rootIdx, scaleType.intervals)
  const activePosition = positionIdx !== null ? positions[positionIdx] : null

  const handleRoot = (i: number) => { setRootIdx(i); setPositionIdx(null) }
  const handleScale = (i: number) => { setScaleTypeIdx(i); setPositionIdx(null) }
  const handlePlay = () => playScale(rootIdx, scaleType.intervals, 3)
  const groups = [
    { label: "Diatónicas",     items: SCALE_TYPES.map((s, i) => ({ ...s, idx: i })).filter(s => s.group === "major" || s.group === "minor") },
    { label: "Pentatónicas",   items: SCALE_TYPES.map((s, i) => ({ ...s, idx: i })).filter(s => s.group === "pentatonic") },
    { label: "Modos griegos",  items: SCALE_TYPES.map((s, i) => ({ ...s, idx: i })).filter(s => s.group === "mode") },
  ]

  return (
    <div className="flex flex-col gap-9">
      <div className="mc-hero">
        <div>
          <div className="mc-eyebrow">Estudio · Escalas</div>
          <h1 className="mc-h1">
            <span style={{ color: DEGREE_COLORS[0] }}>{NOTE_NAMES[rootIdx]}</span>
            <span style={{ color: "rgba(255,255,255,0.95)", fontStyle: "italic" }}> {scaleType.name}</span>
          </h1>
          <p className="mc-lede">{info.description}</p>
          <div className="mc-meta-row">
            <span className="mc-mono-tag">{info.mood}</span>
            <span className="mc-meta-sep">·</span>
            <span className="mc-meta-text">{info.improv}</span>
          </div>
        </div>

        <div className="mc-hero-aside">
          <button className="mc-play-btn" onClick={handlePlay}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 2 L11 7 L3 12 Z" fill="currentColor"/>
            </svg>
            Escuchar escala
          </button>

          <Metronome />
        </div>
      </div>

      <div className="mc-section">
        <div className="mc-section-head">
          <span className="mc-eyebrow">Tonalidad</span>
          <span className="mc-section-hint">12 tonos cromáticos</span>
        </div>
        <div className="mc-note-row">
          {NOTE_NAMES.map((n, i) => (
            <button key={n} onClick={() => handleRoot(i)} className={`mc-note-pill ${rootIdx === i ? "active" : ""}`}>{n}</button>
          ))}
        </div>
      </div>

      <div className="mc-section">
        <div className="mc-section-head">
          <span className="mc-eyebrow">Familia · Escala</span>
          <span className="mc-section-hint">{SCALE_TYPES.length} escalas disponibles</span>
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
        <div className="mc-anatomy-item" style={{ minWidth: 200 }}>
          <p className="mc-anatomy-label">Fórmula interválica</p>
          <p className="mc-anatomy-intervals">{scaleType.intervals.map(i => INTERVAL_NAMES[i]).join(" · ")}</p>
        </div>
        <div className="mc-anatomy-divider" />
        <div className="mc-anatomy-item">
          <p className="mc-anatomy-label">Semitonos</p>
          <p className="mc-anatomy-intervals">{scaleType.intervals.join(" · ")}</p>
        </div>
      </div>

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

        {/* Triad string-set selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <span className="mc-mono-mini" style={{ marginRight: 4 }}>TRÍADAS</span>
          <button
            onClick={() => setActiveStrings(null)}
            className={`mc-pos-chip ${activeStrings === null ? "active" : ""}`}
          >
            Todas las cuerdas
          </button>
          {STRING_SETS.map((ss) => {
            const isActive = activeStrings !== null && [...ss.strings].every(s => activeStrings.has(s))
            return (
              <button
                key={ss.label}
                onClick={() => setActiveStrings(isActive ? null : ss.strings)}
                className={`mc-pos-chip ${isActive ? "active" : ""}`}
              >
                {ss.label}
                <span className="mc-pos-range">{ss.name}</span>
              </button>
            )
          })}
          {activeStrings !== null && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono)" }}>
              · Hover un acorde abajo para ver su tríada
            </span>
          )}
        </div>

        <Fretboard
          rootIdx={rootIdx}
          intervals={scaleType.intervals}
          position={activePosition}
          displayMode={displayMode}
          focusMode={focusMode}
          activeStrings={activeStrings}
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

      {showTriads && (
        <div className="mc-section">
          <div className="mc-section-head">
            <span className="mc-eyebrow">Acordes diatónicos</span>
            <span className="mc-section-hint">Tríadas construidas sobre cada grado</span>
          </div>
          <div className="mc-diatonic-grid">
            {DEGREE_LABELS.map((deg, i) => {
              if (i >= triads.length) return null
              const chord = triads[i]
              const noteName = getNoteName(diatonicNotes[i])
              return (
                <div key={deg} className="mc-diatonic-card">
                  <span className="mc-diatonic-deg" style={{ color: DEGREE_COLORS[i] }}>{deg}{chord.quality === "dim" ? "°" : ""}</span>
                  <span className="mc-diatonic-chord">
                    {noteName}<span className="mc-diatonic-suffix">{chord.symbol}</span>
                  </span>
                  <span className="mc-diatonic-quality">{chord.quality}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
