// Mock data for Material del Maestro screen.
// Replace these with real backend queries.

export type Teacher = {
  name: string
  studio: string
  avatar: string
}

export const TEACHER: Teacher = {
  name: "Andrés Calamaro Jr.",
  studio: "Estudio Calamaro · Lunes 19:00",
  avatar: "AC",
}

export type LessonMaterial = {
  kind: "pdf" | "audio" | "tab"
  label: string
  size: string | null
  duration: string | null
}

export type Lesson = {
  id: string
  week: string
  title: string
  date: string
  duration: string
  status: "current" | "done"
  focus: string
  homework: number
  materials: LessonMaterial[]
  notes: string
}

export const LESSONS: Lesson[] = [
  {
    id: "l-008",
    week: "Semana 12",
    title: "Improvisación en Pentatónica Menor",
    date: "12 May 2026",
    duration: "60 min",
    status: "current",
    focus: "Pentatónica de A menor en posiciones 1 y 2",
    homework: 3,
    materials: [
      { kind: "pdf",   label: "Backing track guía",       size: "1.2 MB", duration: null },
      { kind: "audio", label: "Ejemplo improvisación",     size: "3.8 MB", duration: "2:14" },
      { kind: "tab",   label: "Lick #4 — bend al b5",      size: null,     duration: null },
    ],
    notes: "Trabajar los bends del b3 con vibrato controlado. Grabate tocando sobre el backing.",
  },
  {
    id: "l-007",
    week: "Semana 11",
    title: "Acordes con Tensiones · Maj7 y m9",
    date: "05 May 2026",
    duration: "60 min",
    status: "done",
    focus: "Voicings de Maj7 sin la fundamental",
    homework: 4,
    materials: [
      { kind: "pdf",   label: "Hoja de voicings",         size: "780 KB", duration: null },
      { kind: "audio", label: "Demo progresión II-V-I",   size: "2.1 MB", duration: "1:22" },
    ],
    notes: "Buenísimo el avance con la mano derecha. Seguir con el metrónomo a 80.",
  },
  {
    id: "l-006",
    week: "Semana 10",
    title: "Círculo de Quintas · Tonalidades Mayores",
    date: "28 Abr 2026",
    duration: "60 min",
    status: "done",
    focus: "Transposición de I–IV–V por tonalidades",
    homework: 5,
    materials: [
      { kind: "pdf",   label: "Diagrama del círculo",     size: "640 KB", duration: null },
      { kind: "tab",   label: "Progresiones en C, G, D",  size: null,     duration: null },
    ],
    notes: "Practicar el cambio rápido entre tonalidades cercanas. C ↔ G ↔ D ↔ A.",
  },
  {
    id: "l-005",
    week: "Semana 9",
    title: "Modos Griegos · Dórico y Mixolidio",
    date: "21 Abr 2026",
    duration: "60 min",
    status: "done",
    focus: "Construcción modal sobre acorde estático",
    homework: 2,
    materials: [
      { kind: "audio", label: "Backing dórico en Am",     size: "4.2 MB", duration: "3:00" },
    ],
    notes: "",
  },
]

export type RepertoireItem = {
  song: string
  artist: string
  key: string
  progress: number
  difficulty: "Inicial" | "Intermedio" | "Avanzado"
}

export const REPERTOIRE: RepertoireItem[] = [
  { song: "Sultans of Swing",    artist: "Dire Straits", key: "Dm",   progress: 0.85, difficulty: "Avanzado"   },
  { song: "Wonderwall",          artist: "Oasis",        key: "F#m",  progress: 1.00, difficulty: "Inicial"    },
  { song: "Hotel California",    artist: "Eagles",       key: "Bm",   progress: 0.55, difficulty: "Intermedio" },
  { song: "Stairway to Heaven",  artist: "Led Zeppelin", key: "Am",   progress: 0.30, difficulty: "Avanzado"   },
]

export type RoutineItem = {
  label: string
  duration: string
  desc: string
}

export const ROUTINE: RoutineItem[] = [
  { label: "Calentamiento cromático",      duration: "5 min",  desc: "Subir y bajar por todo el mástil en cuartos. Mano izquierda relajada." },
  { label: "Pentatónica · 5 posiciones",   duration: "10 min", desc: "Una posición por día, 90 BPM. Empezar lento, subir gradualmente." },
  { label: "Cambios de acorde",            duration: "10 min", desc: "I–IV–V en tres tonalidades distintas, sin mirar la guitarra." },
  { label: "Improvisación libre",          duration: "15 min", desc: "Backing track + escala del día. Foco en frases melódicas." },
]
