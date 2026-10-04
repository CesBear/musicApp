"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { NOTE_NAMES, NOTE_NAMES_FLAT, DEGREE_COLORS } from "@/data/scales"
import { ALL_PATTERNS } from "@/data/rhythms"
import { playChord, scheduleChord, getAudioTime, getVisualLatencyMs, stopAllGuitarNotes } from "@/lib/audio"
import { playStrokeOnFrets } from "@/lib/rhythmAudio"
import { grooveFor, playBandStep, bassFromPc, setBandVolume } from "@/lib/band"
import {
  palette, voicingsFor, keyScales, keyName as keyTitle, PROGRESSION_PRESETS, IMPROV_CHALLENGES,
  type Mode, type HarmonyChord, type ChallengeFocus,
} from "@/lib/harmony"
import ChordDiagram from "@/components/ChordDiagram"
import Fretboard from "@/components/Fretboard"
import type { ChordVoicing } from "@/data/chords"

// ─── Constantes ───────────────────────────────────────────────────────────────

const FUNC_COLOR: Record<HarmonyChord["func"], string> = { T: "#c89535", S: "#4a7fc4", D: "#c4503a", color: "#8b5ba8" }
const FUNC_LEGEND = [
  { label: "tónica", color: FUNC_COLOR.T }, { label: "subdominante", color: FUNC_COLOR.S },
  { label: "dominante", color: FUNC_COLOR.D }, { label: "color", color: FUNC_COLOR.color },
]
const GROUPS: { id: HarmonyChord["group"]; label: string; hint: string }[] = [
  { id: "diatonic", label: "Diatónicos", hint: "los 7 acordes de la tonalidad · teclas 1–7" },
  { id: "borrowed", label: "Prestados", hint: "de la tonalidad paralela: color sin salir de la tónica" },
  { id: "secondary", label: "Dominantes secundarias", hint: "el V7 de otro acorde: lo hacen sonar como destino" },
]
const QUALITY_LABEL: Record<HarmonyChord["quality"], string> = { major: "MAY", minor: "MEN", dim: "DIM", maj7: "MAJ7", m7: "M7", "7": "DOM7", m7b5: "M7♭5" }

// Estilos de acompañamiento: un patrón de Rasgueos (o el acorde sostenido) + el groove de la banda
const FEELS: { id: string; label: string; pattern: string | null }[] = [
  { id: "sostenido", label: "Acorde sostenido", pattern: null },
  { id: "balada", label: "Balada", pattern: "balada" },
  { id: "pop", label: "Pop", pattern: "pop" },
  { id: "rock", label: "Rock", pattern: "rock" },
  { id: "funk", label: "Funk-pop", pattern: "kiko-stabs" },
  { id: "reggae", label: "Reggae", pattern: "reggae" },
  { id: "bossa", label: "Bossa nova", pattern: "bossa" },
  { id: "country", label: "Country", pattern: "country" },
]
const SUSTAIN_GROOVE = grooveFor(ALL_PATTERNS.find(p => p.id === "balada")!)

type ScaleView = "pent" | "key" | "chord"

