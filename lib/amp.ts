// Amplificador y efectos de guitarra con Web Audio nativo.
//
//   guitarIn ─┬─ directo ───────────────────────────────────────────┐
//             └─ preamp (waveshaper) → EQ (graves/medios/agudos) →   ├→ fxIn
//                gabinete (HPF, resonancia, presencia, LPF) ─────────┘
//   fxIn ─┬─ seco ──────────────────────┐
//         └─ chorus estéreo (2 voces) ──┴→ pre ─┬─→ salida
//                                               ├─ delay (feedback filtrado) ─→ salida
//                                               └─ reverb (convolver, IR sintética) ─→ salida
//
// El power chord con distorsión (playChugChord) trae su propio preamp y entra
// directo en fxIn: comparte chorus, delay y reverb pero no se satura dos veces.
import type { AmpSettings } from "@/lib/ampSettings"

export interface AmpChain {
  guitarIn: GainNode     // guitarra limpia (samples / síntesis)
  fxIn:     GainNode     // señales ya amplificadas (chug)
  apply:    (s: AmpSettings) => void
}

function driveCurve(k: number): Float32Array<ArrayBuffer> {
  const n = 2048
  const curve = new Float32Array(new ArrayBuffer(n * 4))
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1
    // tanh asimétrica: un poco más de recorte en un semiciclo = armónicos pares (sonido valvular)
    curve[i] = x >= 0 ? Math.tanh(k * x) / Math.tanh(k) : Math.tanh(k * 0.85 * x) / Math.tanh(k * 0.85)
  }
  return curve
}

// Respuesta al impulso sintética: ruido estéreo con decaimiento exponencial que se
// oscurece con el tiempo (como una sala real, donde los agudos se absorben antes).
function makeImpulse(ctx: BaseAudioContext, seconds = 2.2): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  let seed = 12345
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff * 2 - 1 }
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    let lp = 0
    const pre = Math.floor(ctx.sampleRate * 0.012)
    for (let i = 0; i < len; i++) {
      if (i < pre) { d[i] = 0; continue }
      const t = (i - pre) / ctx.sampleRate
      const a = 0.25 + 0.7 * Math.min(1, t / seconds)          // más oscuro con el tiempo
      lp = lp + (1 - a) * (rand() - lp)
      d[i] = lp * Math.exp(-3.4 * t / seconds)
    }
  }
  return buf
}

// Calibrados con renders offline (ver scratchpad tone.mts): picos y RMS parejos entre presets
const MAKEUP = 1.6
const DRIVE_LIFT = 0.25

