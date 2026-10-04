import { describe, it, expect } from "vitest"
import { CATEGORIES, ALL_PATTERNS, OPEN_CHORDS, BASS, THEORY, GENRE_GUIDE, STYLE_VOICINGS } from "@/data/rhythms"
import { chordAt } from "@/lib/rhythmAudio"
import { grooveFor } from "@/lib/band"
import { GUITAR_TUNING_MIDI } from "@/data/scales"
import { chordPcs, names } from "../helpers/music"

describe("patrones de rasgueo", () => {
  it("los ids son únicos", () => {
    const ids = ALL_PATTERNS.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  for (const p of ALL_PATTERNS) {
    describe(p.id, () => {
      it("tiene beats × subdivisión golpes", () => {
        expect(p.strokes).toHaveLength(p.beats * p.subsPerBeat)
        if (p.countLabels) expect(p.countLabels).toHaveLength(p.strokes.length)
      })
      it("respeta la regla del péndulo (abajo en número/+, arriba en e/a)", () => {
        if (p.subsPerBeat === 3 || p.fingers) return            // tresillos y con dedos no alternan igual
        p.strokes.forEach((s, i) => {
          const down = i % 2 === 0
          if (s === "U" || s === "u") expect(down, `subida en tiempo de bajada (golpe ${i})`).toBe(false)
          if (!p.allDown && p.voice !== "chug" && "DdBb".includes(s)) expect(down, `bajada en tiempo de subida (golpe ${i})`).toBe(true)
        })
      })
      it("usa acordes, bajos y riffs que existen", () => {
        for (const c of p.chords ?? []) {
          expect(OPEN_CHORDS[c], `acorde ${c}`).toBeDefined()
          if (p.strokes.some(s => "BbP".includes(s))) expect(BASS[c], `bajo de ${c}`).toBeDefined()
        }
        for (const c of Object.values(p.stepChords ?? {})) expect(OPEN_CHORDS[c], `riff ${c}`).toBeDefined()
      })
      it("las aproximaciones cromáticas usan formas movibles", () => {
        if (!p.approach?.length) return
        for (const c of p.chords ?? []) expect(OPEN_CHORDS[c].includes(0), `${c} tiene cuerdas al aire`).toBe(false)
      })
      it("tiene un groove de banda con el mismo largo de compás", () => {
        const g = grooveFor(p)
        const hits = [...Object.values(g.drums).flat(), ...g.bass.map(b => b.at)]
        for (const at of hits) expect(at).toBeLessThan(p.beats + 1e-6)
      })
    })
  }
})

describe("notas de los acordes", () => {
  const EXPECT: Record<string, string> = {
    E: "E B E G# B E", A: "A E A C# E", D: "D A D F#", G: "G B D G B G", C: "C E G C E", F: "F C F A C F",
    Am: "A E A C E", Dm: "D A D F", Em: "E B E G B E", E7: "E B D G# B E", A7: "A E G C# E", B7: "B D# A B F#",
    G7: "G B D G B F", Am7: "A E G C E", Dm7: "D A C F", Cmaj7: "C E G B E",
    E9: "E B D G# B F#", Em9: "E G D F#", Am9: "A G C E B", A9: "A G C# E B", D9: "D F# C E", Dm9: "D F C E",
    C9: "C E A# D", G13: "G F B E", "Em7·": "E B D G", "A7·": "A G C# E", Fmaj7: "F E A C", Cmaj9: "C E B D",
    Dmaj9: "D F# C# E", "E7#9": "E G# D G",
  }
  for (const [name, notes] of Object.entries(EXPECT)) {
    it(`${name} = ${notes}`, () => expect(names(chordPcs(OPEN_CHORDS[name]))).toBe(notes))
  }
  it("los bajos son fundamental y quinta (o la nota pedida)", () => {
    const N = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    for (const [chord, [[s1, f1], [s2, f2]]] of Object.entries(BASS)) {
      const root = N[(GUITAR_TUNING_MIDI[s1] + f1) % 12]
      expect(chord.startsWith(root), `${chord}: bajo ${root}`).toBe(true)
      const alt = (GUITAR_TUNING_MIDI[s2] + f2 - (GUITAR_TUNING_MIDI[s1] + f1) + 120) % 12
      expect([7, 5], `${chord}: el bajo alternado debe ser la 5ª`).toContain(alt)
    }
  })
})

describe("técnicas de golpe", () => {
  const p = (id: string) => ALL_PATTERNS.find(x => x.id === id)!
  it("el empuje toca el acorde del compás siguiente", () => {
    expect(chordAt(p("kiko-251"), 15, 0)).toBe("A9")
    expect(chordAt(p("kiko-251"), 0, 0)).toBe("Em7·")
  })
  it("los riffs por golpe usan su propio acorde", () => {
    expect(chordAt(p("kiko-octavas"), 6, 0)).toBe("8vaC")
  })
})

describe("guía, teoría y voicings", () => {
  const ids = new Set(ALL_PATTERNS.map(x => x.id))
  it("la guía por género apunta a patrones reales", () => {
    for (const g of GENRE_GUIDE) for (const id of g.patterns) expect(ids.has(id), `${g.genre} → ${id}`).toBe(true)
  })
  it("la teoría apunta a patrones reales", () => {
    for (const t of THEORY) for (const id of t.demos) expect(ids.has(id), `${t.id} → ${id}`).toBe(true)
  })
  it("cada voicing de la galería tiene digitación coherente con sus trastes", () => {
    for (const c of CATEGORIES) for (const v of c.voicings ?? []) {
      const fr = OPEN_CHORDS[v], fi = STYLE_VOICINGS[v]?.fingers
      expect(fr && fi, v).toBeTruthy()
      fr.forEach((f, i) => expect(f > 0, `${v} cuerda ${i}`).toBe(fi[i] > 0))
    }
  })
})
