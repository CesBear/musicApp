"use client"

import { useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import type { CircleSelection } from "@/components/CircleOfFifths"
const CircleOfFifths = dynamic(() => import("@/components/CircleOfFifths"), { ssr: false })
import { CIRCLE_NOTES } from "@/data/circle"
import {
  DEGREE_COLORS, DEGREE_LABELS,
  MAJOR_TRIADS, MINOR_TRIADS,
  getNoteName,
} from "@/data/scales"

export default function CirculoQuintasPage() {
  const [selected, setSelected] = useState<CircleSelection | null>({
    name: "C", kind: "major", rootIdx: 0, sharps: 0, hue: 70,
  })

  const majorIntervals = [0, 2, 4, 5, 7, 9, 11]
  const minorIntervals = [0, 2, 3, 5, 7, 8, 10]
  const intervals = selected?.kind === "minor" ? minorIntervals : majorIntervals
  const triads = selected?.kind === "minor" ? MINOR_TRIADS : MAJOR_TRIADS
  const notes = selected ? intervals.map(i => (selected.rootIdx + i) % 12) : []

  const idx = CIRCLE_NOTES.findIndex(n => selected?.kind === "major" ? n.major === selected.name : n.minor === selected?.name)
  const note = idx >= 0 ? CIRCLE_NOTES[idx] : null
  const relativeName = selected?.kind === "major" ? note?.minor : note?.major

  const tonic = selected ? selected.rootIdx : 0
  const subdominant = (tonic + 5) % 12
  const dominant = (tonic + 7) % 12

  return (
    <div className="flex flex-col gap-8">
      <div className="mc-hero">
        <div>
          <div className="mc-eyebrow">Estudio · Círculo de Quintas</div>
          <h1 className="mc-h1">
            <span style={{ color: "rgba(255,255,255,0.95)", fontStyle: "italic" }}>Mapa de </span>
            <span style={{ color: DEGREE_COLORS[0] }}>tonalidades</span>
          </h1>
          <p className="mc-lede">Las notas externas son mayores; las internas, sus relativas menores. Cada paso horario sube una quinta justa — y suma un sostenido en la armadura.</p>
        </div>
      </div>

      <div className="mc-circulo-grid">
        <div className="mc-circulo-stage">
          <CircleOfFifths selected={selected} onSelect={setSelected} />
        </div>

        <div className="mc-circulo-side">
          {selected ? (
            <>
              <div className="mc-info-card" style={{
                borderColor: `oklch(0.74 0.10 ${selected.hue} / 0.35)`,
                background: `oklch(0.74 0.10 ${selected.hue} / 0.06)`,
              }}>
                <p className="mc-info-label" style={{ color: `oklch(0.78 0.10 ${selected.hue})` }}>Tonalidad seleccionada</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 56, lineHeight: 1, fontStyle: "italic", letterSpacing: "-0.03em", color: "#fff" }}>{selected.name}</span>
                  <span className="mc-mono-tag">{selected.kind === "major" ? "MAYOR" : "MENOR"}</span>
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 10, lineHeight: 1.5 }}>
                  Relativa {selected.kind === "major" ? "menor" : "mayor"}: <span style={{ color: "rgba(255,255,255,0.9)" }}>{relativeName}</span>
                </p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 4, lineHeight: 1.5 }}>
                  Armadura: <span style={{ color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-mono)" }}>
                    {note && note.sharps > 0 ? `${note.sharps}♯` : note && note.sharps < 0 ? `${Math.abs(note.sharps)}♭` : "natural"}
                  </span>
                </p>
              </div>

              <div className="mc-info-card">
                <p className="mc-info-label">Notas de la escala</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {notes.map((n, i) => (
                    <div key={i} className="mc-anatomy-note" style={{ minWidth: 44 }}>
                      <span className="mc-anatomy-deg" style={{ color: DEGREE_COLORS[i] }}>{DEGREE_LABELS[i]}</span>
                      <span className="mc-anatomy-noteName" style={{ fontSize: 14 }}>{getNoteName(n)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mc-info-card">
                <p className="mc-info-label">Cadencia principal · I – IV – V</p>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  {[
                    { deg: "I",  note: tonic,       q: triads[0] },
                    { deg: "IV", note: subdominant, q: triads[3] },
                    { deg: "V",  note: dominant,    q: triads[4] },
                  ].map((c, i) => (
                    <div key={i} className="mc-cadence-card">
                      <span className="mc-cadence-deg">{c.deg}</span>
                      <span className="mc-cadence-name">{getNoteName(c.note)}{c.q.symbol}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                  La progresión más común en {selected.kind === "major" ? "mayor" : "menor"}.
                </p>
              </div>

              <div className="mc-info-card mc-info-card-quiet">
                <p className="mc-info-label">Cómo leer el círculo</p>
                <ul className="mc-tips">
                  <li>↻ Horario: sube una quinta · +1 sostenido</li>
                  <li>↺ Anti-horario: sube una cuarta · +1 bemol</li>
                  <li>Vecinos cercanos = modulación natural</li>
                </ul>
              </div>

              <Link
                href={`/progresiones?root=${selected.rootIdx}&mode=${selected.kind}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px 16px", borderRadius: 8, textDecoration: "none",
                  border: `1px solid oklch(0.74 0.10 ${selected.hue} / 0.3)`,
                  background: `oklch(0.74 0.10 ${selected.hue} / 0.07)`,
                  color: `oklch(0.78 0.10 ${selected.hue})`,
                  fontSize: 11, fontFamily: "var(--font-mono)",
                  letterSpacing: "0.1em", fontWeight: 600,
                  transition: "all 0.15s",
                }}>
                EXPLORAR EN PROGRESIONES →
              </Link>
            </>
          ) : (
            <div className="mc-info-card mc-info-card-quiet">
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Toca cualquier tonalidad para ver sus notas, relativa y cadencia principal.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
