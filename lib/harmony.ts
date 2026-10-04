// Armonía para Progresiones: la paleta de acordes de una tonalidad (diatónicos, con o
// sin 7ª, prestados y dominantes secundarias), sus notas, sus voicings y la escala
// recomendada para improvisar encima de cada uno. Sin dependencias de audio ni de UI.
import { NOTE_NAMES, NOTE_NAMES_FLAT } from "@/data/scales"
import { CIRCLE_NOTES } from "@/data/circle"
import { CHORD_VOICINGS, computeTriads, type ChordVoicing } from "@/data/chords"

export type Mode = "major" | "minor"
export type ChordQuality = "major" | "minor" | "dim" | "maj7" | "m7" | "7" | "m7b5"
export type ChordGroup = "diatonic" | "borrowed" | "secondary"
export type Func = "T" | "S" | "D" | "color"

export interface ImprovScale { rootIdx: number; intervals: number[]; name: string }

export interface HarmonyChord {
  id:      string          // estable entre tonalidades: "d:2", "b:♭VII", "s:V/vi"
  degree:  string          // número romano: "ii", "♭VII", "V/vi"
  rootIdx: number
  quality: ChordQuality
  name:    string          // "Dm7", "B♭", "E7"
  group:   ChordGroup
  func:    Func
  tones:   number[]        // clases de altura: [fundamental, 3ª, 5ª, (7ª)]
  toneNames: string[]      // deletreadas por intervalo: E7 = E G♯ B D (nunca A♭)
  scale:   ImprovScale     // qué escala usar encima
  hint:    string          // por qué funciona esa escala
}

const FORMULA: Record<ChordQuality, number[]> = {
  major: [0, 4, 7], minor: [0, 3, 7], dim: [0, 3, 6],
  maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], "7": [0, 4, 7, 10], m7b5: [0, 3, 6, 10],
}
const SUFFIX: Record<ChordQuality, string> = { major: "", minor: "m", dim: "°", maj7: "maj7", m7: "m7", "7": "7", m7b5: "m7♭5" }

export const SCALES = {
  ionian:     { name: "jónico (mayor)",      intervals: [0, 2, 4, 5, 7, 9, 11] },
  dorian:     { name: "dórico",               intervals: [0, 2, 3, 5, 7, 9, 10] },
  phrygian:   { name: "frigio",               intervals: [0, 1, 3, 5, 7, 8, 10] },
  lydian:     { name: "lidio",                intervals: [0, 2, 4, 6, 7, 9, 11] },
  mixolydian: { name: "mixolidio",            intervals: [0, 2, 4, 5, 7, 9, 10] },
  aeolian:    { name: "eólico (menor natural)", intervals: [0, 2, 3, 5, 7, 8, 10] },
  locrian:    { name: "locrio",               intervals: [0, 1, 3, 5, 6, 8, 10] },
  phrygDom:   { name: "frigio dominante (5º de la menor armónica)", intervals: [0, 1, 4, 5, 7, 8, 10] },
  majPent:    { name: "pentatónica mayor",    intervals: [0, 2, 4, 7, 9] },
  minPent:    { name: "pentatónica menor",    intervals: [0, 3, 5, 7, 10] },
} as const

export const chordTones = (rootIdx: number, q: ChordQuality) => FORMULA[q].map(i => (rootIdx + i) % 12)

// Deletreo: cada intervalo usa la letra que le toca (3ª = dos letras arriba, 5ª = cuatro, 7ª = seis)
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"]
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11]
const LETTER_STEPS: Record<number, number> = { 0: 0, 2: 1, 3: 2, 4: 2, 5: 3, 6: 4, 7: 4, 8: 4, 9: 5, 10: 6, 11: 6 }
export function spellChord(rootName: string, q: ChordQuality): string[] {
  const rl = LETTERS.indexOf(rootName[0])
  const acc = rootName.slice(1)
  const rootPc = (LETTER_PC[rl] + (acc === "♯" ? 1 : acc === "♭" ? -1 : 0) + 12) % 12
  return FORMULA[q].map(iv => {
    const L = (rl + LETTER_STEPS[iv]) % 7
    let diff = (rootPc + iv - LETTER_PC[L] + 12) % 12
    if (diff > 6) diff -= 12
    return LETTERS[L] + (diff > 0 ? "♯".repeat(diff) : "♭".repeat(-diff))
  })
}

