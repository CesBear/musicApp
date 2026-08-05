// 30-Hour Workout — rutina de práctica estructurada inspirada en la filosofía
// del legendario "30-Hour Path to Virtuoso Enlightenment" de Steve Vai
// (Guitar World, abril 2004). Contenido, ejercicios y textos originales de
// MaestroMusic — no es una transcripción del artículo.
import type { TabExercise } from "@/components/TabDiagram"

export type WorkoutCategoryId =
  | "ejercicios" | "escalas" | "acordes" | "oido"
  | "lectura" | "composicion" | "teoria" | "jamming"

export interface WorkoutCategory {
  id:            WorkoutCategoryId
  title:         string
  tagline:       string
  color:         string   // acento oklch
  hourStart:     number   // posición dentro del bloque de 10h (1-8)
  hoursPerCycle: number   // 1h normal, 3h para jamming
  intro:         string[]
  howTo:         string[]
  tips:          string[]
  links?:        { href: string; label: string }[]
  exercises?:    TabExercise[]
}

/** Horas concretas que ocupa una categoría en un ciclo dado (0, 1 o 2). */
export function hoursForCycle(cat: WorkoutCategory, cycle: 0 | 1 | 2): number[] {
  const start = cycle * 10 + cat.hourStart
  return Array.from({ length: cat.hoursPerCycle }, (_, i) => start + i)
}

export function hourRangeLabel(cat: WorkoutCategory, cycle: 0 | 1 | 2): string {
  const hrs = hoursForCycle(cat, cycle)
  return hrs.length === 1 ? String(hrs[0]) : `${hrs[0]}–${hrs[hrs.length - 1]}`
}

export const TOTAL_WORKOUT_HOURS = 30

// ─── Ejercicios de dedos ──────────────────────────────────────────────────────

