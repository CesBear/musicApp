// 30 Horas — rutina guiada inspirada en la filosofía del "30-Hour Path to
// Virtuoso Enlightenment" de Steve Vai (Guitar World, 2004): 8 áreas por ciclo
// de 10 horas, 3 ciclos. Contenido, ejercicios y textos originales de
// MaestroMusic — no es una transcripción del artículo.
//
// Cada hora es una sesión con bloques cronometrados (suman 60 min), una
// instrucción concreta, una meta medible y su ejercicio. Los 3 ciclos son
// niveles progresivos: nada se repite.
import type { TabExercise, TabStep } from "@/components/TabDiagram"

export type WorkoutCategoryId =
  | "ejercicios" | "escalas" | "acordes" | "oido"
  | "lectura" | "composicion" | "teoria" | "jamming"

export type Cycle = 0 | 1 | 2

export interface SessionBlock {
  min:       number                 // minutos en la sesión de 60
  title:     string
  do:        string                 // qué hacer, en concreto
  goal?:     string                 // criterio para darlo por logrado
  exercise?: TabExercise
  link?:     { href: string; label: string }
  earPool?:  number[]               // muestra el entrenador de intervalos con estos semitonos
}

export interface WorkoutSession {
  title:  string
  focus:  string                    // qué vas a lograr hoy, en una frase
  blocks: SessionBlock[]
  check:  string[]                  // autoevaluación antes de marcarla
}

export interface WorkoutCategory {
  id:      WorkoutCategoryId
  title:   string
  tagline: string
  color:   string                   // acento oklch
  why:     string
  levels:  [WorkoutSession[], WorkoutSession[], WorkoutSession[]]
}

export const LEVELS: { name: string; desc: string }[] = [
  { name: "Fundamentos", desc: "Posición, limpieza y las bases de cada área." },
  { name: "Desarrollo",  desc: "Más velocidad, más vocabulario, primeras ideas propias." },
  { name: "Aplicación",  desc: "Técnicas avanzadas y música real: transcribir, componer, tocar." },
]

// ─── Helpers de tablatura (cuerda 0 = Mi grave … 5 = mi aguda) ────────────────

type SF = [string: number, fret: number]
const line = (notes: SF[]): TabStep[] => notes.map(([string, fret]) => ({ notes: [{ string, fret }] }))
/** Acorde en formato guitarrista: trastes de Mi grave → mi aguda, null = no suena. */
const chord = (frets: (number | null)[]): TabStep => ({
  notes: frets.flatMap((fret, string) => fret === null ? [] : [{ string, fret }]),
})
const rest: TabStep = { notes: [] }
const repeat = <T,>(x: T, n: number): T[] => Array.from({ length: n }, () => x)

const C_OPEN  = chord([null, 3, 2, 0, 1, 0])
const G_OPEN  = chord([3, 2, 0, 0, 0, 3])
const D_OPEN  = chord([null, null, 0, 2, 3, 2])
const A_OPEN  = chord([null, 0, 2, 2, 2, 0])
const EM_OPEN = chord([0, 2, 2, 0, 0, 0])
const AM_OPEN = chord([null, 0, 2, 2, 1, 0])
const F_BARRE = chord([1, 3, 3, 2, 1, 1])
const BM_BARRE = chord([null, 2, 4, 4, 3, 2])
const DM7  = chord([null, null, 0, 2, 1, 1])
const G7   = chord([3, 2, 0, 0, 0, 1])
const CMAJ7 = chord([null, 3, 2, 0, 0, 0])

// ─── Ejercicios ───────────────────────────────────────────────────────────────

