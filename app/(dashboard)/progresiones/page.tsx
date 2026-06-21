"use client"

import { useState, useRef, useEffect } from "react"
import { NOTE_NAMES, NOTE_NAMES_FLAT, DEGREE_COLORS } from "@/data/scales"
import { CIRCLE_NOTES } from "@/data/circle"
import { CHORD_VOICINGS, ChordVoicing } from "@/data/chords"
import { playGuitarString, playChord, scheduleChord } from "@/lib/audio"
import ChordDiagram from "@/components/ChordDiagram"

// ─── Types ───────────────────────────────────────────────────────────────────

type Quality = "major" | "minor" | "dim"
type Mode    = "major" | "minor"

type DiatonicChord = {
  degree:  string
  rootIdx: number
  quality: Quality
  name:    string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FUNC_COLOR: Record<string, string> = {
  "I":    "#c89535", "vi":   "#c89535", "i":    "#c89535",
  "♭III": "#c89535", "VI":   "#c89535",
  "IV":   "#4a7fc4", "ii":   "#4a7fc4", "iv":   "#4a7fc4", "♭VI":  "#4a7fc4",
  "V":    "#c4503a", "iii":  "#c4503a", "v":    "#c4503a", "♭VII": "#c4503a",
  "vii°": "#8b5ba8", "ii°":  "#8b5ba8",
}

const QUALITY_LABEL: Record<Quality, string> = {
  major: "MAY", minor: "MEN", dim: "DIM",
}

const PRESETS: Record<Mode, { label: string; degrees: number[] }[]> = {
  major: [
    { label: "I · IV · V",       degrees: [0, 3, 4]    },
    { label: "I · V · vi · IV",  degrees: [0, 4, 5, 3] },
    { label: "I · vi · IV · V",  degrees: [0, 5, 3, 4] },
    { label: "ii · V · I",       degrees: [1, 4, 0]    },
    { label: "I · IV · I · V",   degrees: [0, 3, 0, 4] },
  ],
  minor: [
    { label: "i · ♭VII · ♭VI",       degrees: [0, 6, 5]    },
    { label: "i · iv · v",            degrees: [0, 3, 4]    },
    { label: "i · ♭III · ♭VII · iv",  degrees: [0, 2, 6, 3] },
    { label: "i · v · ♭VI · ♭VII",    degrees: [0, 4, 5, 6] },
    { label: "i · ii° · v · i",       degrees: [0, 1, 4, 0] },
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPreferFlat(rootIdx: number): boolean {
  return (CIRCLE_NOTES.find(n => n.rootIdx === rootIdx)?.sharps ?? 0) < 0
}

function noteName(idx: number, flat: boolean): string {
  return flat ? NOTE_NAMES_FLAT[idx % 12] : NOTE_NAMES[idx % 12]
}

function getDiatonic(rootIdx: number, mode: Mode): DiatonicChord[] {
  const R  = rootIdx
  const fl = getPreferFlat(R)
  const n  = (i: number) => noteName((R + i) % 12, fl)
  if (mode === "major") return [
    { degree: "I",    rootIdx: R,         quality: "major", name: n(0)        },
    { degree: "ii",   rootIdx: (R+2)%12,  quality: "minor", name: n(2)  + "m" },
    { degree: "iii",  rootIdx: (R+4)%12,  quality: "minor", name: n(4)  + "m" },
    { degree: "IV",   rootIdx: (R+5)%12,  quality: "major", name: n(5)        },
    { degree: "V",    rootIdx: (R+7)%12,  quality: "major", name: n(7)        },
    { degree: "vi",   rootIdx: (R+9)%12,  quality: "minor", name: n(9)  + "m" },
    { degree: "vii°", rootIdx: (R+11)%12, quality: "dim",   name: n(11) + "°" },
  ]
  return [
    { degree: "i",    rootIdx: R,         quality: "minor", name: n(0)  + "m" },
    { degree: "ii°",  rootIdx: (R+2)%12,  quality: "dim",   name: n(2)  + "°" },
    { degree: "♭III", rootIdx: (R+3)%12,  quality: "major", name: n(3)        },
    { degree: "iv",   rootIdx: (R+5)%12,  quality: "minor", name: n(5)  + "m" },
    { degree: "v",    rootIdx: (R+7)%12,  quality: "minor", name: n(7)  + "m" },
    { degree: "♭VI",  rootIdx: (R+8)%12,  quality: "major", name: n(8)        },
    { degree: "♭VII", rootIdx: (R+10)%12, quality: "major", name: n(10)       },
  ]
}

function computeTriads(rootIdx: number, quality: "major" | "minor"): ChordVoicing[] {
  const TUNING = [40, 45, 50, 55, 59, 64]
  const third  = quality === "major" ? 4 : 3
  const T = [rootIdx % 12, (rootIdx + third) % 12, (rootIdx + 7) % 12]
  const groups: [number, number, number][] = [[3,4,5],[2,3,4],[1,2,3]]
  const result: ChordVoicing[] = []
  for (const group of groups) {
    for (let inv = 0; inv < 3; inv++) {
      const frets   = new Array(6).fill(-1)
      const fingers = new Array(6).fill(0)
      let prevPitch = TUNING[group[0]] - 1
      let valid = true
      for (let j = 0; j < 3; j++) {
        const s    = group[j]
        const open = TUNING[s]
        let fret   = (T[(inv + j) % 3] - open % 12 + 12) % 12
        let pitch  = open + fret
        while (pitch <= prevPitch) { fret += 12; pitch += 12 }
        if (fret > 12) { valid = false; break }
        frets[s] = fret; fingers[s] = j + 1; prevPitch = pitch
      }
      if (valid) result.push({ frets, fingers })
    }
  }
  return result
}

function getVoicings(rootIdx: number, quality: Quality): ChordVoicing[] {
  const sharp = NOTE_NAMES[rootIdx]
  const flat  = NOTE_NAMES_FLAT[rootIdx]
  const type  = quality === "major" ? "major" : quality === "minor" ? "minor" : null
  if (!type) return []
  const main   = CHORD_VOICINGS[sharp]?.[type] ?? CHORD_VOICINGS[flat]?.[type] ?? []
  const triads = computeTriads(rootIdx, type)
  return [...main, ...triads]
}

function playTriad(rootIdx: number, quality: Quality, offsetSec: number, maxDur?: number) {
  const low   = 12 * 3 + rootIdx
  const root  = 12 * 4 + rootIdx
  const third = quality === "major" ? 4 : 3
  const fifth = quality === "dim"   ? 6 : 7
  playGuitarString(low,          offsetSec,        0.10, maxDur)
  playGuitarString(root,         offsetSec + 0.03, 0.09, maxDur)
  playGuitarString(root + third, offsetSec + 0.06, 0.09, maxDur)
  playGuitarString(root + fifth, offsetSec + 0.09, 0.09, maxDur)
  playGuitarString(root + 12,    offsetSec + 0.12, 0.07, maxDur)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProgresionesPage() {
  const [rootIdx,     setRootIdx]     = useState(0)
  const [mode,        setMode]        = useState<Mode>("major")
  const [progression, setProgression] = useState<number[]>([])
  const [bpm,         setBpm]         = useState(80)
  const [beats,       setBeats]       = useState(2)
  const [repeats,     setRepeats]     = useState(2)
  const [playing,     setPlaying]     = useState(false)
  const [activeStep,  setActiveStep]  = useState(-1)
  const [selectedSlot,  setSelectedSlot]  = useState<number | null>(null)
  const [voicingIdxMap, setVoicingIdxMap] = useState<Record<number, number>>({})
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const [activeBeat, setActiveBeat] = useState(-1)
  const [dragIdx,    setDragIdx]    = useState<number | null>(null)
  const [dragOver,   setDragOver]   = useState<number | null>(null)

  // Initialize from URL params (e.g. coming from Círculo de Quintas)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const r = p.get("root"); const m = p.get("mode")
    if (r !== null && !isNaN(parseInt(r))) setRootIdx(parseInt(r))
    if (m === "major" || m === "minor") setMode(m)
  }, [])

  const chords  = getDiatonic(rootIdx, mode)
  const fl      = getPreferFlat(rootIdx)
  const keyName = noteName(rootIdx, fl) + (mode === "major" ? " Mayor" : " Menor")

  // Which slot to show in the diagram panel
  const displaySlot  = playing ? activeStep : selectedSlot
  const displayChord = displaySlot !== null && displaySlot >= 0 && displaySlot < progression.length
    ? chords[progression[displaySlot]]
    : null
  const voicings       = displayChord ? getVoicings(displayChord.rootIdx, displayChord.quality) : []
  const rawVoicingIdx  = displaySlot !== null ? (voicingIdxMap[displaySlot] ?? 0) : 0
  const safeVoicing    = rawVoicingIdx >= voicings.length ? 0 : rawVoicingIdx

  // ─── Actions ─────────────────────────────────────────────────────────────

  const resetKey = () => { stop(); setProgression([]); setSelectedSlot(null); setVoicingIdxMap({}) }

  const handleRootChange = (i: number) => { setRootIdx(i);  resetKey() }
  const handleModeChange = (m: Mode)   => { setMode(m);     resetKey() }

  const addChord = (degIdx: number) => {
    if (progression.length >= 8) return
    setProgression(p => [...p, degIdx])
  }

  const removeChord = (slotIdx: number) => {
    stop()
    setProgression(p => p.filter((_, i) => i !== slotIdx))
    setVoicingIdxMap(m => {
      const next: Record<number, number> = {}
      Object.entries(m).forEach(([k, v]) => {
        const ki = parseInt(k)
        if (ki < slotIdx) next[ki] = v
        else if (ki > slotIdx) next[ki - 1] = v
      })
      return next
    })
    setSelectedSlot(s => {
      if (s === null) return null
      if (s === slotIdx) return null
      return s > slotIdx ? s - 1 : s
    })
  }

  const selectSlot = (slotIdx: number) => {
    if (playing) return
    setSelectedSlot(s => s === slotIdx ? null : slotIdx)
  }

  const applyPreset = (degrees: number[]) => {
    stop()
    setProgression(degrees)
    setSelectedSlot(0)
    setVoicingIdxMap({})
  }

  const stop = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPlaying(false)
    setActiveStep(-1)
    setActiveBeat(-1)
  }

  const reorderSlots = (from: number, to: number) => {
    if (from === to) { setDragIdx(null); setDragOver(null); return }
    setProgression(prev => {
      const p = [...prev]; const [m] = p.splice(from, 1); p.splice(to, 0, m); return p
    })
    setVoicingIdxMap(m => {
      const arr = Array.from({ length: progression.length }, (_, i) => m[i] ?? 0)
      const [mv] = arr.splice(from, 1); arr.splice(to, 0, mv)
      const next: Record<number, number> = {}
      arr.forEach((v, i) => { if (v > 0) next[i] = v })
      return next
    })
    setSelectedSlot(s => {
      if (s === null) return null
      if (s === from) return to
      if (from < to && s > from && s <= to) return s - 1
      if (from > to && s >= to && s < from) return s + 1
      return s
    })
    setDragIdx(null); setDragOver(null)
  }

  const play = () => {
    if (playing) { stop(); return }
    if (progression.length === 0) return
    setPlaying(true)
    setSelectedSlot(null)
    timers.current = []

    const secsPerBeat  = 60 / bpm
    const secsPerChord = secsPerBeat * beats
    const total        = progression.length * repeats
    // Cap each chord's ring time to its own slot — otherwise notes (which can
    // naturally sustain up to 3.5s) pile up unkilled across chord changes and
    // the summed voices overwhelm the bus, which is heard as distortion/noise.
    const ringDur = Math.max(0.25, secsPerChord - 0.08)

    for (let rep = 0; rep < repeats; rep++) {
      progression.forEach((degIdx, step) => {
        const chord = chords[degIdx]
        const abs   = rep * progression.length + step
        const when  = abs * secsPerChord + 0.1

        // Use the saved guitar voicing; fall back to triad for dim chords
        const stepVoicings = getVoicings(chord.rootIdx, chord.quality)
        const savedV = voicingIdxMap[step] ?? 0
        const safeV  = savedV >= stepVoicings.length ? 0 : savedV
        if (stepVoicings.length > 0) {
          scheduleChord(stepVoicings[safeV].frets, when, undefined, ringDur)
        } else {
          playTriad(chord.rootIdx, chord.quality, when, ringDur)
        }

        timers.current.push(setTimeout(() => setActiveStep(step), when * 1000))
        for (let b = 0; b < beats; b++) {
          timers.current.push(
            setTimeout(() => setActiveBeat(b), (when + b * secsPerBeat) * 1000)
          )
        }
      })
    }

    const endT = setTimeout(() => { setPlaying(false); setActiveStep(-1); setActiveBeat(-1) },
      (total * secsPerChord + 0.5) * 1000)
    timers.current.push(endT)
  }

  const playDiagramChord = () => {
    if (!displayChord || voicings.length === 0) return
    playChord(voicings[safeVoicing].frets)
  }

  const changeBpm = (d: number) => setBpm(b => Math.max(30, Math.min(240, b + d)))

  // ─── Styles ──────────────────────────────────────────────────────────────

  const pill = (active: boolean, color?: string): React.CSSProperties => ({
    padding: "4px 11px",
    borderRadius: 6,
    fontSize: 10.5,
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.05em",
    border: active ? `1px solid ${color ?? DEGREE_COLORS[0]}` : "1px solid rgba(255,255,255,0.1)",
    background: active ? `${color ?? DEGREE_COLORS[0]}18` : "rgba(255,255,255,0.04)",
    color: active ? (color ?? DEGREE_COLORS[0]) : "rgba(255,255,255,0.55)",
    cursor: "pointer",
    transition: "all 0.15s",
  })

  const arrowBtn: React.CSSProperties = {
    width: 26, height: 26, borderRadius: 5,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, cursor: "pointer", flexShrink: 0,
  }

  const lbl: React.CSSProperties = {
    fontSize: 9, letterSpacing: "0.14em",
    color: "rgba(255,255,255,0.28)",
    fontFamily: "var(--font-mono)",
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-2">

      {/* Hero */}
      <div style={{ paddingBottom: 6, borderBottom: "1px solid var(--border-1)" }}>
        <div className="mc-eyebrow">Estudio · Progresiones</div>
        <h1 className="mc-h1" style={{ fontSize: "clamp(28px, 3vw, 40px)", margin: "2px 0 0" }}>
          <span style={{ color: DEGREE_COLORS[0] }}>{keyName.split(" ")[0]}</span>
          <span style={{ color: "rgba(255,255,255,0.95)", fontStyle: "italic" }}>
            {" "}{keyName.split(" ").slice(1).join(" ")}
          </span>
        </h1>
      </div>

      {/* Key + Mode */}
      <div className="mc-section" style={{ gap: 8 }}>
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 12 }}>
          <span className="mc-eyebrow">Tonalidad</span>
          <div className="mc-segmented">
            {(["major", "minor"] as const).map(m => (
              <button key={m} onClick={() => handleModeChange(m)} className={mode === m ? "active" : ""}>
                {m === "major" ? "Mayor" : "Menor"}
              </button>
            ))}
          </div>
        </div>
        <div className="mc-note-row">
          {NOTE_NAMES.map((n, i) => {
            const sharp = NOTE_NAMES[i]
            const flat  = NOTE_NAMES_FLAT[i]
            const dual  = sharp !== flat
            return (
              <button key={n} onClick={() => handleRootChange(i)}
                className={`mc-note-pill ${rootIdx === i ? "active" : ""}`}
                style={dual ? { display: "flex", flexDirection: "column", alignItems: "center", gap: 0, lineHeight: 1.15, padding: "6px 10px" } : undefined}>
                {dual ? (
                  <>
                    <span style={{ fontSize: 13 }}>{sharp}</span>
                    <span style={{ fontSize: 9.5, opacity: 0.55, fontFamily: "var(--font-mono)" }}>{flat}</span>
                  </>
                ) : sharp}
              </button>
            )
          })}
        </div>
      </div>

      {/* Chord Palette */}
      <div className="mc-section" style={{ gap: 8 }}>
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Acordes diatónicos</span>
          <span className="mc-section-hint">click para agregar · máx 8</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {chords.map((chord, i) => {
            const col = FUNC_COLOR[chord.degree] ?? "rgba(255,255,255,0.6)"
            return (
              <button key={i} onClick={() => addChord(i)}
                disabled={progression.length >= 8}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "flex-start",
                  padding: "7px 10px", borderRadius: 8, gap: 1,
                  border: `1px solid ${col}44`,
                  background: `${col}0d`,
                  cursor: progression.length >= 8 ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  opacity: progression.length >= 8 ? 0.45 : 1,
                  minWidth: 58,
                }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
                  letterSpacing: "0.1em", color: col }}>{chord.degree}</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 17, fontStyle: "italic",
                  fontWeight: 600, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  {chord.name}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 8,
                  color: "rgba(255,255,255,0.28)", letterSpacing: "0.08em" }}>
                  {QUALITY_LABEL[chord.quality]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Progression + Diagram panel */}
      <div className="mc-section" style={{ gap: 8 }}>
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Progresión</span>
          <span className="mc-section-hint">{progression.length} / 8 acordes</span>
          {progression.length > 0 && (
            <button onClick={() => { stop(); setProgression([]); setSelectedSlot(null) }}
              style={{ ...pill(false), padding: "3px 9px", fontSize: 9.5 }}>
              Limpiar
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Slots */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minHeight: 56 }}>
              {progression.length === 0 ? (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "100%", height: 56,
                  border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 8,
                  color: "rgba(255,255,255,0.2)", fontSize: 11,
                  fontFamily: "var(--font-mono)", letterSpacing: "0.1em",
                }}>
                  SELECCIONA ACORDES ARRIBA
                </div>
              ) : (
                progression.map((degIdx, slotIdx) => {
                  const chord    = chords[degIdx]
                  const col      = FUNC_COLOR[chord.degree] ?? "rgba(255,255,255,0.6)"
                  const isActive = playing && activeStep === slotIdx
                  const isSel    = !playing && selectedSlot === slotIdx
                  return (
                    <div key={slotIdx}
                      draggable={!playing}
                      onClick={() => selectSlot(slotIdx)}
                      onDragStart={() => setDragIdx(slotIdx)}
                      onDragOver={e => { e.preventDefault(); setDragOver(slotIdx) }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={e => { e.preventDefault(); if (dragIdx !== null) reorderSlots(dragIdx, slotIdx) }}
                      onDragEnd={() => { setDragIdx(null); setDragOver(null) }}
                      style={{
                        position: "relative",
                        display: "flex", flexDirection: "column", alignItems: "center",
                        padding: "8px 10px 6px", borderRadius: 8, minWidth: 54,
                        border: dragOver === slotIdx && dragIdx !== slotIdx
                          ? `1.5px dashed ${col}99`
                          : (isActive || isSel) ? `1.5px solid ${col}` : `1px solid ${col}44`,
                        background: (isActive || isSel) ? `${col}22` : `${col}0a`,
                        cursor: playing ? "default" : dragIdx !== null ? "grabbing" : "grab",
                        transition: "all 0.15s",
                        filter: isActive ? `drop-shadow(0 0 10px ${col}66)` : undefined,
                        opacity: dragIdx === slotIdx ? 0.4 : 1,
                      }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, fontWeight: 700,
                        letterSpacing: "0.1em", color: col, marginBottom: 2 }}>
                        {chord.degree}
                      </span>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontStyle: "italic",
                        fontWeight: 600, color: (isActive || isSel) ? "#fff" : "rgba(255,255,255,0.88)",
                        letterSpacing: "-0.02em", lineHeight: 1 }}>
                        {chord.name}
                      </span>
                      {isActive && beats > 1 && (
                        <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
                          {Array.from({ length: beats }).map((_, b) => (
                            <div key={b} style={{
                              width: 4, height: 4, borderRadius: "50%", flexShrink: 0,
                              background: activeBeat === b ? col : "rgba(255,255,255,0.15)",
                              transition: "background 0.06s",
                            }} />
                          ))}
                        </div>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); removeChord(slotIdx) }}
                        style={{
                          position: "absolute", top: 3, right: 4,
                          width: 14, height: 14, borderRadius: "50%",
                          border: "none", background: "transparent",
                          color: "rgba(255,255,255,0.25)", cursor: "pointer",
                          fontSize: 11, lineHeight: 1, display: "flex",
                          alignItems: "center", justifyContent: "center", padding: 0,
                        }}>×</button>
                    </div>
                  )
                })
              )}
            </div>

            {/* Presets */}
            <div>
              <span style={{ ...lbl, display: "block", marginBottom: 8 }}>PROGRESIONES POPULARES</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {PRESETS[mode].map((preset, i) => (
                  <button key={i} onClick={() => applyPreset(preset.degrees)}
                    style={{ ...pill(false), fontSize: 10 }}>
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

          {/* Chord diagram panel */}
          <div style={{
            alignSelf: "flex-start",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10,
            background: "rgba(255,255,255,0.03)",
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "10px 8px 8px",
            minHeight: 120,
          }}>
            {displayChord && voicings.length > 0 ? (
              <>
                <ChordDiagram
                  voicing={voicings[safeVoicing]}
                  name={displayChord.name}
                  size="xs"
                  onPlay={playDiagramChord}
                />
                {/* Position nav */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, marginTop: 10,
                }}>
                  <button
                    onClick={() => displaySlot !== null && setVoicingIdxMap(m => ({ ...m, [displaySlot]: (safeVoicing - 1 + voicings.length) % voicings.length }))}
                    style={{ ...arrowBtn, width: 22, height: 22, fontSize: 12 }}>‹</button>
                  <span style={{ ...lbl, fontSize: 9.5, color: "rgba(255,255,255,0.4)" }}>
                    {safeVoicing + 1} / {voicings.length}
                  </span>
                  <button
                    onClick={() => displaySlot !== null && setVoicingIdxMap(m => ({ ...m, [displaySlot]: (safeVoicing + 1) % voicings.length }))}
                    style={{ ...arrowBtn, width: 22, height: 22, fontSize: 12 }}>›</button>
                </div>
              </>
            ) : displayChord && voicings.length === 0 ? (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 8, padding: 8,
              }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontStyle: "italic",
                  color: "rgba(255,255,255,0.6)" }}>{displayChord.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9,
                  color: "rgba(255,255,255,0.2)", textAlign: "center", letterSpacing: "0.08em" }}>
                  SIN DIAGRAMA
                </span>
              </div>
            ) : (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" opacity={0.2}>
                  <rect x="4" y="8" width="6" height="12" rx="1.5" stroke="white" strokeWidth="1.4"/>
                  <rect x="11" y="8" width="6" height="12" rx="1.5" stroke="white" strokeWidth="1.4"/>
                  <rect x="18" y="8" width="6" height="12" rx="1.5" stroke="white" strokeWidth="1.4"/>
                </svg>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, textAlign: "center",
                  color: "rgba(255,255,255,0.18)", letterSpacing: "0.08em", lineHeight: 1.5 }}>
                  SELECCIONA<br/>UN ACORDE
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Playback */}
      <div className="mc-section" style={{ paddingBottom: 8 }}>
        <div className="mc-section-head">
          <span className="mc-eyebrow">Reproducción</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {/* BPM */}
        <button onClick={() => changeBpm(-5)} style={arrowBtn}>−</button>
        <input type="range" min={30} max={240} value={bpm}
          onChange={e => setBpm(+e.target.value)} className="mc-slider" style={{ width: 120 }}/>
        <button onClick={() => changeBpm(5)} style={arrowBtn}>+</button>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2, minWidth: 44 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16,
            color: "#fff", lineHeight: 1 }}>{bpm}</span>
          <span style={{ ...lbl, fontSize: 8 }}>BPM</span>
        </div>

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />

        {/* Beats */}
        <span style={{ ...lbl, fontSize: 8.5 }}>PULSOS</span>
        <div style={{ display: "flex", gap: 3 }}>
          {[1, 2, 4].map(b => (
            <button key={b} onClick={() => setBeats(b)}
              style={{ ...pill(beats === b), padding: "4px 10px" }}>{b}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />

        {/* Repeats */}
        <span style={{ ...lbl, fontSize: 8.5 }}>REPS</span>
        <div style={{ display: "flex", gap: 3 }}>
          {[1, 2, 4].map(r => (
            <button key={r} onClick={() => setRepeats(r)}
              style={{ ...pill(repeats === r), padding: "4px 10px" }}>{r}×</button>
          ))}
        </div>

          <button onClick={play} disabled={progression.length === 0} style={{
            marginLeft: "auto",
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 18px", borderRadius: 999,
            fontSize: 12, fontWeight: 700,
            cursor: progression.length === 0 ? "not-allowed" : "pointer",
            border: playing ? "1px solid rgba(255,80,80,0.4)" : `1px solid ${DEGREE_COLORS[0]}60`,
            background: playing ? "rgba(255,80,80,0.12)" : `${DEGREE_COLORS[0]}14`,
            color: playing ? "#ff6060" : DEGREE_COLORS[0],
            opacity: progression.length === 0 ? 0.4 : 1,
            transition: "all 0.15s",
          }}>
            {playing ? (
              <><svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <rect x="1" y="1" width="3" height="8" fill="currentColor"/>
                <rect x="6" y="1" width="3" height="8" fill="currentColor"/>
              </svg>Stop</>
            ) : (
              <><svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path d="M2 1L9 5 2 9Z" fill="currentColor"/>
              </svg>Reproducir</>
            )}
          </button>
        </div>
      </div>

    </div>
  )
}