const FINGER_EXERCISES: TabExercise[] = [
  {
    id: "lineal", title: "Lineal · patrón 1-2-3-4", bpmHint: 70,
    desc: "Un dedo por traste, ascendiendo por cada cuerda. La base de toda la destreza de mano izquierda.",
    steps: [
      { notes: [{ string: 0, fret: 1 }] }, { notes: [{ string: 0, fret: 2 }] },
      { notes: [{ string: 0, fret: 3 }] }, { notes: [{ string: 0, fret: 4 }] },
      { notes: [{ string: 1, fret: 1 }] }, { notes: [{ string: 1, fret: 2 }] },
      { notes: [{ string: 1, fret: 3 }] }, { notes: [{ string: 1, fret: 4 }] },
      { notes: [{ string: 2, fret: 1 }] }, { notes: [{ string: 2, fret: 2 }] },
      { notes: [{ string: 2, fret: 3 }] }, { notes: [{ string: 2, fret: 4 }] },
    ],
  },
  {
    id: "angular", title: "Angular · cruce de cuerdas", bpmHint: 65,
    desc: "El mismo dedo salta a la cuerda vecina. Entrena el picking angular y el economy picking.",
    steps: [
      { notes: [{ string: 0, fret: 5 }] }, { notes: [{ string: 1, fret: 6 }] },
      { notes: [{ string: 2, fret: 7 }] }, { notes: [{ string: 3, fret: 8 }] },
      { notes: [{ string: 3, fret: 8 }] }, { notes: [{ string: 2, fret: 7 }] },
      { notes: [{ string: 1, fret: 6 }] }, { notes: [{ string: 0, fret: 5 }] },
    ],
  },
  {
    id: "trino", title: "Trino legato (H/P)", bpmHint: 90, subdivision: 4,
    desc: "Alterna hammer-on y pull-off entre dos trastes sin repicar. Aísla la fuerza de cada dedo.",
    steps: [
      { notes: [{ string: 0, fret: 5 }] },
      { notes: [{ string: 0, fret: 6 }], tie: "h" },
      { notes: [{ string: 0, fret: 5 }], tie: "p" },
      { notes: [{ string: 0, fret: 6 }], tie: "h" },
      { notes: [{ string: 0, fret: 5 }], tie: "p" },
      { notes: [{ string: 0, fret: 6 }], tie: "h" },
      { notes: [{ string: 0, fret: 5 }], tie: "p" },
      { notes: [{ string: 0, fret: 6 }], tie: "h" },
    ],
  },
  {
    id: "tapping", title: "Tapping en una cuerda", bpmHint: 100, subdivision: 3, beatsPerGroup: 3,
    desc: "Golpe con la mano derecha y dos pull-offs con la izquierda. La base del tapping a dos manos.",
    steps: [
      { notes: [{ string: 5, fret: 12 }], tie: "t" },
      { notes: [{ string: 5, fret: 8 }],  tie: "p" },
      { notes: [{ string: 5, fret: 5 }],  tie: "p" },
      { notes: [{ string: 5, fret: 12 }], tie: "t" },
      { notes: [{ string: 5, fret: 8 }],  tie: "p" },
      { notes: [{ string: 5, fret: 5 }],  tie: "p" },
    ],
  },
  {
    id: "barrido", title: "Barrido (sweep) · Am", bpmHint: 60, subdivision: 10, beatsPerGroup: 5,
    desc: "Una sola pasada de púa a través de un arpegio, rápida y continua — no una escala lenta. Digita cada cuerda con un dedo distinto para que no suene rasgueado.",
    // Una sola pasada de púa: todo hacia abajo en la subida, todo hacia arriba en la bajada.
    steps: [
      { notes: [{ string: 0, fret: 5 }], pick: "d" }, { notes: [{ string: 1, fret: 7 }], pick: "d" },
      { notes: [{ string: 2, fret: 7 }], pick: "d" }, { notes: [{ string: 3, fret: 5 }], pick: "d" },
      { notes: [{ string: 4, fret: 5 }], pick: "d" }, { notes: [{ string: 3, fret: 5 }], pick: "u" },
      { notes: [{ string: 2, fret: 7 }], pick: "u" }, { notes: [{ string: 1, fret: 7 }], pick: "u" },
      { notes: [{ string: 0, fret: 5 }], pick: "u" },
    ],
  },
]

const SCALE_EXERCISES: TabExercise[] = [
  {
    id: "terceras", title: "Patrón melódico en terceras", bpmHint: 75,
    desc: "Salta de nota en nota en vez de subir la escala en línea recta. Así se entrenan los oídos y los dedos a la vez.",
    steps: [
      { notes: [{ string: 1, fret: 3 }] },  { notes: [{ string: 0, fret: 5 }] },
      { notes: [{ string: 1, fret: 5 }] },  { notes: [{ string: 0, fret: 7 }] },
      { notes: [{ string: 1, fret: 7 }] },  { notes: [{ string: 0, fret: 9 }] },
      { notes: [{ string: 1, fret: 9 }] },  { notes: [{ string: 0, fret: 11 }] },
    ],
  },
]

