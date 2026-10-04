import { GUITAR_TUNING_MIDI } from "@/data/scales"

export const PC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

/** Notas (clase de altura) de una forma de acorde: trastes de Mi grave → mi aguda, -1 = no suena. */
export function chordPcs(frets: number[]): number[] {
  return frets.flatMap((f, s) => f < 0 ? [] : [(GUITAR_TUNING_MIDI[s] + f) % 12])
}
export const names = (pcs: number[]) => pcs.map(p => PC[p]).join(" ")
export const midiName = (m: number) => PC[m % 12] + (Math.floor(m / 12) - 1)
