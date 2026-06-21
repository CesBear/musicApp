import { GUITAR_TUNING_MIDI } from "@/data/scales"

let _ctx: AudioContext | null = null
let _bus: GainNode | null = null
let _wave: PeriodicWave | null = null
let _chordGains: GainNode[] = []

function getMaster(): { ctx: AudioContext; bus: GainNode } {
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const comp = _ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.knee.value = 8
    comp.ratio.value = 4
    comp.attack.value = 0.006
    comp.release.value = 0.15

    // Brick-wall safety stage: catches any peaks comp lets through before they
    // hit hard digital clipping at destination (e.g. many voices stacking at once).
    const limiter = _ctx.createDynamicsCompressor()
    limiter.threshold.value = -3
    limiter.knee.value = 0
    limiter.ratio.value = 20
    limiter.attack.value = 0.001
    limiter.release.value = 0.05

    comp.connect(limiter)
    limiter.connect(_ctx.destination)

    _bus = _ctx.createGain()
    _bus.gain.value = 0.60
    _bus.connect(comp)
  }
  if (_ctx.state === "suspended") void _ctx.resume()
  return { ctx: _ctx, bus: _bus! }
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

// Cached harmonic waveform approximating a clean electric guitar.
// PeriodicWave is far more reliable than Karplus-Strong delay loops,
// which break on high-frequency notes where the period < Web Audio's minimum delay.
function getGuitarWave(ctx: AudioContext): PeriodicWave {
  if (!_wave) {
    const real = new Float32Array([0, 0.70, 0.55, 0.28, 0.16, 0.10, 0.06, 0.04, 0.02, 0.01])
    const imag = new Float32Array(real.length)
    _wave = ctx.createPeriodicWave(real, imag, { disableNormalization: false })
  }
  return _wave
}

export function playGuitarString(midi: number, when = 0, gainPeak = 0.11, maxDur?: number): GainNode {
  const { ctx, bus } = getMaster()
  const t0 = ctx.currentTime + when
  const freq = midiToFreq(midi)
  // Lower strings sustain longer (matches real guitar physics)
  let dur = Math.max(1.2, 3.5 - freq * 0.005)
  // Cap ring time so fast-changing sequences don't stack unkilled decaying notes on top of each other
  if (maxDur !== undefined) dur = Math.min(dur, Math.max(0.15, maxDur))

  const osc = ctx.createOscillator()
  osc.setPeriodicWave(getGuitarWave(ctx))
  osc.frequency.value = freq

  // Time-varying lowpass: bright at attack → mellow as it decays (string damping)
  const lp = ctx.createBiquadFilter()
  lp.type = "lowpass"
  lp.frequency.setValueAtTime(Math.min(freq * 14, 9000), t0)
  lp.frequency.exponentialRampToValueAtTime(Math.min(freq * 3, 2500), t0 + dur * 0.6)
  lp.Q.value = 0.4

  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gainPeak, t0 + 0.007)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)

  osc.connect(lp)
  lp.connect(g)
  g.connect(bus)

  osc.start(t0)
  osc.stop(t0 + dur + 0.05)

  setTimeout(() => { try { g.disconnect() } catch { /**/ } }, (when + dur + 0.5) * 1000)
  return g
}

export function playTone(midi: number, when = 0, duration = 0.35, gainPeak = 0.18): void {
  const { ctx, bus } = getMaster()
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
  g.connect(filt)
  filt.connect(bus)
  osc1.start(t0); osc2.start(t0)
  osc1.stop(t0 + duration + 0.05); osc2.stop(t0 + duration + 0.05)
}

export function playScale(rootIdx: number, intervals: number[], octave = 4): void {
  const spacing = 0.18
  const maxDur  = spacing * 2.2 // let notes ring into the next one a little without endlessly stacking
  intervals.forEach((iv, i) => {
    playGuitarString(12 * (octave + 1) + rootIdx + iv, i * spacing, 0.10, maxDur)
  })
  playGuitarString(12 * (octave + 1) + rootIdx + 12, intervals.length * spacing, 0.10, maxDur)
}

