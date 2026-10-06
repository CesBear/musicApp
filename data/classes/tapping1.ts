// Clase «Tapping Shredmaster» (Secretos del Shred), 5 oct 2026 — transcripción de la
// hoja de la clase (public/clases/tapping-1-shredmaster.pdf) para practicarla con
// audio. Cuerda 0 = Mi grave … 5 = mi aguda. ♩ = 120 en el original.
import type { TabExercise, TabStep, TieType } from "@/components/TabDiagram"

type N = [string: number, fret: number, tie?: TieType]
const steps = (notes: N[]): TabStep[] => notes.map(([string, fret, tie]) => ({ notes: [{ string, fret }], ...(tie ? { tie } : {}) }))
const rep = <T,>(xs: T[], n: number) => Array.from({ length: n }, () => xs).flat()
const E = 5   // mi aguda

export interface ClassExercise {
  letter: string
  exercise: TabExercise
  goal: string
}

export const TAPPING_1_INTRO = [
  "El tapping es tocar notas golpeando el diapasón con un dedo de la mano derecha (normalmente el medio, para no soltar la púa). El golpe ya hace sonar la nota; luego esa misma mano tira de la cuerda hacia abajo o hacia un lado (pull-off) y suena la nota que pisa la mano izquierda.",
  "En la hoja, la «T» y la cruz «+» sobre la nota marcan el tap. Las demás notas se ligan: pull-off (P) cuando bajas y hammer-on (H) cuando subes. Solo se pica la primera nota, o ninguna.",
]

export const TAPPING_1_TIPS = [
  "Mutea las cuerdas que no tocas: la palma derecha sobre las graves y el canto del índice izquierdo sobre las agudas. El tapping hace ruido si las cuerdas sueltas vibran.",
  "El pull-off del tap va hacia abajo (hacia el piso), no hacia afuera: así la nota de la izquierda suena igual de fuerte que la tapeada.",
  "Golpea justo detrás del traste, como si pisaras con la izquierda. Si el tap suena apagado, estás lejos del traste.",
  "Empieza a 60 BPM y sube de 5 en 5. La meta de la hoja es ♩ = 120.",
]

