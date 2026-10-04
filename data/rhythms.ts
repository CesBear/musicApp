// Banco de ritmos de guitarra: patrones por género, teoría del ritmo y guía
// rápida "me piden X, toco Y". Lo consume app/(dashboard)/rasgueos/page.tsx.

// D/U = rasgueo pleno · d/u = fantasma (suave) · x = chuck/scratch percusivo
// B = bajo (fundamental) · b = bajo alternado (normalmente la 5ª)
// P = pinza: bajo + acorde a la vez, con los dedos (bossa) · - = aire
export type Stroke = "D" | "U" | "d" | "u" | "x" | "B" | "b" | "P" | "-"

export interface StrumPattern {
  id: string
  label: string
  timeSignature: string
  beats: number
  subsPerBeat: 2 | 3 | 4
  strokes: Stroke[]
  level: 1 | 2 | 3
  bpmHint: number
  desc: string
  tip: string
  songs?: string
  voice?: "chug"            // power chord con distorsión y palm mute
  staccato?: boolean        // acordes cortados en seco (funk, reggae, ska)
  fingers?: boolean         // con dedos, no con púa: no aplica la regla del péndulo
  allDown?: boolean         // solo bajadas a propósito (punk, metal)
  countLabels?: string[]    // conteo propio (p. ej. huapango 6/8 + 3/4)
  chords?: string[]         // un acorde por compás (nombres de OPEN_CHORDS)
  approach?: number[]       // golpes que tocan el acorde medio tono abajo (aproximación cromática)
  push?: number[]           // golpes que ya tocan el acorde del compás siguiente (anticipación)
  stepChords?: Record<number, string> // acorde propio en ciertos golpes (riffs de dobles cuerdas, octavas)
  powerRoots?: number[]     // para voice "chug" (midi de la raíz)
}

export interface Category {
  id: string
  label: string
  blurb: string
  patterns: StrumPattern[]
  lessons?: { title: string; body: string }[]   // técnicas del estilo, antes de los patrones
  voicings?: string[]                            // galería de acordes (claves de STYLE_VOICINGS)
}

// ─── Acordes (trastes de Mi grave → mi aguda, -1 = no suena) ─────────────────

export const OPEN_CHORDS: Record<string, number[]> = {
  E:  [0, 2, 2, 1, 0, 0],
  A:  [-1, 0, 2, 2, 2, 0],
  D:  [-1, -1, 0, 2, 3, 2],
  G:  [3, 2, 0, 0, 0, 3],
  C:  [-1, 3, 2, 0, 1, 0],
  F:  [1, 3, 3, 2, 1, 1],
  Am: [-1, 0, 2, 2, 1, 0],
  Dm: [-1, -1, 0, 2, 3, 1],
  Em: [0, 2, 2, 0, 0, 0],
  E7: [0, 2, 0, 1, 0, 0],
  A7: [-1, 0, 2, 0, 2, 0],
  B7: [-1, 2, 1, 2, 0, 2],
  G7: [3, 2, 0, 0, 0, 1],
  Am7: [-1, 0, 2, 0, 1, 0],
  Dm7: [-1, -1, 0, 2, 1, 1],
  Cmaj7: [-1, 3, 2, 0, 0, 0],
  // Voicings de funk / funk-pop: pocas cuerdas, sin la 5ª, colores de 9ª
  // Todas movibles (sin cuerdas al aire) para poder deslizarlas medio tono
  E9:  [0, 2, 0, 1, 0, 2],
  Em9: [-1, 7, 5, 7, 7, -1],
  Am9: [5, -1, 5, 5, 5, 7],
  A9:  [5, -1, 5, 6, 5, 7],
  D9:  [-1, 5, 4, 5, 5, -1],
  Dm9: [-1, 5, 3, 5, 5, -1],
  C9:  [-1, 3, 2, 3, 3, -1],
  G13: [3, -1, 3, 4, 5, -1],
  "Em7·": [-1, 7, 9, 7, 8, -1],
  "A7·": [5, -1, 5, 6, 5, -1],
  Fmaj7: [1, -1, 2, 2, 1, -1],
  Cmaj9: [-1, 3, 2, 4, 3, -1],
  Dmaj9: [-1, 5, 4, 6, 5, -1],
  "E7#9": [-1, 7, 6, 7, 8, -1],
  // Dobles cuerdas (terceras en 2ª y 1ª cuerda) sobre A7
  "3ªA": [-1, -1, -1, -1, 10, 9],
  "3ªG": [-1, -1, -1, -1, 8, 7],
  "3ªD": [-1, -1, -1, -1, 3, 2],
  "3ªE": [-1, -1, -1, -1, 5, 4],
  // Octavas (la cuerda del medio queda muteada con el dedo que pisa la grave)
  "8vaA":  [5, -1, 7, -1, -1, -1],
  "8vaC":  [8, -1, 10, -1, -1, -1],
  "8vaD":  [-1, 5, -1, 7, -1, -1],
  "8vaEb": [-1, 6, -1, 8, -1, -1],
  "8vaE":  [-1, 7, -1, 9, -1, -1],
  "8vaG":  [3, -1, 5, -1, -1, -1],
}

/** Bajo de cada acorde: [fundamental, alternado] como [cuerda, traste]. */
export const BASS: Record<string, [[number, number], [number, number]]> = {
  E:  [[0, 0], [1, 2]],  Em: [[0, 0], [1, 2]],  E7: [[0, 0], [1, 2]],
  A:  [[1, 0], [2, 2]],  Am: [[1, 0], [2, 2]],  A7: [[1, 0], [2, 2]],  Am7: [[1, 0], [2, 2]],
  D:  [[2, 0], [1, 0]],  Dm: [[2, 0], [1, 0]],  Dm7: [[2, 0], [1, 0]],
  G:  [[0, 3], [2, 0]],  G7: [[0, 3], [2, 0]],
  C:  [[1, 3], [0, 3]],  Cmaj7: [[1, 3], [0, 3]],
  F:  [[0, 1], [1, 3]],
  B7: [[1, 2], [0, 2]],
}

export const POWER_NAME: Record<number, string> = {
  40: "E5", 43: "G5", 45: "A5", 47: "B5", 48: "C5", 50: "D5",
}

// ─── Patrones ─────────────────────────────────────────────────────────────────

