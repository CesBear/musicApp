// Sampler para la guitarra "Emily the Strange" (Karoryfer Samples, CC0).
// Subconjunto convertido a AAC en public/samples/emily: capas mp/mf/f × 3
// round-robins × 18 alturas (una cada 3 semitonos, Db2–D6) + 25 rasgueos
// muteados. Carga perezosa con fallback: si un buffer aún no está listo (o la
// red falla), el llamador usa la síntesis de lib/audio.ts.

const BASE = "/samples/emily"

const PITCHES: { name: string; midi: number }[] = [
  { name: "db2", midi: 37 }, { name: "e2", midi: 40 }, { name: "gb2", midi: 42 },
  { name: "a2", midi: 45 },  { name: "c3", midi: 48 }, { name: "eb3", midi: 51 },
  { name: "gb3", midi: 54 }, { name: "a3", midi: 57 }, { name: "c4", midi: 60 },
  { name: "eb4", midi: 63 }, { name: "gb4", midi: 66 }, { name: "a4", midi: 69 },
  { name: "c5", midi: 72 },  { name: "eb5", midi: 75 }, { name: "gb5", midi: 78 },
  { name: "a5", midi: 81 },  { name: "c6", midi: 84 }, { name: "d6", midi: 86 },
]

type Dyn = "mp" | "mf" | "f"
const RRS = [1, 2, 3] as const

// Ganancia por capa para que el pico de salida ≈ gainPeak, igual que el
// sintetizador (picos promedio medidos: mp 0.258 · mf 0.477 · f 0.842).
const DYN_GAIN: Record<Dyn, number> = { mp: 3.9, mf: 2.1, f: 1.2 }

// Picos medidos de cada sample muteado, para normalizar el "chuck".
const MUTED_PEAKS: Record<string, number> = {
  muted1_rr1: 1,     muted1_rr2: 0.993, muted1_rr3: 0.801, muted1_rr4: 0.921, muted1_rr5: 1,
  muted2_rr1: 0.779, muted2_rr2: 0.912, muted2_rr3: 0.855, muted2_rr4: 0.899, muted2_rr5: 0.798,
  muted3_rr1: 0.382, muted3_rr2: 0.524, muted3_rr3: 0.392, muted3_rr4: 0.398, muted3_rr5: 0.415,
  muted4_rr1: 0.736, muted4_rr2: 0.931, muted4_rr3: 0.883, muted4_rr4: 0.728, muted4_rr5: 0.713,
  muted5_rr1: 0.293, muted5_rr2: 0.295, muted5_rr3: 0.341, muted5_rr4: 0.27,  muted5_rr5: 0.296,
}
const MUTED_PATHS = Object.keys(MUTED_PEAKS)

const cache   = new Map<string, AudioBuffer>()
const pending = new Set<string>()
const failedPaths = new Set<string>()
let disabled = false // demasiados errores de red/decode → quedarse en síntesis

async function load(ctx: BaseAudioContext, path: string): Promise<void> {
  if (disabled || cache.has(path) || pending.has(path) || failedPaths.has(path)) return
  pending.add(path)
  try {
    const res = await fetch(`${BASE}/${path}.m4a`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    cache.set(path, await ctx.decodeAudioData(await res.arrayBuffer()))
  } catch {
    failedPaths.add(path)
    if (failedPaths.size > 6) disabled = true
  } finally {
    pending.delete(path)
  }
}

function nearestPitch(midi: number) {
  let best = PITCHES[0]
  for (const p of PITCHES) if (Math.abs(midi - p.midi) < Math.abs(midi - best.midi)) best = p
  return best
}

function dynForGain(gainPeak: number): Dyn {
  return gainPeak >= 0.095 ? "f" : gainPeak >= 0.05 ? "mf" : "mp"
}

let rrCounter = 0

export interface SampleHit {
  buffer: AudioBuffer
  rate: number
  gain: number
}

// Devuelve el sample listo para midi+velocidad, o null si aún no cargó
// (en cuyo caso dispara la carga para la próxima vez).
export function getGuitarSample(ctx: BaseAudioContext, midi: number, gainPeak: number): SampleHit | null {
  if (disabled) return null
  const p = nearestPitch(midi)
  const dyn = dynForGain(gainPeak)
  const paths = RRS.map(rr => `notes/${p.name}_${dyn}_rr${rr}`)
  const ready = paths.filter(pa => cache.has(pa))
  if (!ready.length) {
    paths.forEach(pa => void load(ctx, pa))
    return null
  }
  const path = ready[rrCounter++ % ready.length]
  return {
    buffer: cache.get(path)!,
    rate: Math.pow(2, (midi - p.midi) / 12),
    gain: gainPeak * DYN_GAIN[dyn],
  }
}

// Rasgueo muteado real (chuck). gain normalizado para pico ≈ 0.28 × velocity.
export function getMutedSample(ctx: BaseAudioContext, velocity = 1): SampleHit | null {
  if (disabled) return null
  const ready = MUTED_PATHS.filter(pa => cache.has(`noises/${pa}`))
  if (!ready.length) {
    MUTED_PATHS.forEach(pa => void load(ctx, `noises/${pa}`))
    return null
  }
  const name = ready[Math.floor(Math.random() * ready.length)]
  return {
    buffer: cache.get(`noises/${name}`)!,
    rate: 0.97 + Math.random() * 0.06,
    gain: (0.28 / MUTED_PEAKS[name]) * velocity,
  }
}

// Precalienta el rango que usa la app (mf+f de Db2–A5 + todos los muteados,
// ~4MB en AAC). Se llama una vez al crear el AudioContext.
export function preloadGuitarSamples(ctx: BaseAudioContext): void {
  for (const p of PITCHES) {
    if (p.midi > 81) continue
    for (const dyn of ["mf", "f"] as Dyn[]) {
      for (const rr of RRS) void load(ctx, `notes/${p.name}_${dyn}_rr${rr}`)
    }
  }
  for (const pa of MUTED_PATHS) void load(ctx, `noises/${pa}`)
}