export function buildAmp(ctx: BaseAudioContext, out: AudioNode): AmpChain {
  const guitarIn = ctx.createGain()
  const fxIn = ctx.createGain()

  // ── Directo vs. amplificado ──
  const direct = ctx.createGain()
  guitarIn.connect(direct); direct.connect(fxIn)

  const pre = ctx.createGain()
  const shaper = ctx.createWaveShaper()
  shaper.oversample = "4x"
  const bass = ctx.createBiquadFilter();   bass.type = "lowshelf";  bass.frequency.value = 140
  const mid = ctx.createBiquadFilter();    mid.type = "peaking";    mid.frequency.value = 750; mid.Q.value = 0.8
  const treble = ctx.createBiquadFilter(); treble.type = "highshelf"; treble.frequency.value = 3000
  // Gabinete 1×12: sin graves inútiles, cuerpo en 110 Hz, presencia en 2.3 kHz y
  // caída fuerte arriba de ~5.5 kHz (lo que le quita lo «de cable» a la señal directa)
  const cabHP = ctx.createBiquadFilter();   cabHP.type = "highpass";  cabHP.frequency.value = 85; cabHP.Q.value = 0.7
  const cabBody = ctx.createBiquadFilter(); cabBody.type = "peaking"; cabBody.frequency.value = 110; cabBody.Q.value = 1.1; cabBody.gain.value = 2.5
  const cabPres = ctx.createBiquadFilter(); cabPres.type = "peaking"; cabPres.frequency.value = 2300; cabPres.Q.value = 1.2; cabPres.gain.value = 3
  const cabLP1 = ctx.createBiquadFilter();  cabLP1.type = "lowpass";  cabLP1.frequency.value = 5600; cabLP1.Q.value = 0.8
  const cabLP2 = ctx.createBiquadFilter();  cabLP2.type = "lowpass";  cabLP2.frequency.value = 7800; cabLP2.Q.value = 0.5
  const ampOut = ctx.createGain()
  guitarIn.connect(pre); pre.connect(shaper); shaper.connect(bass); bass.connect(mid); mid.connect(treble)
  treble.connect(cabHP); cabHP.connect(cabBody); cabBody.connect(cabPres); cabPres.connect(cabLP1); cabLP1.connect(cabLP2)
  cabLP2.connect(ampOut); ampOut.connect(fxIn)

  // ── Chorus estéreo: dos voces con retardo modulado, una a cada lado ──
  const dry = ctx.createGain()
  const chorusWet = ctx.createGain()
  const sum = ctx.createGain()
  fxIn.connect(dry); dry.connect(sum)
  ;[{ base: 0.013, rate: 0.62, pan: -0.75 }, { base: 0.019, rate: 0.83, pan: 0.75 }].forEach(v => {
    const d = ctx.createDelay(0.05); d.delayTime.value = v.base
    const lfo = ctx.createOscillator(); lfo.frequency.value = v.rate
    const depth = ctx.createGain(); depth.gain.value = 0.0028
    lfo.connect(depth); depth.connect(d.delayTime); lfo.start()
    const p = ctx.createStereoPanner(); p.pan.value = v.pan
    fxIn.connect(d); d.connect(p); p.connect(chorusWet)
  })
  chorusWet.connect(sum)

  // ── Delay con feedback filtrado (cada repetición más oscura) ──
  const delay = ctx.createDelay(2)
  const fb = ctx.createGain()
  const fbLP = ctx.createBiquadFilter(); fbLP.type = "lowpass"; fbLP.frequency.value = 2600
  const fbHP = ctx.createBiquadFilter(); fbHP.type = "highpass"; fbHP.frequency.value = 180
  const delayWet = ctx.createGain()
  const delayPan = ctx.createStereoPanner(); delayPan.pan.value = 0.35
  sum.connect(delay); delay.connect(fbLP); fbLP.connect(fbHP); fbHP.connect(fb); fb.connect(delay)
  fbHP.connect(delayWet); delayWet.connect(delayPan); delayPan.connect(out)

  // ── Reverb ──
  const verb = ctx.createConvolver()
  verb.buffer = makeImpulse(ctx)
  const verbWet = ctx.createGain()
  sum.connect(verb); verb.connect(verbWet); verbWet.connect(out)

  sum.connect(out)

  let lastDrive = -1
  const apply = (s: AmpSettings) => {
    const t = ctx.currentTime
    direct.gain.setTargetAtTime(s.amp ? 0 : 1.5, t, 0.02)
    // Ganancia de entrada y compensación de salida: niveles parejos entre presets (calibrado con renders)
    const k = 1.2 + s.drive * 22
    if (s.drive !== lastDrive) { shaper.curve = driveCurve(k); lastDrive = s.drive }
    pre.gain.setTargetAtTime(1 + s.drive * 2, t, 0.02)
    // La pendiente del tanh en reposo es ≈ k·pre; se compensa y se deja un poco más de
    // volumen al saturar porque la compresión del preamp baja los picos
    const makeup = MAKEUP * (1 + s.drive * DRIVE_LIFT) / (k * (1 + s.drive * 2))
    ampOut.gain.setTargetAtTime(s.amp ? makeup : 0, t, 0.02)
    bass.gain.setTargetAtTime(s.bass, t, 0.02)
    mid.gain.setTargetAtTime(s.mid, t, 0.02)
    treble.gain.setTargetAtTime(s.treble, t, 0.02)
    dry.gain.setTargetAtTime(1 - s.chorus * 0.35, t, 0.02)
    chorusWet.gain.setTargetAtTime(s.chorus * 0.75, t, 0.02)
    delay.delayTime.setTargetAtTime(s.delayTime, t, 0.05)
    fb.gain.setTargetAtTime(0.38, t, 0.02)
    delayWet.gain.setTargetAtTime(s.delay * 0.7, t, 0.02)
    verbWet.gain.setTargetAtTime(s.reverb * 0.9, t, 0.02)
  }

  return { guitarIn, fxIn, apply }
}