export const CATEGORIES: Category[] = [
  {
    id: "fundamentos",
    label: "Fundamentos",
    blurb: "La base de todo: el péndulo del brazo, el primer cambio de acorde y el bajo con acorde.",
    patterns: [
      {
        id: "negras", label: "Negras", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 1, bpmHint: 70,
        strokes: ["D", "-", "D", "-", "D", "-", "D", "-"],
        chords: ["E", "A"],
        desc: "Una bajada en cada pulso, cambiando de acorde en cada compás. El punto de partida de todo.",
        tip: "Aunque solo bajes, el brazo también sube en el «+» sin tocar: así ya entrenas el péndulo.",
      },
      {
        id: "corcheas", label: "Corcheas", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 1, bpmHint: 70,
        strokes: ["D", "U", "D", "U", "D", "U", "D", "U"],
        chords: ["E", "A"],
        desc: "Bajada en el pulso, subida en el «+». El brazo se vuelve un péndulo constante.",
        tip: "El brazo nunca se detiene. Aunque un patrón tenga silencios, el movimiento sigue: solo dejas de rozar las cuerdas.",
      },
      {
        id: "balada", label: "Balada", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 1, bpmHint: 75,
        strokes: ["D", "-", "D", "U", "D", "U", "D", "U"],
        chords: ["C", "G", "Am", "F"],
        desc: "El primer patrón «real» sobre la progresión más usada del pop: I–V–vi–IV (C–G–Am–F).",
        tip: "Cuenta en voz alta: «1, 2 y 3 y 4 y». El cambio de acorde cae siempre en el 1.",
      },
      {
        id: "bajo-acorde", label: "Bajo y acorde", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 1, bpmHint: 75,
        strokes: ["B", "-", "D", "-", "b", "-", "D", "-"],
        chords: ["G", "C"],
        desc: "Bajo en 1 y 3, acorde en 2 y 4. Es la base del country, el bolero, la cumbia y la ranchera.",
        tip: "B toca solo la fundamental del acorde y b el bajo alternado (normalmente la 5ª). Apunta con la púa a una sola cuerda.",
      },
      {
        id: "vals", label: "Vals 3/4", timeSignature: "3/4", beats: 3, subsPerBeat: 2, level: 1, bpmHint: 90,
        strokes: ["D", "-", "D", "U", "D", "U"],
        chords: ["C", "G", "G", "C"],
        desc: "Tres pulsos por compás: fuerte–débil–débil.",
        tip: "Acentúa el 1 y suaviza el resto. Las subidas siguen cayendo en el «+», nunca en el número.",
      },
    ],
  },
  {
    id: "pop-rock",
    label: "Pop · Rock",
    blurb: "Los patrones que sostienen la mitad de la radio: del campamento al estadio.",
    patterns: [
      {
        id: "pop", label: "Pop universal", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 80,
        strokes: ["D", "-", "D", "U", "-", "U", "D", "U"],
        chords: ["C", "G", "Am", "F"],
        desc: "EL patrón del pop-rock acústico. El secreto está en el tiempo 3: no se toca.",
        tip: "En el tiempo 3 el brazo baja igual, pero en el aire. Por eso después viene una subida: nunca rompas el péndulo.",
        songs: "Let Her Go · Passenger (aprox.)",
      },
      {
        id: "pop16", label: "Pop 16 moderno", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 2, bpmHint: 75,
        strokes: ["D", "-", "-", "u", "-", "u", "D", "-", "-", "u", "D", "u", "-", "u", "D", "u"],
        chords: ["G", "D", "Em", "C"],
        desc: "La versión en semicorcheas del pop acústico actual: pocas bajadas fuertes y subidas suaves que rellenan.",
        tip: "En semicorcheas: abajo en el número y en el «+», arriba en la «e» y la «a». Mueve más la muñeca que el brazo.",
      },
      {
        id: "seis-octavos", label: "Balada 6/8", timeSignature: "6/8", beats: 2, subsPerBeat: 3, level: 2, bpmHint: 55,
        strokes: ["D", "-", "D", "U", "D", "U"],
        chords: ["G", "Em", "C", "D"],
        desc: "6/8: dos pulsos grandes divididos en tres. El vaivén de las baladas lentas.",
        tip: "Siente «UNO-dos-tres, DOS-dos-tres» y mece el brazo como un columpio. La bajada fuerte va en cada «uno».",
        songs: "Perfect · Ed Sheeran",
      },
      {
        id: "rock", label: "Rock", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 100,
        strokes: ["D", "-", "D", "-", "D", "U", "D", "U"],
        chords: ["E", "A", "D", "A"],
        desc: "Sólido y directo: mitad negras, mitad corcheas, sobre E–A–D.",
        tip: "Ataca las bajadas con decisión: en rock la mano derecha es la batería.",
      },
      {
        id: "shuffle", label: "Shuffle blues", timeSignature: "4/4", beats: 4, subsPerBeat: 3, level: 3, bpmHint: 90,
        strokes: ["D", "-", "U", "D", "-", "U", "D", "-", "U", "D", "-", "U"],
        chords: ["E7", "A7", "E7", "B7"],
        desc: "El swing del blues: cada pulso se divide en tres y solo suenan el primero y el último.",
        tip: "Di «TRAM-pa, TRAM-pa». La subida cae en la última tercera parte del pulso, no en la mitad.",
        songs: "La Grange · ZZ Top",
      },
    ],
  },
  {
    id: "funk-disco",
    label: "Funk · Disco",
    blurb: "Semicorcheas, muteo y acordes de 9ª: la guitarra de James Brown y Nile Rodgers. El funk-pop de Luis Miguel con Kiko Cibrián tiene su propia sección.",
    patterns: [
      {
        id: "funk-16", label: "Funk 16 · chicken scratch", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 95, staccato: true,
        strokes: ["D", "u", "d", "u", "x", "u", "d", "u", "D", "u", "d", "u", "x", "u", "d", "u"],
        chords: ["E9"],
        desc: "Semicorcheas continuas, chuck en 2 y 4 y fantasmas por todas partes, sobre un E9.",
        tip: "La mano derecha nunca para. La izquierda presiona solo en el acorde y afloja el resto: eso es el «scratch».",
        songs: "Sex Machine · James Brown",
      },
      {
        id: "disco", label: "Disco · estilo Nile Rodgers", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 112, staccato: true,
        strokes: ["D", "u", "d", "U", "d", "u", "D", "u", "d", "U", "d", "u", "D", "u", "d", "U"],
        chords: ["Em9", "A9"],
        desc: "Semicorcheas parejas con acentos que dibujan un patrón: 1, «a», «+», «a»… sobre el vamp dórico i–IV (Em9–A9).",
        tip: "Toca solo 3–4 cuerdas agudas, sin rozar los graves. Los acentos salen de apretar el acorde; los fantasmas, de aflojarlo.",
        songs: "Le Freak · Chic — Good Times · Chic",
      },
    ],
  },
  {
    id: "kiko",
    label: "Funk-pop · Kiko",
    blurb: "El estilo de guitarra de Kiko Cibrián en el Luis Miguel funk-pop de finales de los 80 y los 90: guitarra limpia, semicorcheas constantes y acordes de color en pocas cuerdas. Patrones inspirados en ese estilo, no transcripciones.",
    lessons: [
      { title: "El motor de semicorcheas", body: "La mano derecha baja y sube en semicorcheas todo el tiempo, desde la muñeca, sin parar. Los acordes y los silencios salen de la mano izquierda, no de dejar de rasguear." },
      { title: "Scratch y stab", body: "Scratch: la izquierda apoya las cuerdas sin presionar y suena un «chk» sin notas. Stab: aprieta el acorde solo durante esa semicorchea y suéltalo enseguida. El groove es el contraste entre los dos." },
      { title: "Anticipación", body: "Adelantar el acorde del compás siguiente a la última semicorchea (la «a» del 4) hace que la música empuje hacia adelante. Es la firma del funk-pop y de la salsa." },
      { title: "Aproximación cromática", body: "Tocar el acorde medio tono abajo justo antes del acorde real y deslizarlo (B9 → C9). Solo funciona con voicings movibles, sin cuerdas al aire." },
      { title: "Voicings de 3–4 cuerdas", body: "Nada de acordes de 6 cuerdas: el bajo ya toca la fundamental. Se quitan la 5ª (y a veces la fundamental) y quedan 3ª, 7ª y tensiones (9ª, 13ª). La nota de arriba es la que se oye: muévela como una melodía." },
      { title: "Dobles cuerdas y octavas", body: "Entre acorde y acorde aparecen terceras en las dos cuerdas agudas y líneas en octavas (dedo 1 en la grave, dedo 3 o 4 dos cuerdas arriba, la del medio muteada)." },
      { title: "El sonido", body: "Pastilla single coil (posiciones 2 o 4 de una Strat), compresor, chorus suave y amplificador limpio. Elige el preset «Limpio» en el panel Sonido de la barra lateral." },
      { title: "Progresiones típicas", body: "Vamp dórico i–IV (Am9–D9), ii–V–I (Em7–A9–Dmaj9), descenso IV–iii–ii–I (Fmaj7–Em7–Dm7–Cmaj9), dominante estático (G13) y aproximaciones cromáticas por medio tono." },
    ],
    voicings: ["Am9", "D9", "Em9", "A9", "Dm9", "G13", "C9", "Cmaj9", "Dmaj9", "Fmaj7", "Em7·", "E7#9"],
    patterns: [
      {
        id: "kiko-scratch", label: "Funk-pop · estilo Kiko Cibrián", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 112, staccato: true,
        strokes: ["D", "x", "x", "U", "x", "x", "D", "x", "x", "x", "x", "U", "x", "x", "D", "x"],
        chords: ["Am9", "D9"],
        desc: "La base de todo: el sonido del Luis Miguel funk-pop de los 90: scratch muteado constante y stabs cortos de 9ª en el 1, la «a» del 1, el «+» del 2 y la «a» del 3.",
        tip: "Guitarra limpia (single coil, chorus y compresor). El scratch va con la izquierda apoyada sin presionar; el stab, apretando y soltando de inmediato.",
        songs: "Será que no me amas · Luis Miguel — Suave · Luis Miguel",
      },
      {
        id: "kiko-stabs", label: "Funk-pop · stabs anticipados", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 2, bpmHint: 108, staccato: true,
        strokes: ["D", "-", "-", "-", "x", "-", "-", "U", "-", "-", "D", "-", "x", "-", "-", "U"],
        chords: ["Em9", "A9"],
        desc: "Menos notas y más espacio: stab en el 1, chuck en 2 y 4 y anticipación en la «a» del 2 y del 4.",
        tip: "La anticipación de la «a» del 4 adelanta el acorde del compás siguiente: es lo que hace que «empuje».",
      },
      {
        id: "kiko-aproximacion", label: "Aproximación cromática", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 108, staccato: true,
        strokes: ["D", "x", "x", "x", "x", "x", "x", "U", "D", "x", "x", "U", "x", "x", "D", "x"],
        approach: [7],
        chords: ["Am9", "D9"],
        desc: "En la «a» del 2 el acorde suena medio tono abajo y se desliza al real en el 3. La aproximación hace que el acorde «llegue» en vez de aparecer.",
        tip: "Mueve la mano entera un traste sin cambiar la forma. El deslizamiento dura una semicorchea: no te adelantes al 3.",
      },
      {
        id: "kiko-251", label: "ii–V–I con empuje", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 104, staccato: true,
        strokes: ["D", "-", "D", "-", "x", "-", "-", "U", "x", "-", "D", "-", "x", "-", "-", "U"],
        push: [15],
        chords: ["Em7·", "A9", "Dmaj9", "Dmaj9"],
        desc: "ii–V–I en Re (Em7–A9–Dmaj9). La última semicorchea de cada compás ya toca el acorde siguiente: la anticipación lo empuja.",
        tip: "Los tres voicings están entre los trastes 4 y 9: cambia moviendo pocos dedos. El 1 del compás nuevo no se vuelve a tocar, ya sonó.",
      },
      {
        id: "kiko-descenso", label: "Descenso IV–iii–ii–I", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 2, bpmHint: 92, staccato: true,
        strokes: ["D", "u", "d", "u", "D", "u", "d", "U", "d", "u", "D", "u", "d", "U", "d", "u"],
        chords: ["Fmaj7", "Em7·", "Dm7", "Cmaj9"],
        desc: "Fmaj7–Em7–Dm7–Cmaj9: una escalera que baja por la escala, típica de los temas de medio tempo y las baladas pop de los 90.",
        tip: "Los fantasmas casi no suenan; los acentos marcan el 1, el 2 y la «a» del 2 y del 4. La nota aguda de cada acorde baja por grados.",
      },
      {
        id: "kiko-13", label: "Vamp de 13ª en las «e»", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 106, staccato: true,
        strokes: ["x", "U", "x", "x", "x", "U", "D", "x", "x", "U", "x", "x", "x", "x", "D", "u"],
        approach: [5],
        chords: ["G13"],
        desc: "Un solo acorde (G13) y todo el interés en el ritmo: stabs en las «e», que caen justo después del pulso, y una aproximación al «+» del 2.",
        tip: "Las «e» se tocan con la subida. Si el pulso se te escapa, cuenta «1 e + a» en voz alta y toca solo en la «e».",
      },
      {
        id: "kiko-backbeat", label: "Stabs en 2 y 4 con aproximación", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 2, bpmHint: 110, staccato: true,
        strokes: ["x", "x", "x", "U", "D", "x", "x", "x", "x", "x", "x", "U", "D", "x", "x", "x"],
        approach: [3, 11],
        chords: ["C9"],
        desc: "El acorde suena en 2 y 4 junto con la caja, y cada vez entra desde medio tono abajo (B9 → C9).",
        tip: "Piensa en el par «a-2» como un solo gesto: subida en B9, bajada en C9.",
      },
      {
        id: "kiko-terceras", label: "Dobles cuerdas en terceras", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 100, staccato: true,
        strokes: ["D", "x", "x", "U", "x", "x", "D", "x", "D", "x", "x", "U", "x", "x", "D", "x"],
        chords: ["A7·"],
        stepChords: { 0: "3ªA", 3: "3ªG", 6: "3ªA", 8: "3ªD", 11: "3ªE", 14: "3ªA" },
        desc: "Un riff de terceras en las dos cuerdas agudas sobre A7: la guitarra hace de segunda voz entre los acordes.",
        tip: "Toca solo la 2ª y la 1ª cuerda. Las demás quedan muteadas con la izquierda y el scratch sigue entre nota y nota.",
      },
      {
        id: "kiko-octavas", label: "Línea en octavas", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 96, staccato: true,
        strokes: ["D", "x", "x", "U", "x", "x", "D", "x", "D", "x", "D", "U", "x", "x", "D", "x"],
        chords: ["Am"],
        stepChords: { 0: "8vaA", 3: "8vaA", 6: "8vaC", 8: "8vaD", 10: "8vaEb", 11: "8vaE", 14: "8vaG" },
        desc: "La-Do-Re-Mi♭-Mi-Sol en octavas: la pentatónica de La con la nota de blues, como una línea de bajo una octava arriba.",
        tip: "Dedo 1 en la cuerda grave y dedo 3 o 4 dos cuerdas arriba; la cuerda del medio queda muteada con la yema del dedo 1. Rasguea fuerte: solo suenan las dos notas.",
      },
    ],
  },
  {
    id: "latino",
    label: "Latino",
    blurb: "Rumba, cumbia, bolero, bossa y pop urbano: bajos, contratiempos y células como el tresillo.",
    patterns: [
      {
        id: "rumba", label: "Rumba", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 3, bpmHint: 100,
        strokes: ["D", "U", "x", "U", "-", "U", "x", "U"],
        chords: ["Am", "G", "F", "E"],
        desc: "La rumba flamenca (simplificada) sobre la cadencia andaluza: Am–G–F–E.",
        tip: "El «x» es un golpe seco con la palma al bajar. En el 3 el brazo baja al aire: abajo-arriba-GOLPE-arriba-(aire)-arriba-GOLPE-arriba.",
        songs: "Bamboleo · Gipsy Kings",
      },
      {
        id: "cumbia", label: "Cumbia", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 95,
        strokes: ["B", "U", "x", "U", "b", "U", "x", "U"],
        chords: ["Am", "Dm", "E", "Am"],
        desc: "Bajo en 1 y 3, chuck en 2 y 4 y acorde arriba en cada contratiempo: la guitarra hace de bajo y de güira.",
        tip: "Las subidas son cortas y solo en las cuerdas agudas. El bajo alterna fundamental y 5ª como en la cumbia de toda la vida.",
        songs: "La cumbia sampuesana",
      },
      {
        id: "bolero", label: "Bolero", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 68,
        strokes: ["B", "-", "D", "u", "b", "-", "D", "u"],
        chords: ["Am", "Dm", "E7", "Am"],
        desc: "Bajo en 1 y 3, acorde suave en 2 y 4 con una subida que lo adorna. El acompañamiento de trío romántico.",
        tip: "Todo es suave: el bajo canta y el acorde casi se acaricia. Si suena fuerte y parejo, es balada, no bolero.",
        songs: "Bésame mucho",
      },
      {
        id: "bossa", label: "Bossa nova", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 3, bpmHint: 70, fingers: true,
        strokes: ["P", "-", "-", "D", "b", "-", "D", "-"],
        chords: ["Cmaj7", "Am7", "Dm7", "G7"],
        desc: "Con los dedos: el pulgar marca 1 y 3 como un surdo y los dedos tocan el acorde sincopado (P = pulgar y acorde juntos).",
        tip: "El pulgar nunca se adelanta ni se atrasa: es el reloj. Los dedos índice, medio y anular pellizcan las 3 cuerdas agudas.",
        songs: "Garota de Ipanema (simplificada)",
      },
      {
        id: "reggaeton", label: "Reggaetón · tresillo 3-3-2", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 92,
        strokes: ["D", "-", "-", "U", "-", "-", "D", "-"],
        chords: ["Am", "F", "C", "G"],
        desc: "El tresillo (3+3+2) que hay debajo del dembow: golpe en el 1, en el «+» del 2 y en el 4.",
        tip: "Cuenta «1-2-3, 1-2-3, 1-2»: así se siente el tresillo. El brazo sigue el péndulo aunque solo toques 3 veces.",
        songs: "Despacito · Luis Fonsi (base)",
      },
    ],
  },
  {
    id: "regional",
    label: "Regional mexicano",
    blurb: "Vals ranchero, polka norteña y huapango: el bajo manda y el acorde responde.",
    patterns: [
      {
        id: "vals-ranchero", label: "Vals ranchero", timeSignature: "3/4", beats: 3, subsPerBeat: 2, level: 1, bpmHint: 120,
        strokes: ["B", "-", "D", "-", "D", "-"],
        chords: ["G", "C", "D", "G"],
        desc: "Bajo–acorde–acorde: el «chun-ta-ta» del 3/4 de las rancheras y el mariachi.",
        tip: "El bajo del 1 suena largo; los dos acordes, cortos y un poco más suaves.",
        songs: "Cielito lindo",
      },
      {
        id: "polka", label: "Polka norteña · corrido", timeSignature: "2/4", beats: 2, subsPerBeat: 2, level: 2, bpmHint: 110,
        strokes: ["B", "U", "b", "U"],
        chords: ["G", "D", "D", "G"],
        desc: "El «chun-ta» del norteño y los corridos: bajo en cada pulso, alternando fundamental y 5ª, y acorde arriba en el contratiempo.",
        tip: "Como el bajo sexto: el bajo va hacia abajo en una cuerda y el acorde vuelve hacia arriba en las agudas.",
        songs: "Contrabando y traición · Los Tigres del Norte",
      },
      {
        id: "huapango", label: "Huapango · sesquiáltera", timeSignature: "6/8 + 3/4", beats: 6, subsPerBeat: 2, level: 3, bpmHint: 120,
        strokes: ["D", "u", "d", "U", "d", "u", "D", "u", "D", "u", "D", "u"],
        countLabels: ["1", "", "", "2", "", "", "1", "", "2", "", "3", ""],
        chords: ["A", "E"],
        desc: "Dos compases que alternan: 6/8 (dos pulsos de tres) y 3/4 (tres pulsos de dos). Esa alternancia se llama sesquiáltera.",
        tip: "Mismas 6 corcheas, distinto acento: «UNO-dos-tres-DOS-dos-tres» y luego «UNO-dos-DOS-dos-TRES-dos».",
        songs: "La Malagueña",
      },
    ],
  },
  {
    id: "folk-country",
    label: "Folk · Country",
    blurb: "Fogata y trenes: ritmos que caminan solos con el bajo alternado.",
    patterns: [
      {
        id: "folk", label: "Folk", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 85,
        strokes: ["D", "U", "-", "U", "D", "U", "-", "U"],
        chords: ["G", "C", "D", "G"],
        desc: "Fluido y saltarín, con el hueco en los pulsos 2 y 4.",
        tip: "Las subidas suenan mejor si solo rozan las 3–4 cuerdas agudas.",
      },
      {
        id: "country", label: "Country · boom-chicka", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 110,
        strokes: ["B", "-", "D", "U", "b", "-", "D", "U"],
        chords: ["G", "C", "G", "D"],
        desc: "Bajo en 1, acorde en 2, bajo alternado en 3, acorde en 4: el clásico «boom-chicka».",
        tip: "Como el bolero pero más rápido y brillante. En G el bajo alterna Sol (6ª cuerda) y Re (4ª).",
        songs: "Ring of Fire · Johnny Cash",
      },
      {
        id: "tren", label: "Tren", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 3, bpmHint: 120,
        strokes: ["d", "U", "d", "U", "d", "U", "d", "U"],
        chords: ["E", "A", "E", "B7"],
        desc: "El «train beat»: bajadas fantasma y subidas acentuadas, como una locomotora.",
        tip: "Invierte el instinto: aquí lo fuerte va en la subida. Empieza lento hasta que el acento se voltee solo.",
        songs: "Folsom Prison Blues · Johnny Cash",
      },
      {
        id: "vals-country", label: "Vals country", timeSignature: "3/4", beats: 3, subsPerBeat: 2, level: 2, bpmHint: 100,
        strokes: ["B", "-", "D", "U", "D", "U"],
        chords: ["G", "C", "D", "G"],
        desc: "El vals con relleno: bajo en el 1 y rasgueo completo en 2 y 3.",
        tip: "El bajo del 1 va solo en la cuerda de la fundamental; el resto, al acorde completo.",
        songs: "Tennessee Waltz",
      },
    ],
  },
  {
    id: "reggae-ska",
    label: "Reggae · Ska",
    blurb: "La guitarra toca a contratiempo: corto, seco y siempre fuera del pulso fuerte.",
    patterns: [
      {
        id: "reggae", label: "Reggae · one drop", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 75, staccato: true,
        strokes: ["-", "-", "D", "-", "-", "-", "D", "-"],
        chords: ["A", "D", "A", "E"],
        desc: "El «skank» va en los tiempos 2 y 4, corto y seco, mientras la batería cae en el 3 (one drop).",
        tip: "Corta el acorde justo después de tocarlo aflojando la mano izquierda. El reggae es más silencio que sonido.",
        songs: "Three Little Birds · Bob Marley",
      },
      {
        id: "ska", label: "Ska", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 150, staccato: true,
        strokes: ["-", "U", "-", "U", "-", "U", "-", "U"],
        chords: ["C", "Am", "F", "G"],
        desc: "Rápido y saltarín: el acorde va en cada «+», corto, con subidas.",
        tip: "Muñeca, no brazo: a este tempo el movimiento grande no llega. Staccato extremo.",
        songs: "A Message to You Rudy · The Specials",
      },
      {
        id: "rocksteady", label: "Rocksteady", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 3, bpmHint: 80, staccato: true,
        strokes: ["-", "-", "D", "U", "-", "-", "D", "U"],
        chords: ["Am", "Dm"],
        desc: "El paso entre ska y reggae: skank doble (abajo-arriba) en 2 y 4.",
        tip: "Las dos notas del skank son igual de cortas: «chi-ka».",
      },
    ],
  },
  {
    id: "metal-punk",
    label: "Metal · Punk",
    blurb: "Power chords, palm mute y distorsión: la mano derecha como pistón.",
    patterns: [
      {
        id: "punk", label: "Punk", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 160, voice: "chug", allDown: true,
        strokes: ["D", "D", "D", "D", "D", "D", "D", "D"],
        powerRoots: [40, 45, 47, 45],
        desc: "Solo bajadas, sin parar, con palm mute. Resistencia pura del antebrazo.",
        tip: "Relaja el hombro y usa poco recorrido. Si a 2 compases ya duele, baja 20 BPM.",
        songs: "Blitzkrieg Bop · Ramones",
      },
      {
        id: "thrash", label: "Thrash 16", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 85, voice: "chug",
        strokes: ["D", "U", "D", "U", "D", "U", "D", "U", "D", "U", "D", "U", "D", "U", "D", "U"],
        powerRoots: [40],
        desc: "Semicorcheas continuas alternadas sobre un pedal de E5: el idioma del thrash.",
        tip: "Es el mismo motor del galope (Paso 1). La púa apenas entra a las cuerdas: rozar, no excavar.",
      },
      {
        id: "half-time", label: "Half-time", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 90, voice: "chug", allDown: true,
        strokes: ["D", "-", "-", "D", "x", "-", "-", "D"],
        powerRoots: [40, 40, 43, 45],
        desc: "Groove pesado y abierto: el chuck del tiempo 3 hace de caja.",
        tip: "Deja que los huecos respiren. Lo pesado no es tocar más: es tocar menos y más a tiempo.",
      },
      {
        id: "hard-rock", label: "Hard rock", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 110, voice: "chug",
        strokes: ["D", "-", "D", "U", "-", "U", "D", "-"],
        powerRoots: [45, 50, 43, 45],
        desc: "El patrón pop universal… con power chords y actitud. A5–D5–G5.",
        tip: "Palm mute en las bajadas y deja abrir las subidas para que el riff respire.",
      },
    ],
  },
  {
    id: "galope",
    label: "Galope",
    blurb: "El motor del rock y el metal: corchea + dos semicorcheas por pulso.",
    patterns: [
      {
        id: "galope", label: "Galope clásico", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 60, voice: "chug",
        strokes: ["D", "-", "D", "U", "D", "-", "D", "U", "D", "-", "D", "U", "D", "-", "D", "U"],
        powerRoots: [40],
        desc: "«ta—ka-ta» en cada pulso: una bajada larga y luego bajada-subida rápida.",
        tip: "Si aún no lo dominas, empieza por la ruta «Cómo galopar». La limpieza importa más que la velocidad.",
        songs: "The Trooper · Iron Maiden — Run to the Hills · Iron Maiden",
      },
      {
        id: "galope-inverso", label: "Galope inverso", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 60, voice: "chug",
        strokes: ["D", "U", "D", "-", "D", "U", "D", "-", "D", "U", "D", "-", "D", "U", "D", "-"],
        powerRoots: [40],
        desc: "Las dos semicorcheas van primero: «ka-ta—ta». Más agresivo y típico del thrash.",
        tip: "El acento cae en la primera semicorchea de cada grupo. No dejes que el «ta» final se coma el siguiente pulso.",
      },
      {
        id: "medio-galope", label: "Medio galope", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 2, bpmHint: 70, voice: "chug",
        strokes: ["D", "-", "D", "U", "D", "-", "-", "-", "D", "-", "D", "U", "D", "-", "-", "-"],
        powerRoots: [40],
        desc: "Galope en los pulsos 1 y 3, descanso en 2 y 4. El puente hacia el galope completo.",
        tip: "Usa el pulso de descanso para relajar el antebrazo. Tensión acumulada = velocidad perdida.",
      },
      {
        id: "galope-tresillo", label: "Galope en tresillo", timeSignature: "4/4", beats: 4, subsPerBeat: 3, level: 3, bpmHint: 65, voice: "chug",
        strokes: ["D", "D", "U", "D", "D", "U", "D", "D", "U", "D", "D", "U"],
        powerRoots: [40],
        desc: "Tres golpes iguales por pulso: el galope «shuffle» que balancea en vez de correr.",
        tip: "Cuenta «1-y-a, 2-y-a». Los tres golpes duran exactamente lo mismo.",
      },
      {
        id: "galope-remate", label: "Galope con remate", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 65, voice: "chug",
        strokes: ["D", "-", "D", "U", "D", "-", "D", "U", "D", "-", "D", "U", "D", "-", "-", "-"],
        powerRoots: [40, 43],
        desc: "Tres pulsos de galope y un remate abierto que resuena, alternando E5 y G5 por compás.",
        tip: "En el remate levanta la palma del puente: el contraste entre lo seco y lo abierto es lo que hace un riff.",
      },
      {
        id: "galope-mixto", label: "Galope mixto", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 60, voice: "chug",
        strokes: ["D", "-", "D", "U", "D", "U", "D", "-", "D", "-", "D", "U", "D", "U", "D", "-"],
        powerRoots: [40],
        desc: "Clásico e inverso alternados en cada pulso. El desafío final.",
        tip: "Si puedes cambiar entre los dos sin que el motor se corte, ya galopas.",
      },
    ],
  },
  {
    id: "como-galopar",
    label: "Cómo galopar",
    blurb: "Ruta de 5 pasos para construir el galope desde cero. Hazlos en orden.",
    patterns: [
      {
        id: "paso-1", label: "Paso 1 · El motor", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 1, bpmHint: 50, voice: "chug",
        strokes: ["D", "U", "D", "U", "D", "U", "D", "U", "D", "U", "D", "U", "D", "U", "D", "U"],
        powerRoots: [40],
        desc: "Semicorcheas continuas: cuatro golpes por pulso alternando bajada-subida.",
        tip: "Movimiento pequeño y muñeca suelta. Si el antebrazo se tensa, baja el tempo.",
      },
      {
        id: "paso-2", label: "Paso 2 · Quita la «e»", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 2, bpmHint: 50, voice: "chug",
        strokes: ["D", "-", "D", "U", "D", "-", "D", "U", "D", "-", "D", "U", "D", "-", "D", "U"],
        powerRoots: [40],
        desc: "El mismo motor, sin tocar la segunda semicorchea. Cuenta: «1—y-a, 2—y-a».",
        tip: "El brazo sigue haciendo las 4 semicorcheas; en la «e» pasa por el aire.",
      },
      {
        id: "paso-3", label: "Paso 3 · Con descanso", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 2, bpmHint: 60, voice: "chug",
        strokes: ["D", "-", "D", "U", "D", "-", "-", "-", "D", "-", "D", "U", "D", "-", "-", "-"],
        powerRoots: [40],
        desc: "Un pulso de galope, un pulso de descanso.",
        tip: "En cada hueco revisa: ¿hombro relajado? ¿púa sin apretar?",
      },
      {
        id: "paso-4", label: "Paso 4 · Resistencia", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 60, voice: "chug",
        strokes: ["D", "-", "D", "U", "D", "-", "D", "U", "D", "-", "D", "U", "D", "-", "D", "U"],
        powerRoots: [40],
        desc: "Galope continuo. Activa «+BPM auto» y aguanta limpio mientras el tempo sube.",
        tip: "Si pierdes limpieza, para y baja 10 BPM. La velocidad se construye, no se fuerza.",
      },
      {
        id: "paso-5", label: "Paso 5 · Mezcla final", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 70, voice: "chug",
        strokes: ["D", "-", "D", "U", "D", "U", "D", "-", "D", "-", "D", "U", "D", "U", "D", "-"],
        powerRoots: [40],
        desc: "Galope clásico e inverso alternados por pulso, sin cortar el motor.",
        tip: "Cuando esto salga limpio a 90 BPM, ve directo a «The Trooper».",
      },
    ],
  },
  {
    id: "tecnica",
    label: "Técnica",
    blurb: "Dinámica, acentos y percusión: lo que separa un ritmo plano de uno con groove.",
    patterns: [
      {
        id: "fantasma", label: "Golpes fantasma", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 70,
        strokes: ["D", "u", "d", "u", "D", "u", "d", "u"],
        chords: ["E", "A"],
        desc: "Acentúa los pulsos 1 y 3; el resto apenas roza las cuerdas.",
        tip: "El groove está en la dinámica: fuerte-suave-suave-suave.",
      },
      {
        id: "backbeat", label: "Acento en 2 y 4", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 75,
        strokes: ["d", "u", "D", "u", "d", "u", "D", "u"],
        chords: ["E", "A"],
        desc: "El acento en 2 y 4 (backbeat): donde golpea la caja de la batería.",
        tip: "Piensa como baterista: tu bajada fuerte es el golpe de caja.",
      },
      {
        id: "chuck", label: "Chuck percusivo", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 3, bpmHint: 72,
        strokes: ["D", "-", "x", "U", "-", "U", "x", "U"],
        chords: ["C", "Am", "F", "G"],
        desc: "El golpe seco (chuck) sustituye al acorde en 2 y 4: guitarra y percusión a la vez.",
        tip: "Apoya el canto de la palma sobre las cuerdas justo al bajar: debe sonar a percusión, no a nota.",
      },
    ],
  },
]

