"use client"

import { useState, useSyncExternalStore } from "react"
import {
  AMP_PRESETS, getAmpSettings, setAmpSettings, selectAmpPreset, subscribeAmp,
  type AmpPresetId, type AmpSettings,
} from "@/lib/ampSettings"
import { playChord } from "@/lib/audio"

// Panel global del amplificador (barra lateral): preset + perillas. Los cambios se
// oyen al instante en toda la app y quedan guardados en el navegador.

const SERVER: AmpSettings = AMP_PRESETS.limpio.settings
const KNOBS: { key: keyof AmpSettings; label: string; min: number; max: number; step: number; fmt: (v: number) => string }[] = [
  { key: "drive",  label: "Ganancia", min: 0,   max: 1,  step: 0.01, fmt: v => `${Math.round(v * 10)}` },
  { key: "bass",   label: "Graves",   min: -12, max: 12, step: 1,    fmt: v => `${v > 0 ? "+" : ""}${v}` },
  { key: "mid",    label: "Medios",   min: -12, max: 12, step: 1,    fmt: v => `${v > 0 ? "+" : ""}${v}` },
  { key: "treble", label: "Agudos",   min: -12, max: 12, step: 1,    fmt: v => `${v > 0 ? "+" : ""}${v}` },
  { key: "chorus", label: "Chorus",   min: 0,   max: 1,  step: 0.01, fmt: v => `${Math.round(v * 10)}` },
  { key: "delay",  label: "Delay",    min: 0,   max: 1,  step: 0.01, fmt: v => `${Math.round(v * 10)}` },
  { key: "reverb", label: "Reverb",   min: 0,   max: 1,  step: 0.01, fmt: v => `${Math.round(v * 10)}` },
]

export default function AmpPanel() {
  const s = useSyncExternalStore(subscribeAmp, getAmpSettings, () => SERVER)
  const [open, setOpen] = useState(false)
  const edited = JSON.stringify(s) !== JSON.stringify(AMP_PRESETS[s.preset].settings)

  return (
    <div className="mm-amp">
      <button className="mm-amp-head" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="mc-eyebrow">Sonido</span>
        <span style={{ fontSize: 12.5, color: "var(--text-1)", marginLeft: "auto" }}>
          {AMP_PRESETS[s.preset].label}{edited ? " *" : ""}
        </span>
        <span style={{ fontSize: 10, color: "var(--text-3)" }}>{open ? "▴" : "▾"}</span>
      </button>
      <div className="mm-amp-presets">
        {(Object.keys(AMP_PRESETS) as AmpPresetId[]).map(id => (
          <button key={id} data-on={s.preset === id || undefined} title={AMP_PRESETS[id].desc}
            onClick={() => { selectAmpPreset(id); playChord([-1, 3, 2, 0, 1, 0]) }}>
            {AMP_PRESETS[id].label}
          </button>
        ))}
      </div>
      {open && (
        <div className="mm-amp-knobs">
          <p style={{ margin: 0, fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.4 }}>{AMP_PRESETS[s.preset].desc}</p>
          {KNOBS.map(k => {
            const disabled = !s.amp && ["drive", "bass", "mid", "treble"].includes(k.key)
            return (
              <label key={k.key} className="mm-amp-knob" style={{ opacity: disabled ? 0.4 : 1 }}>
                <span>{k.label}</span>
                <input type="range" className="mc-slider" min={k.min} max={k.max} step={k.step} disabled={disabled}
                  value={s[k.key] as number} onChange={e => setAmpSettings({ [k.key]: Number(e.target.value) })} />
                <span className="mm-amp-val">{k.fmt(s[k.key] as number)}</span>
              </label>
            )
          })}
          <div style={{ display: "flex", gap: 6 }}>
            <button className="mc-btn-ghost" style={{ flex: 1, justifyContent: "center", padding: "6px 8px", fontSize: 12 }}
              onClick={() => playChord([-1, 3, 2, 0, 1, 0])}>▶ Probar</button>
            {edited && (
              <button className="mc-btn-ghost" style={{ padding: "6px 8px", fontSize: 12 }}
                onClick={() => selectAmpPreset(s.preset)}>Restablecer</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
