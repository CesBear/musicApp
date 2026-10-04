// Solfeo: modelo de notas en el pentagrama (clave de sol y de fa), lecciones y
// generador de ejercicios. Lo consume app/(dashboard)/solfeo/page.tsx.

export type Clef = "treble" | "bass"
export type Acc = -1 | 0 | 1                 // bemol, natural, sostenido

export interface Note {
  step:   number                            // 0 = Do … 6 = Si
  octave: number                            // índice científico: Do central = Do4
  acc:    Acc
}

export const SOLFEGE = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"]
export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"]
const SEMIS = [0, 2, 4, 5, 7, 9, 11]
const ACC_SIGN: Record<Acc, string> = { [-1]: "♭", 0: "", 1: "♯" }

export const n = (name: string): Note => {
  // "C4", "F#3", "Bb4"
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name)
  if (!m) throw new Error(`nota inválida: ${name}`)
  return { step: LETTERS.indexOf(m[1]), octave: +m[3], acc: m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0 }
}

export const diatonic = (x: Note) => x.octave * 7 + x.step
export const midiOf   = (x: Note) => 12 * (x.octave + 1) + SEMIS[x.step] + x.acc
export const noteName = (x: Note, system: "solfege" | "letters", withOctave = false) =>
  (system === "solfege" ? SOLFEGE[x.step] : LETTERS[x.step]) + ACC_SIGN[x.acc] + (withOctave ? String(x.octave) : "")

// Posición en el pentagrama: 0 = 1ª línea (abajo), 1 = 1er espacio, 2 = 2ª línea…
// Clave de sol: la 1ª línea es Mi4. Clave de fa: la 1ª línea es Sol2.
const BOTTOM: Record<Clef, number> = { treble: diatonic(n("E4")), bass: diatonic(n("G2")) }
export const staffPos = (x: Note, clef: Clef) => diatonic(x) - BOTTOM[clef]
export const fromPos  = (pos: number, clef: Clef, acc: Acc = 0): Note => {
  const d = pos + BOTTOM[clef]
  return { step: ((d % 7) + 7) % 7, octave: Math.floor(d / 7), acc }
}

/** Describe dónde está: «2ª línea», «3er espacio», «1 línea adicional abajo»… */
export function placeName(pos: number): string {
  const ord = ["1ª", "2ª", "3ª", "4ª", "5ª"]
  const ordM = ["1er", "2º", "3er", "4º"]
  if (pos >= 0 && pos <= 8) return pos % 2 === 0 ? `${ord[pos / 2]} línea` : `${ordM[(pos - 1) / 2]} espacio`
  if (pos === -1) return "espacio debajo del pentagrama"
  if (pos === 9) return "espacio encima del pentagrama"
  if (pos < 0) {
    const k = Math.floor(-pos / 2)
    return pos % 2 === 0 ? `${k}ª línea adicional abajo` : `debajo de la ${k}ª línea adicional`
  }
  const k = Math.floor((pos - 8) / 2)
  return pos % 2 === 0 ? `${k}ª línea adicional arriba` : `encima de la ${k}ª línea adicional`
}

// ─── Ejercicios ───────────────────────────────────────────────────────────────

export type Mode = "treble" | "bass" | "grand" | "guitar"

export const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: "treble", label: "Clave de sol",     desc: "La clave de la guitarra, la voz y los instrumentos agudos." },
  { id: "bass",   label: "Clave de fa",      desc: "La clave del bajo, el piano (mano izquierda) y los graves." },
  { id: "grand",  label: "Gran pentagrama",  desc: "Sol arriba y fa abajo, unidos por el Do central, como en el piano." },
  { id: "guitar", label: "En la guitarra",   desc: "Lee la nota y tócala en el mástil. La guitarra suena una octava más grave de lo escrito." },
]

export const LEVELS: { id: 1 | 2 | 3; label: string; desc: string }[] = [
  { id: 1, label: "Nivel 1", desc: "Solo dentro del pentagrama" },
  { id: 2, label: "Nivel 2", desc: "Con líneas adicionales" },
  { id: 3, label: "Nivel 3", desc: "Con sostenidos y bemoles" },
]

export interface Question {
  note: Note
  clef: Clef
}

// Rango de posiciones por modo y nivel ([min, max] en el pentagrama de la clave)
function range(mode: Mode, level: 1 | 2 | 3): [number, number] {
  if (mode === "guitar") return level === 1 ? [-7, 8] : [-7, 12]     // Mi3 escrito (6ª al aire) en adelante
  if (level === 1) return [0, 8]
  if (level === 2) return [-4, 12]
  return [-2, 10]
}

