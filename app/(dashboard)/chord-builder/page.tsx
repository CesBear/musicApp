"use client"

import { Fragment, useState, useEffect, useCallback } from "react"
import ChordDiagram from "@/components/ChordDiagram"
import { CHORD_VOICINGS, CHORD_TYPES, ROOT_NOTES, ChordType, computeTriads, rootToIdx } from "@/data/chords"
import { GUITAR_TUNING, GUITAR_TUNING_MIDI, NOTE_NAMES, DEGREE_COLORS } from "@/data/scales"
import { playChord, playGuitarString } from "@/lib/audio"

const ACCENT = DEGREE_COLORS[0]
// "oklch(L C H)" → "oklch(L C H / a)"
const alpha = (color: string, a: number) => `${color.slice(0, -1)} / ${a})`

function baseFretOf(v: { frets: number[] }): number {
  const active = v.frets.filter(f => f > 0)
  return active.length ? Math.min(...active) : 0
}

function triadQuality(type: ChordType): "major" | "minor" {
  return (type === "minor" || type === "m7") ? "minor" : "major"
}

// Una tríada mayor/menor solo es un subconjunto válido de acordes que contienen 1-3-5:
// para sus2/sus4 (que reemplazan la 3ª) mostrarla sería enseñar notas equivocadas.
const TYPES_WITHOUT_TRIADS: ChordType[] = ["sus2", "sus4"]

function degreeLabel(interval: number, type: ChordType): string {
  const M: Record<number, string> = {
    0: "1", 1: "b9", 2: type === "sus2" ? "2" : "9", 3: "b3", 4: "3", 5: "4",
    6: "b5", 7: "5", 8: "#5", 9: "6", 10: "b7", 11: "7",
  }
  return M[interval] ?? ""
}

const GROUPS = ["tríadas", "séptimas", "extendidos"] as const