const EX = {
  arana: {
    id: "arana", title: "Araña 1-2-3-4 · trastes 5–8", bpmHint: 60,
    desc: "Un dedo por traste en las 6 cuerdas. En el traste 5 los trastes son más cortos que en el 1: menos estiramiento.",
    steps: line([0, 1, 2, 3, 4, 5].flatMap(s => [5, 6, 7, 8].map(f => [s, f] as SF))),
  },
  puaAlterna: {
    id: "pua-alterna", title: "Púa alterna en la cuerda Sol", bpmHint: 70, subdivision: 4,
    desc: "Dos golpes por nota, siempre abajo-arriba.",
    steps: line([[3, 5], [3, 5], [3, 7], [3, 7], [3, 9], [3, 9], [3, 7], [3, 7]]),
  },
  trino13: {
    id: "trino-13", title: "Trino 1–3 (hammer-on / pull-off)", bpmHint: 80, subdivision: 4,
    desc: "Solo la primera nota se pica; el resto lo hacen los dedos.",
    steps: [
      ...line([[3, 5]]),
      ...[7, 5, 7, 5, 7, 5, 7].map((fret, i): TabStep => ({ notes: [{ string: 3, fret }], tie: i % 2 === 0 ? "h" : "p" })),
    ],
  },
  cruceQuintas: {
    id: "cruce-quintas", title: "Cruce de cuerdas en quintas", bpmHint: 80,
    desc: "Saltas entre cuerdas vecinas con púa alterna: La–Mi y Re–La.",
    steps: line([[0, 5], [1, 7], [0, 5], [1, 7], [1, 5], [2, 7], [1, 5], [2, 7]]),
  },
  legatoCadena: {
    id: "legato-cadena", title: "Cadena de ligados 5-7-8", bpmHint: 80, subdivision: 4,
    desc: "Sube con hammer-ons, baja con pull-offs. Solo pica la primera nota.",
    steps: [
      { notes: [{ string: 3, fret: 5 }] },
      { notes: [{ string: 3, fret: 7 }], tie: "h" }, { notes: [{ string: 3, fret: 8 }], tie: "h" },
      { notes: [{ string: 3, fret: 7 }], tie: "p" }, { notes: [{ string: 3, fret: 5 }], tie: "p" },
      { notes: [{ string: 3, fret: 7 }], tie: "h" }, { notes: [{ string: 3, fret: 8 }], tie: "h" },
      { notes: [{ string: 3, fret: 7 }], tie: "p" },
    ],
  },
  rafagas: {
    id: "rafagas", title: "Ráfagas: 4 notas y pausa", bpmHint: 70, subdivision: 4,
    desc: "Cuatro semicorcheas y un pulso de silencio.",
    steps: [...line([[3, 5], [3, 7], [3, 8], [3, 7]]), ...repeat(rest, 4)],
  },
  tapping: {
    id: "tapping", title: "Tapping en una cuerda · Am", bpmHint: 90, subdivision: 3, beatsPerGroup: 6,
    desc: "Tap en el 12 (mano derecha), pull-off al 8 y al 5: La menor arpegiado (Mi–Do–La).",
    steps: [
      { notes: [{ string: 5, fret: 12 }], tie: "t" }, { notes: [{ string: 5, fret: 8 }], tie: "p" }, { notes: [{ string: 5, fret: 5 }], tie: "p" },
      { notes: [{ string: 5, fret: 12 }], tie: "t" }, { notes: [{ string: 5, fret: 8 }], tie: "p" }, { notes: [{ string: 5, fret: 5 }], tie: "p" },
    ],
  },
  barrido: {
    id: "barrido", title: "Barrido (sweep) · Am de 5 cuerdas", bpmHint: 60, subdivision: 5, beatsPerGroup: 10,
    desc: "La–Mi–La–Do–Mi: una sola pasada de púa hacia abajo al subir y hacia arriba al bajar.",
    steps: [
      ...line([[0, 5], [1, 7], [2, 7], [3, 5], [4, 5]]).map(s => ({ ...s, pick: "d" as const })),
      ...line([[3, 5], [2, 7], [1, 7], [0, 5]]).map(s => ({ ...s, pick: "u" as const })),
      rest,
    ],
  },
  pentaCaja1: {
    id: "penta-caja1", title: "Pentatónica menor de La · caja 1", bpmHint: 70,
    desc: "La–Do–Re–Mi–Sol en dos octavas, subiendo y bajando.",
    steps: (() => {
      const up: SF[] = [[0, 5], [0, 8], [1, 5], [1, 7], [2, 5], [2, 7], [3, 5], [3, 7], [4, 5], [4, 8], [5, 5], [5, 8]]
      return line([...up, ...[...up].reverse()])
    })(),
  },
  pentaGrupos3: {
    id: "penta-grupos3", title: "Pentatónica en grupos de 3", bpmHint: 60, subdivision: 3, beatsPerGroup: 12,
    desc: "La-Do-Re, Do-Re-Mi, Re-Mi-Sol… cada grupo empieza una nota más arriba.",
    steps: (() => {
      const box: SF[] = [[0, 5], [0, 8], [1, 5], [1, 7], [2, 5], [2, 7], [3, 5], [3, 7], [4, 5], [4, 8]]
      return line(Array.from({ length: 8 }, (_, i) => box.slice(i, i + 3)).flat())
    })(),
  },
  mayorC: {
    id: "mayor-c", title: "Escala de Do mayor · una octava", bpmHint: 70,
    desc: "Do–Re–Mi–Fa–Sol–La–Si–Do. Los semitonos están en Mi–Fa y Si–Do.",
    steps: (() => {
      const up: SF[] = [[1, 3], [1, 5], [2, 2], [2, 3], [2, 5], [3, 2], [3, 4], [3, 5]]
      return line([...up, ...[...up].reverse()])
    })(),
  },
  tercerasC: {
    id: "terceras-c", title: "Do mayor en terceras", bpmHint: 70,
    desc: "Do-Mi, Re-Fa, Mi-Sol, Fa-La, Sol-Si, La-Do, Si-Re, Do-Mi.",
    steps: line([
      [1, 3], [2, 2], [1, 5], [2, 3], [2, 2], [2, 5], [2, 3], [3, 2],
      [2, 5], [3, 4], [3, 2], [3, 5], [3, 4], [4, 3], [3, 5], [4, 5],
    ]),
  },
  doricoFrase: {
    id: "dorico-frase", title: "Re dórico · frase con la 6ª mayor", bpmHint: 70,
    desc: "Re–Fa–La–Si–La–Sol–Fa–Re. El Si natural es el color dórico.",
    steps: line([[1, 5], [2, 3], [2, 7], [3, 4], [2, 7], [2, 5], [2, 3], [1, 5]]),
  },
  mixolidioFrase: {
    id: "mixolidio-frase", title: "Sol mixolidio · frase con la 7ª menor", bpmHint: 70,
    desc: "Sol–Si–Re–Fa–Mi–Re–Si–Sol. El Fa natural es el color mixolidio.",
    steps: line([[0, 3], [1, 2], [1, 5], [2, 3], [2, 2], [1, 5], [1, 2], [0, 3]]),
  },
  cambioEmAm: {
    id: "cambio-em-am", title: "Cambio Em ↔ Am", bpmHint: 60, subdivision: 1, beatsPerGroup: 4,
    desc: "Dos pulsos por acorde. Los dedos 2 y 3 se mueven juntos, una cuerda hacia abajo.",
    steps: [EM_OPEN, EM_OPEN, AM_OPEN, AM_OPEN, EM_OPEN, EM_OPEN, AM_OPEN, AM_OPEN],
  },
  cambioGCD: {
    id: "cambio-gcd", title: "Cambios G – C – D", bpmHint: 60, subdivision: 1, beatsPerGroup: 4,
    desc: "Dos pulsos por acorde. Prepara el siguiente acorde en el segundo pulso.",
    steps: [G_OPEN, G_OPEN, C_OPEN, C_OPEN, D_OPEN, D_OPEN, G_OPEN, G_OPEN],
  },
  cejillaCFG: {
    id: "cejilla-cfg", title: "Cejilla de F en C – F – G", bpmHint: 60, subdivision: 1, beatsPerGroup: 4,
    desc: "I–IV–V de Do mayor. F es la cejilla con forma de Mi en el traste 1.",
    steps: [C_OPEN, C_OPEN, F_BARRE, F_BARRE, G_OPEN, G_OPEN, C_OPEN, C_OPEN],
  },
  cejillaBm: {
    id: "cejilla-bm", title: "Cejilla de Bm en Bm – G – D – A", bpmHint: 60, subdivision: 1, beatsPerGroup: 4,
    desc: "vi–IV–I–V de Re mayor. Bm es la cejilla con forma de La en el traste 2.",
    steps: [BM_BARRE, BM_BARRE, G_OPEN, G_OPEN, D_OPEN, D_OPEN, A_OPEN, A_OPEN],
  },
  powerRiff: {
    id: "power-riff", title: "Riff de power chords A5 – C5 – D5", bpmHint: 90, subdivision: 2,
    desc: "Raíz y quinta. Misma forma para los tres, solo cambia el traste y la cuerda.",
    steps: [
      ...repeat(chord([5, 7, null, null, null, null]), 2), ...repeat(chord([8, 10, null, null, null, null]), 2),
      ...repeat(chord([null, 5, 7, null, null, null]), 2), ...repeat(chord([5, 7, null, null, null, null]), 2),
    ],
  },
  iiVI: {
    id: "ii-v-i", title: "ii – V – I en Do: Dm7 – G7 – Cmaj7", bpmHint: 70, subdivision: 1, beatsPerGroup: 4,
    desc: "Dos pulsos para Dm7 y G7, cuatro para Cmaj7.",
    steps: [DM7, DM7, G7, G7, CMAJ7, CMAJ7, CMAJ7, CMAJ7],
  },
  melodiaOculta1: {
    id: "melodia-oculta-1", title: "Melodía oculta #1 · Do mayor", bpmHint: 70, hidden: true,
    desc: "Empieza en Do (cuerda La, traste 3).",
    steps: [...line([[1, 3], [1, 5], [2, 2], [1, 3], [2, 2], [2, 3], [2, 5]]), rest],
  },
  melodiaOculta2: {
    id: "melodia-oculta-2", title: "Melodía oculta #2 · La menor pentatónica", bpmHint: 70, hidden: true,
    desc: "Empieza en La (cuerda Mi grave, traste 5).",
    steps: line([[0, 5], [0, 8], [1, 5], [1, 7], [2, 5], [1, 7], [1, 5], [0, 8]]),
  },
  melodiaOculta3: {
    id: "melodia-oculta-3", title: "Melodía oculta #3 · con saltos", bpmHint: 70, hidden: true,
    desc: "Empieza en Sol (cuerda Re, traste 5). Tiene saltos de 4ª y de 3ª.",
    steps: line([[2, 5], [3, 5], [3, 4], [3, 2], [2, 5], [2, 2], [2, 3], [1, 5]]),
  },
  notas65: {
    id: "notas-6-5", title: "Notas naturales · cuerdas 6 y 5", bpmHint: 60, subdivision: 1, beatsPerGroup: 4,
    desc: "Mi grave: Mi Fa Sol La Si Do Re Mi. La: La Si Do Re Mi Fa Sol La.",
    steps: line([
      [0, 0], [0, 1], [0, 3], [0, 5], [0, 7], [0, 8], [0, 10], [0, 12],
      [1, 0], [1, 2], [1, 3], [1, 5], [1, 7], [1, 8], [1, 10], [1, 12],
    ]),
  },
  lectura1: {
    id: "lectura-1", title: "Frase de lectura #1 · Sol mayor", bpmHint: 70,
    desc: "Léela 30 segundos con la vista antes de tocar.",
    steps: line([[1, 3], [1, 5], [2, 4], [2, 5], [1, 5], [1, 3], [0, 5], [0, 3], [1, 3], [2, 2], [2, 5], [1, 3]]),
  },
  lectura2: {
    id: "lectura-2", title: "Frase de lectura #2 · Sol mayor, dos compases", bpmHint: 70,
    desc: "Sube por la escala y vuelve con saltos de arpegio.",
    steps: line([
      [0, 3], [0, 5], [1, 2], [1, 3], [1, 5], [2, 2], [2, 4], [2, 5],
      [2, 2], [1, 3], [0, 5], [0, 2], [0, 3], [1, 2], [1, 5], [2, 5],
    ]),
  },
  motivoSemilla: {
    id: "motivo-semilla", title: "Llamada y respuesta", bpmHint: 75, beatsPerGroup: 4,
    desc: "Toca la llamada (4 notas) y completa tú el silencio con tu respuesta.",
    steps: [...line([[2, 5], [2, 7], [1, 5], [1, 3]]), ...repeat(rest, 4)],
  },
  riffSemilla: {
    id: "riff-semilla", title: "Riff semilla en La menor", bpmHint: 85,
    desc: "Apréndelo y luego cambia una sola cosa: el ritmo, una nota o el final.",
    steps: [
      ...line([[0, 5], [0, 8], [1, 5]]),
      { notes: [{ string: 1, fret: 7 }], tie: "h" }, { notes: [{ string: 1, fret: 5 }], tie: "p" },
      ...line([[0, 8], [0, 5]]), rest,
    ],
  },
  mayorUnaCuerda: {
    id: "mayor-una-cuerda", title: "Sol mayor en una cuerda", bpmHint: 60, subdivision: 1, beatsPerGroup: 8,
    desc: "Trastes 0-2-4-5-7-9-11-12: T T S T T T S.",
    steps: line([[3, 0], [3, 2], [3, 4], [3, 5], [3, 7], [3, 9], [3, 11], [3, 12]]),
  },
  triada1358: {
    id: "triada-1358", title: "Tríada de Do: 1-3-5-8", bpmHint: 70,
    desc: "Do–Mi–Sol–Do (octava) y de vuelta.",
    steps: line([[1, 3], [2, 2], [2, 5], [3, 5], [3, 5], [2, 5], [2, 2], [1, 3]]),
  },
  arpegiosIIVV: {
    id: "arpegios-i-iv-v", title: "Arpegios I – IV – V en Do", bpmHint: 70, beatsPerGroup: 4,
    desc: "Do (Do–Mi–Sol–Do), Fa (Fa–La–Do–Fa), Sol (Sol–Si–Re–Sol).",
    steps: line([[1, 3], [2, 2], [2, 5], [3, 5], [2, 3], [3, 2], [3, 5], [4, 6], [0, 3], [1, 2], [1, 5], [2, 5]]),
  },
  tritonoResuelve: {
    id: "tritono-resuelve", title: "El tritono de G7 resuelve a Do", bpmHint: 60, subdivision: 1, beatsPerGroup: 4,
    desc: "Si+Fa (tensión) → Do+Mi (reposo): el Si sube un semitono y el Fa baja uno.",
    steps: [
      ...repeat(chord([null, 2, 3, null, null, null]), 2), ...repeat(chord([null, 3, 2, null, null, null]), 2),
      ...repeat(chord([null, 2, 3, null, null, null]), 2), ...repeat(chord([null, 3, 2, null, null, null]), 2),
    ],
  },
  bendReferencia: {
    id: "bend-referencia", title: "Bend a la nota de referencia", bpmHint: 60, subdivision: 1, beatsPerGroup: 4,
    desc: "Toca la referencia y luego dobla un tono hasta que suene igual: Sol 9 ↔ Sol 7 bend, Si 10 ↔ Si 8 bend.",
    steps: [
      ...line([[3, 9]]), { notes: [{ string: 3, fret: 7 }], tie: "b", bend: 2 },
      ...line([[4, 10]]), { notes: [{ string: 4, fret: 8 }], tie: "b", bend: 2 },
    ],
  },
  lickBlues: {
    id: "lick-blues", title: "Lick con slide y ligados · La menor", bpmHint: 85,
    desc: "Slide, hammer-on y pull-off en la caja 1. Apréndelo y luego cámbialo.",
    steps: [
      ...line([[0, 5]]), { notes: [{ string: 0, fret: 8 }], tie: "s" },
      ...line([[1, 5]]), { notes: [{ string: 1, fret: 7 }], tie: "h" }, { notes: [{ string: 1, fret: 5 }], tie: "p" },
      ...line([[2, 5], [2, 7]]), { notes: [{ string: 2, fret: 5 }], tie: "p" },
    ],
  },
  doubleStops: {
    id: "double-stops", title: "Double stops en La menor", bpmHint: 75, subdivision: 1, beatsPerGroup: 4,
    desc: "Dos cuerdas a la vez con un dedo o dos. El último entra con slide.",
    steps: [
      chord([null, null, null, null, 5, 5]), chord([null, null, null, null, 8, 8]),
      chord([null, null, null, 7, 8, null]), chord([null, null, null, 5, 5, null]),
      chord([null, null, null, 5, 5, null]), { ...chord([null, null, null, 7, 8, null]), tie: "s" },
      chord([null, null, null, 5, 5, null]), rest,
    ],
  },
  jamMayor: {
    id: "jam-mayor", title: "Lick en Do mayor pentatónica", bpmHint: 80,
    desc: "Do–Re–Mi–Sol–La: la pentatónica mayor suena abierta y alegre.",
    steps: line([[1, 3], [1, 5], [2, 2], [2, 5], [2, 7], [2, 5], [2, 2], [1, 5]]),
  },
  shuffleA: {
    id: "shuffle-a", title: "Shuffle de blues en La", bpmHint: 80,
    desc: "La quinta y la sexta alternan sobre la cuerda La al aire.",
    steps: [
      ...repeat(chord([null, 0, 2, null, null, null]), 2), ...repeat(chord([null, 0, 4, null, null, null]), 2),
      ...repeat(chord([null, 0, 2, null, null, null]), 2), ...repeat(chord([null, 0, 4, null, null, null]), 2),
    ],
  },
} satisfies Record<string, TabExercise>