const CHORD_EXERCISES: TabExercise[] = [
  {
    id: "cambio-em-am", title: "Cambio Em ↔ Am", bpmHint: 70,
    desc: "Alterna dos acordes abiertos completos en cada pulso. El objetivo es que el cambio sea inaudible.",
    steps: [
      { notes: [{ string: 0, fret: 0 }, { string: 1, fret: 2 }, { string: 2, fret: 2 }, { string: 3, fret: 0 }, { string: 4, fret: 0 }, { string: 5, fret: 0 }] },
      { notes: [{ string: 1, fret: 0 }, { string: 2, fret: 2 }, { string: 3, fret: 2 }, { string: 4, fret: 1 }, { string: 5, fret: 0 }] },
      { notes: [{ string: 0, fret: 0 }, { string: 1, fret: 2 }, { string: 2, fret: 2 }, { string: 3, fret: 0 }, { string: 4, fret: 0 }, { string: 5, fret: 0 }] },
      { notes: [{ string: 1, fret: 0 }, { string: 2, fret: 2 }, { string: 3, fret: 2 }, { string: 4, fret: 1 }, { string: 5, fret: 0 }] },
    ],
  },
  {
    id: "power-chords", title: "Power chords cromáticos", bpmHint: 85, subdivision: 2,
    desc: "Dos notas por golpe (raíz + 5ª) subiendo por trastes. La base rítmica del rock.",
    steps: [
      { notes: [{ string: 0, fret: 5 }, { string: 1, fret: 7 }] }, { notes: [{ string: 0, fret: 5 }, { string: 1, fret: 7 }] },
      { notes: [{ string: 0, fret: 7 }, { string: 1, fret: 9 }] }, { notes: [{ string: 0, fret: 7 }, { string: 1, fret: 9 }] },
      { notes: [{ string: 0, fret: 8 }, { string: 1, fret: 10 }] }, { notes: [{ string: 0, fret: 8 }, { string: 1, fret: 10 }] },
      { notes: [{ string: 0, fret: 5 }, { string: 1, fret: 7 }] }, { notes: [{ string: 0, fret: 5 }, { string: 1, fret: 7 }] },
    ],
  },
]

const LECTURA_EXERCISES: TabExercise[] = [
  {
    id: "frase-lectura", title: "Frase de lectura #1", bpmHint: 80,
    desc: "Léela una vez con la vista antes de tocarla. Luego tócala sin detenerte pase lo que pase, aunque falles una nota.",
    steps: [
      { notes: [{ string: 1, fret: 3 }] }, { notes: [{ string: 1, fret: 5 }] },
      { notes: [{ string: 2, fret: 4 }] }, { notes: [{ string: 2, fret: 5 }] },
      { notes: [{ string: 1, fret: 5 }] }, { notes: [{ string: 1, fret: 3 }] },
      { notes: [{ string: 0, fret: 5 }] }, { notes: [{ string: 0, fret: 3 }] },
      { notes: [{ string: 1, fret: 3 }] }, { notes: [{ string: 2, fret: 2 }] },
      { notes: [{ string: 2, fret: 5 }] }, { notes: [{ string: 1, fret: 3 }] },
    ],
  },
]

const COMPOSICION_EXERCISES: TabExercise[] = [
  {
    id: "motivo-semilla", title: "Motivo semilla (llamada y respuesta)", bpmHint: 75, beatsPerGroup: 4,
    desc: "Toca las primeras 4 notas (la 'llamada') y completa tú los 4 huecos en silencio con tu propia 'respuesta'. Repite variando la respuesta cada vez.",
    steps: [
      { notes: [{ string: 2, fret: 5 }] }, { notes: [{ string: 2, fret: 7 }] },
      { notes: [{ string: 1, fret: 5 }] }, { notes: [{ string: 1, fret: 3 }] },
      { notes: [] }, { notes: [] }, { notes: [] }, { notes: [] },
    ],
  },
]

const TEORIA_EXERCISES: TabExercise[] = [
  {
    id: "triada-mayor", title: "Tríada mayor ascendente (1-3-5-8)", bpmHint: 70,
    desc: "Escucha cómo suenan la fundamental, la 3ª y la 5ª por separado — es el ADN de todo acorde mayor.",
    steps: [
      { notes: [{ string: 1, fret: 3 }] }, { notes: [{ string: 2, fret: 2 }] },
      { notes: [{ string: 2, fret: 5 }] }, { notes: [{ string: 1, fret: 3 }] },
      { notes: [{ string: 2, fret: 2 }] }, { notes: [{ string: 2, fret: 5 }] },
    ],
  },
]

