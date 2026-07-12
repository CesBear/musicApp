"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { playGuitarString, playMutedStrum, playChugChord, playMetronomeClick, getAudioTime, getVisualLatencyMs } from "@/lib/audio"
import Metronome from "@/components/Metronome"

// ─── Types ────────────────────────────────────────────────────────────────────

// D/U = rasgueo pleno · d/u = golpe fantasma (suave) · x = chuck percusivo · - = aire
type Stroke = "D" | "U" | "d" | "u" | "x" | "-"

interface StrumPattern {
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
  // "chug" = power chord con distorsión y palm mute; default = acordes abiertos limpios
  voice?: "chug"
  // Progresión que cicla un acorde por compás (nombres de OPEN_CHORDS)
  chords?: string[]
  // Progresión de power chords para voz chug (midi de la raíz)
  powerRoots?: number[]
}

interface Category {
  id: string
  label: string
  blurb: string
  patterns: StrumPattern[]
}

// ─── Chord shapes ─────────────────────────────────────────────────────────────

const OPEN_CHORDS: Record<string, number[]> = {
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
  B7: [-1, 2, 1, 2, 0, 2],
  E9: [0, 2, 0, 1, 0, 2],
}

const POWER_NAME: Record<number, string> = {
  40: "E5", 43: "G5", 45: "A5", 47: "B5", 48: "C5", 50: "D5",
}

