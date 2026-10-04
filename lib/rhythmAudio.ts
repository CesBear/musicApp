// Síntesis de los patrones de rasgueo (Rasgueos): traduce cada golpe del banco
// de ritmos (data/rhythms.ts) a notas del motor de guitarra de lib/audio.ts.
import { playGuitarString, playMutedStrum, playChugChord } from "@/lib/audio"
import { OPEN_CHORDS, BASS, POWER_NAME, type StrumPattern } from "@/data/rhythms"


const GUITAR_BASE = [40, 45, 50, 55, 59, 64]
const GHOST_VEL   = 0.42

function playDown(absWhen: number, now: number, subDur: number, frets: number[], vel = 1, staccato = false) {
  const rel = absWhen - now
  // Cap ring time relative to the subdivision so consecutive strums don't
  // pile up unkilled notes (natural decay can be up to 3.5s, way longer than a strum).
  // Staccato (funk, reggae, ska): la mano izquierda corta el acorde casi enseguida.
  const maxDur = staccato ? subDur * 0.7 : subDur * 1.8
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

function playUp(absWhen: number, now: number, subDur: number, frets: number[], vel = 1, staccato = false) {
  const rel = absWhen - now
  const maxDur = staccato ? subDur * 0.7 : subDur * 1.8
  const stag = Math.min(0.020, (subDur * 0.30) / 4)
  let k = 0
  ;[5, 4, 3, 2].forEach(si => {
    if (frets[si] < 0) return
    playGuitarString(GUITAR_BASE[si] + frets[si], rel + k * stag, Math.max(0.060 - k * 0.005, 0.038) * vel, maxDur)
    k++
  })
}

// Una sola cuerda: el bajo del acorde (fundamental o alternado).
function playBass(rel: number, subDur: number, chord: string, alt: boolean, vel = 1) {
  const bass = BASS[chord]
  const [string, fret] = bass ? bass[alt ? 1 : 0] : [0, 0]
  playGuitarString(GUITAR_BASE[string] + fret, rel, 0.12 * vel, subDur * 3)
}

// Pinza con los dedos (bossa): bajo + las 3 cuerdas agudas a la vez, sin rasgueo.
function playPinch(rel: number, subDur: number, chord: string, frets: number[]) {
  playBass(rel, subDur, chord, false, 0.9)
  ;[3, 4, 5].forEach(si => {
    if (frets[si] >= 0) playGuitarString(GUITAR_BASE[si] + frets[si], rel + 0.004, 0.06, subDur * 2.2)
  })
}

/** Acorde que suena en el golpe s del compás barIdx (riff propio, anticipación o el del compás). */
export function chordAt(pat: StrumPattern, s: number, barIdx: number): string {
  const names = pat.chords ?? ["E"]
  if (pat.stepChords?.[s]) return pat.stepChords[s]
  if (pat.push?.includes(s)) return names[(barIdx + 1) % names.length]
  return names[barIdx % names.length]
}

export function progressionOf(pat: StrumPattern): string[] {
  if (pat.voice === "chug") return (pat.powerRoots ?? [40]).map(r => POWER_NAME[r] ?? "E5")
  return pat.chords ?? ["E"]
}

export function playStroke(pat: StrumPattern, s: number, barIdx: number, absWhen: number, now: number, subDur: number) {
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

  const name  = chordAt(pat, s, barIdx)
  let frets   = OPEN_CHORDS[name] ?? OPEN_CHORDS.E
  // Aproximación cromática: la misma forma un traste abajo (solo voicings movibles)
  if (pat.approach?.includes(s)) frets = frets.map(f => f <= 0 ? f : f - 1)
  const st = !!pat.staccato
  switch (stroke) {
    case "D": playDown(absWhen, now, subDur, frets, 1, st); break
    case "U": playUp(absWhen, now, subDur, frets, 1, st); break
    case "d": playDown(absWhen, now, subDur, frets, GHOST_VEL, st); break
    case "u": playUp(absWhen, now, subDur, frets, GHOST_VEL, st); break
    // En funk el scratch es más suave que un chuck de palma
    case "x": playMutedStrum(rel, st ? 0.6 : 1); break
    case "B": playBass(rel, subDur, name, false); break
    case "b": playBass(rel, subDur, name, true); break
    case "P": playPinch(rel, subDur, name, frets); break
  }
}


/**
 * Un golpe de rasgueo sobre cualquier forma de acorde (Progresiones). El bajo (B/b/P)
 * sale de la cuerda más grave que suena: fundamental y su 5ª.
 */
export function playStrokeOnFrets(stroke: StrumPattern["strokes"][number], frets: number[], rel: number, subDur: number, staccato = false) {
  const low = frets.findIndex(f => f >= 0)
  const root = low >= 0 ? GUITAR_BASE[low] + frets[low] : 40
  switch (stroke) {
    case "D": playDown(rel, 0, subDur, frets, 1, staccato); break
    case "U": playUp(rel, 0, subDur, frets, 1, staccato); break
    case "d": playDown(rel, 0, subDur, frets, GHOST_VEL, staccato); break
    case "u": playUp(rel, 0, subDur, frets, GHOST_VEL, staccato); break
    case "x": playMutedStrum(rel, staccato ? 0.6 : 1); break
    case "B": playGuitarString(root, rel, 0.12, subDur * 3); break
    case "b": playGuitarString(root + 7, rel, 0.12, subDur * 3); break
    case "P":
      playGuitarString(root, rel, 0.11, subDur * 3)
      ;[3, 4, 5].forEach(si => { if (frets[si] >= 0) playGuitarString(GUITAR_BASE[si] + frets[si], rel + 0.004, 0.06, subDur * 2.2) })
      break
  }
}