export function scheduleChord(frets: number[], when: number, tuning = GUITAR_TUNING_MIDI, maxDur?: number): void {
  frets.forEach((fret, i) => {
    if (fret < 0) return
    const midi = tuning[i] + fret
    const gain = Math.max(0.09 - i * 0.006, 0.055)
    playGuitarString(midi, when + i * 0.040, gain, maxDur)
  })
}

export function playChord(frets: number[], tuning = GUITAR_TUNING_MIDI): void {
  const { ctx } = getMaster()
  const now = ctx.currentTime

  // Kill previous chord by ramping each gain node to 0 over a few ms —
  // a hard setValueAtTime(0, now) is an instant step (a click/pop), not silence.
  const FADE = 0.006
  for (const g of _chordGains) {
    try {
      const current = g.gain.value
      g.gain.cancelScheduledValues(now)
      g.gain.setValueAtTime(current, now)
      g.gain.linearRampToValueAtTime(0, now + FADE)
    } catch { /**/ }
  }
  _chordGains = []

  frets.forEach((fret, i) => {
    if (fret < 0) return
    const midi = tuning[i] + fret
    const gain = Math.max(0.09 - i * 0.006, 0.055)
    // 20ms base offset ensures t0 is never at ctx.currentTime, avoiding block-boundary artifacts
    _chordGains.push(playGuitarString(midi, 0.020 + i * 0.040, gain))
  })
}

export function getAudioTime(): number {
  const { ctx } = getMaster()
  return ctx.currentTime
}

export type ClickSound = "classic" | "wood" | "beep" | "rim"

function noiseBuffer(ctx: AudioContext, dur: number, decay = 4): AudioBuffer {
  const n = Math.ceil(ctx.sampleRate * dur)
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / n * decay)
  return buf
}

export function playMetronomeClick(
  type: "accent" | "beat" | "sub" = "beat",
  when?: number,
  sound: ClickSound = "classic"
): void {
  const { ctx, bus } = getMaster()
  const t0 = when ?? ctx.currentTime
  const isAccent = type === "accent"
  const isSub    = type === "sub"

  if (sound === "classic") {
    const freq = isAccent ? 1600 : isSub ? 700 : 1000
    const peak = isAccent ? 0.14  : isSub ? 0.04 : 0.09
    const dur  = isSub ? 0.04 : 0.06
    const osc = ctx.createOscillator()
    osc.type = "square"; osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t0)
    g.gain.linearRampToValueAtTime(peak, t0 + 0.002)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g); g.connect(bus)
    osc.start(t0); osc.stop(t0 + dur + 0.01)

  } else if (sound === "wood") {
    const freq = isAccent ? 1100 : isSub ? 600 : 800
    const peak = isAccent ? 0.45  : isSub ? 0.20 : 0.32
    const dur  = isAccent ? 0.055 : isSub ? 0.025 : 0.04
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer(ctx, dur, 10)
    const bp = ctx.createBiquadFilter()
    bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = 10
    const g = ctx.createGain()
    g.gain.setValueAtTime(peak, t0)
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
    src.connect(bp); bp.connect(g); g.connect(bus)
    src.start(t0); src.stop(t0 + dur + 0.005)

  } else if (sound === "beep") {
    const freq = isAccent ? 1047 : isSub ? 440 : 660   // C6, A4, E5
    const peak = isAccent ? 0.20  : isSub ? 0.05 : 0.12
    const dur  = isSub ? 0.03 : 0.05
    const osc = ctx.createOscillator()
    osc.type = "sine"; osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t0)
    g.gain.linearRampToValueAtTime(peak, t0 + 0.002)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g); g.connect(bus)
    osc.start(t0); osc.stop(t0 + dur + 0.005)

  } else if (sound === "rim") {
    const peak = isAccent ? 0.55  : isSub ? 0.18 : 0.38
    const dur  = isAccent ? 0.028 : isSub ? 0.012 : 0.018
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer(ctx, dur, 15)
    const hp = ctx.createBiquadFilter()
    hp.type = "highpass"; hp.frequency.value = isAccent ? 4500 : 3200
    const g = ctx.createGain()
    g.gain.setValueAtTime(peak, t0)
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
    src.connect(hp); hp.connect(g); g.connect(bus)
    src.start(t0); src.stop(t0 + dur + 0.005)
  }
}