const preferFlat = (keyRoot: number, mode: Mode) => {
  // La armadura de la tonalidad mayor (o de la relativa mayor) decide sostenidos o bemoles
  const major = mode === "major" ? keyRoot : (keyRoot + 3) % 12
  return (CIRCLE_NOTES.find(c => c.rootIdx === major)?.sharps ?? 0) < 0
}
export const pcName = (pc: number, flat: boolean) => (flat ? NOTE_NAMES_FLAT : NOTE_NAMES)[((pc % 12) + 12) % 12].replace("b", "♭").replace("#", "♯")

const MODE_NAMES_MAJOR = ["ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"] as const
const MAJOR_DEGREES = [
  { roman: "I", semis: 0, tri: "major", sev: "maj7", func: "T" },
  { roman: "ii", semis: 2, tri: "minor", sev: "m7", func: "S" },
  { roman: "iii", semis: 4, tri: "minor", sev: "m7", func: "T" },
  { roman: "IV", semis: 5, tri: "major", sev: "maj7", func: "S" },
  { roman: "V", semis: 7, tri: "major", sev: "7", func: "D" },
  { roman: "vi", semis: 9, tri: "minor", sev: "m7", func: "T" },
  { roman: "vii°", semis: 11, tri: "dim", sev: "m7b5", func: "D" },
] as const
// Menor natural = modo eólico: los mismos acordes que la mayor relativa, empezando en el vi
const MINOR_DEGREES = [
  { roman: "i", semis: 0, tri: "minor", sev: "m7", func: "T", mode: "aeolian" },
  { roman: "ii°", semis: 2, tri: "dim", sev: "m7b5", func: "S", mode: "locrian" },
  { roman: "♭III", semis: 3, tri: "major", sev: "maj7", func: "T", mode: "ionian" },
  { roman: "iv", semis: 5, tri: "minor", sev: "m7", func: "S", mode: "dorian" },
  { roman: "v", semis: 7, tri: "minor", sev: "m7", func: "D", mode: "phrygian" },
  { roman: "♭VI", semis: 8, tri: "major", sev: "maj7", func: "S", mode: "lydian" },
  { roman: "♭VII", semis: 10, tri: "major", sev: "7", func: "D", mode: "mixolydian" },
] as const

function make(keyRoot: number, mode: Mode, id: string, degree: string, semis: number, quality: ChordQuality,
  group: ChordGroup, func: Func, scale: ImprovScale, hint: string): HarmonyChord {
  const rootIdx = (keyRoot + semis) % 12
  const flat = preferFlat(keyRoot, mode) || degree.includes("♭")
  const root = pcName(rootIdx, flat)
  return { id, degree, rootIdx, quality, name: root + SUFFIX[quality], group, func, tones: chordTones(rootIdx, quality), toneNames: spellChord(root, quality), scale, hint }
}

const sc = (rootIdx: number, key: keyof typeof SCALES, flat: boolean): ImprovScale =>
  ({ rootIdx: rootIdx % 12, intervals: [...SCALES[key].intervals], name: `${pcName(rootIdx, flat)} ${SCALES[key].name}` })