// ─── Pattern bank ─────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  {
    id: "fundamentos",
    label: "Fundamentos",
    blurb: "La base de todo: bajadas, subidas, el péndulo del brazo y tu primer cambio de acorde.",
    patterns: [
      {
        id: "negras", label: "Negras", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 1, bpmHint: 70,
        strokes: ["D", "-", "D", "-", "D", "-", "D", "-"],
        chords: ["E", "A"],
        desc: "Una bajada en cada pulso, cambiando de acorde en cada compás. El punto de partida de todo.",
        tip: "El movimiento nace del antebrazo. Prepara el siguiente acorde durante el último pulso del compás.",
      },
      {
        id: "corcheas", label: "Corcheas", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 1, bpmHint: 70,
        strokes: ["D", "U", "D", "U", "D", "U", "D", "U"],
        chords: ["E", "A"],
        desc: "Bajada en el pulso, subida en el «+». El brazo se convierte en un péndulo constante.",
        tip: "El brazo nunca se detiene. Aunque un patrón tenga silencios, el movimiento sigue: solo dejas de rozar las cuerdas.",
      },
      {
        id: "balada", label: "Balada", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 1, bpmHint: 75,
        strokes: ["D", "-", "D", "U", "D", "U", "D", "U"],
        chords: ["C", "G", "Am", "F"],
        desc: "El primer patrón «real» sobre la progresión más usada del pop: C–G–Am–F.",
        tip: "Cuenta en voz alta: «1, 2 y 3 y 4 y». El cambio de acorde cae siempre en el 1.",
        songs: "Photograph · Ed Sheeran",
      },
      {
        id: "vals", label: "Vals 3/4", timeSignature: "3/4", beats: 3, subsPerBeat: 2, level: 1, bpmHint: 90,
        strokes: ["D", "-", "U", "D", "U", "-"],
        chords: ["C", "G", "G", "C"],
        desc: "Tres pulsos por compás: fuerte–débil–débil.",
        tip: "Acentúa el 1 y suaviza el resto: el vals se reconoce por su primer tiempo.",
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
        tip: "En el tiempo 3 el brazo baja igual, pero en el aire. Nunca rompas el péndulo.",
        songs: "Wonderwall · Oasis — Let Her Go · Passenger",
      },
      {
        id: "seis-octavos", label: "Balada 6/8", timeSignature: "6/8", beats: 2, subsPerBeat: 3, level: 2, bpmHint: 55,
        strokes: ["D", "-", "U", "D", "-", "U"],
        chords: ["G", "Em", "C", "D"],
        desc: "Compás de 6/8: dos pulsos grandes divididos en tres. El vaivén de las baladas lentas.",
        tip: "Siente «UNO-dos-tres, DOS-dos-tres» y mece el brazo como un columpio.",
        songs: "Perfect · Ed Sheeran",
      },
      {
        id: "rock", label: "Rock", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 95,
        strokes: ["D", "-", "D", "-", "D", "U", "D", "U"],
        chords: ["E", "A", "D", "A"],
        desc: "Sólido y directo: mitad negras, mitad corcheas, sobre E–A–D.",
        tip: "Ataca las bajadas con decisión: en rock la mano derecha es la batería.",
      },
      {
        id: "shuffle", label: "Shuffle blues", timeSignature: "4/4", beats: 4, subsPerBeat: 3, level: 3, bpmHint: 90,
        strokes: ["D", "-", "U", "D", "-", "U", "D", "-", "U", "D", "-", "U"],
        chords: ["E7", "A", "E7", "B7"],
        desc: "El «swing» del blues: cada pulso se divide en tres y solo suenan el primero y el último.",
        tip: "No lo cuentes derecho: di «TRAM-pa, TRAM-pa». Si suena a caballo cojo, vas bien.",
        songs: "La Grange · ZZ Top",
      },
    ],
  },
  {
    id: "folk-country",
    label: "Folk · Country",
    blurb: "Fogata, banjo imaginario y trenes: ritmos que caminan solos.",
    patterns: [
      {
        id: "folk", label: "Folk", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 85,
        strokes: ["D", "U", "-", "U", "D", "U", "-", "U"],
        chords: ["G", "C", "D", "G"],
        desc: "Fluido y saltarín, con el hueco en los pulsos 2 y 4.",
        tip: "Las subidas suenan mejor si solo rozan las 3–4 cuerdas agudas.",
        songs: "Ho Hey · The Lumineers",
      },
      {
        id: "country", label: "Country", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 95,
        strokes: ["D", "-", "D", "U", "D", "-", "D", "U"],
        chords: ["G", "C", "G", "D"],
        desc: "El clásico «boom-chicka»: bajada firme a los graves y respuesta en las agudas.",
        tip: "En los pulsos 1 y 3 apunta a las cuerdas graves; en el resto, a las agudas.",
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
        strokes: ["D", "-", "D", "U", "D", "U"],
        chords: ["G", "C", "D", "G"],
        desc: "El vals con relleno: bajo en el 1 y rasgueo completo en 2 y 3.",
        tip: "La primera bajada va solo a las dos cuerdas más graves; las demás, al acorde completo.",
        songs: "Tennessee Waltz",
      },
    ],
  },
  {
    id: "latino",
    label: "Latino",
    blurb: "Rumba, cumbia, bolero y vals mexicano: el chuck percusivo es protagonista.",
    patterns: [
      {
        id: "rumba", label: "Rumba", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 3, bpmHint: 100,
        strokes: ["D", "-", "x", "U", "U", "-", "x", "U"],
        chords: ["Am", "G", "F", "E"],
        desc: "La rumba flamenca (simplificada) sobre la cadencia andaluza: Am–G–F–E.",
        tip: "El «x» es un golpe seco con la palma sobre las cuerdas. Bajada–GOLPE–arriba–arriba–GOLPE–arriba.",
        songs: "Bamboleo · Gipsy Kings",
      },
      {
        id: "cumbia", label: "Cumbia", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 95,
        strokes: ["x", "U", "x", "U", "x", "U", "x", "U"],
        chords: ["Am", "Dm", "E", "Am"],
        desc: "Pulsos muteados, contratiempos abiertos: la guitarra se vuelve güira.",
        tip: "El chuck cae en el pulso y el acorde respira en el «+». Corta las subidas: staccato.",
      },
      {
        id: "bolero", label: "Bolero", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 70,
        strokes: ["D", "-", "d", "u", "D", "u", "d", "u"],
        chords: ["Am", "Dm", "E", "Am"],
        desc: "Suave y romántico: acentos en 1 y 3, todo lo demás apenas roza.",
        tip: "El bolero vive en la dinámica: si todo suena igual de fuerte, es una balada, no un bolero.",
        songs: "Bésame Mucho",
      },
      {
        id: "ranchera", label: "Vals ranchero", timeSignature: "3/4", beats: 3, subsPerBeat: 2, level: 1, bpmHint: 110,
        strokes: ["D", "-", "U", "-", "U", "-"],
        chords: ["G", "C", "D", "G"],
        desc: "Bajo–arriba–arriba: el 3/4 de las rancheras y el mariachi.",
        tip: "La bajada del 1 busca las cuerdas graves (el «bajo»); las dos subidas, las agudas.",
        songs: "Cielito Lindo",
      },
    ],
  },
  {
    id: "reggae-ska",
    label: "Reggae · Ska",
    blurb: "Todo pasa en el contratiempo: el pulso queda vacío y el acorde respira.",
    patterns: [
      {
        id: "reggae", label: "Reggae", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 75,
        strokes: ["-", "U", "-", "U", "-", "U", "-", "U"],
        chords: ["A", "D", "A", "E"],
        desc: "Solo contratiempos («skank»): el pulso queda vacío y todo cae en el «+».",
        tip: "Corta el acorde justo después de tocarlo. Reggae es más silencio que sonido.",
        songs: "Three Little Birds · Bob Marley",
      },
      {
        id: "ska", label: "Ska", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 150,
        strokes: ["-", "U", "-", "U", "-", "U", "-", "U"],
        chords: ["C", "Am", "F", "G"],
        desc: "El mismo skank del reggae pero al doble de velocidad y aún más corto.",
        tip: "Muñeca, no brazo: a este tempo el movimiento grande no llega. Staccato extremo.",
        songs: "A Message to You Rudy · The Specials",
      },
      {
        id: "rocksteady", label: "Rocksteady", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 3, bpmHint: 80,
        strokes: ["-", "U", "-", "U", "x", "U", "-", "U"],
        chords: ["Am", "Dm"],
        desc: "Skank con un chuck en el tiempo 3, marcando el «one drop» de la batería.",
        tip: "El golpe del 3 es el ancla de todo el groove: dale intención.",
      },
    ],
  },
  {
    id: "metal-punk",
    label: "Metal · Punk",
    blurb: "Power chords, palm mute y distorsión: la mano derecha como pistón.",
    patterns: [
      {
        id: "punk", label: "Punk", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 160, voice: "chug",
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
        songs: "Master of Puppets · Metallica",
      },
      {
        id: "half-time", label: "Half-time", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 90, voice: "chug",
        strokes: ["D", "-", "-", "D", "x", "-", "-", "D"],
        powerRoots: [40, 40, 43, 45],
        desc: "Groove pesado y abierto: el chuck del tiempo 3 hace de caja.",
        tip: "Deja que los huecos respiren. Lo pesado no es tocar más: es tocar menos, más a tiempo.",
      },
      {
        id: "hard-rock", label: "Hard rock", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 110, voice: "chug",
        strokes: ["D", "-", "D", "U", "-", "U", "D", "-"],
        powerRoots: [45, 50, 43, 45],
        desc: "El patrón pop universal… con power chords y actitud. A5–D5–G5.",
        tip: "Alterna palm mute en las bajadas y deja abrir las subidas para que el riff respire.",
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
        desc: "El galope clásico: «ta—ka-ta» en cada pulso. Una bajada larga seguida de bajada-subida rápida.",
        tip: "Si aún no lo dominas, empieza por la ruta «Cómo galopar». La limpieza importa más que la velocidad.",
        songs: "The Trooper · Iron Maiden — Run to the Hills · Iron Maiden",
      },
      {
        id: "galope-inverso", label: "Galope inverso", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 60, voice: "chug",
        strokes: ["D", "U", "D", "-", "D", "U", "D", "-", "D", "U", "D", "-", "D", "U", "D", "-"],
        powerRoots: [40],
        desc: "Las dos semicorcheas van primero: «ka-ta—ta». Más agresivo y típico del thrash.",
        tip: "El acento cae en la primera semicorchea de cada grupo. No dejes que el «ta» final se coma el siguiente pulso.",
        songs: "Battery · Metallica",
      },
      {
        id: "medio-galope", label: "Medio galope", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 2, bpmHint: 70, voice: "chug",
        strokes: ["D", "-", "D", "U", "D", "-", "-", "-", "D", "-", "D", "U", "D", "-", "-", "-"],
        powerRoots: [40],
        desc: "Galope en los pulsos 1 y 3, descanso en 2 y 4. El puente perfecto hacia el galope completo.",
        tip: "Usa el pulso de descanso para relajar el antebrazo. Tensión acumulada = velocidad perdida.",
      },
      {
        id: "galope-tresillo", label: "Galope en tresillo", timeSignature: "4/4", beats: 4, subsPerBeat: 3, level: 3, bpmHint: 65, voice: "chug",
        strokes: ["D", "D", "U", "D", "D", "U", "D", "D", "U", "D", "D", "U"],
        powerRoots: [40],
        desc: "Tres golpes iguales por pulso: el galope «shuffle» que balancea en vez de correr.",
        tip: "Cuenta «1-y-a, 2-y-a». Los tres golpes duran exactamente lo mismo: no lo conviertas en galope normal.",
      },
      {
        id: "galope-remate", label: "Galope con remate", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 65, voice: "chug",
        strokes: ["D", "-", "D", "U", "D", "-", "D", "U", "D", "-", "D", "U", "D", "-", "-", "-"],
        powerRoots: [40, 43],
        desc: "Tres pulsos de galope y un remate abierto que resuena, alternando E5 y G5 por compás.",
        tip: "En el remate levanta la palma del puente: contraste entre lo seco y lo abierto — así se escriben los riffs.",
      },
      {
        id: "galope-mixto", label: "Galope mixto", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 60, voice: "chug",
        strokes: ["D", "-", "D", "U", "D", "U", "D", "-", "D", "-", "D", "U", "D", "U", "D", "-"],
        powerRoots: [40],
        desc: "Clásico e inverso alternados en cada pulso. El desafío final de la sección.",
        tip: "Si puedes cambiar entre los dos sin que el motor se corte, oficialmente ya galopas.",
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
        desc: "Semicorcheas continuas: cuatro golpes por pulso alternando bajada-subida. Es el movimiento base del galope.",
        tip: "Movimiento pequeño y muñeca suelta. Si el antebrazo se tensa, baja el tempo: la tensión es el enemigo nº 1.",
      },
      {
        id: "paso-2", label: "Paso 2 · Quita el «e»", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 2, bpmHint: 50, voice: "chug",
        strokes: ["D", "-", "D", "U", "D", "-", "D", "U", "D", "-", "D", "U", "D", "-", "D", "U"],
        powerRoots: [40],
        desc: "El mismo motor, pero sin tocar la segunda semicorchea. Cuenta: «1—y-a, 2—y-a».",
        tip: "El brazo sigue haciendo las 4 semicorcheas completas; en el «e» simplemente pasa por el aire.",
      },
      {
        id: "paso-3", label: "Paso 3 · Con descanso", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 2, bpmHint: 60, voice: "chug",
        strokes: ["D", "-", "D", "U", "D", "-", "-", "-", "D", "-", "D", "U", "D", "-", "-", "-"],
        powerRoots: [40],
        desc: "Un pulso de galope, un pulso de descanso. Recupera el control entre cada «ta—ka-ta».",
        tip: "Aprovecha el descanso para comprobar: ¿hombro relajado? ¿púa sin apretar? Reinicia la postura en cada hueco.",
      },
      {
        id: "paso-4", label: "Paso 4 · Resistencia", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 60, voice: "chug",
        strokes: ["D", "-", "D", "U", "D", "-", "D", "U", "D", "-", "D", "U", "D", "-", "D", "U"],
        powerRoots: [40],
        desc: "Galope continuo. Activa «+BPM auto» y aguanta limpio mientras el tempo sube cada 4 compases.",
        tip: "Si pierdes limpieza, para y baja 10 BPM. La velocidad se construye, no se fuerza.",
      },
      {
        id: "paso-5", label: "Paso 5 · Mezcla final", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 70, voice: "chug",
        strokes: ["D", "-", "D", "U", "D", "U", "D", "-", "D", "-", "D", "U", "D", "U", "D", "-"],
        powerRoots: [40],
        desc: "El examen: galope clásico e inverso alternados por pulso, sin cortar el motor.",
        tip: "Cuando esto salga limpio a 90 BPM, ve directo a «The Trooper» y no mires atrás.",
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
        tip: "El groove no está en las notas sino en la dinámica: fuerte-suave-suave-suave.",
      },
      {
        id: "backbeat", label: "Acento en 2 y 4", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 2, bpmHint: 75,
        strokes: ["d", "u", "D", "u", "d", "u", "D", "u"],
        chords: ["E", "A"],
        desc: "El acento en 2 y 4 (backbeat): el mismo lugar donde golpea la caja de la batería.",
        tip: "Piensa como baterista: tu bajada fuerte es el golpe de caja. Todo lo demás acompaña.",
      },
      {
        id: "chuck", label: "Chuck percusivo", timeSignature: "4/4", beats: 4, subsPerBeat: 2, level: 3, bpmHint: 72,
        strokes: ["D", "-", "x", "U", "-", "U", "x", "U"],
        chords: ["C", "Am", "F", "G"],
        desc: "El golpe seco («chuck») sustituye al acorde en los pulsos 2 y 4: guitarra y percusión a la vez.",
        tip: "Apoya el canto de la palma sobre las cuerdas justo al golpear: debe sonar percusión, no nota.",
      },
      {
        id: "funk-16", label: "Funk 16", timeSignature: "4/4", beats: 4, subsPerBeat: 4, level: 3, bpmHint: 85,
        strokes: ["D", "u", "d", "u", "x", "u", "d", "u", "D", "u", "d", "u", "x", "u", "d", "u"],
        chords: ["E9"],
        desc: "Semicorcheas continuas con chuck en 2 y 4 y fantasmas por todas partes, sobre un E9 funky.",
        tip: "La mano derecha nunca para de moverse en semicorcheas: acorde, fantasma o golpe — pero siempre en el aire correcto.",
      },
    ],
  },
]

