import { describe, it, expect } from "vitest"
import { TAPPING_1 } from "@/data/classes/tapping1"
import { GUITAR_TUNING_MIDI } from "@/data/scales"
import { midiName } from "../helpers/music"

const ex = (letter: string) => TAPPING_1.find(x => x.letter === letter)!.exercise
const notes = (letter: string) => ex(letter).steps.filter(s => s.notes.length).map(s => midiName(GUITAR_TUNING_MIDI[s.notes[0].string] + s.notes[0].fret + (s.bend ?? 0)))

describe("Tapping 1 — transcripción de la hoja de clase", () => {
  it("A1: Mi–Do–La (arpegio de Am) dos veces", () => expect(notes("A1").join(" ")).toBe("E5 C5 A4 E5 C5 A4"))
  it("A2: Mi–La–Do", () => expect(notes("A2").join(" ")).toBe("E5 A4 C5 E5 A4 C5"))
  it("A3: Mi–Do–La–Do", () => expect(notes("A3").join(" ")).toBe("E5 C5 A4 C5 E5 C5 A4 C5"))
  it("B: arpegios de Am, G y F", () => {
    const n = notes("B")
    expect(n.slice(0, 3).join(" ")).toBe("E5 C5 A4")      // Am
    expect(n.slice(6, 9).join(" ")).toBe("D5 G4 B4")      // G
    expect(n.slice(12, 15).join(" ")).toBe("C5 F4 A4")    // F
  })
  it("C: Mi pedal arriba sobre Am, Em, Fmaj7, Em", () => expect(notes("C").join(" ")).toBe("E5 A4 C5 E5 G4 B4 E5 F4 A4 E5 G4 B4"))
  it("D: el tap hace Mi–Fa–Sol–Fa sobre La–Do", () => expect(notes("D").filter((_, i) => i % 3 === 0).join(" ")).toBe("E5 F5 G5 F5"))
  it("E: slide 12→13→12", () => expect(notes("E").slice(0, 3).join(" ")).toBe("E5 F5 E5"))
  it("F: el bend de un tono llega a Fa♯", () => expect(notes("F")[0]).toBe("F#5"))
  it("G: Do mayor ascendente en grupos de tres por las 6 cuerdas", () => {
    expect(notes("G").join(" ")).toBe("E3 C3 D3 A3 F3 G3 D4 B3 C4 G4 E4 F4 C5 A4 B4 F5 D5 E5")
  })
  it("H: bajada de La menor hasta la cuerda al aire", () => expect(notes("H").slice(0, 8).join(" ")).toBe("E5 C5 B4 A4 E4 A4 B4 C5"))
  it("Kotzen e I: todo dentro de Do mayor / La menor (sin alteraciones)", () => {
    for (const l of ["RK", "I"]) expect(notes(l).filter(n => n.includes("#")), l).toEqual([])
    expect(notes("RK").join(" ")).toBe("F5 E5 D5 E5 F5 A5 F5 E5 D5 C5 B4 A4 B4 C5 E5 C5 B4 A4 G4 F4 E4 F4 G4 C5")
  })
  it("cada ejercicio llena compases completos y los taps están marcados", () => {
    for (const { exercise: e } of TAPPING_1) {
      const group = e.beatsPerGroup ?? (e.subdivision ?? 2) * 4
      expect(e.steps.length % group, `${e.id}: ${e.steps.length} pasos, compás de ${group}`).toBe(0)
      expect(e.steps.some(s => s.tie === "t" || s.tie === "b"), `${e.id} sin tap`).toBe(true)
      for (const s of e.steps) for (const n of s.notes) { expect(n.fret).toBeGreaterThanOrEqual(0); expect(n.fret).toBeLessThanOrEqual(24) }
    }
  })
})

describe("Kotzen completa (continuación propuesta)", () => {
  it("empieza igual que la hoja", () => {
    expect(notes("RK+").slice(0, 24)).toEqual(notes("RK"))
  })
  it("sigue el patrón por la 4ª, 5ª y 6ª cuerda y cierra en La", () => {
    const n = notes("RK+")
    expect(n.slice(27, 36).join(" ")).toBe("D4 C4 B3 C4 D4 G4 D4 C4 B3")   // 4ª cuerda
    expect(n.slice(36, 45).join(" ")).toBe("A3 G3 F3 G3 A3 D4 A3 G3 F3")   // 5ª
    expect(n.slice(45, 54).join(" ")).toBe("E3 D3 C3 D3 E3 A3 E3 D3 C3")   // 6ª
    expect(n[n.length - 1]).toBe("A2")                                     // tónica
    expect(n.filter(x => x.includes("#"))).toEqual([])                     // todo en La menor / Do mayor
  })
})