// Galería de voicings: digitación (0 = sin dedo, 1 índice … 4 meñique) y para qué se usa
export const STYLE_VOICINGS: Record<string, { fingers: number[]; role: string }> = {
  Am9:    { fingers: [2, 0, 1, 1, 1, 4], role: "Tónica menor con 9ª: el acorde «casa» del vamp dórico" },
  D9:     { fingers: [0, 2, 1, 3, 3, 0], role: "IV dominante del vamp dórico (Am9–D9)" },
  Em9:    { fingers: [0, 2, 1, 3, 4, 0], role: "Menor suave; i del vamp Em9–A9 o ii en Re" },
  A9:     { fingers: [2, 0, 1, 3, 1, 4], role: "Dominante con 9ª; V en Re o IV en Mi dórico" },
  Dm9:    { fingers: [0, 2, 1, 3, 4, 0], role: "ii en Do; alterna con G13" },
  G13:    { fingers: [1, 0, 2, 3, 4, 0], role: "Dominante con 13ª: el color más funky para vamps de un acorde" },
  C9:     { fingers: [0, 2, 1, 3, 3, 0], role: "Dominante para stabs en 2 y 4; se aproxima desde B9" },
  Cmaj9:  { fingers: [0, 2, 1, 4, 3, 0], role: "Mayor con 7ª y 9ª: final dulce, color de balada" },
  Dmaj9:  { fingers: [0, 2, 1, 4, 3, 0], role: "I del ii–V–I en Re" },
  Fmaj7:  { fingers: [1, 0, 3, 4, 2, 0], role: "IV con 7ª mayor: abre el descenso IV–iii–ii–I" },
  "Em7·": { fingers: [0, 1, 3, 1, 2, 0], role: "Menor 7 en el traste 7: ii en Re, iii en Do" },
  "E7#9": { fingers: [0, 2, 1, 3, 4, 0], role: "Dominante con 9ª aumentada: tensión máxima, más rock-funk" },
}

