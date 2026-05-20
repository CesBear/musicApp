// Tiny Web Audio synthesizer for scale, chord and metronome playback.
// Lazy-initializes AudioContext on first user gesture to avoid autoplay errors.

import { GUITAR_TUNING } from "@/data/scales"

let _audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  if (_audioCtx.state === "suspended") void _audioCtx.resume()
  return _audioCtx
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export function playTone(midi: number, when = 0, duration = 0.35, gainPeak = 0.18): void {
  const ctx = getAudioCtx()
  const t0 = ctx.currentTime + when

  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  osc1.type = "triangle"
  osc2.type = "sine"
  osc1.frequency.value = midiToFreq(midi)
  osc2.frequency.value = midiToFreq(midi + 0.02)

  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gainPeak, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)

  const filt = ctx.createBiquadFilter()
  filt.type = "lowpass"
  filt.frequency.value = 4000
  filt.Q.value = 0.6

  osc1.connect(g); osc2.connect(g)
  g.connect(filt).connect(ctx.destination)
  osc1.start(t0); osc2.start(t0)
  osc1.stop(t0 + duration + 0.05); osc2.stop(t0 + duration + 0.05)
}

export function playScale(rootIdx: number, intervals: number[], octave = 4): void {
  intervals.forEach((iv, i) => {
    playTone(12 * (octave + 1) + rootIdx + iv, i * 0.18, 0.28, 0.16)
  })
  playTone(12 * (octave + 1) + rootIdx + 12, intervals.length * 0.18, 0.38, 0.16)
}

export function playChord(frets: number[], tuning = GUITAR_TUNING): void {
  frets.forEach((fret, i) => {
    if (fret < 0) return
    const midi = 40 + tuning[i] + fret  // string 0 = low E (MIDI 40)
    playTone(midi, i * 0.035, 0.9, 0.10)
  })
}

export function playMetronomeClick(accent = false): void {
  const ctx = getAudioCtx()
  const t0 = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = "square"
  osc.frequency.value = accent ? 1600 : 1000
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(accent ? 0.12 : 0.08, t0 + 0.002)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06)
  osc.connect(g).connect(ctx.destination)
  osc.start(t0); osc.stop(t0 + 0.07)
}
