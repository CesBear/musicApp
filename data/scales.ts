// Scales, intervals, modes — core music theory data
export const NOTE_NAMES      = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]
export const NOTE_NAMES_FLAT = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"]

export const GUITAR_TUNING  = [4, 9, 2, 7, 11, 4]
// Absolute MIDI note of each open string (low E2 → high e4) — use this for
// fret-to-pitch math. GUITAR_TUNING above is pitch *class* only (0-11, for
// note-name lookups) and is missing the octave, so `40 + GUITAR_TUNING[i]`
// is NOT a valid open-string pitch except for string 0.
export const GUITAR_TUNING_MIDI = [40, 45, 50, 55, 59, 64]
export const STRING_LABELS  = ["E", "A", "D", "G", "B", "e"]

export const INTERVAL_NAMES  = ["R", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"]
export const DEGREE_SYMBOLS  = ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"]

// Refined degree palette — same chroma/lightness, hue-rotated
export const DEGREE_COLORS = [
  "oklch(0.80 0.15 70)",   // I  amber (root)
  "oklch(0.78 0.12 240)",  // ii sky
  "oklch(0.80 0.14 150)",  // iii emerald
  "oklch(0.80 0.14 350)",  // IV rose
  "oklch(0.78 0.14 295)",  // V  violet
  "oklch(0.80 0.14 40)",   // vi orange
  "oklch(0.80 0.13 195)",  // vii teal
]

export const DEGREE_LABELS = ["I", "II", "III", "IV", "V", "VI", "VII"]

export type ScaleGroup = "major" | "minor" | "pentatonic" | "mode"
export type ScaleType = { name: string; intervals: number[]; group: ScaleGroup }

export const SCALE_TYPES: ScaleType[] = [
  { name: "Mayor",             intervals: [0, 2, 4, 5, 7, 9, 11], group: "major" },
  { name: "Menor Natural",     intervals: [0, 2, 3, 5, 7, 8, 10], group: "minor" },
  { name: "Menor Armónica",    intervals: [0, 2, 3, 5, 7, 8, 11], group: "minor" },
  { name: "Pentatónica Mayor", intervals: [0, 2, 4, 7, 9],        group: "pentatonic" },
  { name: "Pentatónica Menor", intervals: [0, 3, 5, 7, 10],       group: "pentatonic" },
  { name: "Blues",             intervals: [0, 3, 5, 6, 7, 10],    group: "pentatonic" },
  { name: "Dórica",            intervals: [0, 2, 3, 5, 7, 9, 10], group: "mode" },
  { name: "Mixolidia",         intervals: [0, 2, 4, 5, 7, 9, 10], group: "mode" },
  { name: "Frigia",            intervals: [0, 1, 3, 5, 7, 8, 10], group: "mode" },
  { name: "Lidia",             intervals: [0, 2, 4, 6, 7, 9, 11], group: "mode" },
]

export type ScaleInfo = { mood: string; description: string; improv: string }

export const SCALE_INFO: Record<string, ScaleInfo> = {
  "Mayor":             { mood: "Bright · Estable",   description: "Optimista, completamente resuelta — la base de la música occidental.",                improv: "Progresiones I–IV–V, melodías alegres." },
  "Menor Natural":     { mood: "Dark · Melancólico",  description: "Introspectiva, dramática — la base del rock, blues, clásica.",                          improv: "i–VI–III–VII, baladas, rock alternativo." },
  "Menor Armónica":    { mood: "Exotic · Tense",      description: "Menor con séptima elevada. Tensión dramática que resuelve al I con fuerza.",            improv: "Acordes V7 en tonalidades menores." },
  "Pentatónica Mayor": { mood: "Open · Vocal",        description: "Cinco notas que suenan naturales sobre cualquier acorde mayor.",                        improv: "Country, pop, rock mayor. La más segura." },
  "Pentatónica Menor": { mood: "Raw · Bluesy",        description: "Las cinco notas del rock y el blues. La más usada en guitarra eléctrica.",              improv: "Hendrix, Clapton, Page. Blues en I, IV, V." },
  "Blues":             { mood: "Gritty · Soulful",    description: "Pentatónica menor con la nota azul (b5). El sabor del blues clásico.",                  improv: "El b5 como nota de paso entre 4 y 5." },
  "Dórica":            { mood: "Cool · Jazzístico",   description: "Menor con sexta elevada. Menos oscura, con sabor funky.",                                improv: "Carlos Santana. Acordes m7 estáticos." },
  "Mixolidia":         { mood: "Dominant · Funky",    description: "Mayor con séptima bemol. El sonido del rock clásico y el blues eléctrico.",             improv: "Acordes dominantes 7. SRV." },
  "Frigia":            { mood: "Tense · Flamenco",    description: "Segundo modo de la mayor. Oscuro e intenso, sabor mediterráneo o metal.",               improv: "Riffs de metal y flamenco. El b2 lo define." },
  "Lidia":             { mood: "Dreamy · Brillante",  description: "Mayor con cuarta aumentada. Etérea, cinematográfica.",                                   improv: "Maj7#11. Atmósferas flotantes." },
}

export const MAJOR_TRIADS = [
  { quality: "maj", symbol: "" },  { quality: "min", symbol: "m" },
  { quality: "min", symbol: "m" }, { quality: "maj", symbol: "" },
  { quality: "maj", symbol: "" },  { quality: "min", symbol: "m" },
  { quality: "dim", symbol: "°" },
] as const

export const MINOR_TRIADS = [
  { quality: "min", symbol: "m" },  { quality: "dim", symbol: "°" },
  { quality: "maj", symbol: "" },   { quality: "min", symbol: "m" },
  { quality: "min", symbol: "m" },  { quality: "maj", symbol: "" },
  { quality: "maj", symbol: "" },
] as const

export function getScaleNotes(rootIdx: number, intervals: number[]): Set<number> {
  return new Set(intervals.map(i => (rootIdx + i) % 12))
}

export function getNoteName(semitone: number, preferFlat = false): string {
  return preferFlat ? NOTE_NAMES_FLAT[semitone % 12] : NOTE_NAMES[semitone % 12]
}

export function getIntervalLabel(semitone: number, rootIdx: number, mode: "notes" | "intervals" | "degrees"): string {
  if (mode === "notes") return NOTE_NAMES[((semitone % 12) + 12) % 12]
  const interval = ((semitone - rootIdx) % 12 + 12) % 12
  return mode === "intervals" ? INTERVAL_NAMES[interval] : DEGREE_SYMBOLS[interval]
}

export function getScalePositions(rootIdx: number, intervals: number[]) {
  const rootFret = (rootIdx - GUITAR_TUNING[0] + 12) % 12
  return intervals.map((interval, i) => {
    let start = rootFret + interval
    if (start > 20) start -= 12
    return { label: `Pos. ${i + 1}`, startFret: start, endFret: start + 4 }
  })
}