function baseFretOf(v: ChordVoicing): number {
  const active = v.frets.filter(f => f > 0)
  return active.length ? Math.min(...active) : 0
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ProgresionesPage() {
  const [rootIdx, setRootIdx]       = useState(0)
  const [mode, setMode]             = useState<Mode>("major")
  const [sevenths, setSevenths]     = useState(false)
  const [progression, setProgression] = useState<string[]>([])
  const [bpm, setBpm]               = useState(80)
  const [beats, setBeats]           = useState(4)
  const [repeats, setRepeats]       = useState<number>(Infinity)
  const [feelId, setFeelId]         = useState("pop")
  const [bandOn, setBandOn]         = useState(true)
  const [bandVol, setBandVol]       = useState(0.8)
  const [playing, setPlaying]       = useState(false)
  const [activeStep, setActiveStep] = useState(-1)
  const [activeBeat, setActiveBeat] = useState(-1)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [voicingIdxMap, setVoicingIdxMap] = useState<Record<number, number>>({})
  const [dragIdx, setDragIdx]       = useState<number | null>(null)
  const [dragOver, setDragOver]     = useState<number | null>(null)
  const [scaleView, setScaleView]   = useState<ScaleView>("pent")
  const [labels, setLabels]         = useState<"notes" | "intervals">("notes")
  const [challengeIdx, setChallengeIdx] = useState(0)

  const chords = useMemo(() => palette(rootIdx, mode, sevenths), [rootIdx, mode, sevenths])
  const byId = useMemo(() => Object.fromEntries(chords.map(c => [c.id, c])), [chords])
  const diatonic = chords.filter(c => c.group === "diatonic")

  // Desde el Círculo de Quintas: ?root=7&mode=major
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const r = p.get("root"); const m = p.get("mode")
    // eslint-disable-next-line react-hooks/set-state-in-effect -- parámetros de la URL, solo existen en el navegador
    if (r !== null && !isNaN(parseInt(r))) setRootIdx(parseInt(r))
    if (m === "major" || m === "minor") setMode(m)
  }, [])

  // ─── Reproducción (scheduler con lookahead, como Rasgueos) ──────────────────
  const playingRef   = useRef(false)
  const schedRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const timers       = useRef<ReturnType<typeof setTimeout>[]>([])
  const nextTimeRef  = useRef(0)
  const stepRef      = useRef(0)
  const bpmRef       = useRef(bpm)
  const bandRef      = useRef(bandOn)
  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { bandRef.current = bandOn }, [bandOn])
  useEffect(() => { if (playing) setBandVolume(bandVol) }, [bandVol, playing])
  const cfgRef = useRef<{ ids: string[]; byId: Record<string, HarmonyChord>; voicings: Record<number, number>; feel: typeof FEELS[number]; beats: number; reps: number } | null>(null)

  const stop = useCallback(() => {
    playingRef.current = false
    if (schedRef.current) { clearInterval(schedRef.current); schedRef.current = null }
    timers.current.forEach(clearTimeout); timers.current = []
    stopAllGuitarNotes()
    setPlaying(false); setActiveStep(-1); setActiveBeat(-1)
  }, [])
  useEffect(() => () => stop(), [stop])

  const tick = useCallback(() => {
    const cfg = cfgRef.current
    if (!cfg || !playingRef.current) return
    const pat = cfg.feel.pattern ? ALL_PATTERNS.find(p => p.id === cfg.feel.pattern)! : null
    const spb = pat?.subsPerBeat ?? 1
    const barSteps = pat ? pat.strokes.length : 4
    const stepsPerChord = cfg.beats * spb
    const total = cfg.ids.length * stepsPerChord * cfg.reps
    const now = getAudioTime()
    const beatSec = 60 / bpmRef.current
    const d = beatSec / spb
    const groove = pat ? grooveFor(pat) : SUSTAIN_GROOVE
    while (nextTimeRef.current < now + 0.12) {
      const g = stepRef.current
      if (g >= total) {
        const end = (nextTimeRef.current - now + 0.3) * 1000
        timers.current.push(setTimeout(() => stop(), end))
        if (schedRef.current) { clearInterval(schedRef.current); schedRef.current = null }
        return
      }
      const slot = Math.floor(g / stepsPerChord) % cfg.ids.length
      const chord = cfg.byId[cfg.ids[slot]]
      const vs = voicingsFor(chord)
      const v = vs[Math.min(cfg.voicings[slot] ?? 0, vs.length - 1)]
      const rel = nextTimeRef.current - now
      if (!pat) {
        if (g % stepsPerChord === 0) scheduleChord(v.frets, rel, undefined, Math.max(0.25, cfg.beats * beatSec - 0.08))
      } else {
        playStrokeOnFrets(pat.strokes[g % barSteps], v.frets, rel, d, !!pat.staccato)
      }
      if (bandRef.current) playBandStep(groove, (g % barSteps) / spb, 1 / spb, rel, beatSec, bassFromPc(chord.rootIdx))
      if (g % spb === 0) {
        const beat = Math.floor((g % stepsPerChord) / spb)
        const delay = Math.max(0, rel * 1000 + getVisualLatencyMs())
        timers.current.push(setTimeout(() => { if (playingRef.current) { setActiveStep(slot); setActiveBeat(beat) } }, delay))
      }
      stepRef.current++
      nextTimeRef.current += d
    }
  }, [stop])

  const play = () => {
    if (playingRef.current) { stop(); return }
    if (progression.length === 0) return
    cfgRef.current = { ids: [...progression], byId, voicings: { ...voicingIdxMap }, feel: FEELS.find(f => f.id === feelId)!, beats, reps: repeats }
    stepRef.current = 0
    nextTimeRef.current = getAudioTime() + 0.1
    playingRef.current = true
    setPlaying(true); setSelectedSlot(null)
    setBandVolume(bandVol)
    schedRef.current = setInterval(tick, 25)
  }

  // ─── Edición de la progresión ──────────────────────────────────────────────
  const previewChord = (c: HarmonyChord, vIdx = 0) => {
    const vs = voicingsFor(c)
    if (vs.length) playChord(vs[Math.min(vIdx, vs.length - 1)].frets)
  }
  const addChord = (id: string) => {
    if (progression.length >= 8) return
    setProgression(p => [...p, id])
    if (!playingRef.current) previewChord(byId[id])
  }
  const removeChord = (slot: number) => {
    stop()
    setProgression(p => p.filter((_, i) => i !== slot))
    setVoicingIdxMap(m => {
      const next: Record<number, number> = {}
      Object.entries(m).forEach(([k, v]) => { const ki = +k; if (ki < slot) next[ki] = v; else if (ki > slot) next[ki - 1] = v })
      return next
    })
    setSelectedSlot(s => s === null || s === slot ? null : s > slot ? s - 1 : s)
  }
  const selectSlot = (slot: number) => {
    if (playing) return
    setSelectedSlot(s => {
      const next = s === slot ? null : slot
      if (next !== null) previewChord(byId[progression[slot]], voicingIdxMap[slot] ?? 0)
      return next
    })
  }
  const applyPreset = (ids: string[]) => {
    stop(); setProgression(ids); setSelectedSlot(0); setVoicingIdxMap({})
    previewChord(byId[ids[0]])
  }
  const reorderSlots = (from: number, to: number) => {
    if (from === to) { setDragIdx(null); setDragOver(null); return }
    setProgression(prev => { const p = [...prev]; const [m] = p.splice(from, 1); p.splice(to, 0, m); return p })
    setVoicingIdxMap(m => {
      const arr = Array.from({ length: progression.length }, (_, i) => m[i] ?? 0)
      const [mv] = arr.splice(from, 1); arr.splice(to, 0, mv)
      const next: Record<number, number> = {}
      arr.forEach((v, i) => { if (v > 0) next[i] = v })
      return next
    })
    setSelectedSlot(s => s === null ? null : s === from ? to : from < to && s > from && s <= to ? s - 1 : from > to && s >= to && s < from ? s + 1 : s)
    setDragIdx(null); setDragOver(null)
  }
  // Cambiar de raíz transpone la progresión (los ids son grados, no notas)
  const changeRoot = (i: number) => { stop(); setRootIdx(i); setVoicingIdxMap({}) }
  const changeMode = (m: Mode) => { stop(); setMode(m); setProgression([]); setSelectedSlot(null); setVoicingIdxMap({}) }

  // Atajos: [espacio] play/stop · [1-7] agrega grado · [⌫] quita el seleccionado
  const playRef = useRef(play)
  const addRef = useRef(addChord)
  const removeRef = useRef(removeChord)
  const selRef = useRef(selectedSlot)
  const diatonicRef = useRef(diatonic)
  useEffect(() => {
    playRef.current = play; addRef.current = addChord; removeRef.current = removeChord
    selRef.current = selectedSlot; diatonicRef.current = diatonic
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t instanceof HTMLInputElement) return
      if (e.code === "Space" && !(t instanceof HTMLButtonElement)) { e.preventDefault(); playRef.current() }
      else if (/^[1-7]$/.test(e.key)) addRef.current(diatonicRef.current[+e.key - 1].id)
      else if ((e.key === "Backspace" || e.key === "Delete") && selRef.current !== null) { e.preventDefault(); removeRef.current(selRef.current) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // ─── Lo que suena ahora (para el mapa y el diagrama) ────────────────────────
  const currentSlot = playing ? activeStep : selectedSlot ?? (progression.length ? 0 : -1)
  const current = currentSlot >= 0 ? byId[progression[currentSlot]] : null
  const next = currentSlot >= 0 && progression.length > 1 ? byId[progression[(currentSlot + 1) % progression.length]] : null
  const voicings = current ? voicingsFor(current) : []
  const vIdx = currentSlot >= 0 ? Math.min(voicingIdxMap[currentSlot] ?? 0, Math.max(0, voicings.length - 1)) : 0
  const voicing = voicings[vIdx]

  const challenge = IMPROV_CHALLENGES[challengeIdx]
  const ks = keyScales(rootIdx, mode)
  const scale = scaleView === "chord" && current ? current.scale : scaleView === "key" ? ks[1] : ks[0]
  const emphasis = (focus: ChallengeFocus): number[] | null => {
    if (!current) return null
    if (focus === "chord") return current.tones
    if (focus === "third") return [current.tones[1]]
    if (focus === "root") return [current.tones[0]]
    if (focus === "next") return next ? next.tones : current.tones
    return null
  }
  const emph = emphasis(challenge.focus)
  // Las notas resaltadas siempre se dibujan, aunque no estén en la escala elegida (p. ej. un prestado)
  const mapIntervals = [...new Set([...scale.intervals, ...(emph ?? []).map(t => (t - scale.rootIdx + 12) % 12)])].sort((a, b) => a - b)
  const toneNames = (c: HarmonyChord) => c.toneNames.join(" · ")

  // ─── Estilos ───────────────────────────────────────────────────────────────
  const pill = (active: boolean): React.CSSProperties => ({
    padding: "5px 11px", borderRadius: 6, fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
    border: `1px solid ${active ? DEGREE_COLORS[0] : "var(--border-2)"}`,
    background: active ? "var(--mc-accent-soft)" : "var(--surface-2)",
    color: active ? DEGREE_COLORS[0] : "var(--text-2)", cursor: "pointer",
  })
  const arrowBtn: React.CSSProperties = {
    width: 26, height: 26, borderRadius: 6, border: "1px solid var(--border-2)", background: "var(--surface-2)",
    color: "var(--text-1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer", flexShrink: 0,
  }
  const chordBtn = (c: HarmonyChord, disabled: boolean): React.CSSProperties => ({
    display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "7px 10px", borderRadius: 8, gap: 1, minWidth: 62,
    border: `1px solid ${FUNC_COLOR[c.func]}55`, background: `${FUNC_COLOR[c.func]}12`,
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
  })

  const diagBase = voicing ? baseFretOf(voicing) : 0
  const diagMain = voicing?.shape ? `FORMA ${voicing.shape}` : voicing?.label ? voicing.label.split(" · ")[0].toUpperCase() : ""
  const diagSub = voicing?.label?.includes(" · ") ? voicing.label.split(" · ")[1] : diagBase <= 1 ? "abierta" : `traste ${diagBase}`

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="mc-hero">
        <div>
          <div className="mc-eyebrow">Estudio · Progresiones</div>
          <h1 className="mc-h1">
            <span style={{ color: DEGREE_COLORS[0] }}>{keyTitle(rootIdx, mode).split(" ")[0]}</span>
            <span style={{ fontStyle: "italic" }}> {keyTitle(rootIdx, mode).split(" ")[1]}</span>
          </h1>
          <p className="mc-lede">Arma una progresión, ponle banda y improvisa encima: el mástil te muestra qué notas tocar en cada acorde.</p>
        </div>
      </div>

      {/* Tonalidad */}
      <div className="mc-section" style={{ gap: 8 }}>
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <span className="mc-eyebrow">Tonalidad</span>
          <div className="mm-seg">
            {(["major", "minor"] as const).map(m => <button key={m} data-on={mode === m || undefined} onClick={() => changeMode(m)}>{m === "major" ? "Mayor" : "Menor"}</button>)}
          </div>
          <div className="mm-seg">
            <button data-on={!sevenths || undefined} onClick={() => setSevenths(false)}>Tríadas</button>
            <button data-on={sevenths || undefined} onClick={() => setSevenths(true)}>Con 7ª</button>
          </div>
          <span className="mc-section-hint">cambiar la raíz transpone la progresión</span>
        </div>
        <div className="mc-note-row">
          {NOTE_NAMES.map((n, i) => {
            const dual = NOTE_NAMES[i] !== NOTE_NAMES_FLAT[i]
            return (
              <button key={n} onClick={() => changeRoot(i)} className={`mc-note-pill ${rootIdx === i ? "active" : ""}`}
                style={dual ? { display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.15, padding: "6px 10px" } : undefined}>
                {dual ? (<><span style={{ fontSize: 13 }}>{NOTE_NAMES[i]}</span><span style={{ fontSize: 10.5, opacity: 0.6, fontFamily: "var(--font-mono)" }}>{NOTE_NAMES_FLAT[i]}</span></>) : n}
              </button>
            )
          })}
        </div>
      </div>

      {/* Paleta */}
      <div className="mc-section" style={{ gap: 12 }}>
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10, flexWrap: "wrap" }}>
          <span className="mc-eyebrow">Acordes</span>
          <span className="mc-section-hint">click = suena y se agrega · máx 8</span>
          <div style={{ display: "flex", gap: 10, marginLeft: "auto", flexWrap: "wrap" }}>
            {FUNC_LEGEND.map(f => (
              <span key={f.label} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-2)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: f.color }} />{f.label}
              </span>
            ))}
          </div>
        </div>
        {GROUPS.map(gr => (
          <div key={gr.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 600 }}>{gr.label}</span>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{gr.hint}</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {chords.filter(c => c.group === gr.id).map((c, i) => (
                <button key={c.id} onClick={() => addChord(c.id)} disabled={progression.length >= 8} style={chordBtn(c, progression.length >= 8)}
                  title={`${c.hint}${gr.id === "diatonic" ? ` · tecla ${i + 1}` : ""}`}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: FUNC_COLOR[c.func] }}>{c.degree}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontStyle: "italic", color: "#fff", lineHeight: 1.1 }}>{c.name}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>{QUALITY_LABEL[c.quality]}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Progresión + diagrama */}
      <div className="mc-section" style={{ gap: 8 }}>
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Progresión</span>
          <span className="mc-section-hint">{progression.length} / 8 · arrastra para reordenar · ⌫ borra</span>
          {progression.length > 0 && <button onClick={() => { stop(); setProgression([]); setSelectedSlot(null); setVoicingIdxMap({}) }} style={pill(false)}>Limpiar</button>}
        </div>
        <div className="pg-main">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minHeight: 60 }}>
              {progression.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: 60, border: "1px dashed var(--border-2)", borderRadius: 8, color: "var(--text-3)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
                  ELIGE ACORDES ARRIBA O UNA PROGRESIÓN DE EJEMPLO
                </div>
              ) : progression.map((id, slot) => {
                const c = byId[id]
                if (!c) return null
                const col = FUNC_COLOR[c.func]
                const on = playing ? activeStep === slot : selectedSlot === slot
                return (
                  <div key={slot} draggable={!playing} onClick={() => selectSlot(slot)}
                    onDragStart={() => setDragIdx(slot)} onDragOver={e => { e.preventDefault(); setDragOver(slot) }}
                    onDragLeave={() => setDragOver(null)} onDrop={e => { e.preventDefault(); if (dragIdx !== null) reorderSlots(dragIdx, slot) }}
                    onDragEnd={() => { setDragIdx(null); setDragOver(null) }}
                    className="pg-slot"
                    style={{
                      border: dragOver === slot && dragIdx !== slot ? `1.5px dashed ${col}` : on ? `1.5px solid ${col}` : `1px solid ${col}55`,
                      background: on ? `${col}26` : `${col}0e`, opacity: dragIdx === slot ? 0.4 : 1,
                      filter: playing && on ? `drop-shadow(0 0 10px ${col}66)` : undefined, cursor: playing ? "default" : "grab",
                    }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700, color: col }}>{c.degree}</span>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 19, fontStyle: "italic", color: "#fff", lineHeight: 1 }}>{c.name}</span>
                    {playing && on && beats > 1 && (
                      <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                        {Array.from({ length: beats }).map((_, b) => <span key={b} style={{ width: 4, height: 4, borderRadius: 2, background: activeBeat === b ? col : "var(--border-3)" }} />)}
                      </div>
                    )}
                    <button onClick={e => { e.stopPropagation(); removeChord(slot) }} aria-label="Quitar acorde" className="pg-x">×</button>
                  </div>
                )
              })}
            </div>
            <div>
              <span className="mc-eyebrow" style={{ display: "block", marginBottom: 8 }}>Progresiones de ejemplo</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {PROGRESSION_PRESETS[mode].map(p => (
                  <button key={p.label} onClick={() => applyPreset(p.ids)} className="pg-preset">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-1)" }}>{p.label}</span>
                    <span style={{ fontSize: 11.5, color: "var(--text-2)" }}>{p.ids.map(id => byId[id]?.name).join(" · ")}</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>{p.style}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="pg-diagram">
            {current && voicing ? (
              <>
                <ChordDiagram voicing={voicing} name={current.name} size="sm" hideLevel onPlay={() => playChord(voicing.frets)} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <button onClick={() => currentSlot >= 0 && setVoicingIdxMap(m => ({ ...m, [currentSlot]: (vIdx - 1 + voicings.length) % voicings.length }))} style={{ ...arrowBtn, width: 22, height: 22 }} title="Voicing anterior">‹</button>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 76 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700, color: DEGREE_COLORS[0] }}>{diagMain}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-3)" }}>{diagSub} · {vIdx + 1}/{voicings.length}</span>
                  </div>
                  <button onClick={() => currentSlot >= 0 && setVoicingIdxMap(m => ({ ...m, [currentSlot]: (vIdx + 1) % voicings.length }))} style={{ ...arrowBtn, width: 22, height: 22 }} title="Voicing siguiente">›</button>
                </div>
              </>
            ) : (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", textAlign: "center" }}>CLICK EN UN ACORDE<br />DE LA PROGRESIÓN</span>
            )}
          </div>
        </div>
      </div>

      {/* Base: estilo, banda y reproducción */}
      <div className="mc-section" style={{ gap: 10 }}>
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Base</span>
          <span className="mc-section-hint">[espacio] = play / stop</span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FEELS.map(f => <button key={f.id} onClick={() => { setFeelId(f.id); if (playing) stop() }} style={pill(feelId === f.id)}>{f.label}</button>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setBpm(b => Math.max(40, b - 5))} style={arrowBtn}>−</button>
          <input type="range" min={40} max={200} value={bpm} onChange={e => setBpm(+e.target.value)} className="mc-slider" style={{ flex: 1, minWidth: 110, maxWidth: 240 }} />
          <button onClick={() => setBpm(b => Math.min(200, b + 5))} style={arrowBtn}>+</button>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, color: "#fff", minWidth: 64 }}>{bpm} <span style={{ fontSize: 11, color: "var(--text-3)" }}>BPM</span></span>
          <span className="mc-eyebrow">Pulsos por acorde</span>
          <div style={{ display: "flex", gap: 3 }}>{[1, 2, 4, 8].map(b => <button key={b} onClick={() => { setBeats(b); if (playing) stop() }} style={pill(beats === b)}>{b}</button>)}</div>
          <span className="mc-eyebrow">Vueltas</span>
          <div style={{ display: "flex", gap: 3 }}>{[1, 2, 4, Infinity].map(r => <button key={r} onClick={() => setRepeats(r)} style={pill(repeats === r)}>{r === Infinity ? "∞" : `${r}×`}</button>)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setBandOn(v => !v)} style={pill(bandOn)}>🥁 Banda {bandOn ? "ON" : "OFF"}</button>
          {bandOn && <input type="range" min={0} max={1.2} step={0.05} value={bandVol} onChange={e => setBandVol(+e.target.value)} className="mc-slider" style={{ width: 110, flex: "none" }} aria-label="Volumen de la banda" />}
          <button onClick={play} disabled={progression.length === 0} className="mc-play-btn" style={{ marginLeft: "auto", opacity: progression.length === 0 ? 0.4 : 1, ...(playing ? { background: "oklch(0.68 0.18 25 / 0.15)", color: "oklch(0.78 0.17 25)", border: "1px solid oklch(0.68 0.18 25 / 0.5)" } : {}) }}>
            {playing ? "◼ Parar" : repeats === Infinity ? "▶ Tocar en loop" : "▶ Tocar"}
          </button>
        </div>
      </div>

      {/* Improvisar */}
      <div className="pg-improv">
        <div className="pg-now">
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ minWidth: 180 }}>
              <span className="mc-eyebrow">{playing ? "Suena ahora" : "Acorde"}</span>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "#fff", lineHeight: 1.1 }}>{current?.name ?? "—"}</div>
              {current && <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: DEGREE_COLORS[0] }}>{toneNames(current)}</div>}
            </div>
            {next && (
              <div style={{ minWidth: 140 }}>
                <span className="mc-eyebrow">Siguiente</span>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text-2)", lineHeight: 1.2 }}>{next.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)" }}>{toneNames(next)}</div>
              </div>
            )}
            {current && (
              <div style={{ flex: 1, minWidth: 220 }}>
                <span className="mc-eyebrow">Escala para este acorde</span>
                <div style={{ fontSize: 14, color: "var(--text-1)", marginTop: 2 }}>{current.scale.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>{current.hint}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span className="mc-eyebrow">Mapa</span>
          <div className="mm-seg">
            <button data-on={scaleView === "pent" || undefined} onClick={() => setScaleView("pent")}>Pentatónica</button>
            <button data-on={scaleView === "key" || undefined} onClick={() => setScaleView("key")}>Escala completa</button>
            <button data-on={scaleView === "chord" || undefined} onClick={() => setScaleView("chord")}>Escala del acorde</button>
          </div>
          <div className="mm-seg">
            <button data-on={labels === "notes" || undefined} onClick={() => setLabels("notes")}>Notas</button>
            <button data-on={labels === "intervals" || undefined} onClick={() => setLabels("intervals")}>Intervalos</button>
          </div>
          <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{scale.name}{emph ? " · con aro blanco: las notas del reto" : ""}</span>
        </div>
        <Fretboard rootIdx={scale.rootIdx} intervals={mapIntervals} displayMode={labels}
          emphasizeNotes={emph ? new Set(emph) : null} />

        <div className="pg-challenge">
          <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
            <span className="mc-eyebrow" style={{ color: DEGREE_COLORS[0] }}>Reto {challengeIdx + 1}/{IMPROV_CHALLENGES.length}</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 21, color: "#fff" }}>{challenge.title}</span>
            <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <button className="mc-btn-ghost" onClick={() => setChallengeIdx(i => (i - 1 + IMPROV_CHALLENGES.length) % IMPROV_CHALLENGES.length)}>‹</button>
              <button className="mc-btn-ghost" onClick={() => setChallengeIdx(i => (i + 1) % IMPROV_CHALLENGES.length)}>Otro reto ›</button>
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 14.5, color: "var(--text-1)", lineHeight: 1.55 }}>{challenge.how}</p>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>{challenge.tip}</p>
          {progression.length === 0 && <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-3)" }}>Elige una progresión de ejemplo y dale a «Tocar en loop» para empezar.</p>}
        </div>
      </div>
    </div>
  )
}
