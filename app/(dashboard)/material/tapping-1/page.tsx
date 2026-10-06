"use client"

import TabPractice from "@/components/TabPractice"
import Metronome from "@/components/Metronome"
import { TAPPING_1, TAPPING_1_INTRO, TAPPING_1_TIPS } from "@/data/classes/tapping1"

// Práctica interactiva de la clase de tapping (5 oct 2026). La hoja original está en
// public/clases/tapping-1-shredmaster.pdf y en Material → Técnica.
export default function Tapping1Page() {
  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="mc-hero">
        <div>
          <div className="mc-eyebrow"><a href="/material" style={{ color: "inherit" }}>Material</a> · Técnica · Clase del 5 oct 2026</div>
          <h1 className="mc-h1">Tapping 1</h1>
          <p className="mc-lede">Tapping Shredmaster Class · Secretos del Shred. Los 12 ejercicios de la hoja, para escucharlos y practicarlos a tu tempo hasta llegar a ♩ = 120.</p>
        </div>
        <div className="mc-hero-aside" style={{ minWidth: 0 }}>
          <a href="/clases/tapping-1-shredmaster.pdf" target="_blank" rel="noopener noreferrer" className="mc-btn-ghost" style={{ textDecoration: "none", justifyContent: "center" }}>Abrir la hoja original (PDF)</a>
        </div>
      </div>

      <div className="rz-guide">
        <div className="rz-lesson" style={{ gap: 8 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#fff" }}>La técnica</span>
          {TAPPING_1_INTRO.map(p => <p key={p} style={{ margin: 0, fontSize: 14, color: "var(--text-1)", lineHeight: 1.6 }}>{p}</p>)}
        </div>
        <div className="rz-lesson" style={{ gap: 8 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#fff" }}>Para que suene limpio</span>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            {TAPPING_1_TIPS.map(t => <li key={t} style={{ fontSize: 13.5, color: "var(--text-1)", lineHeight: 1.5 }}>{t}</li>)}
          </ul>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {TAPPING_1.map(({ letter, exercise, goal }) => (
          <section key={exercise.id} className="sf-lesson" style={{ gap: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
              <span className="mm-tag" style={{ color: "var(--mc-accent)", borderColor: "var(--mc-accent-border)", background: "var(--mc-accent-soft)" }}>{letter}</span>
              <span className="mc-eyebrow">{exercise.timeSignature}</span>
            </div>
            <div className="mm-goal"><span className="mm-goal-label">Meta</span><span>{goal}</span></div>
            <TabPractice exercise={exercise} targetBpm={120} />
          </section>
        ))}
      </div>

      <div className="mc-section">
        <div className="mc-section-head" style={{ justifyContent: "flex-start", gap: 10 }}>
          <span className="mc-eyebrow">Metrónomo</span>
          <span className="mc-section-hint">para practicar sin el audio de la tablatura</span>
        </div>
        <Metronome />
      </div>
    </div>
  )
}