export function makeQuestion(mode: Mode, level: 1 | 2 | 3, prev?: Question): Question {
  for (let tries = 0; tries < 20; tries++) {
    const clef: Clef = mode === "bass" ? "bass" : mode === "grand" ? (Math.random() < 0.5 ? "treble" : "bass") : "treble"
    const [lo, hi] = range(mode, level)
    const pos = lo + Math.floor(Math.random() * (hi - lo + 1))
    let acc: Acc = 0
    if (level === 3 && Math.random() < 0.45) acc = Math.random() < 0.5 ? 1 : -1
    const note = fromPos(pos, clef, acc)
    // evita Mi♯/Si♯/Fa♭/Do♭ (enarmónicos confusos para empezar)
    if ((acc === 1 && (note.step === 2 || note.step === 6)) || (acc === -1 && (note.step === 3 || note.step === 0))) continue
    if (prev && prev.clef === clef && diatonic(prev.note) === diatonic(note) && prev.note.acc === note.acc) continue
    return { note, clef }
  }
  return { note: n("G4"), clef: "treble" }
}

// ─── Lecciones ────────────────────────────────────────────────────────────────

export interface LessonNote { note: string; label?: string; tone?: "a" | "b" | "c" }

export interface Lesson {
  id: string
  title: string
  body: string[]
  tip?: string
  staff?: { clef: Clef | "grand" | "none"; notes: (LessonNote & { clef?: Clef })[]; numbering?: boolean }
  figures?: boolean
}

