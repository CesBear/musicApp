"use client"

import { useState, useEffect } from "react"
import ChordDiagram from "@/components/ChordDiagram"
import { CHORD_VOICINGS, CHORD_TYPES, ROOT_NOTES, ChordType, ChordVoicing } from "@/data/chords"
import { GUITAR_TUNING, NOTE_NAMES, DEGREE_COLORS } from "@/data/scales"
import { playChord } from "@/lib/audio"

const ROMAN = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"]

function baseFretOf(v: ChordVoicing): number {
  const active = v.frets.filter(f => f > 0)
  return active.length ? Math.min(...active) : 0
}

function posLabel(v: ChordVoicing): string {
  const bf = baseFretOf(v)
  const fretStr = bf <= 1 ? "Abierta" : (ROMAN[bf] ?? `${bf}ª`)
  return v.shape ? `${v.shape} · ${fretStr}` : fretStr
}

export default function ChordBuilderPage() {
  const [root, setRoot] = useState("A")
  const [type, setType] = useState<ChordType>("major")
  const [posIdx, setPosIdx] = useState(0)

  const voicings = CHORD_VOICINGS[root]?.[type] ?? []
  const voicing  = voicings[posIdx] ?? voicings[0]

  // Reset position when chord changes
  useEffect(() => { setPosIdx(0) }, [root, type])

  const typeInfo    = CHORD_TYPES.find(t => t.type === type)!
  const chordSymbol = typeInfo.symbol

  const chordNotes = voicing ? [...new Set(voicing.frets.map((f, i) => {
    if (f < 0) return null
    return NOTE_NAMES[(GUITAR_TUNING[i] + f) % 12]
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

      {/* Position selector — shows all CAGED voicings for this chord */}
      {voicings.length > 1 && (
        <div className="mc-section">
          <div className="mc-section-head">
            <span className="mc-eyebrow">Posición en el mástil</span>
            <span className="mc-section-hint">{voicings.length} posiciones</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {voicings.map((v, i) => {
              const active = i === posIdx
              const bf = baseFretOf(v)
              return (
                <button
                  key={i}
                  onClick={() => { setPosIdx(i); playChord(v.frets) }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    gap: 3, padding: "10px 18px", borderRadius: 8, cursor: "pointer",
                    border: active ? `1px solid ${DEGREE_COLORS[0]}` : "1px solid rgba(255,255,255,0.1)",
                    background: active ? `${DEGREE_COLORS[0]}18` : "rgba(255,255,255,0.04)",
                    transition: "all 0.15s",
                  }}>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13,
                    color: active ? DEGREE_COLORS[0] : "rgba(255,255,255,0.85)",
                    letterSpacing: "0.06em",
                  }}>
                    {v.shape ?? "—"}
                  </span>
                  <span style={{
                    fontSize: 10, color: active ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
                    fontFamily: "var(--font-mono)", letterSpacing: "0.08em",
                  }}>
                    {bf <= 1 ? "ABIERTA" : `TRASTE ${bf}`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

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
                {["E","A","D","G","B","e"].map((str, i) => {
                  const fret = voicing.frets[i]
                  const finger = voicing.fingers[i]
                  return (
                    <div key={i} className="mc-string-col">
                      <div className={`mc-string-fret ${fret === -1 ? "muted" : fret === 0 ? "open" : "fingered"}`}>
                        {fret === -1 ? "×" : fret === 0 ? "○" : fret}
                      </div>
                      {finger > 0 && fret > 0 && <div className="mc-string-finger">D{finger}</div>}
                      <span className="mc-string-label">{str}</span>
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