const JAMMING_EXERCISES: TabExercise[] = [
  {
    id: "lick-blues", title: "Lick con slide + hammer/pull", bpmHint: 85,
    desc: "Un lick corto que combina las tres técnicas de esta hora: slide, hammer-on y pull-off. Apréndelo y luego cámbialo — esa es la idea.",
    steps: [
      { notes: [{ string: 0, fret: 5 }] },
      { notes: [{ string: 0, fret: 8 }], tie: "s" },
      { notes: [{ string: 1, fret: 5 }] },
      { notes: [{ string: 1, fret: 7 }], tie: "h" },
      { notes: [{ string: 1, fret: 5 }], tie: "p" },
      { notes: [{ string: 2, fret: 5 }] },
      { notes: [{ string: 2, fret: 7 }] },
      { notes: [{ string: 2, fret: 5 }], tie: "p" },
    ],
  },
]

// ─── Categorías ────────────────────────────────────────────────────────────────

export const WORKOUT_CATEGORIES: WorkoutCategory[] = [
  {
    id: "ejercicios", title: "Ejercicios de dedos", tagline: "Destreza y control puro",
    color: "oklch(0.80 0.15 70)", hourStart: 1, hoursPerCycle: 1,
    intro: [
      "Antes de sonar bien, la guitarra exige que la mano izquierda y la derecha se muevan con precisión absoluta. Esta hora no es sobre música: es sobre control motor.",
      "El objetivo no es la velocidad — es la limpieza. La velocidad llega sola cuando el movimiento es económico y cada nota suena exactamente igual de fuerte y clara que la anterior.",
    ],
    howTo: [
      "Elige un ejercicio y ponlo a un tempo donde puedas tocarlo sin un solo error, aunque te parezca ridículamente lento.",
      "Tócalo en bucle durante 1-2 minutos sin parar. Si fallas una nota, no la corrijas sobre la marcha: para todo y reinicia desde el principio.",
      "Sube el metrónomo 4-5 BPM solo cuando lo hayas tocado perfecto 3 veces seguidas.",
      "Cambia de mano: todo ejercicio con hammer-on/pull-off se practica también con los dedos 2-3, 2-4, 3-4 y con la mano de tapping si aplica.",
      "Cierra la hora con 5 minutos de estiramiento suave — nunca fuerces un dedo dolorido.",
    ],
    tips: [
      "Observa tus dedos en un espejo o en la cámara del celular: deben moverse con economía, sin gestos de más.",
      "El metrónomo manda. Si no puedes tocarlo limpio al tempo actual, el tempo está mal, no tus dedos.",
    ],
    exercises: FINGER_EXERCISES,
  },
  {
    id: "escalas", title: "Escalas", tagline: "El vocabulario de tus dedos",
    color: "oklch(0.78 0.12 240)", hourStart: 2, hoursPerCycle: 1,
    intro: [
      "Una escala no es una carrera de arriba a abajo del diapasón — es un color, un estado de ánimo. El objetivo de esta hora es memorizar cómo *suena* cada escala, no solo dónde están las notas.",
      "Si tu único plan al improvisar es subir y bajar un patrón porque sabes que 'las notas funcionan', vas a sonar mecánico. Aprende la escala cantándola, no solo digitándola.",
    ],
    howTo: [
      "Elige una escala en /escalas, cántala nota por nota mientras la tocas, muy lento.",
      "Tócala en una posición, luego en dos octavas, luego en tres si el mástil lo permite.",
      "Practícala en ambas direcciones — ascendente y descendente — y en intervalos (terceras, cuartas, quintas), no solo en línea recta.",
      "Grábate tocando la escala y escúchate con sentido crítico: ¿tu sonido es parejo? ¿el fraseo tiene intención o es solo movimiento?",
      "Termina explorando los modos relativos de la misma tonalidad — misma digitación, distinto centro tonal, distinto color emocional.",
    ],
    tips: [
      "Ya tienes las 7 escalas diatónicas/pentatónicas y los 7 modos griegos completos en /escalas, incluyendo Locrio y Menor Melódica.",
      "Nunca toques una escala sin imaginar antes cómo quieres que suene — la mente dirige, los dedos ejecutan.",
    ],
    links: [{ href: "/escalas", label: "Practicar escalas y modos →" }],
    exercises: SCALE_EXERCISES,
  },
  {
    id: "acordes", title: "Acordes", tagline: "Memorización, rasgueo, color",
    color: "oklch(0.80 0.14 150)", hourStart: 3, hoursPerCycle: 1,
    intro: [
      "No necesitas saber el nombre de cada acorde para ser un gran músico — necesitas que tu oído reconozca su color instantáneamente y sepas qué hacer con él.",
      "Divide esta hora en tres partes: memorización, técnica de rasgueo e improvisación armónica libre.",
    ],
    howTo: [
      "Memorización (20 min): aprende un tipo de acorde nuevo (mayor7, dominante7, menor7...) en varias posiciones. Cántalas mientras las tocas.",
      "Rasgueo (20 min): elige un patrón rítmico y tócalo sin parar con metrónomo hasta que se sienta natural — nunca lo practiques rápido antes que limpio.",
      "Improvisación (20 min): toma un acorde conocido, mueve una sola nota un traste arriba o abajo. Cuando encuentres un color que te guste, guárdalo en tu propia 'librería de acordes'.",
    ],
    tips: [
      "Toca cada acorde con distintas dinámicas — suave, duro, brusco, tierno — para conocer todo su rango expresivo.",
      "Usa cuerdas al aire, armónicos naturales y estiramientos amplios para descubrir voicings que no salen en ningún libro.",
    ],
    links: [
      { href: "/rasgueos", label: "Patrones de rasgueo por género →" },
      { href: "/chord-builder", label: "Constructor de acordes →" },
    ],
    exercises: CHORD_EXERCISES,
  },
  {
    id: "oido", title: "Entrenamiento del oído", tagline: "La conexión más importante",
    color: "oklch(0.78 0.14 295)", hourStart: 4, hoursPerCycle: 1,
    intro: [
      "Si vas a saltarte todo lo demás de esta rutina, no te saltes esto. El oído es el puente entre lo que imaginas y lo que tus dedos ejecutan — sin él, la técnica no tiene destino.",
      "Es una habilidad que se construye con repetición, no con talento innato. Algunas personas nacen con un oído más rápido; todas las personas pueden entrenarlo.",
    ],
    howTo: [
      "Improvisa y canta exactamente lo que tocas. No necesitas buena voz — necesitas afinación.",
      "Canta una nota al azar y luego intenta tocarla en la guitarra usando la nota anterior como referencia.",
      "Memoriza el sonido de cada intervalo (2ª menor, 3ª mayor, 5ª justa...) grabándote tocarlo y nombrarlo después de unos segundos de silencio.",
      "Transcribe de oído: empieza con líneas simples de una sola voz, luego acordes completos.",
      "Usa el entrenador de intervalos de abajo cuando quieras una sesión rápida y objetiva.",
    ],
    tips: [
      "Lleva papel pautado contigo: cuando tengas un momento libre lejos del instrumento, escribe una melodía guiándote solo por el oído.",
      "Esta habilidad puede tardar años en desarrollarse del todo — el punto no es dominarla ya, es no dejar de trabajarla.",
    ],
  },
  {
    id: "lectura", title: "Lectura a primera vista", tagline: "Identificar patrones, mirar adelante",
    color: "oklch(0.80 0.14 40)", hourStart: 5, hoursPerCycle: 1,
    intro: [
      "La guitarra es probablemente el instrumento más difícil para leer a primera vista: hay múltiples formas de tocar la misma nota y ninguna posición es obviamente 'correcta'.",
      "Los dos elementos clave son identificar patrones repetidos y aprender a mirar un compás adelante de lo que estás tocando.",
    ],
    howTo: [
      "Consigue partituras (no solo tabs) de distintos niveles y estilos — clásica, jazz, lo que sea.",
      "Toca una pieza nueva y desconocida cada día, a un tempo fijo con metrónomo, sin detenerte pase lo que pase.",
      "Si te pierdes una nota, sigue adelante. Nunca te quedes atascado — termina la pieza completa y luego revisa qué te perdiste.",
      "Domina completamente una pieza y luego tócala muchas veces más: la lectura mejora repitiendo, no solo leyendo material nuevo.",
      "Lee música escrita para otros instrumentos (piano, clarinete, saxofón) — te obliga a pensar en términos de notas, no de digitación de guitarra.",
    ],
    tips: [
      "Practica a un tempo que no te haga fallar cada dos compases: ni tan lento que pierdas el hábito de mirar adelante, ni tan rápido que te desmorones.",
    ],
    links: [{ href: "/lector", label: "Abrir el lector de partituras →" }],
    exercises: LECTURA_EXERCISES,
  },
  {
    id: "composicion", title: "Composición", tagline: "Construye tu catálogo",
    color: "oklch(0.80 0.13 195)", hourStart: 6, hoursPerCycle: 1,
    intro: [
      "Escribir música es, junto con tocarla, una de las experiencias más gratificantes de ser músico. No hace falta un don especial para empezar — hace falta constancia y curiosidad.",
      "Los momentos de inspiración son escasos e impredecibles. Esta hora entrena el hábito de capturarlos cuando aparecen y de generar ideas cuando no aparecen solos.",
    ],
    howTo: [
      "Enciende una grabadora (el celular sirve) y registra cualquier idea, por pequeña que sea, antes de que se te olvide.",
      "Escribe en formato de hoja de referencia: melodía + acordes encima. No necesitas notación clásica completa para empezar.",
      "Compón para un instrumento que no sea la guitarra al menos una vez — obliga a pensar en melodía pura, sin el mapa mental del diapasón.",
      "Busca a alguien con quien compartir ideas musicales — la química con otro músico saca ideas que solo no encontrarías.",
      "Antes de dormir, imagina una melodía interminable sin pensar en si 'se puede tocar'. Es puro ejercicio de imaginación libre.",
    ],
    tips: [
      "La gente compone sobre cualquier cosa: un evento de su vida, una emoción, una fantasía. Presta atención a qué te mueve más a ti — ahí está tu material.",
    ],
    exercises: COMPOSICION_EXERCISES,
  },
  {
    id: "teoria", title: "Teoría musical", tagline: "El idioma detrás del instrumento",
    color: "oklch(0.80 0.14 350)", hourStart: 7, hoursPerCycle: 1,
    intro: [
      "La teoría no es un requisito para ser un gran guitarrista, pero si vas a hablar un idioma, ayuda saber leerlo y escribirlo.",
      "El sistema es más lógico de lo que parece. Lo que confunde a la mayoría es simplemente la falta de práctica pensando en tonalidades poco comunes.",
    ],
    howTo: [
      "Repasa un concepto por sesión: armaduras, círculo de quintas, construcción de acordes, modos.",
      "Después de aprender un concepto en el papel, busca inmediatamente dónde vive en el diapasón — la teoría sin instrumento se olvida rápido.",
      "Practica pensar en tonalidades incómodas (Fa#, Reb) con la misma soltura que en Do o Sol.",
      "Analiza una canción que ya sepas tocar: identifica su tonalidad, su progresión en números romanos y qué modo usa cada sección.",
    ],
    tips: [
      "El círculo de quintas es el mapa más útil que vas a memorizar en toda tu vida como músico — dedícale tiempo real.",
    ],
    links: [{ href: "/circulo-quintas", label: "Explorar el círculo de quintas →" }],
    exercises: TEORIA_EXERCISES,
  },
  {
    id: "jamming", title: "Jamming & expresión", tagline: "Donde todo lo anterior cobra sentido",
    color: "oklch(0.72 0.19 25)", hourStart: 8, hoursPerCycle: 3,
    intro: [
      "Este es el bloque más largo del día — 3 horas — y no es casualidad. Todo lo que entrenaste en las horas anteriores (dedos, escalas, acordes, oído) son solo herramientas. Aquí es donde se convierten en voz propia.",
      "El riesgo de esta rutina es obsesionarte con la técnica y usarla como una prisión en vez de una herramienta. Estar sentado tocando con control y expresión es la meta — no la velocidad por sí sola.",
    ],
    howTo: [
      "Vibrato (1h): sostén una nota y aplica vibrato variando de muy lento a muy violento. Repite con cada dedo, en cada traste — las cuerdas se sienten distinto lejos del traste 12.",
      "Bending (dentro del bloque): dobla una nota hacia el 'target' exacto sin pasarte ni quedarte corto. Practica unísonos: una cuerda doblada afinando exactamente con otra al aire.",
      "Armónicos: pasa una hora completa solo con armónicos naturales y artificiales, buscando los 'puntos dulces' del diapasón.",
      "Whammy bar / dinámica: si tu guitarra tiene palanca, explora desde vibratos sutiles hasta caos total. Trabaja también tocar extremadamente fuerte y, un segundo después, extremadamente suave.",
      "Jam libre: construye una base (loop, pista grabada, o un bajista/batería) e improvisa usando solo una emoción como guía — rabia, euforia, melancolía. Grábate y escucha qué cosas nuevas aparecieron.",
    ],
    tips: [
      "Usa el metrónomo de abajo para mantener el groove mientras improvisas — encajar perfecto con el click es una de las sensaciones más satisfactorias que existen como músico.",
      "Empújate a tocar algo que nunca hayas tocado antes, todos los días. Es la única forma real de descubrir un estilo propio.",
    ],
    exercises: JAMMING_EXERCISES,
  },
]

