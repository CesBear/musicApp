import { describe, it, expect } from "vitest"
import { SCALE_TYPES, GUITAR_TUNING_MIDI, GUITAR_TUNING, getScaleNotes } from "@/data/scales"
import { CHORD_VOICINGS, computeTriads, type ChordType, type ChordVoicing } from "@/data/chords"
import { CIRCLE_NOTES } from "@/data/circle"
import { chordPcs, names } from "../helpers/music"

describe("afinación", () => {
  it("es E2 A2 D3 G3 B3 E4 y coincide con la tabla de clases de altura", () => {
    expect(GUITAR_TUNING_MIDI).toEqual([40, 45, 50, 55, 59, 64])
    expect(GUITAR_TUNING).toEqual(GUITAR_TUNING_MIDI.map(m => m % 12))
  })
})

describe("escalas", () => {
  const expected: Record<string, number[]> = {
    "Mayor": [0, 2, 4, 5, 7, 9, 11], "Menor Natural": [0, 2, 3, 5, 7, 8, 10],
    "Menor Armónica": [0, 2, 3, 5, 7, 8, 11], "Menor Melódica": [0, 2, 3, 5, 7, 9, 11],
    "Pentatónica Mayor": [0, 2, 4, 7, 9], "Pentatónica Menor": [0, 3, 5, 7, 10], "Blues": [0, 3, 5, 6, 7, 10],
    "Dórica": [0, 2, 3, 5, 7, 9, 10], "Mixolidia": [0, 2, 4, 5, 7, 9, 10], "Frigia": [0, 1, 3, 5, 7, 8, 10],
    "Lidia": [0, 2, 4, 6, 7, 9, 11], "Locrio": [0, 1, 3, 5, 6, 8, 10],
  }
  for (const sc of SCALE_TYPES) {
    it(`${sc.name} tiene los intervalos correctos`, () => {
      expect(expected[sc.name], `escala sin referencia: ${sc.name}`).toBeDefined()
      expect(sc.intervals).toEqual(expected[sc.name])
    })
  }
  it("La pentatónica menor = A C D E G", () => {
    const pent = SCALE_TYPES.find(s => s.name === "Pentatónica Menor")!
    expect(names([...getScaleNotes(9, pent.intervals)].sort((a, b) => a - b))).toBe("C D E G A")
  })
})

describe("acordes (CHORD_VOICINGS)", () => {
  const FORMULA: Record<ChordType, number[]> = {
    major: [0, 4, 7], minor: [0, 3, 7], dom7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10],
    sus2: [0, 2, 7], sus4: [0, 5, 7], add9: [0, 2, 4, 7], "6": [0, 4, 7, 9], "9": [0, 2, 4, 7, 10],
  }
  // Notas que una forma de guitarra puede omitir sin cambiar el acorde
  const OPTIONAL: Partial<Record<ChordType, number[]>> = { "9": [4, 7], dom7: [7], maj7: [7], m7: [7], "6": [7], add9: [7] }
  const ROOT: Record<string, number> = { C: 0, "C#": 1, D: 2, Eb: 3, E: 4, F: 5, "F#": 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 }
  for (const [root, types] of Object.entries(CHORD_VOICINGS)) {
    for (const [type, voicings] of Object.entries(types) as [ChordType, ChordVoicing[]][]) {
      voicings.forEach((v, i) => {
        it(`${root} ${type} #${i + 1} (${v.frets.join(",")})`, () => {
          const r = ROOT[root]
          const rel = chordPcs(v.frets).map(p => (p - r + 12) % 12)
          const allowed = new Set(FORMULA[type])
          for (const iv of rel) expect(allowed.has(iv), `nota ajena al acorde: intervalo ${iv}`).toBe(true)
          const required = FORMULA[type].filter(iv => !(OPTIONAL[type] ?? []).includes(iv))
          for (const iv of required) expect(rel, `falta el intervalo ${iv}`).toContain(iv)
          expect(rel[0], "el bajo debe ser la fundamental").toBe(0)
          expect(v.frets).toHaveLength(6)
          expect(v.fingers).toHaveLength(6)
        })
      })
    }
  }
})

describe("tríadas por grupo de cuerdas", () => {
  for (let root = 0; root < 12; root++) for (const q of ["major", "minor"] as const) {
    it(`raíz ${root} ${q}: cada forma tiene exactamente la tríada`, () => {
      const third = q === "major" ? 4 : 3
      const shapes = computeTriads(root, q)
      expect(shapes.length).toBeGreaterThan(0)
      for (const s of shapes) {
        const rel = new Set(chordPcs(s.frets).map(p => (p - root + 12) % 12))
        expect([...rel].sort((a, b) => a - b)).toEqual([0, third, 7])
      }
    })
  }
})

describe("círculo de quintas", () => {
  it("cada paso sube una quinta justa y suma un sostenido (o quita un bemol)", () => {
    for (let i = 1; i < CIRCLE_NOTES.length; i++) {
      expect((CIRCLE_NOTES[i].rootIdx - CIRCLE_NOTES[i - 1].rootIdx + 12) % 12).toBe(7)
    }
    const acc = CIRCLE_NOTES.map(c => c.sharps)
    expect(acc).toEqual([0, 1, 2, 3, 4, 5, 6, -5, -4, -3, -2, -1])
  })
  it("la relativa menor está una 3ª menor abajo", () => {
    const pc: Record<string, number> = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 }
    for (const c of CIRCLE_NOTES) {
      const minorRoot = pc[c.minor.replace("m", "")]
      expect((c.rootIdx - minorRoot + 12) % 12, `${c.major} / ${c.minor}`).toBe(3)
    }
  })
})