/** Paleta de acordes de la tonalidad: 7 diatónicos + prestados + dominantes secundarias. */
export function palette(keyRoot: number, mode: Mode, sevenths: boolean): HarmonyChord[] {
  const flat = preferFlat(keyRoot, mode)
  const out: HarmonyChord[] = []
  if (mode === "major") {
    MAJOR_DEGREES.forEach((d, i) => {
      const q = (sevenths ? d.sev : d.tri) as ChordQuality
      const modeKey = MODE_NAMES_MAJOR[i]
      out.push(make(keyRoot, mode, `d:${i}`, sevenths ? d.roman.replace("°", "ø") : d.roman, d.semis, q, "diatonic", d.func as Func,
        sc(keyRoot + d.semis, modeKey, flat), i === 0 ? "La escala de la tonalidad: todas las notas funcionan." : `Las notas de la tonalidad vistas desde ${pcName(keyRoot + d.semis, flat)} (${SCALES[modeKey].name}).`))
    })
    // Prestados de la tonalidad menor paralela: color «rock» y melancólico
    // Como tríada (B♭ en Do) basta el mixolidio de la tónica; el B♭7 trae además el La♭,
    // que solo está en la menor natural paralela, de donde viene el acorde
    out.push(make(keyRoot, mode, "b:♭VII", "♭VII", 10, sevenths ? "7" : "major", "borrowed", "color",
      sc(keyRoot, sevenths ? "aeolian" : "mixolydian", flat),
      sevenths ? "Prestado de la menor paralela: menor natural de la tónica (incluye la 7ª del acorde)."
        : "Viene del modo mixolidio: sobre él, la escala de la tonalidad con la 7ª bajada (♭7)."))
    out.push(make(keyRoot, mode, "b:iv", "iv", 5, sevenths ? "m7" : "minor", "borrowed", "S", sc(keyRoot, "aeolian", flat), "Prestado de la menor paralela: usa la menor natural de la tónica (3ª, 6ª y 7ª bajadas)."))
    out.push(make(keyRoot, mode, "b:♭VI", "♭VI", 8, sevenths ? "maj7" : "major", "borrowed", "S", sc(keyRoot, "aeolian", flat), "Prestado de la menor paralela: menor natural de la tónica."))
    out.push(make(keyRoot, mode, "b:♭III", "♭III", 3, sevenths ? "maj7" : "major", "borrowed", "T", sc(keyRoot, "aeolian", flat), "Prestado de la menor paralela: menor natural de la tónica."))
    // Dominantes secundarias: el V7 de cada acorde diatónico
    ;[["ii", 2, true], ["iii", 4, true], ["IV", 5, false], ["V", 7, false], ["vi", 9, true]].forEach(([target, semis, minorTarget]) => {
      const root = (semis as number) + 7
      out.push(make(keyRoot, mode, `s:V/${target}`, `V/${target}`, root, "7", "secondary", "D",
        sc(keyRoot + root, minorTarget ? "phrygDom" : "mixolydian", flat),
        minorTarget ? `Lleva a un acorde menor: frigio dominante (la 3ª mayor ${pcName(keyRoot + root + 4, flat)} es la nota que «tira»).`
          : `Lleva a un acorde mayor: mixolidio sobre ${pcName(keyRoot + root, flat)}.`))
    })
  } else {
    MINOR_DEGREES.forEach((d, i) => {
      const q = (sevenths ? d.sev : d.tri) as ChordQuality
      out.push(make(keyRoot, mode, `d:${i}`, sevenths ? d.roman.replace("°", "ø") : d.roman, d.semis, q, "diatonic", d.func as Func,
        sc(keyRoot + d.semis, d.mode, flat), i === 0 ? "La escala de la tonalidad: menor natural." : `Las notas de la tonalidad vistas desde ${pcName(keyRoot + d.semis, flat)} (${SCALES[d.mode].name}).`))
    })
    // Prestados: V mayor (de la menor armónica) y IV mayor (del dórico)
    out.push(make(keyRoot, mode, "b:V", "V", 7, sevenths ? "7" : "major", "borrowed", "D", sc(keyRoot + 7, "phrygDom", flat), "De la menor armónica: la sensible (3ª del V) resuelve a la tónica medio tono arriba."))
    out.push(make(keyRoot, mode, "b:IV", "IV", 5, sevenths ? "7" : "major", "borrowed", "S", sc(keyRoot, "dorian", flat), "Del modo dórico: la tónica con la 6ª mayor (sonido Santana, funk)."))
    out.push(make(keyRoot, mode, "s:V/iv", "V/iv", 0, "7", "secondary", "D", sc(keyRoot, "phrygDom", flat), "La tónica vuelta dominante para ir al iv: frigio dominante."))
    out.push(make(keyRoot, mode, "s:V/♭III", "V/♭III", 10, "7", "secondary", "D", sc(keyRoot + 10, "mixolydian", flat), "Es el ♭VII con 7ª: lleva al ♭III mayor. Mixolidio."))
  }
  return out
}

