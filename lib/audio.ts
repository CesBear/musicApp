import { GUITAR_TUNING_MIDI } from "@/data/scales"
import { getGuitarSample, getMutedSample, preloadGuitarSamples } from "@/lib/sampler"

let _ctx: AudioContext | null = null
let _bus: GainNode | null = null
let _wave: PeriodicWave | null = null
let _chordGains: GainNode[] = []

// Every guitar voice (sounding or scheduled in the future) registers here so
// a hard stop can silence pending notes — clearing UI timers isn't enough
// because Web Audio nodes are already committed to the audio clock.
type LiveVoice = { g: GainNode; src: AudioScheduledSourceNode }
const _liveVoices = new Set<LiveVoice>()

export function stopAllGuitarNotes(fade = 0.025): void {
  if (!_ctx) return
  const now = _ctx.currentTime
  for (const v of _liveVoices) {
    try {
      v.g.gain.cancelScheduledValues(now)
      v.g.gain.setValueAtTime(v.g.gain.value, now)
      v.g.gain.linearRampToValueAtTime(0, now + fade)
      v.src.stop(now + fade + 0.01)
    } catch { /**/ }
  }
  _liveVoices.clear()
}

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

    // Empieza a bajar los samples de guitarra real en cuanto hay contexto;
    // mientras llegan, todo suena con la síntesis de siempre.
    preloadGuitarSamples(_ctx)
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

  // Sample real (Emily, CC0) si ya está cargado; síntesis mientras tanto.
  const smp = getGuitarSample(ctx, midi, gainPeak)
  if (smp) {
    const src = ctx.createBufferSource()
    src.buffer = smp.buffer
    src.playbackRate.value = smp.rate

    const g = ctx.createGain()
    g.gain.value = smp.gain
    const natural = smp.buffer.duration / smp.rate
    let end = natural
    if (maxDur !== undefined) {
      // Mismo recorte que la síntesis: decae dentro de su slot para no apilar colas
      const d = Math.max(0.15, Math.min(maxDur, natural))
      g.gain.setValueAtTime(smp.gain, t0 + d * 0.6)
      g.gain.exponentialRampToValueAtTime(0.001, t0 + d)
      end = d
    }
    src.connect(g)
    g.connect(bus)
    src.start(t0)
    src.stop(t0 + end + 0.05)
    const voice: LiveVoice = { g, src }
    _liveVoices.add(voice)
    setTimeout(() => {
      _liveVoices.delete(voice)
      try { g.disconnect() } catch { /**/ }
    }, (when + end + 0.5) * 1000)
    return g
  }

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

  const voice: LiveVoice = { g, src: osc }
  _liveVoices.add(voice)
  setTimeout(() => {
    _liveVoices.delete(voice)
    try { g.disconnect() } catch { /**/ }
  }, (when + dur + 0.5) * 1000)
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

// ─── Distorted palm-mute chug (galope / metal) ───────────────────────────────

let _chugInput: GainNode | null = null

// Shared drive → waveshaper → cab voicing chain. One nonlinear stage for all
// chug voices so simultaneous notes intermodulate like a real amp.
function getChugBus(ctx: AudioContext, bus: GainNode): GainNode {
  if (!_chugInput) {
    const pre = ctx.createGain()
    pre.gain.value = 3.5

    const shaper = ctx.createWaveShaper()
    const n = 2048, k = 10
    const curve = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1
      curve[i] = Math.tanh(k * x) / Math.tanh(k)
    }
    shaper.curve = curve
    shaper.oversample = "4x"

    // Post-distortion voicing: mid scoop + fizz rolloff (cheap cab sim)
    const scoop = ctx.createBiquadFilter()
    scoop.type = "peaking"
    scoop.frequency.value = 550
    scoop.Q.value = 0.9
    scoop.gain.value = -4

    const cab = ctx.createBiquadFilter()
    cab.type = "lowpass"
    cab.frequency.value = 4200
    cab.Q.value = 0.7

    const out = ctx.createGain()
    // Calibrado empíricamente contra los samples reales: 0.15 → chug ≈0.26,
    // galope solapado ≤0.8 en el peor caso de fase entre round-robins
    out.gain.value = 0.15

    pre.connect(shaper); shaper.connect(scoop); scoop.connect(cab); cab.connect(out); out.connect(bus)
    _chugInput = pre
  }
  return _chugInput
}