export const REST_BLOCK = {
  hourRange: "31–40",
  title: "Descanso",
  text: "No es parte de las 30 horas — es la advertencia que las hace sostenibles. Tus dedos tienen decenas de músculos pequeños que necesitan recuperarse como cualquier otro músculo. Si sientes dolor real (no solo fatiga), para. Vigila señales de tendinitis o túnel carpiano: son lesiones serias si se ignoran. Protege también tus oídos en ensayos y shows ruidosos — los vas a necesitar el resto de tu vida.",
}

// ─── Filosofía y motivación ─────────────────────────────────────────────────

export const WORKOUT_PHILOSOPHY = {
  title: "La idea detrás de las 30 horas",
  paragraphs: [
    "Todos tenemos la capacidad de descubrir una voz única en el instrumento. Encontrarla exige escuchar tu voz interior y tener el valor de expresarla — esta rutina no busca que suenes como nadie más, sino darte las herramientas para sonar como tú mismo.",
    "El método es simple de describir y difícil de sostener: toca algo — una curva, un riff, una escala — muy lento. Si te equivocas, empieza de nuevo. Repite hasta que salga perfecto, muchas veces seguidas. Solo entonces sube el tempo, poco a poco.",
    "Esto no garantiza que te conviertas en un gran compositor — eso no se enseña, se descubre dentro de uno mismo. Pero si el objetivo es dominar el instrumento, no hay atajo real: hay que pensar, respirar y vivir la guitarra en la mayoría de tus horas despierto.",
  ],
}

export const WORKOUT_QUOTES: string[] = [
  "La técnica no es el objetivo — es la herramienta. No la conviertas en una prisión.",
  "Toca lento y perfecto antes que rápido y sucio. Siempre.",
  "Si al improvisar solo subes y bajas una escala porque 'sabes que las notas funcionan', vas a sonar como un robot, no como un músico.",
  "El oído es la conexión más importante entre tu imaginación y tus dedos. Todo lo demás depende de eso.",
  "Nunca aceptes el fracaso en algo que está dentro de tu capacidad de control. Es todo mental.",
  "La disciplina no le quita la pasión a la música — es lo que te permite expresarla sin límites técnicos.",
  "Está bien desanimarse a veces. No está bien rendirse — eso simplemente no está en el carácter de quien de verdad quiere esto.",
]
