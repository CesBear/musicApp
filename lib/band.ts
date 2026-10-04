// Banda de acompañamiento para Rasgueos: batería sintetizada + bajo que siguen el
// género del patrón y los acordes. Se agenda paso a paso desde el mismo scheduler
// que la guitarra, así que todo comparte el reloj de audio y el tempo.
import { getMixer } from "@/lib/audio"
import type { StrumPattern } from "@/data/rhythms"

type Drum = "K" | "S" | "H" | "O" | "R" | "P"         // bombo, caja, hat cerrado, hat abierto, aro/clave, shaker
type BassNote = { at: number; note?: "r" | "5" | "8" } // raíz, quinta, octava

export interface Groove {
  id:    string
  label: string
  drums: Partial<Record<Drum, number[]>>                // posiciones en pulsos dentro del compás
  bass:  BassNote[]
}

const every = (step: number, beats: number, from = 0) =>
  Array.from({ length: Math.round((beats - from) / step) }, (_, i) => +(from + i * step).toFixed(4))
const T = 1 / 3

// Grooves de 4/4 salvo indicación. Las posiciones pueden caer entre subdivisiones del
// patrón (p. ej. semicorcheas del hat sobre un rasgueo en corcheas): se agendan con offset.
const GROOVES: Record<string, Groove> = {
  basico:   { id: "basico", label: "Básico", drums: { K: [0, 2], S: [1, 3], H: every(0.5, 4) }, bass: [{ at: 0 }, { at: 2 }] },
  balada:   { id: "balada", label: "Balada", drums: { K: [0, 2.5], R: [1, 3], H: every(0.5, 4) }, bass: [{ at: 0 }, { at: 2.5 }, { at: 3, note: "5" }] },
  pop:      { id: "pop", label: "Pop", drums: { K: [0, 1.5, 2], S: [1, 3], H: every(0.5, 4) }, bass: [{ at: 0 }, { at: 1.5 }, { at: 2 }, { at: 3.5, note: "5" }] },
  pop16:    { id: "pop16", label: "Pop moderno", drums: { K: [0, 0.75, 2, 2.5], S: [1, 3], H: every(0.25, 4) }, bass: [{ at: 0 }, { at: 0.75 }, { at: 2 }, { at: 2.5 }] },
  rock:     { id: "rock", label: "Rock", drums: { K: [0, 2, 2.5], S: [1, 3], H: every(0.5, 4) }, bass: every(0.5, 4).map(at => ({ at })) },
  shuffle:  { id: "shuffle", label: "Shuffle", drums: { K: [0, 2], S: [1, 3], H: [0, 2 * T, 1, 1 + 2 * T, 2, 2 + 2 * T, 3, 3 + 2 * T] },
              bass: [{ at: 0 }, { at: 2 * T }, { at: 1, note: "5" }, { at: 1 + 2 * T, note: "5" }, { at: 2, note: "8" }, { at: 2 + 2 * T, note: "8" }, { at: 3, note: "5" }, { at: 3 + 2 * T, note: "5" }] },
  funk:     { id: "funk", label: "Funk", drums: { K: [0, 0.75, 2.5], S: [1, 3], H: every(0.25, 4) },
              bass: [{ at: 0 }, { at: 0.75 }, { at: 1.5, note: "8" }, { at: 2.5 }, { at: 3.25, note: "5" }, { at: 3.5, note: "8" }] },
  disco:    { id: "disco", label: "Disco", drums: { K: [0, 1, 2, 3], S: [1, 3], O: [0.5, 1.5, 2.5, 3.5], H: [0.25, 0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75] },
              bass: every(0.5, 4).map((at, i) => ({ at, note: i % 2 ? "8" as const : "r" as const })) },
  reggae:   { id: "reggae", label: "Reggae one drop", drums: { K: [2], R: [2], H: every(0.5, 4) }, bass: [{ at: 0 }, { at: 1.5 }, { at: 2.5, note: "5" }] },
  ska:      { id: "ska", label: "Ska", drums: { K: [0, 2], S: [1, 3], H: every(0.5, 4) }, bass: [{ at: 0 }, { at: 1, note: "5" }, { at: 2, note: "8" }, { at: 3, note: "5" }] },
  cumbia:   { id: "cumbia", label: "Cumbia", drums: { K: [0, 2], R: [1.5, 3.5], P: every(0.25, 4) }, bass: [{ at: 0 }, { at: 1.5, note: "5" }, { at: 2, note: "5" }, { at: 3.5 }] },
  rumba:    { id: "rumba", label: "Rumba", drums: { K: [0, 2], R: [1, 3], P: every(0.5, 4) }, bass: [{ at: 0 }, { at: 1.5, note: "5" }, { at: 2 }, { at: 3.5, note: "5" }] },
  bolero:   { id: "bolero", label: "Bolero", drums: { K: [0, 2], R: [1, 2.5, 3], P: every(0.5, 4) }, bass: [{ at: 0 }, { at: 2, note: "5" }] },
  bossa:    { id: "bossa", label: "Bossa nova", drums: { K: [0, 1.5, 2, 3.5], R: [0, 0.75, 1.5, 2.5, 3], H: every(0.5, 4) },
              bass: [{ at: 0 }, { at: 1.5 }, { at: 2, note: "5" }, { at: 3.5, note: "5" }] },
  dembow:   { id: "dembow", label: "Dembow", drums: { K: [0, 1, 2, 3], S: [0.75, 1.5, 2.75, 3.5], H: every(0.5, 4) }, bass: [{ at: 0 }, { at: 1.5 }, { at: 3 }] },
  country:  { id: "country", label: "Country", drums: { K: [0, 2], S: [1, 3], H: every(0.5, 4) }, bass: [{ at: 0 }, { at: 2, note: "5" }] },
  tren:     { id: "tren", label: "Train beat", drums: { K: [0, 2], S: every(0.5, 4), H: every(0.5, 4) }, bass: [{ at: 0 }, { at: 1, note: "5" }, { at: 2 }, { at: 3, note: "5" }] },
  punk:     { id: "punk", label: "Punk", drums: { K: [0, 1, 2, 3], S: [1, 3], H: every(0.5, 4) }, bass: every(0.5, 4).map(at => ({ at })) },
  thrash:   { id: "thrash", label: "Doble bombo", drums: { K: every(0.25, 4), S: [1, 3], H: every(0.5, 4) }, bass: every(0.25, 4).map(at => ({ at })) },
  halftime: { id: "halftime", label: "Half-time", drums: { K: [0, 1.5], S: [2], H: every(0.5, 4) }, bass: [{ at: 0 }, { at: 1.5 }] },
  galope:   { id: "galope", label: "Galope", drums: { K: [0, 0.5, 0.75, 1, 1.5, 1.75, 2, 2.5, 2.75, 3, 3.5, 3.75], S: [1, 3], H: every(0.5, 4) },
              bass: [0, 0.5, 0.75, 1, 1.5, 1.75, 2, 2.5, 2.75, 3, 3.5, 3.75].map(at => ({ at })) },
  // Compases que no son 4/4
  vals:     { id: "vals", label: "Vals 3/4", drums: { K: [0], R: [1, 2], H: every(0.5, 3) }, bass: [{ at: 0 }] },
  polka:    { id: "polka", label: "Polka 2/4", drums: { K: [0, 1], S: [0.5, 1.5], H: every(0.5, 2) }, bass: [{ at: 0 }, { at: 1, note: "5" }] },
  seis8:    { id: "seis8", label: "6/8", drums: { K: [0], S: [1], H: every(T, 2) }, bass: [{ at: 0 }, { at: 1, note: "5" }] },
  huapango: { id: "huapango", label: "Huapango", drums: { K: [0, 3], R: [1.5, 4, 5], P: every(0.5, 6) },
              bass: [{ at: 0 }, { at: 1.5, note: "5" }, { at: 3 }, { at: 4, note: "5" }, { at: 5 }] },
}