export const ALL_PATTERNS: StrumPattern[] = CATEGORIES.flatMap(c => c.patterns)
export const categoryOf = (patternId: string) => CATEGORIES.find(c => c.patterns.some(p => p.id === patternId))

// ─── Teoría del ritmo ─────────────────────────────────────────────────────────

export interface TheoryLesson {
  id: string
  title: string
  body: string[]
  count?: string            // cómo se cuenta, en mono
  demos: string[]           // ids de patrones para escucharlo
}

export const THEORY: TheoryLesson[] = [
  {
    id: "subdivision", title: "El pulso y cómo contarlo",
    body: [
      "El pulso es lo que marcas con el pie. Cada pulso se divide en partes iguales: la subdivisión. Saber en qué subdivisión está un género es lo primero para tocarlo.",
      "Corcheas (2 por pulso) en pop, rock, country y latino. Tresillos (3) en blues, shuffle y 6/8. Semicorcheas (4) en funk, disco, pop moderno y metal.",
    ],
    count: "negras 1 2 3 4 · corcheas 1 + 2 + · tresillos 1 y a · semicorcheas 1 e + a",
    demos: ["negras", "corcheas", "shuffle", "paso-1"],
  },
  {
    id: "pendulo", title: "La regla del péndulo",
    body: [
      "La mano derecha sube y baja sin parar, al ritmo de la subdivisión. Si no quieres que suene, pasas por el aire, pero el movimiento sigue.",
      "En corcheas: abajo en los números, arriba en los «+». En semicorcheas: abajo en el número y en el «+», arriba en la «e» y la «a». Por eso nunca hay dos subidas seguidas.",
    ],
    count: "↓ ↑ ↓ ↑  =  1 + 2 +   ·   ↓ ↑ ↓ ↑  =  1 e + a",
    demos: ["pop", "pop16"],
  },
  {
    id: "acentos", title: "Acentos: dónde está el groove",
    body: [
      "Dos patrones con los mismos golpes suenan a géneros distintos según dónde va el acento.",
      "En 2 y 4 (backbeat): rock, pop, funk. En 1 y 3: bolero, country, marcha. En el contratiempo: reggae y ska.",
    ],
    demos: ["backbeat", "fantasma", "reggae"],
  },
  {
    id: "swing", title: "Recto o con swing",
    body: [
      "En recto, el «+» cae justo a la mitad del pulso. Con swing (shuffle), el pulso se divide en tres y la segunda nota cae en la última tercera parte: «TRAM-pa».",
      "Blues, jazz y mucho rock'n'roll van con swing. Pop, funk y latino, casi siempre rectos.",
    ],
    demos: ["corcheas", "shuffle"],
  },
  {
    id: "sincopa", title: "Síncopa y anticipación",
    body: [
      "Síncopa es tocar en una parte débil y no tocar en la fuerte siguiente: el oído siente un empujón. El hueco del tiempo 3 del «pop universal» es una síncopa.",
      "Anticipar es adelantar el acorde del siguiente compás a la última semicorchea (la «a» del 4). Es clave en funk, funk-pop y salsa.",
    ],
    demos: ["pop", "kiko-stabs"],
  },
  {
    id: "celulas-latinas", title: "Células latinas: bajo alternado y tresillo",
    body: [
      "Bajo alternado (boom-chick): bajo en 1 y 3, acorde en 2 y 4. El bajo alterna la fundamental y la 5ª. Lo comparten country, bolero, cumbia, polka norteña y ranchera; cambia el tempo y la intención.",
      "Tresillo 3-3-2: tres golpes repartidos en 8 corcheas (1, «+» del 2 y 4). Está debajo del reggaetón, de mucha cumbia moderna y del pop latino.",
    ],
    count: "boom-chick: B · D · b · D   ·   tresillo: 1 . . 2 . . 3 .",
    demos: ["bajo-acorde", "cumbia", "reggaeton"],
  },
  {
    id: "ternarios", title: "3/4, 6/8 y sesquiáltera",
    body: [
      "3/4 tiene tres pulsos divididos en dos (vals). 6/8 tiene dos pulsos divididos en tres (balada lenta, son jarocho). Tienen las mismas 6 corcheas, pero se acentúan distinto.",
      "La sesquiáltera alterna los dos dentro de la misma canción: es el corazón del huapango.",
    ],
    count: "3/4: UNO-y DOS-y TRES-y   ·   6/8: UNO-dos-tres DOS-dos-tres",
    demos: ["vals", "seis-octavos", "huapango"],
  },
  {
    id: "muteo", title: "Muteo: palm mute, chuck y scratch",
    body: [
      "Palm mute: la palma derecha descansa sobre las cuerdas junto al puente y da el sonido seco y grave del metal y el punk.",
      "Chuck: la palma golpea las cuerdas al bajar y suena como una caja (pop acústico, rumba, cumbia). Scratch: la mano izquierda apoya sin presionar y deja un «chk» sin notas (funk, disco, funk-pop).",
    ],
    demos: ["punk", "chuck", "funk-16"],
  },
]