// ─── Audio ────────────────────────────────────────────────────────────────────

const GUITAR_BASE = [40, 45, 50, 55, 59, 64]
const GHOST_VEL   = 0.42

function playDown(absWhen: number, now: number, subDur: number, frets: number[], vel = 1) {
  const rel = absWhen - now
  // Cap ring time relative to the subdivision so consecutive strums don't
  // pile up unkilled notes (natural decay can be up to 3.5s, way longer than a strum).
  const maxDur = subDur * 1.8
  // Rake speed follows the tempo: the sweep can't eat more than ~1/3 of its slot,
  // or fast subdivisions land audibly behind the metronome click.
  const stag = Math.min(0.028, (subDur * 0.35) / 5)
  let k = 0
  frets.forEach((fret, i) => {
    if (fret < 0) return
    playGuitarString(GUITAR_BASE[i] + fret, rel + k * stag, Math.max(0.090 - i * 0.007, 0.048) * vel, maxDur)
    k++
  })
}

function playUp(absWhen: number, now: number, subDur: number, frets: number[], vel = 1) {
  const rel = absWhen - now
  const maxDur = subDur * 1.8
  const stag = Math.min(0.020, (subDur * 0.30) / 4)
  let k = 0
  ;[5, 4, 3, 2].forEach(si => {
    if (frets[si] < 0) return
    playGuitarString(GUITAR_BASE[si] + frets[si], rel + k * stag, Math.max(0.060 - k * 0.005, 0.038) * vel, maxDur)
    k++
  })
}