export const LESSONS: Lesson[] = [
  {
    id: "pentagrama", title: "El pentagrama",
    body: [
      "La música se escribe en el pentagrama: 5 líneas y 4 espacios. Se cuentan siempre de abajo hacia arriba.",
      "Cada nota va en una línea (la línea la atraviesa por el centro) o en un espacio (queda entre dos líneas). Cuanto más arriba está, más aguda suena.",
    ],
    tip: "Línea, espacio, línea, espacio: cada paso hacia arriba es la nota siguiente (Do, Re, Mi…).",
    staff: { clef: "none", numbering: true, notes: [] },
  },
  {
    id: "notas", title: "Los nombres de las notas",
    body: [
      "Son 7 y se repiten en ciclo: Do, Re, Mi, Fa, Sol, La, Si… y otra vez Do, más agudo (una octava arriba).",
      "En inglés se usan letras: C D E F G A B. Las verás en cifrados de acordes (C, G, Am…), así que conviene saber las dos.",
    ],
    tip: "Do = C, Re = D, Mi = E, Fa = F, Sol = G, La = A, Si = B.",
    staff: { clef: "treble", notes: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"].map(x => ({ note: x, tone: "a" as const })) },
  },
  {
    id: "clave-sol", title: "La clave de sol",
    body: [
      "La clave dice qué nota es cada línea. La clave de sol se enrosca en la 2ª línea: esa línea es Sol (el Sol encima del Do central).",
      "Líneas, de abajo arriba: Mi, Sol, Si, Re, Fa. Espacios: Fa, La, Do, Mi.",
    ],
    tip: "Truco: las líneas son «Mi Sol Si Re Fa» y los espacios «Fa La Do Mi». Ancla: Sol en la 2ª línea.",
    staff: {
      clef: "treble",
      notes: [
        ...["E4", "G4", "B4", "D5", "F5"].map(x => ({ note: x, tone: "a" as const })),
        ...["F4", "A4", "C5", "E5"].map(x => ({ note: x, tone: "b" as const })),
      ],
    },
  },
  {
    id: "clave-fa", title: "La clave de fa",
    body: [
      "La clave de fa en 4ª línea marca con sus dos puntos la línea de Fa (el Fa debajo del Do central). Se usa para los sonidos graves: bajo eléctrico, mano izquierda del piano.",
      "Líneas, de abajo arriba: Sol, Si, Re, Fa, La. Espacios: La, Do, Mi, Sol.",
    ],
    tip: "Truco: líneas «Sol Si Re Fa La» y espacios «La Do Mi Sol». Ancla: Fa entre los dos puntos de la clave.",
    staff: {
      clef: "bass",
      notes: [
        ...["G2", "B2", "D3", "F3", "A3"].map(x => ({ note: x, tone: "a" as const })),
        ...["A2", "C3", "E3", "G3"].map(x => ({ note: x, tone: "b" as const })),
      ],
    },
  },
  {
    id: "adicionales", title: "Líneas adicionales y el Do central",
    body: [
      "Cuando una nota no cabe en el pentagrama se agregan líneas cortas arriba o abajo: las líneas adicionales. Siguen la misma lógica de línea, espacio, línea…",
      "El Do central (en verde) está una línea adicional debajo de la clave de sol y una arriba de la clave de fa: es la misma nota escrita en los dos pentagramas. Por eso las dos claves forman juntas el gran pentagrama.",
    ],
    tip: "Ancla para leer rápido: Do central (1 línea adicional), La debajo de la clave de sol (2 líneas), Mi de la 6ª cuerda (debajo de 3 líneas).",
    staff: {
      clef: "grand",
      notes: [
        { note: "A3", clef: "bass", tone: "b" }, { note: "B3", clef: "bass", tone: "b" },
        { note: "C4", clef: "bass", tone: "c" }, { note: "C4", clef: "treble", tone: "c" },
        { note: "D4", clef: "treble", tone: "a" }, { note: "E4", clef: "treble", tone: "a" },
        { note: "A5", clef: "treble", tone: "a" }, { note: "C6", clef: "treble", tone: "a" },
      ],
    },
  },
  {
    id: "figuras", title: "Figuras y silencios",
    body: [
      "La forma de la nota dice cuánto dura, contada en pulsos. En 4/4 un compás tiene 4 negras.",
      "Cada figura dura la mitad que la anterior. Cada una tiene su silencio, que dura lo mismo pero sin sonar.",
    ],
    tip: "Redonda 4 · blanca 2 · negra 1 · corchea ½ · semicorchea ¼. Un puntillo suma la mitad: blanca con puntillo = 3.",
    figures: true,
  },
  {
    id: "alteraciones", title: "Sostenidos, bemoles y becuadro",
    body: [
      "El sostenido (♯) sube la nota un semitono (un traste). El bemol (♭) la baja un semitono. El becuadro (♮) cancela la alteración y vuelve a la nota natural.",
      "Una alteración escrita junto a la nota vale hasta el final del compás. Las que van al inicio, junto a la clave (la armadura), valen para toda la pieza.",
    ],
    tip: "Fa♯ y Sol♭ suenan igual (son enarmónicos): se escriben distinto según la tonalidad.",
    staff: {
      clef: "treble",
      notes: [
        { note: "F4", label: "Fa", tone: "a" }, { note: "F#4", label: "Fa♯", tone: "b" },
        { note: "B4", label: "Si", tone: "a" }, { note: "Bb4", label: "Si♭", tone: "b" },
        { note: "C5", label: "Do", tone: "a" }, { note: "C#5", label: "Do♯", tone: "b" },
      ],
    },
  },
  {
    id: "guitarra", title: "La guitarra en el pentagrama",
    body: [
      "La guitarra se escribe en clave de sol, pero suena una octava más grave de lo escrito (a veces la clave lleva un 8 debajo). Así sus notas caben en el pentagrama sin tantas líneas adicionales.",
      "Las cuerdas al aire se escriben así: 6ª Mi debajo de 3 líneas adicionales, 5ª La en la 2ª línea adicional, 4ª Re en el espacio de abajo, 3ª Sol en la 2ª línea, 2ª Si en la 3ª línea y 1ª Mi en el 4º espacio.",
    ],
    tip: "Practica en el modo «En la guitarra»: lees la nota y la tocas en el mástil.",
    staff: {
      clef: "treble",
      notes: [
        { note: "E3", label: "6ª", tone: "c" }, { note: "A3", label: "5ª", tone: "c" }, { note: "D4", label: "4ª", tone: "c" },
        { note: "G4", label: "3ª", tone: "c" }, { note: "B4", label: "2ª", tone: "c" }, { note: "E5", label: "1ª", tone: "c" },
      ],
    },
  },
]

export const FIGURES: { name: string; beats: string; note: string; rest: string; dur: number }[] = [
  { name: "Redonda",     beats: "4",   note: "\u{1D15D}", rest: "\u{1D13B}", dur: 4 },
  { name: "Blanca",      beats: "2",   note: "\u{1D15E}", rest: "\u{1D13C}", dur: 2 },
  { name: "Negra",       beats: "1",   note: "\u{1D15F}", rest: "\u{1D13D}", dur: 1 },
  { name: "Corchea",     beats: "½",   note: "\u{1D160}", rest: "\u{1D13E}", dur: 0.5 },
  { name: "Semicorchea", beats: "¼",   note: "\u{1D161}", rest: "\u{1D13F}", dur: 0.25 },
]
