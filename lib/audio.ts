import { GUITAR_TUNING } from "@/data/scales"

let _ctx: AudioContext | null = null
let _bus: GainNode | null = null
let _wave: PeriodicWave | null = null

function getMaster(): { ctx: AudioContext; bus: GainNode } {
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    // Compressor on the master bus prevents any clipping regardless of how many notes play simultaneously
    const comp = _ctx.createDynamicsCompressor()
    comp.threshold.value = -12
    comp.knee.value = 6
    comp.ratio.value = 6
    comp.attack.value = 0.003
    comp.release.value = 0.15
    comp.connect(_ctx.destination)
    _bus = _ctx.createGain()
    _bus.gain.value = 0.7
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

export function playGuitarString(midi: number, when = 0, gainPeak = 0.11): void {
  const { ctx, bus } = getMaster()
  const t0 = ctx.currentTime + when
  const freq = midiToFreq(midi)
  // Lower strings sustain longer (matches real guitar physics)
  const dur = Math.max(1.2, 3.5 - freq * 0.005)

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
  g.gain.linearRampToValueAtTime(gainPeak, t0 + 0.003)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)

  // Short pick transient (noise burst ≈ 8 ms) for the plucked attack character
  const excSamples = Math.ceil(ctx.sampleRate * 0.008)
  const excBuf = ctx.createBuffer(1, excSamples, ctx.sampleRate)
  const excData = excBuf.getChannelData(0)
  for (let i = 0; i < excSamples; i++) {
    excData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / excSamples, 2)
  }
  const exc = ctx.createBufferSource()
  exc.buffer = excBuf
  const excG = ctx.createGain()
  excG.gain.setValueAtTime(gainPeak * 0.5, t0)
  excG.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.012)

  osc.connect(lp)
  lp.connect(g)
  exc.connect(excG)
  excG.connect(g)
  g.connect(bus)

  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
  exc.start(t0)
  exc.stop(t0 + 0.01)

  setTimeout(() => { try { g.disconnect() } catch { /**/ } }, (when + dur + 0.5) * 1000)
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
  intervals.forEach((iv, i) => {
    playGuitarString(12 * (octave + 1) + rootIdx + iv, i * 0.18, 0.10)
  })
  playGuitarString(12 * (octave + 1) + rootIdx + 12, intervals.length * 0.18, 0.10)
}

export function playChord(frets: number[], tuning = GUITAR_TUNING): void {
  frets.forEach((fret, i) => {
    if (fret < 0) return
    const midi = 40 + tuning[i] + fret
    // Low strings slightly louder; 40ms strum sweep per string
    const gain = Math.max(0.10 - i * 0.007, 0.06)
    playGuitarString(midi, i * 0.04, gain)
  })
}

// ─── Drum synthesis ────────────────────────────────────────────────────────

export function playKick(when?: number): void {
  const { ctx, bus } = getMaster()
  const t0 = when ?? ctx.currentTime
  // Sine with fast pitch drop gives the "thud" of a kick
  const osc = ctx.createOscillator()
  osc.type = "sine"
  osc.frequency.setValueAtTime(140, t0)
  osc.frequency.exponentialRampToValueAtTime(38, t0 + 0.07)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.9, t0)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45)
  // Punch transient
  const punchSamples = Math.ceil(ctx.sampleRate * 0.012)
  const punchBuf = ctx.createBuffer(1, punchSamples, ctx.sampleRate)
  const pd = punchBuf.getChannelData(0)
  for (let i = 0; i < punchSamples; i++) pd[i] = (Math.random() * 2 - 1) * (1 - i / punchSamples)
  const punch = ctx.createBufferSource()
  punch.buffer = punchBuf
  const pg = ctx.createGain()
  pg.gain.setValueAtTime(0.35, t0)
  pg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.015)
  osc.connect(g); g.connect(bus)
  punch.connect(pg); pg.connect(bus)
  osc.start(t0); osc.stop(t0 + 0.5)
  punch.start(t0); punch.stop(t0 + 0.015)
}

export function playSnare(when?: number): void {
  const { ctx, bus } = getMaster()
  const t0 = when ?? ctx.currentTime
  // Tone body
  const osc = ctx.createOscillator()
  osc.type = "triangle"
  osc.frequency.setValueAtTime(220, t0)
  osc.frequency.exponentialRampToValueAtTime(90, t0 + 0.08)
  const og = ctx.createGain()
  og.gain.setValueAtTime(0.3, t0)
  og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15)
  // Snare rattle (bandpass noise)
  const noiseSamples = Math.ceil(ctx.sampleRate * 0.22)
  const noiseBuf = ctx.createBuffer(1, noiseSamples, ctx.sampleRate)
  const nd = noiseBuf.getChannelData(0)
  for (let i = 0; i < noiseSamples; i++) nd[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuf
  const bp = ctx.createBiquadFilter()
  bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 0.7
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(0.55, t0)
  ng.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18)
  osc.connect(og); og.connect(bus)
  noise.connect(bp); bp.connect(ng); ng.connect(bus)
  osc.start(t0); osc.stop(t0 + 0.2)
  noise.start(t0); noise.stop(t0 + 0.22)
}

export function playHihat(open = false, when?: number): void {
  const { ctx, bus } = getMaster()
  const t0 = when ?? ctx.currentTime
  const dur = open ? 0.28 : 0.055
  const noiseSamples = Math.ceil(ctx.sampleRate * (dur + 0.01))
  const noiseBuf = ctx.createBuffer(1, noiseSamples, ctx.sampleRate)
  const nd = noiseBuf.getChannelData(0)
  for (let i = 0; i < noiseSamples; i++) nd[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuf
  const hp = ctx.createBiquadFilter()
  hp.type = "highpass"; hp.frequency.value = 7500
  const g = ctx.createGain()
  g.gain.setValueAtTime(open ? 0.12 : 0.14, t0)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
  noise.connect(hp); hp.connect(g); g.connect(bus)
  noise.start(t0); noise.stop(t0 + dur + 0.01)
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