function progressionOf(pat: StrumPattern): string[] {
  if (pat.voice === "chug") return (pat.powerRoots ?? [40]).map(r => POWER_NAME[r] ?? "E5")
  return pat.chords ?? ["E"]
}

function playStroke(pat: StrumPattern, s: number, barIdx: number, absWhen: number, now: number, subDur: number) {
  const stroke = pat.strokes[s]
  const rel = absWhen - now

  if (pat.voice === "chug") {
    const roots = pat.powerRoots ?? [40]
    const root  = roots[barIdx % roots.length]
    // A downstroke followed by two rests gets to ring open (riff accent);
    // everything else stays palm-muted.
    const total = pat.strokes.length
    const open = stroke === "D"
      && pat.strokes[(s + 1) % total] === "-"
      && pat.strokes[(s + 2) % total] === "-"
    const maxDur = open ? subDur * 3.4 : subDur * 1.6
    switch (stroke) {
      case "D": playChugChord(rel, 1, open, maxDur, root); break
      case "U": playChugChord(rel, 0.8, false, maxDur, root); break
      case "d": playChugChord(rel, GHOST_VEL, false, maxDur, root); break
      case "u": playChugChord(rel, GHOST_VEL * 0.9, false, maxDur, root); break
      case "x": playMutedStrum(rel); break
    }
    return
  }

  const names = pat.chords ?? ["E"]
  const frets = OPEN_CHORDS[names[barIdx % names.length]] ?? OPEN_CHORDS.E
  switch (stroke) {
    case "D": playDown(absWhen, now, subDur, frets); break
    case "U": playUp(absWhen, now, subDur, frets); break
    case "d": playDown(absWhen, now, subDur, frets, GHOST_VEL); break
    case "u": playUp(absWhen, now, subDur, frets, GHOST_VEL); break
    case "x": playMutedStrum(rel); break
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCENT = "oklch(0.80 0.14 40)"
const UP_C   = "oklch(0.65 0.18 230)"
const MUTE_C = "oklch(0.78 0.13 90)"

// "oklch(L C H)" → "oklch(L C H / a)"
const alpha = (color: string, a: number) => `${color.slice(0, -1)} / ${a})`

function subLabel(i: number, spb: number): { text: string; strong: boolean } {
  const beat = Math.floor(i / spb) + 1
  const pos  = i % spb
  if (pos === 0) return { text: String(beat), strong: true }
  if (spb === 2) return { text: "+", strong: false }
  if (spb === 3) return { text: pos === 1 ? "y" : "a", strong: false }
  return { text: pos === 1 ? "e" : pos === 2 ? "+" : "a", strong: false }
}

function strokeGlyph(s: Stroke): string {
  switch (s) {
    case "D": case "d": return "↓"
    case "U": case "u": return "↑"
    case "x": return "✕"
    default:  return "·"
  }
}

function strokeColor(s: Stroke, active: boolean): string {
  const dim = s === "d" || s === "u"
  switch (s) {
    case "D": case "d":
      return active ? ACCENT : `rgba(255,255,255,${dim ? 0.32 : 0.68})`
    case "U": case "u":
      return active ? UP_C : `rgba(255,255,255,${dim ? 0.26 : 0.48})`
    case "x":
      return active ? MUTE_C : "rgba(255,255,255,0.45)"
    default:
      return "rgba(255,255,255,0.12)"
  }
}

const LEVEL_LABEL: Record<1 | 2 | 3, string> = { 1: "Básico", 2: "Medio", 3: "Avanzado" }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RasgeosPage() {
  const [catId, setCatId]         = useState(CATEGORIES[0].id)
  const [pattern, setPattern]     = useState<StrumPattern>(CATEGORIES[0].patterns[0])
  const [bpm, setBpm]             = useState(70)
  const [playing, setPlaying]     = useState(false)
  const [activeSub, setActiveSub] = useState(-1)
  const [activeBar, setActiveBar] = useState(-1)
  const [clickOn, setClickOn]     = useState(true)
  const [trainerOn, setTrainerOn] = useState(false)

  const category = CATEGORIES.find(c => c.id === catId) ?? CATEGORIES[0]

  const schedulerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const nextNoteTimeRef = useRef(0)
  const currentSubRef   = useRef(0)
  const barsDoneRef     = useRef(0)
  const bpmRef          = useRef(bpm)
  const patternRef      = useRef(pattern)
  const playingRef      = useRef(false)
  const clickRef        = useRef(clickOn)
  const trainerRef      = useRef(trainerOn)

  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { patternRef.current = pattern }, [pattern])
  useEffect(() => { clickRef.current = clickOn }, [clickOn])
  useEffect(() => { trainerRef.current = trainerOn }, [trainerOn])

  const stop = useCallback(() => {
    playingRef.current = false
    if (schedulerRef.current) { clearInterval(schedulerRef.current); schedulerRef.current = null }
    setActiveSub(-1)
    setActiveBar(-1)
    setPlaying(false)
  }, [])

  const start = useCallback(() => {
    const p   = patternRef.current
    const t0  = getAudioTime() + 0.08

    // Count-in: one bar of clicks before the pattern when the click is on
    let loopStart = t0
    if (clickRef.current) {
      const beatDur = 60 / bpmRef.current
      for (let i = 0; i < p.beats; i++) {
        // "rim" is the only click that cuts through the distorted chug (see onset measurements)
        playMetronomeClick(i === 0 ? "accent" : "beat", t0 + i * beatDur, "rim")
      }
      loopStart = t0 + p.beats * beatDur
    }

    nextNoteTimeRef.current = loopStart
    currentSubRef.current   = 0
    barsDoneRef.current     = 0
    playingRef.current      = true

    schedulerRef.current = setInterval(() => {
      const now = getAudioTime()
      const pat = patternRef.current
      const spb = pat.subsPerBeat
      const d   = 60 / (bpmRef.current * spb)
      const total   = pat.strokes.length
      const progLen = progressionOf(pat).length

      while (nextNoteTimeRef.current < now + 0.12) {
        const s   = currentSubRef.current % total
        const bar = Math.floor(currentSubRef.current / total)

        // Tempo trainer: +4 BPM every 4 bars
        if (s === 0 && currentSubRef.current > 0) {
          barsDoneRef.current++
          if (trainerRef.current && barsDoneRef.current % 4 === 0) {
            setBpm(b => Math.min(200, b + 4))
          }
        }

        if (clickRef.current && s % spb === 0) {
          playMetronomeClick(s === 0 ? "accent" : "beat", nextNoteTimeRef.current, "rim")
        }
        playStroke(pat, s, bar, nextNoteTimeRef.current, now, d)

        const delayMs = Math.max(0, (nextNoteTimeRef.current - now) * 1000 + getVisualLatencyMs())
        setTimeout(() => { if (playingRef.current) setActiveSub(s) }, delayMs)
        if (s === 0) {
          const bIdx = bar % progLen
          setTimeout(() => { if (playingRef.current) setActiveBar(bIdx) }, delayMs)
        }

        currentSubRef.current++
        nextNoteTimeRef.current += d
      }
    }, 25)

    setPlaying(true)
  }, [])

  useEffect(() => () => { stop() }, [stop])

  const toggle = useCallback(() => {
    if (playingRef.current) stop()
    else start()
  }, [stop, start])

  // Space bar toggles playback (unless typing in an input / focused button)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (e.code === "Space" && !(t instanceof HTMLInputElement) && !(t instanceof HTMLButtonElement)) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [toggle])

  const selectPattern = (p: StrumPattern) => {
    const wasPlaying = playingRef.current
    stop()
    setPattern(p)
    patternRef.current = p
    if (wasPlaying) start()
  }

  const spb = pattern.subsPerBeat
  const beatGroups = Array.from({ length: pattern.beats }, (_, b) =>
    pattern.strokes.slice(b * spb, (b + 1) * spb)
  )
  const progression = progressionOf(pattern)

  const togglePill = (on: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 13px", borderRadius: 999, cursor: "pointer",
    fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.08em", fontWeight: 600,
    border: `1px solid ${on ? alpha(ACCENT, 0.5) : "rgba(255,255,255,0.10)"}`,
    background: on ? alpha(ACCENT, 0.12) : "rgba(255,255,255,0.04)",
    color: on ? ACCENT : "rgba(255,255,255,0.5)",
    transition: "all 0.15s",
  })

  return (
    <div className="flex flex-col gap-7" style={{ maxWidth: 760, margin: "0 auto" }}>

      {/* Hero */}
      <div style={{ paddingBottom: 4 }}>
        <div className="mc-eyebrow" style={{ marginBottom: 6 }}>Guitarra · Ritmo</div>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 400,
          color: "#fff", letterSpacing: "-0.03em", lineHeight: 1, margin: 0,
        }}>
          Rasgueo & Ritmo
        </h1>
        <p className="mc-lede" style={{ marginTop: 10 }}>
          Ritmos reales agrupados por género, con progresiones de acordes que cambian
          por compás, metrónomo y entrenador de velocidad.
        </p>
        <p style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
          ↓ bajada · ↑ subida · ✕ chuck · pequeño = fantasma · metal: power chords + distorsión · [espacio] = play
        </p>
      </div>

      {/* Category tabs */}
      <div className="mc-section" style={{ gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIES.map(c => {
            const active = c.id === catId
            return (
              <button key={c.id} onClick={() => setCatId(c.id)} style={{
                padding: "8px 15px", borderRadius: 999, cursor: "pointer",
                fontFamily: "var(--font-display)", fontSize: 13.5, letterSpacing: "-0.01em",
                border: `1px solid ${active ? alpha(ACCENT, 0.45) : "rgba(255,255,255,0.09)"}`,
                background: active ? alpha(ACCENT, 0.13) : "rgba(255,255,255,0.03)",
                color: active ? ACCENT : "rgba(255,255,255,0.65)",
                transition: "all 0.15s",
              }}>
                {c.label}
              </button>
            )
          })}
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.42)", lineHeight: 1.5 }}>
          {category.blurb}
        </p>
      </div>

      {/* Pattern cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
        {category.patterns.map(p => {
          const selected = p.id === pattern.id
          return (
            <button key={p.id} onClick={() => selectPattern(p)} style={{
              background: selected ? alpha(ACCENT, 0.10) : "rgba(255,255,255,0.03)",
              border: `1px solid ${selected ? alpha(ACCENT, 0.45) : "rgba(255,255,255,0.08)"}`,
              borderRadius: 12, padding: "12px 13px", cursor: "pointer", textAlign: "left",
              display: "flex", flexDirection: "column", gap: 8,
              transition: "all 0.15s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <span style={{
                  fontFamily: "var(--font-display)", fontSize: 14, lineHeight: 1.2,
                  color: selected ? ACCENT : "#fff",
                }}>
                  {p.label}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                  {p.timeSignature}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 2, whiteSpace: "nowrap", overflow: "hidden" }}>
                  {p.strokes.map((s, i) => (
                    <span key={i} style={{
                      color: strokeColor(s, false),
                      fontSize: s === "d" || s === "u" ? 8 : 10,
                      marginRight: (i + 1) % p.subsPerBeat === 0 ? 4 : 0,
                    }}>
                      {strokeGlyph(s)}
                    </span>
                  ))}
                </span>
                <span style={{ display: "flex", gap: 2.5, flexShrink: 0 }} title={LEVEL_LABEL[p.level]}>
                  {[1, 2, 3].map(l => (
                    <span key={l} style={{
                      width: 4.5, height: 4.5, borderRadius: "50%",
                      background: l <= p.level ? ACCENT : "rgba(255,255,255,0.12)",
                    }} />
                  ))}
                </span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {progressionOf(p).join(" · ")}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected pattern: visualizer + info */}
      <div className="mc-section" style={{
        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, padding: "16px 18px 18px",
      }}>
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow" style={{ color: ACCENT }}>{pattern.label}</span>
          <span className="mc-section-hint">
            {pattern.timeSignature} · {spb === 2 ? "corcheas" : spb === 3 ? "tresillos" : "semicorcheas"} · {LEVEL_LABEL[pattern.level]}
          </span>
        </div>

        {/* Progresión de acordes (un acorde por compás) */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)" }}>
            ACORDES
          </span>
          {progression.map((name, i) => {
            const active = playing && activeBar === i
            return (
              <span key={i} style={{
                fontFamily: "var(--font-display)", fontSize: 15, fontStyle: "italic",
                padding: "3px 12px", borderRadius: 7,
                border: `1px solid ${active ? alpha(ACCENT, 0.65) : "rgba(255,255,255,0.09)"}`,
                background: active ? alpha(ACCENT, 0.16) : "rgba(255,255,255,0.03)",
                color: active ? ACCENT : "rgba(255,255,255,0.75)",
                transition: "all 0.1s",
              }}>
                {name}
              </span>
            )
          })}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}>
            {progression.length > 1 ? "· 1 por compás" : "· acorde fijo"}
          </span>
        </div>

        {/* Visualizer grouped by beat */}
        <div style={{ display: "flex", gap: 10, padding: "2px 0 4px" }}>
          {beatGroups.map((group, b) => (
            <div key={b} style={{ flex: 1, display: "flex", gap: 4 }}>
              {group.map((stroke, j) => {
                const i        = b * spb + j
                const isActive = activeSub === i
                const label    = subLabel(i, spb)
                const isGhost  = stroke === "d" || stroke === "u"
                const activeBg =
                  stroke === "D" || stroke === "d" ? alpha(ACCENT, 0.20)
                  : stroke === "U" || stroke === "u" ? alpha(UP_C, 0.20)
                  : stroke === "x" ? alpha(MUTE_C, 0.18)
                  : "rgba(255,255,255,0.05)"
                const activeBorder =
                  stroke === "D" || stroke === "d" ? alpha(ACCENT, 0.7)
                  : stroke === "U" || stroke === "u" ? alpha(UP_C, 0.7)
                  : stroke === "x" ? alpha(MUTE_C, 0.65)
                  : "rgba(255,255,255,0.15)"
                return (
                  <div key={j} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.04em",
                      color: label.strong ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.22)",
                      fontWeight: label.strong ? 700 : 400,
                    }}>
                      {label.text}
                    </span>
                    <div style={{
                      width: "100%", aspectRatio: "1", maxHeight: 52,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: 9,
                      background: isActive ? activeBg : stroke !== "-" ? "rgba(255,255,255,0.045)" : "transparent",
                      border: `1.5px solid ${isActive ? activeBorder : stroke !== "-" ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)"}`,
                      transition: "background 0.05s, border-color 0.05s",
                    }}>
                      <span style={{
                        fontSize: stroke === "x" ? 15 : isGhost ? 15 : stroke === "-" ? 14 : 22,
                        lineHeight: 1, userSelect: "none",
                        color: strokeColor(stroke, isActive),
                        transition: "color 0.05s",
                      }}>
                        {strokeGlyph(stroke)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Description + tip + songs */}
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.62)", lineHeight: 1.55 }}>
          {pattern.desc}
        </p>
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-start",
          background: alpha(ACCENT, 0.06),
          border: `1px solid ${alpha(ACCENT, 0.18)}`,
          borderRadius: 10, padding: "10px 13px",
        }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", color: ACCENT, fontWeight: 700, paddingTop: 2 }}>
            CONSEJO
          </span>
          <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
            {pattern.tip}
          </span>
        </div>
        {pattern.songs && (
          <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.38)", fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}>
            ♪ {pattern.songs}
          </p>
        )}
      </div>

      {/* Tempo + practice controls */}
      <div className="mc-section">
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Práctica</span>
          <span className="mc-section-hint" style={{ fontVariantNumeric: "tabular-nums" }}>{bpm} BPM</span>
          {bpm !== pattern.bpmHint && (
            <button onClick={() => setBpm(pattern.bpmHint)} style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.05em",
              color: "rgba(255,255,255,0.35)", textDecoration: "underline", textUnderlineOffset: 3,
            }}>
              sugerido: {pattern.bpmHint}
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="range" min={40} max={200} value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="mc-slider" style={{ flex: 1, accentColor: ACCENT }}
          />
          <button onClick={toggle} style={{
            background: playing ? "oklch(0.68 0.18 25 / 0.14)" : alpha(ACCENT, 0.14),
            border: `1px solid ${playing ? "oklch(0.68 0.18 25 / 0.5)" : alpha(ACCENT, 0.45)}`,
            borderRadius: 10, padding: "11px 28px",
            color: playing ? "oklch(0.75 0.18 25)" : ACCENT,
            fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.08em",
            cursor: "pointer", fontWeight: 700, minWidth: 112,
            transition: "all 0.15s",
          }}>
            {playing ? "◼  PARAR" : "▶  TOCAR"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setClickOn(v => !v)} style={togglePill(clickOn)} title="Click de metrónomo sobre el patrón (con 1 compás de conteo)">
            ♩ CLICK {clickOn ? "ON" : "OFF"}
          </button>
          <button onClick={() => setTrainerOn(v => !v)} style={togglePill(trainerOn)} title="Sube 4 BPM automáticamente cada 4 compases">
            ⤴ +BPM AUTO {trainerOn ? "ON" : "OFF"}
          </button>
          {trainerOn && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>
              +4 BPM cada 4 compases · máx 200
            </span>
          )}
        </div>
      </div>

      {/* Standalone metronome */}
      <div className="mc-section">
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Metrónomo</span>
          <span className="mc-section-hint">práctica libre · compás y acentos configurables</span>
        </div>
        <Metronome />
      </div>

    </div>
  )
}