const BY_PATTERN: Record<string, string> = {
  negras: "basico", corcheas: "basico", balada: "balada", "bajo-acorde": "country", vals: "vals",
  pop: "pop", pop16: "pop16", "seis-octavos": "seis8", rock: "rock", shuffle: "shuffle",
  "funk-16": "funk", disco: "disco", "kiko-scratch": "funk", "kiko-stabs": "disco",
  "kiko-aproximacion": "funk", "kiko-251": "disco", "kiko-descenso": "pop16", "kiko-13": "funk",
  "kiko-backbeat": "disco", "kiko-terceras": "funk", "kiko-octavas": "funk",
  rumba: "rumba", cumbia: "cumbia", bolero: "bolero", bossa: "bossa", reggaeton: "dembow",
  "vals-ranchero": "vals", polka: "polka", huapango: "huapango",
  folk: "pop", country: "country", tren: "tren", "vals-country": "vals",
  reggae: "reggae", ska: "ska", rocksteady: "reggae",
  punk: "punk", thrash: "thrash", "half-time": "halftime", "hard-rock": "rock",
  fantasma: "basico", backbeat: "basico", chuck: "pop",
}

export function grooveFor(p: StrumPattern): Groove {
  const id = BY_PATTERN[p.id] ?? (p.voice === "chug" ? (p.subsPerBeat === 4 ? "galope" : "rock") : p.beats === 3 ? "vals" : "basico")
  return GROOVES[id]
}

// ─── Síntesis ─────────────────────────────────────────────────────────────────

// Nivel base calibrado con renders: la banda queda ~1.3× el RMS de la guitarra, sin tapar el rasgueo
const BAND_LEVEL = 0.13
let _out: GainNode | null = null
let _noise: AudioBuffer | null = null

function out() {
  const { ctx, bus } = getMixer()
  if (!_out) { _out = ctx.createGain(); _out.gain.value = 0.8 * BAND_LEVEL; _out.connect(bus) }
  if (!_noise) {
    _noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = _noise.getChannelData(0)
    let seed = 7
    for (let i = 0; i < d.length; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; d[i] = seed / 0x7fffffff * 2 - 1 }
  }
  return { ctx, out: _out, noise: _noise }
}

