// Ajustes del amplificador y los efectos de guitarra: presets, persistencia en
// localStorage y suscripción para que la UI y el motor de audio (lib/amp.ts)
// estén siempre sincronizados. Sin dependencias de audio: se puede importar en SSR.

export type AmpPresetId = "limpio" | "crunch" | "lead" | "directo"

export interface AmpSettings {
  preset:    AmpPresetId
  amp:       boolean   // false = señal directa (sin preamp ni gabinete)
  drive:     number    // 0–1: saturación del preamp
  bass:      number    // dB, −12…12
  mid:       number
  treble:    number
  chorus:    number    // 0–1: mezcla
  delay:     number    // 0–1: mezcla
  delayTime: number    // segundos
  reverb:    number    // 0–1: mezcla
}

export const AMP_PRESETS: Record<AmpPresetId, { label: string; desc: string; settings: AmpSettings }> = {
  limpio: {
    label: "Limpio", desc: "Single coil limpio con chorus: funk-pop, pop, baladas",
    settings: { preset: "limpio", amp: true, drive: 0.12, bass: 0, mid: -2, treble: 3, chorus: 0.55, delay: 0.1, delayTime: 0.32, reverb: 0.25 },
  },
  crunch: {
    label: "Crunch", desc: "Amplificador al borde de la saturación: rock, blues",
    settings: { preset: "crunch", amp: true, drive: 0.5, bass: 1, mid: 2, treble: 1, chorus: 0, delay: 0.08, delayTime: 0.28, reverb: 0.16 },
  },
  lead: {
    label: "Lead", desc: "Saturado con delay para solos y melodías",
    settings: { preset: "lead", amp: true, drive: 0.8, bass: 0, mid: 3, treble: 0, chorus: 0, delay: 0.32, delayTime: 0.38, reverb: 0.22 },
  },
  directo: {
    label: "Directo", desc: "La guitarra sin amplificador ni efectos",
    settings: { preset: "directo", amp: false, drive: 0, bass: 0, mid: 0, treble: 0, chorus: 0, delay: 0, delayTime: 0.3, reverb: 0 },
  },
}

const KEY = "mm-amp"
const listeners = new Set<(s: AmpSettings) => void>()
let current: AmpSettings | null = null

function load(): AmpSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<AmpSettings>
      const base = AMP_PRESETS[saved.preset as AmpPresetId]?.settings ?? AMP_PRESETS.limpio.settings
      return { ...base, ...saved }
    }
  } catch { /**/ }
  return AMP_PRESETS.limpio.settings
}

export function getAmpSettings(): AmpSettings {
  if (!current) current = load()
  return current
}

export function setAmpSettings(next: Partial<AmpSettings>) {
  current = { ...getAmpSettings(), ...next }
  try { localStorage.setItem(KEY, JSON.stringify(current)) } catch { /**/ }
  listeners.forEach(l => l(current!))
}

export function selectAmpPreset(id: AmpPresetId) {
  setAmpSettings(AMP_PRESETS[id].settings)
}

export function subscribeAmp(l: (s: AmpSettings) => void) {
  listeners.add(l)
  return () => { listeners.delete(l) }
}