export default function ChordBuilderPage() {
  const [root, setRoot] = useState("A")
  const [type, setType] = useState<ChordType>("major")
  const [posIdx, setPosIdx] = useState(0)

  const mainVoicings  = CHORD_VOICINGS[root]?.[type] ?? []
  const extraVoicings = TYPES_WITHOUT_TRIADS.includes(type) ? [] : computeTriads(rootToIdx(root), triadQuality(type))
  const voicings      = [...mainVoicings, ...extraVoicings]
  const voicing       = voicings[posIdx] ?? voicings[0]

  useEffect(() => { setPosIdx(0) }, [root, type])

  const typeInfo    = CHORD_TYPES.find(t => t.type === type)!
  const chordSymbol = typeInfo.symbol

  const rootIdx = rootToIdx(root)
  const noteEntries = voicing
    ? [...new Map(voicing.frets.map((f, i) => {
        if (f < 0) return null
        const idx = (GUITAR_TUNING[i] + f) % 12
        const interval = (idx - rootIdx + 12) % 12
        return [idx, { note: NOTE_NAMES[idx], interval, degree: degreeLabel(interval, type) }] as const
      }).filter(Boolean) as [number, { note: string; interval: number; degree: string }][]).values()]
    : []
  const orderedNotes = [...noteEntries].sort((x, y) => x.interval - y.interval)

  const handleStrum = () => { if (voicing) playChord(voicing.frets) }
  const handleStringPlay = (stringIdx: number, fret: number) => {
    playGuitarString(GUITAR_TUNING_MIDI[stringIdx] + fret)
  }

  const goTo = useCallback((i: number, vs = voicings) => {
    setPosIdx(i)
    playChord(vs[i].frets)
  }, [voicings])
  const prev = useCallback(() => goTo((posIdx - 1 + voicings.length) % voicings.length), [goTo, posIdx, voicings.length])
  const next = useCallback(() => goTo((posIdx + 1) % voicings.length), [goTo, posIdx, voicings.length])

  // ← → navegan voicings
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === "ArrowLeft")  { e.preventDefault(); prev() }
      if (e.key === "ArrowRight") { e.preventDefault(); next() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [prev, next])

  const bf = voicing ? baseFretOf(voicing) : 0
  const mainLabel = voicing?.shape ? `FORMA ${voicing.shape}` : voicing?.label ? voicing.label.split(" · ")[0] : "TRÍADA"
  const subLabel  = voicing?.label ? voicing.label.split(" · ")[1] : bf <= 1 ? "ABIERTA" : `TRASTE ${bf}`

  const arrowStyle: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.75)",
    fontSize: 18, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.12s",
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Hero compacto ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap", paddingBottom: 14, borderBottom: "1px solid var(--border-1)" }}>
        <div>
          <div className="mc-eyebrow" style={{ marginBottom: 6 }}>Estudio · Chord Builder</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 400, letterSpacing: "-0.025em", lineHeight: 1, margin: 0 }}>
            <span style={{ color: ACCENT }}>{root}</span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontStyle: "italic" }}>{chordSymbol || " mayor"}</span>
          </h1>
          <div className="mc-meta-row" style={{ marginTop: 8 }}>
            <span className="mc-mono-tag">{typeInfo.description}</span>
            <span className="mc-meta-sep">·</span>
            <span className="mc-meta-text">{voicing?.barre ? `Cejilla en traste ${voicing.barre.fret}` : "Sin cejilla"}</span>
            <span className="mc-meta-sep">·</span>
            <span className="mc-meta-text" style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>← → cambia posición · click en cuerda para oírla</span>
          </div>
        </div>
        <button className="mc-play-btn" onClick={handleStrum}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 2 L11 7 L3 12 Z" fill="currentColor"/>
          </svg>
          Rasguear acorde
        </button>
      </div>

      {/* ── Raíz + tipo en una banda de controles ── */}
      <div className="mc-section" style={{ gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span className="mc-mono-mini" style={{ width: 38, flexShrink: 0 }}>RAÍZ</span>
          <div className="mc-note-row">
            {ROOT_NOTES.map(n => (
              <button key={n} onClick={() => setRoot(n)} className={`mc-note-pill ${root === n ? "active" : ""}`}>{n}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span className="mc-mono-mini" style={{ width: 38, flexShrink: 0 }}>TIPO</span>
          <div style={{ display: "flex", alignItems: "stretch", gap: 6, flexWrap: "wrap" }}>
            {GROUPS.map((group, gi) => (
              <Fragment key={group}>
                {gi > 0 && <span style={{ width: 1, background: "rgba(255,255,255,0.08)", margin: "4px 4px" }} />}
                {CHORD_TYPES.filter(ct => ct.group === group).map(ct => {
                  const active = type === ct.type
                  return (
                    <button key={ct.type} onClick={() => setType(ct.type)} title={ct.description} style={{
                      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1,
                      padding: "6px 12px", borderRadius: 9, cursor: "pointer", textAlign: "left",
                      border: `1px solid ${active ? alpha(ACCENT, 0.5) : "rgba(255,255,255,0.09)"}`,
                      background: active ? alpha(ACCENT, 0.12) : "rgba(255,255,255,0.03)",
                      transition: "all 0.13s",
                    }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: active ? ACCENT : "rgba(255,255,255,0.85)" }}>{ct.label}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.32)", letterSpacing: "0.02em" }}>{ct.description}</span>
                    </button>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── Diagrama + info ── */}
      <div className="mc-chord-main" style={{ gap: 20 }}>

        {/* Izquierda: navegación + diagrama */}
        <div className="mc-chord-diagram-card" style={{ flexDirection: "column", gap: 12, padding: "18px 20px 20px" }}>
          {voicing ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                <button onClick={prev} style={arrowStyle} aria-label="Voicing anterior">‹</button>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5, color: ACCENT, letterSpacing: "0.06em" }}>
                    {mainLabel}
                  </span>
                  <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
                    {subLabel}
                  </span>
                </div>
                <button onClick={next} style={arrowStyle} aria-label="Voicing siguiente">›</button>
              </div>

              <ChordDiagram voicing={voicing} name={root} symbol={chordSymbol} size="lg" onPlay={handleStrum} onStringPlay={handleStringPlay} />

              {/* Pips: voicings principales (acento) · tríadas (tenues) */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
                {voicings.map((v, i) => {
                  const isMain = i < mainVoicings.length
                  const sel = i === posIdx
                  return (
                    <button key={i} onClick={() => goTo(i)}
                      title={v.shape ? `Forma ${v.shape}` : v.label ?? "Tríada"}
                      style={{
                        width: isMain ? 9 : 7, height: isMain ? 9 : 7, borderRadius: "50%",
                        padding: 0, cursor: "pointer",
                        border: "none",
                        background: sel ? ACCENT : isMain ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.14)",
                        transition: "background 0.12s",
                      }} />
                  )
                })}
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "rgba(255,255,255,0.3)", marginLeft: 6, letterSpacing: "0.05em" }}>
                  {posIdx + 1}/{voicings.length}
                </span>
              </div>
            </>
          ) : (
            <div className="mc-empty-state"><p>Diagrama no disponible</p></div>
          )}
        </div>

        {/* Derecha: notas + digitación + tips */}
        <div className="mc-chord-info" style={{ gap: 12 }}>

          <div className="mc-info-card" style={{ padding: "14px 18px" }}>
            <p className="mc-info-label" style={{ marginBottom: 10 }}>Notas del acorde</p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {orderedNotes.map((n, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div className={`mc-note-circle ${i === 0 ? "root" : ""}`}
                       style={i === 0 ? { background: ACCENT } : {}}>
                    {n.note}
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: i === 0 ? ACCENT : "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>
                    {n.degree}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {voicing && (
            <div className="mc-info-card" style={{ padding: "14px 18px" }}>
              <p className="mc-info-label" style={{ marginBottom: 10 }}>Posiciones · cuerda por cuerda</p>
              <div className="mc-strings">
                {["E", "A", "D", "G", "B", "e"].map((str, i) => {
                  const fret = voicing.frets[i]
                  const finger = voicing.fingers[i]
                  return (
                    <div key={i} className="mc-string-col">
                      <div className={`mc-string-fret ${fret === -1 ? "muted" : fret === 0 ? "open" : "fingered"}`}>
                        {fret === -1 ? "×" : fret === 0 ? "○" : fret}
                      </div>
                      <div className="mc-string-finger" style={{ minHeight: 13 }}>{finger > 0 && fret > 0 ? `D${finger}` : ""}</div>
                      <span className="mc-string-label">{str}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mc-finger-legend" style={{ marginTop: 10 }}>
                <span>D1 índice</span><span>D2 medio</span><span>D3 anular</span><span>D4 meñique</span>
              </div>
            </div>
          )}

          <div className="mc-info-card mc-info-card-quiet" style={{ padding: "14px 18px" }}>
            <p className="mc-info-label" style={{ marginBottom: 8 }}>Tips de práctica</p>
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