/** Escala general de la tonalidad y su pentatónica (la forma más fácil de empezar a improvisar). */
export function keyScales(keyRoot: number, mode: Mode): ImprovScale[] {
  const flat = preferFlat(keyRoot, mode)
  return mode === "major"
    ? [sc(keyRoot, "majPent", flat), sc(keyRoot, "ionian", flat)]
    : [sc(keyRoot, "minPent", flat), sc(keyRoot, "aeolian", flat)]
}

export function keyName(keyRoot: number, mode: Mode) {
  return pcName(keyRoot, preferFlat(keyRoot, mode)) + (mode === "major" ? " mayor" : " menor")
}

// ─── Voicings ─────────────────────────────────────────────────────────────────

const VOICING_TYPE: Partial<Record<ChordQuality, "major" | "minor" | "dom7" | "maj7" | "m7">> = {
  major: "major", minor: "minor", "7": "dom7", maj7: "maj7", m7: "m7",
}

/** Formas movibles para los acordes que no están en CHORD_VOICINGS (disminuido y m7♭5). */
function movable(rootIdx: number, q: "dim" | "m7b5"): ChordVoicing[] {
  const a = (rootIdx - 9 + 12) % 12, e = (rootIdx - 4 + 12) % 12
  const fa = a === 0 ? 12 : a, fe = e < 1 ? e + 12 : e
  if (q === "dim") return [{ frets: [-1, fa, fa + 1, fa + 2, fa + 1, -1], fingers: [0, 1, 2, 4, 3, 0], label: "forma de La" }]
  return [
    { frets: [-1, fa, fa + 1, fa, fa + 1, -1], fingers: [0, 1, 3, 2, 4, 0], label: "forma de La" },
    { frets: [fe, -1, fe, fe, fe - 1, -1], fingers: [2, 0, 3, 4, 1, 0], label: "forma de Mi" },
  ]
}

export function voicingsFor(c: Pick<HarmonyChord, "rootIdx" | "quality">): ChordVoicing[] {
  if (c.quality === "dim" || c.quality === "m7b5") return movable(c.rootIdx, c.quality)
  const type = VOICING_TYPE[c.quality]!
  const main = CHORD_VOICINGS[NOTE_NAMES[c.rootIdx]]?.[type] ?? CHORD_VOICINGS[NOTE_NAMES_FLAT[c.rootIdx]]?.[type] ?? []
  const triads = type === "major" || type === "minor" ? computeTriads(c.rootIdx, type) : []
  return [...main, ...triads]
}

// ─── Progresiones de ejemplo ──────────────────────────────────────────────────