const CLOSE = (what: string): SessionBlock => ({
  min: 5, title: "Cierre", do: `Anota ${what} en una libreta o en Mi Progreso. La próxima sesión empieza 5 BPM por debajo de tu mejor marca.`,
})

// ─── Áreas ────────────────────────────────────────────────────────────────────

export const WORKOUT_CATEGORIES: WorkoutCategory[] = [
  {
    id: "ejercicios", title: "Técnica", tagline: "Destreza y control",
    color: "oklch(0.80 0.15 70)",
    why: "La velocidad llega cuando el movimiento es pequeño y parejo. Aquí entrenas control, no rapidez.",
    levels: [
      [{
        title: "Un dedo por traste", focus: "Que cada dedo caiga en su traste, con la punta y sin tensión.",
        blocks: [
          { min: 5, title: "Calentamiento", do: "Abre y cierra las manos 10 veces y estira suave cada dedo. Toca la Araña una vez a 50 BPM." },
          { min: 20, title: "Araña 1-2-3-4", exercise: EX.arana,
            do: "Dedo 1 en el traste 5, dedo 2 en el 6, 3 en el 7 y 4 en el 8. Púa alterna. Deja los dedos cerca del diapasón cuando no tocan.",
            goal: "Tres vueltas seguidas sin error a 60 BPM. Si fallas, baja 5 BPM." },
          { min: 20, title: "Púa alterna", exercise: EX.puaAlterna,
            do: "Mueve solo la muñeca, no el brazo. La púa apenas pasa la cuerda.",
            goal: "1 minuto continuo a 70 BPM con todas las notas al mismo volumen." },
          { min: 10, title: "Trino 1–3", exercise: EX.trino13,
            do: "El hammer-on cae como un martillo justo detrás del traste. En el pull-off, tira la cuerda un poco hacia abajo.",
            goal: "30 segundos sin que el sonido se apague." },
          CLOSE("tu mejor BPM de cada ejercicio"),
        ],
        check: ["¿Toqué con la punta de los dedos?", "¿Bajé el tempo al fallar en vez de forzar?"],
      }],
      [{
        title: "Cruce de cuerdas y legato", focus: "Cambiar de cuerda sin perder el pulso y ligar con fuerza pareja.",
        blocks: [
          { min: 5, title: "Calentamiento", do: "Araña a tu mejor BPM menos 5.", exercise: EX.arana },
          { min: 20, title: "Cruce en quintas", exercise: EX.cruceQuintas,
            do: "El golpe que cambia de cuerda es el que se descontrola: tócalo lento y mira la púa.",
            goal: "2 minutos a 80 BPM sin rozar cuerdas vecinas." },
          { min: 20, title: "Cadena de ligados", exercise: EX.legatoCadena,
            do: "Solo pica la primera nota. Usa los dedos 1, 3 y 4.",
            goal: "Los ligados suenan tan fuerte como la nota picada." },
          { min: 10, title: "Ráfagas", exercise: EX.rafagas,
            do: "Cuatro notas rápidas y silencio. El silencio deja descansar la mano: así entrenas velocidad sin tensión.",
            goal: "La ráfaga cae exacta en el pulso." },
          CLOSE("tu mejor BPM de cada ejercicio"),
        ],
        check: ["¿Las notas ligadas suenan igual de fuertes?", "¿Apagué las cuerdas que no tocaba?"],
      }],
      [{
        title: "Tapping y barrido", focus: "Dos técnicas típicas de Vai, desde la limpieza y no desde la velocidad.",
        blocks: [
          { min: 5, title: "Calentamiento", do: "Cadena de ligados a 70 BPM.", exercise: EX.legatoCadena },
          { min: 20, title: "Tapping", exercise: EX.tapping,
            do: "Golpea el traste 12 con el dedo medio derecho y tira hacia el 8; luego pull-off al 5. Apaga las cuerdas graves con la palma derecha.",
            goal: "Las tres notas suenan iguales a 90 BPM en tresillos." },
          { min: 20, title: "Barrido Am", exercise: EX.barrido,
            do: "Un solo movimiento de púa por dirección. Levanta cada dedo apenas toca su nota para que no suene a acorde.",
            goal: "Se oyen 5 notas separadas, no un rasgueo, a 60 BPM." },
          { min: 10, title: "Combina", do: "Toca el barrido de subida y remata con el tapping. Inventa tu propio orden y grábalo." },
          CLOSE("tu mejor BPM en tapping y barrido"),
        ],
        check: ["¿Sonaban notas separadas en el barrido?", "¿Controlé el ruido de las cuerdas al aire?"],
      }],
    ],
  },
  {
    id: "escalas", title: "Escalas", tagline: "El vocabulario de tus dedos",
    color: "oklch(0.78 0.12 240)",
    why: "Una escala es un color, no una carrera. La aprendes cuando puedes cantarla y tocarla en grupos, no solo de arriba abajo.",
    levels: [
      [{
        title: "Pentatónica menor de La · caja 1", focus: "La escala del rock y el blues, en una posición y de memoria.",
        blocks: [
          { min: 5, title: "Conoce las notas", do: "Tócala una vez lento diciendo el nombre de cada nota: La, Do, Re, Mi, Sol.", link: { href: "/escalas", label: "Verla en el mástil →" } },
          { min: 20, title: "Caja 1 completa", exercise: EX.pentaCaja1,
            do: "Dedo 1 en el traste 5. Las notas del traste 8 van con el meñique; las del 7, con el anular.",
            goal: "Subir y bajar sin mirar a 70 BPM." },
          { min: 20, title: "Grupos de 3", exercise: EX.pentaGrupos3,
            do: "Recorrerla en grupos te saca del 'arriba y abajo' y suena a frase.",
            goal: "Dos vueltas sin error a 60 BPM." },
          { min: 10, title: "Canta y toca", do: "Toca una nota, cántala y pasa a la siguiente. Busca que tu voz y la guitarra coincidan." },
          { min: 5, title: "Mini improvisación", do: "Con el metrónomo a 70, improvisa usando solo 3 notas de la caja." },
        ],
        check: ["¿Puedo tocar la caja sin mirar?", "¿Canté las notas?"],
      }],
      [{
        title: "Escala mayor en terceras", focus: "Do mayor y el patrón de terceras: el puente entre la escala y la melodía.",
        blocks: [
          { min: 5, title: "Repaso", do: "Caja 1 de la pentatónica a 70 BPM.", exercise: EX.pentaCaja1 },
          { min: 15, title: "Do mayor", exercise: EX.mayorC,
            do: "Fíjate dónde están los semitonos: Mi–Fa y Si–Do están a un traste.",
            goal: "Subir y bajar sin mirar a 70 BPM." },
          { min: 25, title: "Terceras", exercise: EX.tercerasC,
            do: "Cada nota salta a la tercera de arriba y vuelve al siguiente grado. Suena a melodía, no a ejercicio.",
            goal: "Una vuelta limpia a 70 BPM." },
          { min: 10, title: "Canta las terceras", do: "Toca Do, canta Mi, toca Mi. Sigue así por toda la escala." },
          { min: 5, title: "Mini improvisación", do: "Improvisa en Do mayor usando saltos de tercera." },
        ],
        check: ["¿Sé dónde están los semitonos?", "¿Las terceras suenan a melodía?"],
      }],
      [{
        title: "Modos: mismo mapa, otro color", focus: "Dórico y mixolidio: las notas de Do mayor desde otro centro.",
        blocks: [
          { min: 5, title: "Repaso", do: "Do mayor en una octava.", exercise: EX.mayorC },
          { min: 20, title: "Re dórico", exercise: EX.doricoFrase, link: { href: "/escalas", label: "Ver Dórico en el mástil →" },
            do: "Re dórico usa las notas de Do mayor empezando en Re. Su color es el Si natural (6ª mayor): escucha cómo ilumina el acorde menor.",
            goal: "Distinguir de oído la frase dórica de una en Re menor natural (con Sib)." },
          { min: 20, title: "Sol mixolidio", exercise: EX.mixolidioFrase,
            do: "Sol mixolidio es Do mayor desde Sol. Su color es el Fa natural (7ª menor): suena a rock y blues mayor.",
            goal: "Tocar la frase sobre la cuerda Sol al aire y oír la 7ª menor." },
          { min: 10, title: "Compara", do: "Deja sonar la cuerda Re al aire y toca dórico; luego la cuerda Sol al aire y toca mixolidio. Alterna." },
          { min: 5, title: "Escribe", do: "En una frase: ¿qué emoción te da cada modo?" },
        ],
        check: ["¿Escucho el Si en dórico?", "¿Escucho el Fa en mixolidio?"],
      }],
    ],
  },
  {
    id: "acordes", title: "Acordes", tagline: "Formas, cambios y color",
    color: "oklch(0.80 0.14 150)",
    why: "Los acordes se miden en cambios por minuto: cuanto más rápido llegas al siguiente, más música puedes tocar.",
    levels: [
      [{
        title: "Abiertos y cambios", focus: "Cambiar entre acordes abiertos sin cortar el ritmo.",
        blocks: [
          { min: 5, title: "Revisa cada acorde", do: "Toca Em, Am, G, C y D cuerda por cuerda. Si alguna no suena, acomoda el dedo.", link: { href: "/chord-builder", label: "Ver las formas →" } },
          { min: 20, title: "Em ↔ Am", exercise: EX.cambioEmAm,
            do: "Los dedos 2 y 3 bajan una cuerda juntos, como un bloque. El dedo 1 entra al final.",
            goal: "Prueba de 1 minuto sin metrónomo: cuenta los cambios. Meta: 40." },
          { min: 20, title: "G – C – D", exercise: EX.cambioGCD,
            do: "En el segundo pulso de cada acorde ya piensa en la forma del siguiente.",
            goal: "30 cambios por minuto." },
          { min: 10, title: "Con ritmo", do: "Toca G–C–D con el patrón «Balada» de Rasgueos.", link: { href: "/rasgueos", label: "Abrir Rasgueos →" } },
          CLOSE("tus cambios por minuto"),
        ],
        check: ["¿Suenan las 6 cuerdas (o las que tocan)?", "¿Contaste tus cambios por minuto?"],
      }],
      [{
        title: "Cejillas y power chords", focus: "La cejilla de Fa, la de Si menor y el power chord del rock.",
        blocks: [
          { min: 5, title: "Calentamiento", do: "Cambios G–C–D a 60 BPM.", exercise: EX.cambioGCD },
          { min: 20, title: "Cejilla de F", exercise: EX.cejillaCFG,
            do: "El índice presiona con su lado huesudo, un poco girado hacia la cejuela. El pulgar va detrás del mástil, a la altura del dedo medio.",
            goal: "Las 6 cuerdas de F suenan limpias 4 veces seguidas." },
          { min: 15, title: "Cejilla de Bm", exercise: EX.cejillaBm,
            do: "Forma de La menor con el índice como cejilla en el traste 2. La 6ª cuerda no suena.",
            goal: "Bm–G–D–A sin parar a 60 BPM." },
          { min: 15, title: "Power chords", exercise: EX.powerRiff,
            do: "Raíz con el índice y quinta con el anular. Apaga las demás cuerdas apoyando la palma derecha cerca del puente.",
            goal: "El riff completo a 90 BPM con palm mute." },
          CLOSE("cuántas veces seguidas te salió F limpia"),
        ],
        check: ["¿El pulgar estaba relajado?", "¿Apagué las cuerdas que no van en el power chord?"],
      }],
      [{
        title: "Séptimas y el ii–V–I", focus: "Dm7–G7–Cmaj7: la progresión base del jazz y del pop sofisticado.",
        blocks: [
          { min: 5, title: "Calentamiento", do: "Cejilla de F en C–F–G.", exercise: EX.cejillaCFG },
          { min: 15, title: "Conoce los colores", do: "Toca Dm7, G7 y Cmaj7 por separado. Menor 7 suena suave, dominante 7 suena tenso y maj7 suena soñador.", link: { href: "/chord-builder", label: "Ver séptimas →" } },
          { min: 25, title: "ii – V – I", exercise: EX.iiVI,
            do: "De Dm7 a G7 el dedo 1 se queda casi en el mismo lugar. Busca esos dedos guía.",
            goal: "Cinco ciclos sin parar a 70 BPM." },
          { min: 10, title: "Tu color", do: "Toma Cmaj7 y mueve una sola nota un traste arriba o abajo. Guarda los sonidos que te gusten en tu libreta de acordes." },
          CLOSE("el tempo al que te salió el ii–V–I"),
        ],
        check: ["¿Distingo de oído m7, 7 y maj7?", "¿Encontré los dedos guía?"],
      }],
    ],
  },
  {
    id: "oido", title: "Oído", tagline: "La conexión más importante",
    color: "oklch(0.78 0.14 295)",
    why: "El oído une lo que imaginas con lo que tocas. Se entrena con repetición diaria, no con talento.",
    levels: [
      [{
        title: "Intervalos básicos", focus: "Reconocer 3ª menor, 3ª mayor, 5ª y octava: lo que separa un acorde mayor de uno menor.",
        blocks: [
          { min: 5, title: "Escucha la diferencia", do: "Toca Do (cuerda La, traste 3) y luego Mi (cuerda Re, traste 2): 3ª mayor. Luego Do y Mib (traste 1): 3ª menor. Canta ambos." },
          { min: 25, title: "Entrenador", earPool: [3, 4, 7, 12],
            do: "Escucha, responde y repite el intervalo si dudas. Antes de responder, cántalo.",
            goal: "8 de 10 correctas." },
          { min: 20, title: "Canta y busca", do: "Canta una nota cualquiera y encuéntrala en la cuerda Sol. Luego canta una 5ª arriba de esa nota y búscala." },
          { min: 10, title: "¿Mayor o menor?", do: "Pon una canción que conozcas y di en voz alta si cada acorde suena mayor (luminoso) o menor (oscuro)." },
        ],
        check: ["¿Llegué a 8 de 10?", "¿Canté antes de responder?"],
      }],
      [{
        title: "Melodías de oído", focus: "Sacar melodías cortas sin ver la tablatura.",
        blocks: [
          { min: 5, title: "Calentamiento", earPool: [2, 3, 4, 5, 7, 12], do: "Cinco rondas del entrenador." },
          { min: 25, title: "Melodía oculta #1", exercise: EX.melodiaOculta1,
            do: "Dale play sin revelar la tab. Busca nota por nota desde Do. Revela solo para comprobar.",
            goal: "Sacarla completa en menos de 10 escuchas." },
          { min: 20, title: "Melodía oculta #2", exercise: EX.melodiaOculta2,
            do: "Usa la caja 1 de la pentatónica como mapa: todas las notas están ahí.",
            goal: "Sacarla completa sin revelar." },
          { min: 10, title: "Una melodía que conozcas", do: "Saca de oído algo muy simple: «Las mañanitas», un himno o un jingle." },
        ],
        check: ["¿Busqué antes de revelar?", "¿Usé la primera nota como referencia?"],
      }],
      [{
        title: "Transcripción", focus: "Todos los intervalos y tu primera transcripción real.",
        blocks: [
          { min: 5, title: "Calentamiento", earPool: [3, 4, 5, 7, 12], do: "Cinco rondas rápidas." },
          { min: 20, title: "Los 12 intervalos", earPool: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            do: "Asocia cada intervalo con el inicio de una canción que conozcas.",
            goal: "7 de 10 correctas." },
          { min: 25, title: "Melodía oculta #3", exercise: EX.melodiaOculta3,
            do: "Tiene saltos: identifica primero el intervalo y luego busca la nota.",
            goal: "Sacarla completa." },
          { min: 10, title: "Transcribe 4 compases", do: "Elige un solo que te guste y saca 4 compases nota por nota. Escríbelos en tab o en papel." },
        ],
        check: ["¿Identifiqué intervalos antes de buscar notas?", "¿Escribí la transcripción?"],
      }],
    ],
  },
  {
    id: "lectura", title: "Lectura", tagline: "Leer sin detenerse",
    color: "oklch(0.80 0.14 40)",
    why: "Leer bien es saber dónde está cada nota y no detener el pulso nunca. Los errores se corrigen después.",
    levels: [
      [{
        title: "Notas en las cuerdas 6 y 5", focus: "Saber cada nota natural de las cuerdas graves: ahí están las raíces de las cejillas.",
        blocks: [
          { min: 5, title: "La regla", do: "Entre Mi–Fa y Si–Do hay un traste; entre las demás notas, dos." },
          { min: 20, title: "Recorrido", exercise: EX.notas65,
            do: "Di el nombre en voz alta antes de tocar cada nota.",
            goal: "Las 16 notas sin dudar a 60 BPM." },
          { min: 20, title: "Encuéntrala", do: "Elige una nota (por ejemplo Sol) y encuéntrala en la cuerda 6 y en la 5 en menos de 2 segundos. Repite con las 7 notas en desorden.",
            goal: "Las 7 notas en las dos cuerdas sin fallar." },
          { min: 10, title: "Lee la caja", do: "Lee en voz alta los nombres de la caja 1 de la pentatónica mientras la tocas.", exercise: EX.pentaCaja1 },
          { min: 5, title: "Cierre", do: "Escribe las notas que te costaron. Empieza por ellas la próxima vez." },
        ],
        check: ["¿Dije el nombre antes de tocar?", "¿Las encontré en menos de 2 segundos?"],
      }],
      [{
        title: "Leer sin detenerse", focus: "La regla de oro: el pulso sigue aunque falles una nota.",
        blocks: [
          { min: 5, title: "Repaso", do: "Notas de las cuerdas 6 y 5.", exercise: EX.notas65 },
          { min: 25, title: "Frase #1", exercise: EX.lectura1,
            do: "Léela 30 segundos con la vista. Luego tócala con metrónomo sin parar.",
            goal: "3 pasadas seguidas sin detenerte. Fallar no importa; parar sí." },
          { min: 20, title: "Mira adelante", do: "Tócala de nuevo, pero con la vista siempre en la nota siguiente, no en la que suena." },
          { min: 10, title: "Escribe la tuya", do: "Escribe una frase de 8 notas en papel. Mañana la lees como si fuera nueva." },
        ],
        check: ["¿Mantuve el pulso?", "¿Miré una nota adelante?"],
      }],
      [{
        title: "Material real", focus: "Leer a primera vista piezas que no conoces.",
        blocks: [
          { min: 5, title: "Calentamiento", do: "Frase #1 a 80 BPM.", exercise: EX.lectura1 },
          { min: 20, title: "Frase #2", exercise: EX.lectura2,
            do: "Dos compases con saltos. Identifica los patrones antes de tocar.",
            goal: "Dos pasadas sin detenerte a 70 BPM." },
          { min: 25, title: "Lector GP", link: { href: "/lector", label: "Abrir el Lector GP →" },
            do: "Abre un archivo Guitar Pro que no conozcas, ponlo al 60% del tempo y tócalo de principio a fin sin parar.",
            goal: "Terminar la pieza sin detenerte." },
          { min: 10, title: "Repite", do: "Toca la misma pieza otra vez. La lectura mejora repitiendo, no solo leyendo cosas nuevas." },
        ],
        check: ["¿Llegué al final sin parar?", "¿Reconocí patrones?"],
      }],
    ],
  },
  {
    id: "composicion", title: "Composición", tagline: "Construye tu catálogo",
    color: "oklch(0.80 0.13 195)",
    why: "La inspiración llega pocas veces. Esta hora entrena el hábito de capturar ideas y de generarlas cuando no llegan solas.",
    levels: [
      [{
        title: "Llamada y respuesta", focus: "Componer es responder: contesta una frase dada.",
        blocks: [
          { min: 5, title: "Prepara", do: "Abre la grabadora del celular. Todo lo que toques hoy se graba." },
          { min: 25, title: "Responde", exercise: EX.motivoSemilla,
            do: "Toca la llamada y completa el silencio con tu respuesta. Cada vuelta, una respuesta distinta.",
            goal: "5 respuestas distintas grabadas." },
          { min: 20, title: "Tu propia llamada", do: "Inventa una llamada de 4 notas con la pentatónica de La y respóndete." },
          { min: 10, title: "Elige", do: "Escucha lo grabado, elige tu mejor idea y ponle nombre." },
        ],
        check: ["¿Grabé todo?", "¿Elegí y nombré una idea?"],
      }],
      [{
        title: "Tu primer riff", focus: "Un riff de 2 compases con identidad propia.",
        blocks: [
          { min: 5, title: "Escucha", do: "Escucha tu idea favorita de la sesión anterior." },
          { min: 20, title: "Riff semilla", exercise: EX.riffSemilla,
            do: "Apréndelo y luego cambia una sola cosa: el ritmo, una nota o el final. Graba cada versión." },
          { min: 25, title: "Tres riffs propios", do: "Escribe 3 riffs de 2 compases en La menor. Reglas: máximo 6 notas distintas y al menos un silencio.",
            goal: "3 riffs grabados." },
          { min: 10, title: "Con groove", do: "Toca tu mejor riff 2 minutos seguidos con el metrónomo a 90 BPM." },
        ],
        check: ["¿Respeté las reglas?", "¿Los grabé?"],
      }],
      [{
        title: "Una canción mínima", focus: "Progresión + melodía en forma A-A-B-A.",
        blocks: [
          { min: 5, title: "Elige", do: "Elige una progresión, por ejemplo I–V–vi–IV en Do.", link: { href: "/progresiones", label: "Abrir Progresiones →" } },
          { min: 20, title: "Base", do: "Graba la progresión en bucle durante 2 minutos (o deja Progresiones en modo ∞)." },
          { min: 25, title: "Melodía", do: "Improvisa 8 compases sobre la base. Toca la parte A dos veces, cambia en B y vuelve a A.",
            goal: "Una versión completa A-A-B-A grabada." },
          { min: 10, title: "Escríbela", do: "Escribe los acordes arriba y la melodía en tab abajo. Es tu primera hoja de canción." },
        ],
        check: ["¿La parte B contrasta con la A?", "¿Quedó escrita?"],
      }],
    ],
  },
  {
    id: "teoria", title: "Teoría", tagline: "El idioma detrás del instrumento",
    color: "oklch(0.80 0.14 350)",
    why: "La teoría explica lo que ya escuchas. Cada concepto se aprende en papel y se busca de inmediato en el mástil.",
    levels: [
      [{
        title: "Cómo se construye la escala mayor", focus: "La fórmula T-T-S-T-T-T-S y la tríada 1-3-5.",
        blocks: [
          { min: 5, title: "La fórmula", do: "Tono = 2 trastes, semitono = 1 traste. La escala mayor es T-T-S-T-T-T-S." },
          { min: 20, title: "En una cuerda", exercise: EX.mayorUnaCuerda,
            do: "En una sola cuerda la fórmula se ve: cuenta los trastes entre cada nota.",
            goal: "Construir La mayor en la cuerda La sin ayuda." },
          { min: 20, title: "La tríada", exercise: EX.triada1358,
            do: "La tríada mayor son los grados 1, 3 y 5 de la escala: Do–Mi–Sol.",
            goal: "Encontrar 1-3-5 de Sol mayor y de Re mayor." },
          { min: 15, title: "Mayor vs menor", do: "Baja la 3ª un semitono (Mi → Mib) y toca ambas tríadas. Esa nota decide si un acorde es mayor o menor.", link: { href: "/triadas", label: "Ver tríadas en el mástil →" } },
        ],
        check: ["¿Puedo construir una escala mayor desde cualquier nota?", "¿Sé qué nota cambia entre mayor y menor?"],
      }],
      [{
        title: "Armonía diatónica", focus: "Los 7 acordes de una tonalidad: I ii iii IV V vi vii°.",
        blocks: [
          { min: 5, title: "La fórmula", do: "En mayor, los acordes son: mayor, menor, menor, mayor, mayor, menor, disminuido." },
          { min: 20, title: "Tócalos", do: "En Progresiones elige Do mayor y toca los 7 acordes en orden, diciendo su número romano.", link: { href: "/progresiones", label: "Abrir Progresiones →" } },
          { min: 20, title: "I – IV – V", exercise: EX.arpegiosIIVV,
            do: "Arpegia los tres acordes principales: son los que sostienen casi todo el rock, el blues y el pop.",
            goal: "Los tres arpegios sin mirar a 70 BPM." },
          { min: 15, title: "Transporta", do: "Escribe el I, IV y V de Sol mayor y de Re mayor. Compruébalo en Progresiones." },
        ],
        check: ["¿Sé la fórmula de memoria?", "¿Encontré I-IV-V en otras tonalidades?"],
      }],
      [{
        title: "La dominante y el círculo", focus: "Por qué V7 → I suena a llegar a casa.",
        blocks: [
          { min: 5, title: "La idea", do: "G7 tiene Si y Fa: un tritono, el intervalo más inestable. Quiere resolver." },
          { min: 20, title: "El tritono resuelve", exercise: EX.tritonoResuelve,
            do: "Si sube a Do y Fa baja a Mi. Esa resolución es el motor de la armonía tonal.",
            goal: "Cantar la resolución mientras la tocas." },
          { min: 20, title: "Recorre el círculo", link: { href: "/circulo-quintas", label: "Abrir el Círculo →" },
            do: "En sentido antihorario cada tonalidad es la dominante de la siguiente: toca C7 → F7 → Bb7 → Eb7… y escucha cómo cada uno pide el siguiente." },
          { min: 15, title: "Analiza", do: "Toma una canción que sepas: tonalidad, números romanos y dónde aparece el V." },
        ],
        check: ["¿Escucho la tensión del tritono?", "¿Encontré el V en una canción real?"],
      }],
    ],
  },
  {
    id: "jamming", title: "Expresión", tagline: "Donde todo cobra sentido",
    color: "oklch(0.72 0.19 25)",
    why: "Son 3 horas por ciclo porque aquí la técnica se convierte en voz propia: bending, vibrato, dinámica e improvisación.",
    levels: [
      [
        {
          title: "Bending afinado", focus: "Doblar la cuerda hasta la nota exacta, ni más ni menos.",
          blocks: [
            { min: 10, title: "Calentamiento", do: "Bends lentos en la cuerda Sol, traste 7, con el anular apoyado por el medio y el índice. Empuja con la muñeca, no con el dedo." },
            { min: 25, title: "Bend a la referencia", exercise: EX.bendReferencia,
              do: "Toca la nota de referencia, luego dobla hasta que suene igual. El reproductor toca la nota objetivo.",
              goal: "4 de 4 bends afinados." },
            { min: 20, title: "Medio tono", do: "Repite con bends de medio tono: Si 9 como referencia y Si 8 doblado. Exige más control." },
            { min: 5, title: "Cierre", do: "Graba 3 bends y escúchalos: ¿llegaste a la nota?" },
          ],
          check: ["¿Llegué a la nota exacta?", "¿Empujé con la muñeca?"],
        },
        {
          title: "Vibrato", focus: "El vibrato es tu firma: parejo, con ancho y velocidad que tú controlas.",
          blocks: [
            { min: 10, title: "Lento", do: "Nota larga en la cuerda Si, traste 8. Un vibrato por pulso a 60 BPM." },
            { min: 25, title: "Con metrónomo", do: "Sube a 2 y luego a 4 vibratos por pulso. El ancho debe ser siempre igual.",
              goal: "4 por pulso a 60 BPM, parejos." },
            { min: 15, title: "Cada dedo", do: "Vibrato con los dedos 1, 2, 3 y 4 en distintas cuerdas." },
            { min: 10, title: "Bend + vibrato", do: "Dobla un tono y aplica vibrato arriba sin perder la afinación." },
          ],
          check: ["¿Mi vibrato es parejo?", "¿Mantuve la afinación arriba del bend?"],
        },
        {
          title: "Jam en La menor", focus: "Usar todo lo anterior sobre un groove.",
          blocks: [
            { min: 10, title: "Lick", exercise: EX.lickBlues, do: "Aprende el lick y tócalo 10 veces sin error." },
            { min: 30, title: "Improvisa", do: "Metrónomo a 80. Improvisa con la caja 1: los primeros 5 minutos solo con 3 notas, luego libre. Usa bends y vibrato." },
            { min: 15, title: "Con una emoción", do: "Graba 3 minutos tocando con melancolía como única guía." },
            { min: 5, title: "Escucha", do: "Escucha la grabación y anota una cosa que te gustó." },
          ],
          check: ["¿Usé bends y vibrato?", "¿Grabé y escuché?"],
        },
      ],
      [
        {
          title: "Slides y double stops", focus: "Dos recursos que hacen que una frase cante.",
          blocks: [
            { min: 10, title: "Slides", do: "Slides de 2 trastes en la cuerda Sol (5 → 7) sin que se apague la nota. Mantén la presión al deslizar." },
            { min: 25, title: "Double stops", exercise: EX.doubleStops,
              do: "Toca solo las dos cuerdas indicadas. Apaga las demás con el canto de la mano derecha.",
              goal: "La frase completa a 75 BPM sin cuerdas de más." },
            { min: 20, title: "Mezcla", do: "Inventa una frase que combine slides y double stops. Grábala." },
            { min: 5, title: "Cierre", do: "Escucha tu frase y anota qué cambiarías." },
          ],
          check: ["¿El slide mantuvo el sonido?", "¿Sonaron solo las dos cuerdas?"],
        },
        {
          title: "Dinámica y armónicos", focus: "Tocar muy suave y muy fuerte, y encontrar los armónicos naturales.",
          blocks: [
            { min: 15, title: "Armónicos naturales", do: "Roza las cuerdas sin presionar justo encima del traste 12, luego del 7 y del 5. Pica y suelta enseguida." },
            { min: 20, title: "Dinámica", do: "Toca la caja 1 lo más suave posible y luego lo más fuerte, sin cambiar el tempo. Después alterna cada compás." },
            { min: 20, title: "Tensión con volumen", do: "Improvisa empezando en susurro y terminando muy fuerte en 2 minutos." },
            { min: 5, title: "Cierre", do: "¿Qué armónico sonó más claro? Anótalo." },
          ],
          check: ["¿Sonaron los armónicos del 12, 7 y 5?", "¿Mantuve el tempo al cambiar de volumen?"],
        },
        {
          title: "Jam en Do mayor", focus: "Improvisar en mayor sobre una progresión real.",
          blocks: [
            { min: 10, title: "Lick", exercise: EX.jamMayor, do: "Aprende el lick en la pentatónica mayor de Do." },
            { min: 30, title: "Improvisa", link: { href: "/progresiones", label: "Abrir Progresiones →" },
              do: "Deja Progresiones con I–V–vi–IV de Do en modo ∞ e improvisa encima. Busca terminar tus frases en la nota del acorde que suena." },
            { min: 15, title: "Con una emoción", do: "Graba 3 minutos tocando con euforia." },
            { min: 5, title: "Escucha", do: "Anota un momento bueno y uno a mejorar." },
          ],
          check: ["¿Terminé frases en notas del acorde?", "¿Grabé?"],
        },
      ],
      [
        {
          title: "Blues de 12 compases en La", focus: "La forma más tocada de la guitarra eléctrica.",
          blocks: [
            { min: 10, title: "Shuffle", exercise: EX.shuffleA, do: "Toca el shuffle con un swing ligero: la primera corchea un poco más larga." },
            { min: 20, title: "La forma", do: "A7 ×4, D7 ×2, A7 ×2, E7, D7, A7 ×2 (un compás cada uno). En D, toca el shuffle en las cuerdas Re y Sol; en E, en las cuerdas Mi y La.",
              goal: "Los 12 compases sin perderte." },
            { min: 25, title: "Solo encima", do: "Graba 3 vueltas de shuffle y toca un solo encima con la caja 1. Cambia de idea cuando cambia el acorde." },
            { min: 5, title: "Cierre", do: "¿Sentiste los cambios de acorde en tu solo?" },
          ],
          check: ["¿Me sé la forma de memoria?", "¿El solo siguió los cambios?"],
        },
        {
          title: "Frases con intención", focus: "Que cada frase diga algo.",
          blocks: [
            { min: 15, title: "Emociones", do: "Toca una frase de 4 compases por emoción y cambia cada 3 minutos: rabia, ternura, euforia, tristeza." },
            { min: 20, title: "Tres maneras", do: "Toca la misma frase de 3 maneras: con bends, con slides y solo con vibrato." },
            { min: 20, title: "Pregunta y respuesta", do: "Graba una frase, deja 4 compases de silencio y respóndela en vivo. Repite 5 veces." },
            { min: 5, title: "Cierre", do: "¿Qué emoción te salió más natural?" },
          ],
          check: ["¿Las emociones se distinguían?", "¿Respondí en vivo?"],
        },
        {
          title: "Jam libre grabado", focus: "Tocar sin parar y encontrar tu vocabulario.",
          blocks: [
            { min: 45, title: "Graba", do: "Graba 20–30 minutos de improvisación sobre tu blues o tu progresión. No pares aunque no se te ocurra nada: repite una idea hasta que cambie sola." },
            { min: 15, title: "Escucha y aprende", do: "Marca 3 momentos buenos y 1 a mejorar. Aprende los 3 buenos: son tu vocabulario." },
          ],
          check: ["¿Toqué sin parar?", "¿Aprendí mis 3 mejores momentos?"],
        },
      ],
    ],
  },
]