// Power chord (root · 5th · octave), default E5: E2 · B2 · E3
export function playChugChord(when = 0, velocity = 1, open = false, maxDur?: number, rootMidi = 40): void {
  const { ctx, bus } = getMaster()
  const input = getChugBus(ctx, bus)
  const t0 = ctx.currentTime + Math.max(when, 0)
  let dur = open ? 0.55 : 0.15
  if (maxDur !== undefined) dur = Math.min(dur, Math.max(0.07, maxDur))

  const notes = [rootMidi, rootMidi + 7, rootMidi + 12]

  // Cuerdas reales (Emily) a través de la misma distorsión cuando ya cargaron:
  // una sierra sintética saturada suena a teclado; una cuerda DI saturada suena
  // a amplificador. El palm mute sigue siendo envolvente corta + filtro que se
  // cierra ANTES del waveshaper, igual que en una guitarra real.
  const samples = notes.map(m => getGuitarSample(ctx, m, 0.11))
  if (samples.every(Boolean)) {
    notes.forEach((midi, i) => {
      // Dos capas por nota con round-robins distintos y detune leve = pared espesa
      ;[-6, 5].forEach((cents, layer) => {
        const smp = (layer === 0 ? samples[i] : getGuitarSample(ctx, midi, 0.11)) ?? samples[i]!
        const src = ctx.createBufferSource()
        src.buffer = smp.buffer
        src.playbackRate.value = smp.rate * Math.pow(2, cents / 1200)

        const lp = ctx.createBiquadFilter()
        lp.type = "lowpass"
        lp.Q.value = 0.5
        lp.frequency.setValueAtTime(open ? 3200 : 1500, t0)
        lp.frequency.exponentialRampToValueAtTime(open ? 900 : 380, t0 + dur)

        const g = ctx.createGain()
        g.gain.setValueAtTime(0.45 * velocity, t0)
        g.gain.exponentialRampToValueAtTime(0.002, t0 + dur)

        src.connect(lp); lp.connect(g); g.connect(input)
        src.start(t0)
        src.stop(t0 + dur + 0.05)
      })
    })
    return
  }

  notes.forEach(midi => {
    const f = midiToFreq(midi)
    // Two detuned saws per note thicken the wall of sound
    ;[-5, 4].forEach(det => {
      const osc = ctx.createOscillator()
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(f * 1.015, t0) // slight pick-attack bend down to pitch
      osc.frequency.exponentialRampToValueAtTime(f, t0 + 0.02)
      osc.detune.value = det

      // The palm chokes the string: dark tone + filter closing fast (pre-distortion)
      const lp = ctx.createBiquadFilter()
      lp.type = "lowpass"
      lp.Q.value = 0.5
      lp.frequency.setValueAtTime(open ? 3000 : 1300, t0)
      lp.frequency.exponentialRampToValueAtTime(open ? 800 : 320, t0 + dur)

      // Envelope BEFORE the shaper: palm mute dies because string energy drops
      // at the pickup, not at the amp — decaying into the tanh knee sounds real.
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t0)
      g.gain.linearRampToValueAtTime(0.30 * velocity, t0 + 0.004)
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)

      osc.connect(lp); lp.connect(g); g.connect(input)
      osc.start(t0); osc.stop(t0 + dur + 0.05)
    })
  })

  // Pick scrape transient, through the same distortion for grit
  const scrape = ctx.createBufferSource()
  scrape.buffer = noiseBuffer(ctx, 0.018, 9)
  const bp = ctx.createBiquadFilter()
  bp.type = "bandpass"
  bp.frequency.value = 2600
  bp.Q.value = 0.9
  const sg = ctx.createGain()
  sg.gain.setValueAtTime(0.12 * velocity, t0)
  sg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.018)
  scrape.connect(bp); bp.connect(sg); sg.connect(input)
  scrape.start(t0); scrape.stop(t0 + 0.025)
}

// Percussive muted strum ("chuck"): noise snap + low thump, no pitch.
export function playMutedStrum(when = 0, velocity = 1): void {
  const { ctx, bus } = getMaster()
  const t0 = ctx.currentTime + when

  // Chuck real sampleado si ya cargó (round-robin entre 25 variantes)
  const smp = getMutedSample(ctx, velocity)
  if (smp) {
    const src = ctx.createBufferSource()
    src.buffer = smp.buffer
    src.playbackRate.value = smp.rate
    const g = ctx.createGain()
    g.gain.value = smp.gain
    src.connect(g)
    g.connect(bus)
    src.start(t0)
    return
  }

  const dur = 0.055

  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx, dur, 7)
  const bp = ctx.createBiquadFilter()
  bp.type = "bandpass"
  bp.frequency.value = 900
  bp.Q.value = 0.8
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.40 * velocity, t0)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
  src.connect(bp); bp.connect(g); g.connect(bus)
  src.start(t0); src.stop(t0 + dur + 0.01)

  const osc = ctx.createOscillator()
  osc.type = "sine"
  osc.frequency.setValueAtTime(160, t0)
  osc.frequency.exponentialRampToValueAtTime(70, t0 + 0.05)
  const g2 = ctx.createGain()
  g2.gain.setValueAtTime(0, t0)
  g2.gain.linearRampToValueAtTime(0.16 * velocity, t0 + 0.004)
  g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09)
  osc.connect(g2); g2.connect(bus)
  osc.start(t0); osc.stop(t0 + 0.1)
}

export function getAudioTime(): number {
  const { ctx } = getMaster()
  return ctx.currentTime
}

// The two DynamicsCompressors on the master bus add a fixed lookahead delay
// (~6ms each), and the device adds output latency on top. UI animations that
// fire at the *scheduled* audio time land visibly early without this offset.
const COMPRESSOR_LOOKAHEAD_S = 0.012

export function getVisualLatencyMs(): number {
  const { ctx } = getMaster()
  const c = ctx as AudioContext & { outputLatency?: number; baseLatency?: number }
  return (COMPRESSOR_LOOKAHEAD_S + (c.baseLatency ?? 0) + (c.outputLatency ?? 0)) * 1000
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