export const PROGRESSION_PRESETS: Record<Mode, { label: string; ids: string[]; style: string }[]> = {
  major: [
    { label: "I · V · vi · IV", ids: ["d:0", "d:4", "d:5", "d:3"], style: "Pop" },
    { label: "I · vi · IV · V", ids: ["d:0", "d:5", "d:3", "d:4"], style: "Doo-wop / balada" },
    { label: "ii · V · I", ids: ["d:1", "d:4", "d:0", "d:0"], style: "Jazz / funk-pop (con 7ª)" },
    { label: "I · IV · V", ids: ["d:0", "d:3", "d:4", "d:0"], style: "Rock / folk" },
    { label: "I · ♭VII · IV · I", ids: ["d:0", "b:♭VII", "d:3", "d:0"], style: "Rock clásico (prestado)" },
    { label: "I · iv · I", ids: ["d:0", "d:3", "b:iv", "d:0"], style: "Balada con prestado" },
    { label: "I · V/vi · vi · IV", ids: ["d:0", "s:V/vi", "d:5", "d:3"], style: "Pop con dominante secundaria" },
    { label: "I · ♭VI · ♭VII · I", ids: ["d:0", "b:♭VI", "b:♭VII", "d:0"], style: "Épico / rock de estadio" },
  ],
  minor: [
    { label: "i · ♭VII · ♭VI · V", ids: ["d:0", "d:6", "d:5", "b:V"], style: "Cadencia andaluza" },
    { label: "i · ♭VI · ♭III · ♭VII", ids: ["d:0", "d:5", "d:2", "d:6"], style: "Pop menor" },
    { label: "i · iv · v", ids: ["d:0", "d:3", "d:4", "d:0"], style: "Menor natural" },
    { label: "i · iv · V · i", ids: ["d:0", "d:3", "b:V", "d:0"], style: "Menor con dominante" },
    { label: "i · IV", ids: ["d:0", "b:IV"], style: "Dórico (Santana, funk)" },
    { label: "iiø · V · i", ids: ["d:1", "b:V", "d:0", "d:0"], style: "Jazz menor (con 7ª)" },
  ],
}

// ─── Retos de improvisación ───────────────────────────────────────────────────

/** Qué resalta el mapa del mástil mientras dura el reto. */
export type ChallengeFocus = "chord" | "third" | "root" | "next" | "scale"

export interface ImprovChallenge { id: string; title: string; how: string; tip: string; focus: ChallengeFocus }

export const IMPROV_CHALLENGES: ImprovChallenge[] = [
  { id: "notas-acorde", title: "Solo notas del acorde", focus: "chord",
    how: "Improvisa usando únicamente las notas resaltadas. Cambian con cada acorde: sigue el mapa.",
    tip: "Es el ejercicio que más rápido hace que un solo «suene a la canción»." },
  { id: "tercera", title: "Aterriza en la 3ª", focus: "third",
    how: "Toca lo que quieras, pero en cada cambio de acorde tu primera nota debe ser su 3ª (resaltada).",
    tip: "La 3ª dice si el acorde es mayor o menor: caer ahí hace que tu frase dibuje la armonía." },
  { id: "una-nota", title: "Una nota por acorde", focus: "chord",
    how: "Toca una sola nota larga por acorde, siempre del acorde. Elige la más cercana a la anterior.",
    tip: "Así nacen las melodías: moverse lo mínimo entre acordes se llama conducción de voces." },
  { id: "fundamental", title: "Empieza en la fundamental", focus: "root",
    how: "Cada frase empieza en la fundamental del acorde que suena y se aleja desde ahí.",
    tip: "La fundamental es tu ancla: desde ella cualquier salto se oye intencional." },
  { id: "anticipa", title: "Anticipa el cambio", focus: "next",
    how: "Un pulso antes de cada cambio, toca una nota del acorde siguiente (resaltado).",
    tip: "Anticipar hace que la improvisación empuje hacia adelante, como en el funk-pop." },
  { id: "pregunta", title: "Pregunta y respuesta", focus: "scale",
    how: "Toca una frase corta durante un acorde y respóndela en el siguiente. La respuesta termina en una nota del acorde.",
    tip: "Piensa en una conversación: la pregunta queda abierta, la respuesta la cierra." },
  { id: "dos-notas", title: "Ritmo con dos notas", focus: "scale",
    how: "Elige solo dos notas de la escala e improvisa variando únicamente el ritmo durante toda la vuelta.",
    tip: "Con dos notas y buen ritmo se hace música; con todas las notas y sin ritmo, no." },
  { id: "pentatonica", title: "Primero pentatónica", focus: "scale",
    how: "Una vuelta solo con la pentatónica (mapa en «Pentatónica»). Luego agrega las dos notas que faltan (mapa en «Escala completa»).",
    tip: "La pentatónica no tiene notas que choquen; las dos que se agregan son las que dan el color." },
]