// ─── Plan de 30 horas ─────────────────────────────────────────────────────────

export const TAG_PREFIX = "Vai30h:"

export interface PlannedSession {
  hour:      number               // 1–30
  cycle:     Cycle
  cat:       WorkoutCategory
  session:   WorkoutSession
  index:     number               // posición dentro del área en ese ciclo
  tag:       string
  legacyTag: string               // tag de la versión anterior (una celda por área y ciclo)
}

export const WORKOUT_PLAN: PlannedSession[] = (() => {
  const out: PlannedSession[] = []
  for (const cycle of [0, 1, 2] as Cycle[]) {
    for (const cat of WORKOUT_CATEGORIES) {
      const sessions = cat.levels[cycle]
      sessions.forEach((session, index) => {
        const legacyTag = `${TAG_PREFIX}${cat.id}:c${cycle}`
        out.push({
          hour: out.length + 1, cycle, cat, session, index, legacyTag,
          tag: sessions.length === 1 ? legacyTag : `${legacyTag}:${index + 1}`,
        })
      })
    }
  }
  return out
})()

export const TOTAL_WORKOUT_HOURS = WORKOUT_PLAN.length

/** Minutos de un bloque según la duración elegida (60 o 30 min). */
export function blockMinutes(block: SessionBlock, total: 60 | 30): number {
  return total === 60 ? block.min : Math.max(2, Math.round(block.min / 2))
}

export const REST_NOTE =
  "Descansa al menos un día por semana. Tus dedos tienen músculos y tendones pequeños: si sientes dolor (no solo cansancio), para. Vigila señales de tendinitis o túnel carpiano, y protege tus oídos en ensayos ruidosos."

export const WORKOUT_PRINCIPLES: string[] = [
  "Lento y perfecto antes que rápido y sucio. Sube 5 BPM solo después de 3 pasadas limpias.",
  "Si fallas, para y empieza de nuevo. Repetir errores es practicar errores.",
  "La técnica es una herramienta, no la meta. Termina cada semana haciendo música.",
]

export const WORKOUT_QUOTES: string[] = [
  "La técnica no es el objetivo — es la herramienta. No la conviertas en una prisión.",
  "Toca lento y perfecto antes que rápido y sucio. Siempre.",
  "El oído es la conexión más importante entre tu imaginación y tus dedos.",
  "La disciplina no le quita la pasión a la música — es lo que te permite expresarla.",
  "Está bien desanimarse a veces. Rendirse es otra cosa.",
]
