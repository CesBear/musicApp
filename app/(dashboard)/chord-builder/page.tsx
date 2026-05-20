"use client"

import { useState } from "react"
import ChordDiagram from "@/components/ChordDiagram"
import { CHORD_VOICINGS, CHORD_TYPES, ROOT_NOTES, ChordType } from "@/data/chords"
import { GUITAR_TUNING, NOTE_NAMES, DEGREE_COLORS } from "@/data/scales"
import { playChord } from "@/lib/audio"

export default function ChordBuilderPage() {
  const [root, setRoot] = useState("A")
  const [type, setType] = useState<ChordType>("major")

  const voicing = CHORD_VOICINGS[root]?.[type]
  const typeInfo = CHORD_TYPES.find(t => t.type === type)!
  const chordSymbol = typeInfo.symbol

  const noteMap = NOTE_NAMES
  const chordNotes = voicing ? [...new Set(voicing.frets.map((f, i) => {
    if (f < 0) return null
    return noteMap[(GUITAR_TUNING[i] + f) % 12]
  }).filter(Boolean) as string[])] : []

  const handleStrum = () => { if (voicing) playChord(voicing.frets) }
  const orderedNotes = chordNotes.length ? [root, ...chordNotes.filter(n => n !== root)] : []

  return (
    <div className="flex flex-col gap-8">
      <div className="mc-hero">
        <div>
          <div className="mc-eyebrow">Estudio · Chord Builder</div>
          <h1 className="mc-h1">
            <span style={{ color: DEGREE_COLORS[0] }}>{root}</span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontStyle: "italic" }}>{chordSymbol || " mayor"}</span>
          </h1>
          <p className="mc-lede">Voicings, posiciones, digitación. Toca cada cuerda para escucharla.</p>
          <div className="mc-meta-row">
            <span className="mc-mono-tag">{typeInfo.description}</span>
            <span className="mc-meta-sep">·</span>
            <span className="mc-meta-text">{voicing?.barre ? `Cejilla en traste ${voicing.barre.fret}` : "Sin cejilla"}</span>
          </div>
        </div>
        <div className="mc-hero-aside">
          <button className="mc-play-btn" onClick={handleStrum}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 2 L11 7 L3 12 Z" fill="currentColor"/>
            </svg>
            Rasguear acorde
          </button>
        </div>
      </div>

      <div className="mc-section">
        <div className="mc-section-head"><span className="mc-eyebrow">Nota raíz</span></div>
        <div className="mc-note-row">
          {ROOT_NOTES.map(n => (
            <button key={n} onClick={() => setRoot(n)} className={`mc-note-pill ${root === n ? "active" : ""}`}>{n}</button>
          ))}
        </div>
      </div>

      <div className="mc-section">
        <div className="mc-section-head">
          <span className="mc-eyebrow">Tipo de acorde</span>
          <span className="mc-section-hint">{CHORD_TYPES.length} tipos disponibles</span>
        </div>
        {(["tríadas","séptimas","extendidos"] as const).map(group => {
          const items = CHORD_TYPES.filter(ct => ct.group === group)
          return (
            <div key={group} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", marginBottom: 8, textTransform: "uppercase" }}>{group}</p>
              <div className="mc-chord-types">
                {items.map(ct => (
                  <button key={ct.type} onClick={() => setType(ct.type)}
                    className={`mc-chord-type ${type === ct.type ? "active" : ""}`}>
                    <span className="mc-chord-type-label">{ct.label}</span>
                    <span className="mc-chord-type-formula">{ct.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mc-chord-main">
        <div className="mc-chord-diagram-card">
          {voicing ? (
            <ChordDiagram voicing={voicing} name={root} symbol={chordSymbol} size="lg" onPlay={handleStrum} />
          ) : (
            <div className="mc-empty-state"><p>Diagrama no disponible</p></div>
          )}
        </div>

        <div className="mc-chord-info">
          <div className="mc-info-card">
            <p className="mc-info-label">Notas únicas</p>
            <div className="mc-info-notes">
              {orderedNotes.map((n, i) => (
                <div key={i} className={`mc-note-circle ${i === 0 ? "root" : ""}`}
                     style={i === 0 ? { background: DEGREE_COLORS[0] } : {}}>
                  {n}
                </div>
              ))}
            </div>
          </div>

          {voicing && (
            <div className="mc-info-card">
              <p className="mc-info-label">Posiciones · Cuerda por cuerda</p>
              <div className="mc-strings">
                {["E","A","D","G","B","e"].map((s, i) => {
                  const fret = voicing.frets[i]
                  const finger = voicing.fingers[i]
                  return (
                    <div key={i} className="mc-string-col">
                      <div className={`mc-string-fret ${fret === -1 ? "muted" : fret === 0 ? "open" : "fingered"}`}>
                        {fret === -1 ? "×" : fret === 0 ? "○" : fret}
                      </div>
                      {finger > 0 && fret > 0 && <div className="mc-string-finger">D{finger}</div>}
                      <span className="mc-string-label">{s}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mc-finger-legend">
                <span>D1 índice</span><span>D2 medio</span><span>D3 anular</span><span>D4 meñique</span>
              </div>
            </div>
          )}

          <div className="mc-info-card mc-info-card-quiet">
            <p className="mc-info-label">Tips de práctica</p>
            <ul className="mc-tips">
              <li>Asegurate que cada cuerda suene limpia, una por una.</li>
              <li>Practicá el cambio al siguiente acorde de la progresión I–IV–V.</li>
              <li>Si hay cejilla, presioná cerca del traste — menos esfuerzo.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
