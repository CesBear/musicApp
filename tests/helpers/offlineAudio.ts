// Renderiza el motor de audio real (lib/audio.ts + samples de public/) en Node con
// node-web-audio-api. Cada render usa módulos nuevos, así cada uno tiene su propio
// AudioContext y lee el preset de amplificador que se le pase.
import fs from "fs"
import path from "path"
import { vi } from "vitest"
import { OfflineAudioContext } from "node-web-audio-api"

const SR = 44100
const PUBLIC = path.resolve(import.meta.dirname, "../../public")

export type Engine = {
  audio: typeof import("@/lib/audio")
  rhythm: typeof import("@/lib/rhythmAudio")
  band: typeof import("@/lib/band")
  sampler: typeof import("@/lib/sampler")
}

export async function render(seconds: number, preset: string, schedule: (e: Engine) => void) {
  const ctx = new OfflineAudioContext(2, Math.ceil(SR * seconds), SR) as unknown as OfflineAudioContext & { resume(): Promise<void> }
  ctx.resume = async () => {}
  const g = globalThis as Record<string, unknown>
  g.window = { AudioContext: function () { return ctx } }
  g.localStorage = { getItem: () => JSON.stringify({ preset }), setItem() {} }
  g.fetch = async (u: string) => {
    const f = path.join(PUBLIC, u)
    if (!fs.existsSync(f)) return { ok: false, status: 404 }
    const b = fs.readFileSync(f)
    return { ok: true, status: 200, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }
  }
  vi.resetModules()
  const e: Engine = {
    audio: await import("@/lib/audio"),
    rhythm: await import("@/lib/rhythmAudio"),
    band: await import("@/lib/band"),
    sampler: await import("@/lib/sampler"),
  }
  // Crea el contexto (dispara la precarga) y espera a que haya samples reales:
  // si no, el motor cae a la síntesis de respaldo y mediríamos otra cosa.
  e.audio.playGuitarString(40, seconds - 0.05, 0.0001)
  const deadline = Date.now() + 20_000
  while (!e.sampler.getGuitarSample(ctx as unknown as BaseAudioContext, 57, 0.11) || !e.sampler.getMutedSample(ctx as unknown as BaseAudioContext)) {
    if (Date.now() > deadline) throw new Error("los samples de guitarra no cargaron")
    await new Promise(r => setTimeout(r, 100))
  }
  schedule(e)
  const buf = await ctx.startRendering()
  return { L: buf.getChannelData(0), R: buf.getChannelData(1), sr: SR }
}

export function stats(a: { L: Float32Array; R: Float32Array; sr: number }, from = 0, to = Infinity) {
  const i0 = Math.floor(from * a.sr), i1 = Math.min(a.L.length, Math.floor(to * a.sr))
  let peak = 0, ss = 0, clip = 0, lr = 0, ll = 0, rr = 0
  for (let i = i0; i < i1; i++) {
    const l = a.L[i], r = a.R[i]
    const m = Math.max(Math.abs(l), Math.abs(r))
    if (m > peak) peak = m
    if (m >= 0.99) clip++
    ss += l * l; lr += l * r; ll += l * l; rr += r * r
  }
  return { peak, rms: Math.sqrt(ss / Math.max(1, i1 - i0)), clip, correlation: lr / Math.sqrt(ll * rr || 1) }
}

/** Primer instante (s), desde `from`, en que la señal supera el umbral. */
export function onset(a: { L: Float32Array; sr: number }, from = 0, threshold = 0.01) {
  for (let i = Math.floor(from * a.sr); i < a.L.length; i++) if (Math.abs(a.L[i]) > threshold) return i / a.sr
  return Infinity
}