export const TAPPING_1: ClassExercise[] = [
  {
    letter: "A1", goal: "Tres notas iguales de volumen en cada tresillo.",
    exercise: {
      id: "tap1-a1", title: "A1 · Tap y dos pull-offs", bpmHint: 60, subdivision: 3, beatsPerGroup: 6, timeSignature: "2/4",
      desc: "Tap en el 12, pull-off al 8 y al 5: Mi–Do–La, el arpegio de La menor en una cuerda.",
      steps: steps(rep<N>([[E, 12, "t"], [E, 8, "p"], [E, 5, "p"]], 2)),
    },
  },
  {
    letter: "A2", goal: "El hammer-on al 8 suena sin volver a picar.",
    exercise: {
      id: "tap1-a2", title: "A2 · Tap, pull-off y hammer-on", bpmHint: 60, subdivision: 3, beatsPerGroup: 6, timeSignature: "2/4",
      desc: "Tap en el 12, pull-off al 5 y hammer-on al 8: el mismo arpegio en otro orden.",
      steps: steps(rep<N>([[E, 12, "t"], [E, 5, "p"], [E, 8, "h"]], 2)),
    },
  },
  {
    letter: "A3", goal: "Cuatro notas parejas por pulso: es el patrón más usado del tapping.",
    exercise: {
      id: "tap1-a3", title: "A3 · El ciclo de cuatro (semicorcheas)", bpmHint: 60, subdivision: 4, beatsPerGroup: 8, timeSignature: "2/4",
      desc: "12–8–5–8: tap, dos pull-offs y un hammer-on que prepara el siguiente tap.",
      steps: steps(rep<N>([[E, 12, "t"], [E, 8, "p"], [E, 5, "p"], [E, 8, "h"]], 2)),
    },
  },
  {
    letter: "B", goal: "Cambiar de acorde sin cortar los tresillos.",
    exercise: {
      id: "tap1-b", title: "B · Arpegios Am – G – F", bpmHint: 60, subdivision: 3, beatsPerGroup: 6, timeSignature: "2/4",
      desc: "Am (12–8–5), G (10–3–7) y F (8–1–5). La mano izquierda cambia de forma; el tap baja con el acorde.",
      steps: steps([
        ...rep<N>([[E, 12, "t"], [E, 8, "p"], [E, 5, "p"]], 2),
        ...rep<N>([[E, 10, "t"], [E, 3, "p"], [E, 7, "h"]], 2),
        ...rep<N>([[E, 8, "t"], [E, 1, "p"], [E, 5, "h"]], 2),
      ]),
    },
  },
  {
    letter: "C", goal: "El tap queda fijo; solo se mueve la mano izquierda.",
    exercise: {
      id: "tap1-c", title: "C · Nota pedal arriba (Mi)", bpmHint: 60, subdivision: 3, beatsPerGroup: 12, timeSignature: "4/4",
      desc: "Tap siempre en el 12 (Mi) mientras la izquierda cambia: 5–8, 3–7, 1–5, 3–7. Suena Am – Em – Fmaj7 – Em.",
      steps: steps([
        [E, 12, "t"], [E, 5, "p"], [E, 8, "h"], [E, 12, "t"], [E, 3, "p"], [E, 7, "h"],
        [E, 12, "t"], [E, 1, "p"], [E, 5, "h"], [E, 12, "t"], [E, 3, "p"], [E, 7, "h"],
      ]),
    },
  },
  {
    letter: "D", goal: "La mano derecha salta de traste sin perder el pulso.",
    exercise: {
      id: "tap1-d", title: "D · La melodía va en el tap", bpmHint: 60, subdivision: 3, beatsPerGroup: 12, timeSignature: "4/4",
      desc: "Ahora la izquierda queda fija (5–8) y el tap hace la melodía: 12, 13, 15, 13 (Mi–Fa–Sol–Fa).",
      steps: steps([
        [E, 12, "t"], [E, 5, "p"], [E, 8, "h"], [E, 13, "t"], [E, 5, "p"], [E, 8, "h"],
        [E, 15, "t"], [E, 5, "p"], [E, 8, "h"], [E, 13, "t"], [E, 5, "p"], [E, 8, "h"],
      ]),
    },
  },
  {
    letter: "E", goal: "El slide del dedo derecho no se despega de la cuerda.",
    exercise: {
      id: "tap1-e", title: "E · Tap con slide", bpmHint: 60, subdivision: 3, beatsPerGroup: 12, timeSignature: "4/4",
      desc: "Tap en el 12, desliza el mismo dedo al 13 y vuelve al 12; luego 8–5–8 con la izquierda.",
      steps: steps(rep<N>([[E, 12, "t"], [E, 13, "s"], [E, 12, "s"], [E, 8, "p"], [E, 5, "p"], [E, 8, "h"]], 2)),
    },
  },
  {
    letter: "F", goal: "El bend llega a Fa♯ (un tono) con el dedo derecho apoyado.",
    exercise: {
      id: "tap1-f", title: "F · Tap con bend", bpmHint: 60, subdivision: 3, beatsPerGroup: 12, timeSignature: "3/4 (rítmica aprox.)",
      desc: "Tap en el 12 y, sin soltarlo, la mano izquierda dobla la cuerda un tono y la regresa. Después 8–5–8 y un último tap con vibrato.",
      steps: [
        { notes: [{ string: E, fret: 12 }], tie: "b", bend: 2 }, { notes: [] }, { notes: [] },
        { notes: [{ string: E, fret: 12 }], tie: "t" }, { notes: [] }, { notes: [] },
        ...steps([[E, 8, "p"], [E, 5, "p"], [E, 8, "h"]]),
        { notes: [{ string: E, fret: 12 }], tie: "t" }, { notes: [] }, { notes: [] },
      ],
    },
  },
  {
    letter: "G", goal: "Cambiar de cuerda sin que suene la anterior.",
    exercise: {
      id: "tap1-g", title: "G · Escala de Do mayor por las 6 cuerdas", bpmHint: 60, subdivision: 3, beatsPerGroup: 18, timeSignature: "6/4",
      desc: "Tres notas por cuerda en tresillos: tap, pull-off y hammer-on, de la 6ª a la 1ª. Mi–Do–Re, La–Fa–Sol, Re–Si–Do, Sol–Mi–Fa, Do–La–Si, Fa–Re–Mi.",
      steps: steps([
        [0, 12, "t"], [0, 8, "p"], [0, 10, "h"], [1, 12, "t"], [1, 8, "p"], [1, 10, "h"],
        [2, 12, "t"], [2, 9, "p"], [2, 10, "h"], [3, 12, "t"], [3, 9, "p"], [3, 10, "h"],
        [4, 13, "t"], [4, 10, "p"], [4, 12, "h"], [5, 13, "t"], [5, 10, "p"], [5, 12, "h"],
      ]),
    },
  },
  {
    letter: "H", goal: "El pull-off a la cuerda al aire suena tan fuerte como las demás.",
    exercise: {
      id: "tap1-h", title: "H · Bajada hasta la cuerda al aire", bpmHint: 60, subdivision: 4, beatsPerGroup: 16, timeSignature: "4/4",
      desc: "Tap en el 12 y pull-offs 8–7–5–0, luego hammer-ons 5–7–8: La menor de arriba abajo en una cuerda.",
      steps: steps(rep<N>([[E, 12, "t"], [E, 8, "p"], [E, 7, "p"], [E, 5, "p"], [E, 0, "p"], [E, 5, "h"], [E, 7, "h"], [E, 8, "h"]], 2)),
    },
  },
  {
    letter: "RK", goal: "Una sola nota picada por cuerda; todo lo demás, ligado.",
    exercise: {
      id: "tap1-kotzen", title: "Línea a la Richie Kotzen", bpmHint: 55, subdivision: 3, beatsPerGroup: 24, timeSignature: "8/4",
      desc: "Legato que baja y sube y un tap arriba en el 17, en la 1ª, 2ª y 3ª cuerda. Kotzen casi nunca pica: todo sale de ligados y taps.",
      steps: steps([
        [5, 13], [5, 12, "p"], [5, 10, "p"], [5, 12, "h"], [5, 13, "h"], [5, 17, "t"], [5, 13, "p"], [5, 12, "p"], [5, 10, "p"],
        [4, 13], [4, 12, "p"], [4, 10, "p"], [4, 12, "h"], [4, 13, "h"], [4, 17, "t"], [4, 13, "p"], [4, 12, "p"], [4, 10, "p"],
        [3, 12], [3, 10, "p"], [3, 9, "p"], [3, 10, "h"], [3, 12, "h"], [3, 17, "t"],
      ]),
    },
  },
  {
    letter: "RK+", goal: "Llegar a la 6ª cuerda sin cortar el legato y cerrar en La.",
    exercise: {
      id: "tap1-kotzen-full", title: "Línea a la Richie Kotzen · completa (continuación propuesta)", bpmHint: 50, subdivision: 3, beatsPerGroup: 12, timeSignature: "4/4",
      desc: "La hoja termina en «…» en la 3ª cuerda. Aquí sigue el mismo patrón por la 4ª, 5ª y 6ª (bajar, subir, tap en el 17, bajar) y cierra con un slide a La, la tónica. La continuación es nuestra, no de la hoja.",
      steps: [
        ...steps(([[5, 13, 10, 12], [4, 13, 10, 12], [3, 12, 9, 10], [2, 12, 9, 10], [1, 12, 8, 10], [0, 12, 8, 10]] as const).flatMap(([str, top, low, mid]): N[] => [
          [str, top], [str, mid, "p"], [str, low, "p"], [str, mid, "h"], [str, top, "h"], [str, 17, "t"], [str, top, "p"], [str, mid, "p"], [str, low, "p"],
        ])),
        { notes: [{ string: 0, fret: 5 }], tie: "s" }, { notes: [] }, { notes: [] }, { notes: [] }, { notes: [] }, { notes: [] },
      ],
    },
  },
  {
    letter: "I", goal: "Hammer-ons de subida y pull-offs de bajada con el mismo volumen.",
    exercise: {
      id: "tap1-i", title: "I · Tres notas por cuerda + tap (graves)", bpmHint: 55, subdivision: 3, beatsPerGroup: 24, timeSignature: "8/4",
      desc: "Sube con hammer-ons, tap en el 17 y baja con pull-offs, en la 6ª, 5ª y 4ª cuerda.",
      steps: steps([
        [0, 8], [0, 10, "h"], [0, 12, "h"], [0, 17, "t"], [0, 12, "p"], [0, 10, "p"], [0, 8, "p"], [0, 10, "h"], [0, 12, "h"],
        [1, 8], [1, 10, "h"], [1, 12, "h"], [1, 17, "t"], [1, 12, "p"], [1, 10, "p"], [1, 8, "p"],
        [2, 9], [2, 10, "h"], [2, 12, "h"], [2, 17, "t"], [2, 12, "p"], [2, 10, "p"], [2, 9, "p"], [2, 12, "h"],
      ]),
    },
  },
]