// ─── Guía rápida por género ───────────────────────────────────────────────────

export interface GenreGuide {
  genre: string
  meter: string
  bpm: string
  feel: string              // subdivisión y sensación
  accent: string
  technique: string
  chords: string
  patterns: string[]
}

export const GENRE_GUIDE: GenreGuide[] = [
  { genre: "Pop / balada pop", meter: "4/4", bpm: "70–110", feel: "Corcheas rectas (semicorcheas en pop moderno)", accent: "2 y 4", technique: "Rasgueo pleno con huecos; chuck en 2 y 4 en versión acústica", chords: "I–V–vi–IV, vi–IV–I–V", patterns: ["pop", "balada", "pop16", "chuck"] },
  { genre: "Rock", meter: "4/4", bpm: "100–140", feel: "Corcheas rectas", accent: "2 y 4", technique: "Power chords; palm mute en la estrofa y abierto en el coro", chords: "I–IV–V, I–bVII–IV", patterns: ["rock", "hard-rock"] },
  { genre: "Blues", meter: "4/4 con swing", bpm: "60–120", feel: "Tresillos (shuffle)", accent: "2 y 4", technique: "Shuffle; acordes de 7ª dominante", chords: "I7–IV7–V7 en 12 compases", patterns: ["shuffle"] },
  { genre: "Funk", meter: "4/4", bpm: "90–115", feel: "Semicorcheas rectas", accent: "El 1 y el backbeat", technique: "La mano derecha nunca para; la izquierda mutea (scratch); acordes de 9ª en cuerdas agudas", chords: "Vamp de un acorde (E9), i–IV dórico", patterns: ["funk-16", "disco"] },
  { genre: "Funk-pop latino (Luis Miguel / Kiko Cibrián)", meter: "4/4", bpm: "105–120", feel: "Semicorcheas rectas", accent: "Backbeat + stabs anticipados", technique: "Guitarra limpia con chorus y compresor; scratch constante y stabs cortos de m9, 9 y maj7", chords: "Am9–D9, Em7–A9–Dmaj9, Fmaj7–Em7–Dm7–Cmaj9, G13, B9→C9", patterns: ["kiko-scratch", "kiko-stabs", "kiko-aproximacion", "kiko-251", "kiko-descenso", "kiko-13", "kiko-backbeat", "kiko-terceras", "kiko-octavas"] },
  { genre: "Disco", meter: "4/4", bpm: "110–125", feel: "Semicorcheas, bombo en cada pulso", accent: "Contratiempos de la guitarra", technique: "16avos parejos en 3–4 cuerdas agudas con acentos", chords: "Vamps de m7/m9 y 9", patterns: ["disco"] },
  { genre: "Reggae", meter: "4/4", bpm: "60–90", feel: "Corcheas, sensación lenta", accent: "Skank en 2 y 4", technique: "Staccato: tocar y cortar al instante", chords: "I–IV–V, i–iv", patterns: ["reggae", "rocksteady"] },
  { genre: "Ska", meter: "4/4", bpm: "140–180", feel: "Corcheas rápidas", accent: "Cada contratiempo", technique: "Subidas cortas con la muñeca", chords: "I–vi–IV–V", patterns: ["ska"] },
  { genre: "Country", meter: "4/4", bpm: "90–140", feel: "Corcheas rectas", accent: "Bajo en 1 y 3", technique: "Bajo alternado (boom-chicka); train beat en lo rápido", chords: "I–IV–V", patterns: ["country", "tren", "vals-country"] },
  { genre: "Folk", meter: "4/4", bpm: "80–110", feel: "Corcheas rectas", accent: "1 y 3", technique: "Subidas solo en cuerdas agudas", chords: "I–IV–V, I–V–vi–IV", patterns: ["folk"] },
  { genre: "Rumba flamenca", meter: "4/4", bpm: "95–115", feel: "Corcheas", accent: "Golpe en 2 y 4", technique: "Golpe de palma (chuck) y rasgueo continuo", chords: "Cadencia andaluza Am–G–F–E", patterns: ["rumba"] },
  { genre: "Cumbia", meter: "4/4 (o 2/2)", bpm: "85–100", feel: "Corcheas", accent: "Bajo en 1 y 3, acorde a contratiempo", technique: "Bajo alternado + subidas cortas", chords: "i–iv–V, I–IV–V", patterns: ["cumbia", "reggaeton"] },
  { genre: "Bolero", meter: "4/4", bpm: "60–80", feel: "Corcheas suaves", accent: "Bajo en 1 y 3", technique: "Bajo cantado y acorde acariciado; acordes de 7ª", chords: "i–iv–V7, I–vi–ii–V", patterns: ["bolero"] },
  { genre: "Bossa nova", meter: "4/4 (o 2/4)", bpm: "60–80", feel: "Corcheas suaves", accent: "Pulgar en 1 y 3", technique: "Con dedos: pulgar en el bajo y acordes sincopados", chords: "ii–V–I con maj7, m7 y 7", patterns: ["bossa"] },
  { genre: "Reggaetón / pop urbano", meter: "4/4", bpm: "85–100", feel: "Corcheas", accent: "Tresillo 3-3-2", technique: "Pocos golpes, precisos; a veces palm mute", chords: "i–VI–III–VII (Am–F–C–G)", patterns: ["reggaeton"] },
  { genre: "Vals / ranchera", meter: "3/4", bpm: "100–180", feel: "Corcheas", accent: "El 1 (bajo)", technique: "Bajo–acorde–acorde", chords: "I–IV–V", patterns: ["vals-ranchero", "vals"] },
  { genre: "Norteño / corrido", meter: "2/4", bpm: "100–130", feel: "Corcheas", accent: "Cada pulso (bajo)", technique: "Polka: bajo alternado abajo, acorde arriba", chords: "I–V, I–IV–V", patterns: ["polka"] },
  { genre: "Huapango", meter: "6/8 + 3/4", bpm: "110–140", feel: "Corcheas", accent: "Sesquiáltera", technique: "Rasgueo continuo cambiando el acento cada compás", chords: "I–V, I–IV–V", patterns: ["huapango"] },
  { genre: "Metal / punk", meter: "4/4", bpm: "90–220", feel: "Corcheas o semicorcheas", accent: "Cada golpe", technique: "Power chords con palm mute; solo bajadas o galope", chords: "Pedal en E5, i–bVI–bVII", patterns: ["punk", "galope", "thrash", "half-time"] },
]
