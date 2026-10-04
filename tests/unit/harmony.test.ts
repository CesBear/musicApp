import { describe, it, expect } from "vitest"
import { palette, voicingsFor, chordTones, keyScales, PROGRESSION_PRESETS, type Mode } from "@/lib/harmony"
import { chordPcs } from "../helpers/music"

const MODES: Mode[] = ["major", "minor"]
const byId = (key: number, mode: Mode, sev: boolean) => Object.fromEntries(palette(key, mode, sev).map(c => [c.id, c]))

describe("paleta diatónica", () => {
  it("Do mayor: C Dm Em F G Am B°", () => {
    expect(palette(0, "major", false).filter(c => c.group === "diatonic").map(c => c.name)).toEqual(["C", "Dm", "Em", "F", "G", "Am", "B°"])
  })
  it("Do mayor con 7ª: Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7♭5", () => {
    expect(palette(0, "major", true).filter(c => c.group === "diatonic").map(c => c.name)).toEqual(["Cmaj7", "Dm7", "Em7", "Fmaj7", "G7", "Am7", "Bm7♭5"])
  })
  it("La menor: Am B° C Dm Em F G", () => {
    expect(palette(9, "minor", false).filter(c => c.group === "diatonic").map(c => c.name)).toEqual(["Am", "B°", "C", "Dm", "Em", "F", "G"])
  })
  it("Fa mayor usa bemoles: B♭, no A♯", () => {
    expect(palette(5, "major", false).find(c => c.id === "d:3")!.name).toBe("B♭")
  })
})

describe("prestados y dominantes secundarias", () => {
  it("en Do mayor: ♭VII = B♭, iv = Fm, ♭VI = A♭, ♭III = E♭", () => {
    const p = byId(0, "major", false)
    expect([p["b:♭VII"].name, p["b:iv"].name, p["b:♭VI"].name, p["b:♭III"].name]).toEqual(["B♭", "Fm", "A♭", "E♭"])
  })
  it("cada V/x es un dominante 7 una quinta arriba de su destino", () => {
    for (let key = 0; key < 12; key++) {
      const p = byId(key, "major", false)
      for (const [id, target] of [["s:V/ii", "d:1"], ["s:V/iii", "d:2"], ["s:V/IV", "d:3"], ["s:V/V", "d:4"], ["s:V/vi", "d:5"]]) {
        expect(p[id].quality).toBe("7")
        expect((p[id].rootIdx - p[target].rootIdx + 12) % 12, `${id} en ${key}`).toBe(7)
      }
    }
  })
  it("en La menor el V prestado es E (mayor, con el Sol♯)", () => {
    const v = byId(9, "minor", false)["b:V"]
    expect(v.name).toBe("E"); expect(v.tones).toContain(8)
  })
})

describe("escalas para improvisar", () => {
  it("la escala recomendada contiene todas las notas de su acorde (12 tonalidades, mayor y menor, con y sin 7ª)", () => {
    const problems: string[] = []
    for (let key = 0; key < 12; key++) for (const mode of MODES) for (const sev of [false, true]) {
      for (const c of palette(key, mode, sev)) {
        const sc = new Set(c.scale.intervals.map(i => (c.scale.rootIdx + i) % 12))
        for (const t of c.tones) if (!sc.has(t)) problems.push(`${key} ${mode} ${c.name}: ${c.scale.name} no tiene la nota ${t}`)
      }
    }
    expect(problems, problems.slice(0, 10).join("\n")).toEqual([])
  })
  it("los diatónicos usan exactamente las notas de la tonalidad", () => {
    for (let key = 0; key < 12; key++) for (const mode of MODES) {
      const keyNotes = new Set(keyScales(key, mode)[1].intervals.map(i => (key + i) % 12))
      for (const c of palette(key, mode, false).filter(x => x.group === "diatonic")) {
        const sc = c.scale.intervals.map(i => (c.scale.rootIdx + i) % 12)
        expect(new Set(sc), `${c.name} en ${key} ${mode}`).toEqual(keyNotes)
      }
    }
  })
})

describe("voicings", () => {
  it("todo acorde de la paleta tiene al menos un voicing y sus notas son del acorde", () => {
    const problems: string[] = []
    for (let key = 0; key < 12; key++) for (const mode of MODES) for (const sev of [false, true]) {
      for (const c of palette(key, mode, sev)) {
        const vs = voicingsFor(c)
        if (!vs.length) { problems.push(`${c.name}: sin voicings`); continue }
        const tones = new Set(c.tones)
        vs.forEach((v, i) => {
          const pcs = chordPcs(v.frets)
          for (const p of pcs) if (!tones.has(p)) problems.push(`${c.name} #${i}: nota ajena ${p} (${v.frets})`)
          if (!pcs.includes(c.rootIdx)) problems.push(`${c.name} #${i}: sin fundamental`)
          if (!pcs.includes(c.tones[1])) problems.push(`${c.name} #${i}: sin 3ª`)
          if (v.frets.some(f => f > 15)) problems.push(`${c.name} #${i}: traste imposible`)
        })
      }
    }
    expect(problems, problems.slice(0, 10).join("\n")).toEqual([])
  })
  it("m7♭5 y disminuido tienen las notas correctas", () => {
    expect(chordTones(11, "m7b5")).toEqual([11, 2, 5, 9])   // B D F A
    expect(chordTones(11, "dim")).toEqual([11, 2, 5])
  })
})

describe("progresiones de ejemplo", () => {
  it("solo usan acordes que existen en la paleta", () => {
    for (const mode of MODES) {
      const ids = new Set(palette(0, mode, false).map(c => c.id))
      for (const p of PROGRESSION_PRESETS[mode]) for (const id of p.ids) expect(ids.has(id), `${p.label}: ${id}`).toBe(true)
    }
  })
})

describe("deletreo de las notas del acorde", () => {
  const p = byId(0, "major", true)
  it("E7 (V/vi en Do) = E G♯ B D, no A♭", () => expect(p["s:V/vi"].toneNames).toEqual(["E", "G♯", "B", "D"]))
  it("B♭7 (♭VII con 7ª en Do) = B♭ D F A♭", () => expect(p["b:♭VII"].toneNames).toEqual(["B♭", "D", "F", "A♭"]))
  it("Bm7♭5 = B D F A", () => expect(p["d:6"].toneNames).toEqual(["B", "D", "F", "A"]))
  it("F♯m en Re mayor = F♯ A C♯", () => expect(byId(2, "major", false)["d:2"].toneNames).toEqual(["F♯", "A", "C♯"]))
  it("E♭maj7 = E♭ G B♭ D", () => expect(byId(3, "major", true)["d:0"].toneNames).toEqual(["E♭", "G", "B♭", "D"]))
  it("cada nombre corresponde a su clase de altura (todas las tonalidades)", () => {
    const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
    for (let key = 0; key < 12; key++) for (const mode of MODES) for (const sev of [false, true]) for (const c of palette(key, mode, sev)) {
      c.toneNames.forEach((nm, i) => {
        const pc = (PC[nm[0]] + [...nm.slice(1)].reduce((a, ch) => a + (ch === "♯" ? 1 : -1), 0) + 12) % 12
        expect(pc, `${c.name}: ${nm}`).toBe(c.tones[i])
      })
    }
  })
})
