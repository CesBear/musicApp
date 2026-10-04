import { describe, it, expect } from "vitest"
import { n, staffPos, fromPos, midiOf, placeName, makeQuestion, guitarSpots, judgeGuitarAnswer, LESSONS, MODES, type Mode } from "@/data/solfeo"

describe("pentagrama", () => {
  it("anclas de la clave de sol", () => {
    expect(staffPos(n("E4"), "treble")).toBe(0)   // 1ª línea
    expect(staffPos(n("G4"), "treble")).toBe(2)   // la clave se enrosca en la 2ª línea
    expect(staffPos(n("F5"), "treble")).toBe(8)   // 5ª línea
    expect(staffPos(n("C4"), "treble")).toBe(-2)  // Do central: 1 línea adicional abajo
  })
  it("anclas de la clave de fa", () => {
    expect(staffPos(n("G2"), "bass")).toBe(0)
    expect(staffPos(n("F3"), "bass")).toBe(6)     // los puntos rodean la 4ª línea
    expect(staffPos(n("A3"), "bass")).toBe(8)
    expect(staffPos(n("C4"), "bass")).toBe(10)    // Do central: 1 línea adicional arriba
  })
  it("cuerdas al aire de la guitarra (escritas una octava arriba)", () => {
    expect(["E3", "A3", "D4", "G4", "B4", "E5"].map(x => staffPos(n(x), "treble"))).toEqual([-7, -4, -1, 2, 4, 7])
    expect(midiOf(n("E3")) - 12).toBe(40)         // suena Mi2, la 6ª cuerda
  })
  it("nombres de lugar", () => {
    expect(placeName(2)).toBe("2ª línea")
    expect(placeName(7)).toBe("4º espacio")
    expect(placeName(-2)).toBe("1ª línea adicional abajo")
    expect(placeName(-7)).toBe("debajo de la 3ª línea adicional")
  })
  it("fromPos es la inversa de staffPos", () => {
    for (const clef of ["treble", "bass"] as const) for (let p = -10; p <= 16; p++) expect(staffPos(fromPos(p, clef), clef)).toBe(p)
  })
  it("midi y alteraciones", () => {
    expect(midiOf(n("C4"))).toBe(60)
    expect(midiOf(n("A4"))).toBe(69)
    expect(midiOf(n("F#4"))).toBe(66)
    expect(midiOf(n("Bb4"))).toBe(70)
  })
  it("todas las notas de las lecciones se pueden leer", () => {
    for (const l of LESSONS) for (const x of l.staff?.notes ?? []) expect(() => n(x.note)).not.toThrow()
  })
})

describe("ejercicios", () => {
  const RANGE: Record<Mode, Record<number, [number, number]>> = {
    treble: { 1: [0, 8], 2: [-4, 12], 3: [-2, 10] }, bass: { 1: [0, 8], 2: [-4, 12], 3: [-2, 10] },
    grand: { 1: [0, 8], 2: [-4, 12], 3: [-2, 10] }, guitar: { 1: [-7, 8], 2: [-7, 12], 3: [-7, 12] },
  }
  for (const m of MODES) for (const level of [1, 2, 3] as const) {
    it(`${m.id} nivel ${level}: rango y alteraciones`, () => {
      let accs = 0
      for (let k = 0; k < 500; k++) {
        const q = makeQuestion(m.id, level)
        const p = staffPos(q.note, q.clef)
        const [lo, hi] = RANGE[m.id][level]
        expect(p).toBeGreaterThanOrEqual(lo); expect(p).toBeLessThanOrEqual(hi)
        if (m.id === "bass") expect(q.clef).toBe("bass")
        if (m.id === "treble" || m.id === "guitar") expect(q.clef).toBe("treble")
        if (q.note.acc) accs++
        // nada de Mi♯, Si♯, Fa♭, Do♭
        if (q.note.acc === 1) expect([2, 6]).not.toContain(q.note.step)
        if (q.note.acc === -1) expect([0, 3]).not.toContain(q.note.step)
      }
      if (level < 3) expect(accs).toBe(0); else expect(accs).toBeGreaterThan(100)
    })
  }
  it("en modo guitarra toda nota se puede tocar hasta el traste 12", () => {
    for (let k = 0; k < 500; k++) {
      const q = makeQuestion("guitar", 3)
      const sounding = midiOf(q.note) - 12
      const spots = [40, 45, 50, 55, 59, 64].filter(open => sounding - open >= 0 && sounding - open <= 12)
      expect(spots.length, `nota ${sounding}`).toBeGreaterThan(0)
    }
  })
})

describe("respuestas en el mástil (modo guitarra)", () => {
  // Caso real: Sol♭ en la 2ª línea → Sol♭4 escrito → suena Sol♭3
  const gb = n("Gb4")
  it("las posiciones correctas son 4ª cuerda traste 4 y 5ª cuerda traste 9", () => {
    expect(guitarSpots(gb)).toEqual([{ string: 1, fret: 9 }, { string: 2, fret: 4 }])
  })
  it("acertar la posición es correcto", () => {
    expect(judgeGuitarAnswer(gb, 2, 4, "solfege")).toEqual({ kind: "ok", text: "Sol♭3 en la 4ª cuerda traste 4" })
  })
  it("la misma nota una octava abajo se explica como error de octava", () => {
    const v = judgeGuitarAnswer(gb, 0, 2, "solfege")       // 6ª cuerda traste 2 = Sol♭2
    expect(v.kind).toBe("octave")
    expect(v.text).toBe("Tocaste Sol♭2 (6ª cuerda traste 2): la nota es correcta pero una octava más grave. Aquí suena Sol♭3: 5ª cuerda traste 9 o 4ª cuerda traste 4.")
  })
  it("una nota distinta dice cuál tocaste", () => {
    const v = judgeGuitarAnswer(gb, 0, 5, "letters")        // La2
    expect(v.kind).toBe("wrong")
    expect(v.text).toContain("Tocaste A2")
    expect(v.text).toContain("Era G♭3")
  })
  it("las cuerdas al aire se nombran «al aire»", () => {
    expect(judgeGuitarAnswer(n("E3"), 0, 0, "solfege").text).toBe("Mi2 en la 6ª al aire")
  })
})
