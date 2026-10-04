import { describe, it, expect } from "vitest"
import { WORKOUT_PLAN, TOTAL_WORKOUT_HOURS, blockMinutes } from "@/data/workout"
import { GUITAR_TUNING_MIDI } from "@/data/scales"
import { midiName } from "../helpers/music"

const notesOf = (id: string) => {
  for (const p of WORKOUT_PLAN) for (const b of p.session.blocks) if (b.exercise?.id === id)
    return b.exercise.steps.map(s => s.notes.map(x => midiName(GUITAR_TUNING_MIDI[x.string] + x.fret + (s.bend ?? 0))).join("+") || "·")
  throw new Error(`no existe ${id}`)
}

describe("30 horas", () => {
  it("son 30 sesiones con etiquetas únicas", () => {
    expect(TOTAL_WORKOUT_HOURS).toBe(30)
    expect(new Set(WORKOUT_PLAN.map(p => p.tag)).size).toBe(30)
  })
  it("cada sesión dura 60 min (y ~30 en la versión corta)", () => {
    for (const p of WORKOUT_PLAN) {
      expect(p.session.blocks.reduce((a, b) => a + b.min, 0), `hora ${p.hour}`).toBe(60)
      const short = p.session.blocks.reduce((a, b) => a + blockMinutes(b, 30), 0)
      expect(short).toBeGreaterThanOrEqual(28); expect(short).toBeLessThanOrEqual(34)
    }
  })
  it("los intervalos del entrenador de oído son válidos", () => {
    for (const p of WORKOUT_PLAN) for (const b of p.session.blocks) for (const s of b.earPool ?? []) {
      expect(s).toBeGreaterThanOrEqual(1); expect(s).toBeLessThanOrEqual(12)
    }
  })
  it("las tablaturas tienen trastes y cuerdas posibles", () => {
    for (const p of WORKOUT_PLAN) for (const b of p.session.blocks) for (const st of b.exercise?.steps ?? []) for (const x of st.notes) {
      expect(x.string).toBeGreaterThanOrEqual(0); expect(x.string).toBeLessThanOrEqual(5)
      expect(x.fret).toBeGreaterThanOrEqual(0); expect(x.fret).toBeLessThanOrEqual(22)
    }
  })
})

describe("notas de los ejercicios", () => {
  it("Do mayor en terceras", () => expect(notesOf("terceras-c").join(" ")).toBe("C3 E3 D3 F3 E3 G3 F3 A3 G3 B3 A3 C4 B3 D4 C4 E4"))
  it("tríada 1-3-5-8 llega a la octava", () => expect(notesOf("triada-1358").join(" ")).toBe("C3 E3 G3 C4 C4 G3 E3 C3"))
  it("Sol mayor en una cuerda (T T S T T T S)", () => expect(notesOf("mayor-una-cuerda").join(" ")).toBe("G3 A3 B3 C4 D4 E4 F#4 G4"))
  it("pentatónica menor de La, caja 1", () => expect(notesOf("penta-caja1").slice(0, 12).join(" ")).toBe("A2 C3 D3 E3 G3 A3 C4 D4 E4 G4 A4 C5"))
  it("riff de power chords A5–C5–D5", () => expect([...new Set(notesOf("power-riff"))].join(" ")).toBe("A2+E3 C3+G3 D3+A3"))
  it("Re dórico tiene el Si natural", () => expect(notesOf("dorico-frase")).toContain("B3"))
  it("Sol mixolidio tiene el Fa natural", () => expect(notesOf("mixolidio-frase")).toContain("F3"))
  it("los bends llegan a la nota de referencia", () => expect(notesOf("bend-referencia").join(" ")).toBe("E4 E4 A4 A4"))
  it("el tritono de G7 resuelve a Do-Mi", () => expect([...new Set(notesOf("tritono-resuelve"))].join(" ")).toBe("B2+F3 C3+E3"))
})