export function setBandVolume(v: number) { out().out.gain.value = v * BAND_LEVEL }

function noiseHit(t: number, dur: number, gain: number, type: BiquadFilterType, freq: number, q = 0.8, pan = 0) {
  const { ctx, out: o, noise } = out()
  const src = ctx.createBufferSource(); src.buffer = noise
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur)
  const p = ctx.createStereoPanner(); p.pan.value = pan
  src.connect(f); f.connect(g); g.connect(p); p.connect(o)
  src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02)
}

function toneHit(t: number, f0: number, f1: number, dur: number, gain: number, type: OscillatorType = "sine") {
  const { ctx, out: o } = out()
  const osc = ctx.createOscillator(); osc.type = type
  osc.frequency.setValueAtTime(f0, t); osc.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.5)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0008, t + dur)
  osc.connect(g); g.connect(o)
  osc.start(t); osc.stop(t + dur + 0.02)
}

function drum(kind: Drum, t: number, accent: boolean) {
  const v = accent ? 1 : 0.62
  switch (kind) {
    case "K": toneHit(t, 140, 46, 0.32, 0.85); noiseHit(t, 0.012, 0.12, "lowpass", 3000); break
    case "S": noiseHit(t, 0.17, 0.32 * v, "highpass", 1400, 0.6, 0.05); toneHit(t, 220, 170, 0.09, 0.22 * v, "triangle"); break
    case "H": noiseHit(t, 0.035, 0.09 * v, "highpass", 7500, 0.7, -0.25); break
    case "O": noiseHit(t, 0.24, 0.08, "highpass", 7000, 0.7, -0.25); break
    case "R": toneHit(t, 1750, 1650, 0.035, 0.12 * v, "triangle"); noiseHit(t, 0.02, 0.08 * v, "bandpass", 3200, 2, 0.2); break
    case "P": noiseHit(t, 0.05, 0.06 * v, "bandpass", 6500, 1.2, 0.35); break
  }
}

function bassNote(t: number, midi: number, dur: number) {
  const { ctx, out: o } = out()
  const freq = 440 * Math.pow(2, (midi - 69) / 12)
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 1.2
  lp.frequency.setValueAtTime(1100, t); lp.frequency.exponentialRampToValueAtTime(260, t + Math.min(dur, 0.35))
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.42, t + 0.006)
  g.gain.setTargetAtTime(0.26, t + 0.02, 0.12)
  g.gain.setValueAtTime(0.26, t + Math.max(0.03, dur - 0.04)); g.gain.linearRampToValueAtTime(0, t + dur)
  ;[["sawtooth", 0.5], ["sine", 1]].forEach(([type, level]) => {
    const osc = ctx.createOscillator(); osc.type = type as OscillatorType; osc.frequency.value = freq
    const lg = ctx.createGain(); lg.gain.value = level as number
    osc.connect(lg); lg.connect(lp)
    osc.start(t); osc.stop(t + dur + 0.02)
  })
  lp.connect(g); g.connect(o)
}

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
/** Fundamental en el registro del bajo (Mi1–Re#2) a partir del nombre del acorde o la raíz midi. */
export function bassRoot(chord: string | number): number {
  if (typeof chord === "number") return chord - 12
  const pc = (PC[chord[0]] + (chord[1] === "#" ? 1 : chord[1] === "b" ? -1 : 0) + 12) % 12
  return 28 + ((pc - 4 + 12) % 12)
}

/**
 * Agenda la banda para un paso del patrón: todo golpe del groove que caiga en
 * [pos, pos + stepBeats) suena con su offset dentro del paso.
 */
export function playBandStep(g: Groove, pos: number, stepBeats: number, rel: number, beatSec: number, root: number) {
  const { ctx } = out()
  const t0 = ctx.currentTime + rel
  const inStep = (at: number) => at >= pos - 1e-6 && at < pos + stepBeats - 1e-6
  for (const [kind, hits] of Object.entries(g.drums) as [Drum, number[]][]) {
    for (const at of hits) if (inStep(at)) drum(kind, t0 + (at - pos) * beatSec, Math.abs(at - Math.round(at)) < 1e-6)
  }
  g.bass.forEach((b, i) => {
    if (!inStep(b.at)) return
    const next = g.bass[i + 1]?.at ?? (g.bass[0].at + barBeats(g))
    const dur = Math.min((next - b.at) * beatSec * 0.92, 0.9)
    const midi = root + (b.note === "5" ? 7 : b.note === "8" ? 12 : 0)
    bassNote(t0 + (b.at - pos) * beatSec, midi, Math.max(0.08, dur))
  })
}

function barBeats(g: Groove) {
  return g.id === "vals" ? 3 : g.id === "polka" || g.id === "seis8" ? 2 : g.id === "huapango" ? 6 : 4
}
