import { describe, it, expect } from "vitest"
import { render, stats, onset } from "../helpers/offlineAudio"
import { ALL_PATTERNS } from "@/data/rhythms"

const C_CHORD = [-1, 3, 2, 0, 1, 0]

describe("tiempo", () => {
  it("'when' es relativo: dos notas pedidas a 0.5 s y 1.5 s suenan con 1 s exacto de diferencia", async () => {
    const a = await render(3, "directo", e => {
      e.audio.playGuitarString(57, 0.5, 0.11, 0.6)
      e.audio.playGuitarString(57, 1.5, 0.11, 0.6)
    })
    const t1 = onset(a), t2 = onset(a, 1.3)
    // El decodificador AAC de Node no recorta los ~48 ms de silencio inicial que los
    // navegadores sí recortan; por eso se mide la separación y no el instante absoluto.
    expect(t1).toBeGreaterThan(0.49)
    expect(t1).toBeLessThan(0.6)
    expect(Math.abs(t2 - t1 - 1)).toBeLessThan(0.005)
  })
})

describe("amplificador y efectos", () => {
  const strum = (preset: string) => render(4, preset, e => e.audio.scheduleChord(C_CHORD, 0.2, undefined, 3))
  it("los 4 presets suenan parejos y sin saturar", async () => {
    const res: Record<string, ReturnType<typeof stats>> = {}
    for (const p of ["directo", "limpio", "crunch", "lead"]) res[p] = stats(await strum(p), 0.2, 3.8)
    const ref = res.limpio.rms
    for (const [p, s] of Object.entries(res)) {
      expect(s.clip, `${p} satura`).toBe(0)
      expect(s.peak, `${p} pico`).toBeLessThan(0.6)
      expect(s.rms / ref, `${p}: RMS ${s.rms.toFixed(3)} vs limpio ${ref.toFixed(3)}`).toBeGreaterThan(0.7)
      expect(s.rms / ref, `${p}: RMS ${s.rms.toFixed(3)} vs limpio ${ref.toFixed(3)}`).toBeLessThan(1.4)
    }
    // El chorus estéreo abre la imagen; la señal directa es mono
    expect(res.limpio.correlation).toBeLessThan(0.95)
    expect(res.directo.correlation).toBeGreaterThan(0.99)
  })
})

describe("rasgueos con banda", () => {
  // Cada patrón se renderiza en su propio clip corto: en un render offline largo los nodos de
  // las notas terminadas no se desconectan (eso lo hace un setTimeout en tiempo real) y el
  // costo crece mucho más rápido que la duración.
  async function clip(id: string, withBand: boolean) {
    const p = ALL_PATTERNS.find(x => x.id === id)!
    const d = 60 / (p.bpmHint * p.subsPerBeat)
    const len = 2 * p.beats * 60 / p.bpmHint
    const a = await render(len + 1.2, "limpio", e => {
      let t = 0.2
      for (let bar = 0; bar < 2; bar++) for (let s = 0; s < p.strokes.length; s++) {
        e.rhythm.playStroke(p, s, bar, t, 0, d)
        if (withBand) {
          const roots = p.voice === "chug" ? (p.powerRoots ?? [40]) : (p.chords ?? ["E"])
          e.band.playBandStep(e.band.grooveFor(p), s / p.subsPerBeat, 1 / p.subsPerBeat, t, 60 / p.bpmHint, e.band.bassRoot(roots[bar % roots.length]))
        }
        t += d
      }
    })
    return stats(a, 0.2, 0.2 + len)
  }

  it(`los ${ALL_PATTERNS.length} patrones con banda: sin saturar y la banda no tapa a la guitarra`, { timeout: 600_000 }, async () => {
    const problems: string[] = []
    for (const p of ALL_PATTERNS) {
      const mix = await clip(p.id, true), gtr = await clip(p.id, false)
      if (mix.clip > 0) problems.push(`${p.id}: ${mix.clip} muestras saturadas`)
      if (mix.peak > 0.7) problems.push(`${p.id}: pico ${mix.peak.toFixed(2)}`)
      if (gtr.rms < 0.004) problems.push(`${p.id}: la guitarra casi no suena (rms ${gtr.rms.toFixed(4)})`)
      if (mix.rms / gtr.rms > 3) problems.push(`${p.id}: la banda tapa a la guitarra (×${(mix.rms / gtr.rms).toFixed(1)})`)
    }
    expect(problems, problems.join("\n")).toEqual([])
  })
})
