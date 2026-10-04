"use client"

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import { STRING_LABELS } from "@/data/scales"

// Mástil base compartido (Escalas, Tríadas) de guitarra eléctrica: diapasón de
// ébano o maple (a elección del usuario), trastes jumbo, cuerdas de níquel con
// grosor por calibre e inlays de puntos. Las notas las dibuja cada página vía
// `children`, usando la geometría que se le pasa.

export const NECK = {
  SS: 38,   // separación entre cuerdas
  FW: 50,   // ancho de traste
  LM: 46,   // margen entre etiquetas y cejuela (aloja las notas al aire)
  TM: 34,   // margen superior (badges sobre la 1ª cuerda)
  BM: 44,   // margen inferior (números de traste)
  LW: 22,   // columna de etiquetas de cuerda
} as const

export type NeckGeometry = {
  sx:    (fret: number) => number   // x de la línea del traste `fret`
  sy:    (str: number) => number    // y de la cuerda (0 = E grave, abajo)
  noteX: (fret: number) => number   // x donde va el círculo de una nota
  FW: number
  SS: number
  numFrets: number
  /** ids de <defs> compartidos: sombra para las notas */
  noteShadow: string
}

// Acabados de guitarra eléctrica. Cada uno define madera, cejuela e inlays.
type Finish = {
  wood:  [string, string, string]     // degradado arriba → centro → abajo
  grain: string                       // feColorMatrix de las vetas (color + intensidad)
  grainOpacity: number
  nut:   [string, string, string]
  inlay: "pearl" | "black"
  binding?: string                    // filete (Les Paul Custom); sin filete si se omite
}
export type FinishId = "ebony" | "maple"
const FINISHES: Record<FinishId, Finish> = {
  // Ébano: casi negro y liso, cejuela negra de grafito (Ibanez / ESP / Les Paul Custom)
  ebony: {
    wood: ["oklch(0.17 0.006 60)", "oklch(0.20 0.008 60)", "oklch(0.155 0.006 60)"],
    grain: "0 0 0 0 0.02  0 0 0 0 0.02  0 0 0 0 0.02  0 0 0 0.6 -0.25", grainOpacity: 0.5,
    nut: ["oklch(0.22 0 0)", "oklch(0.34 0 0)", "oklch(0.20 0 0)"],
    inlay: "pearl",
  },
  // Maple: claro y barnizado, puntos negros (Strat / Tele)
  maple: {
    wood: ["oklch(0.78 0.07 78)", "oklch(0.83 0.075 82)", "oklch(0.74 0.07 74)"],
    grain: "0 0 0 0 0.45  0 0 0 0 0.30  0 0 0 0 0.12  0 0 0 1.0 -0.4", grainOpacity: 0.5,
    nut: ["oklch(0.82 0.03 85)", "oklch(0.95 0.02 88)", "oklch(0.80 0.03 82)"],
    inlay: "black",
  },
}
const FINISH_LABEL: Record<FinishId, string> = { ebony: "Ébano", maple: "Maple" }

// Preferencia compartida por todos los mástiles de la app (localStorage + aviso
// a las instancias montadas para que cambien a la vez).
const FINISH_KEY = "mm-neck-finish"
const finishListeners = new Set<() => void>()
function readFinish(): FinishId {
  try { return localStorage.getItem(FINISH_KEY) === "maple" ? "maple" : "ebony" } catch { return "ebony" }
}
function writeFinish(f: FinishId) {
  try { localStorage.setItem(FINISH_KEY, f) } catch { /**/ }
  finishListeners.forEach(l => l())
}
function subscribeFinish(l: () => void) {
  finishListeners.add(l)
  window.addEventListener("storage", l)
  return () => { finishListeners.delete(l); window.removeEventListener("storage", l) }
}

const SINGLE_DOTS = [3, 5, 7, 9, 15, 17, 19, 21]
const DOUBLE_DOTS = [12, 24]
// Calibres 10–46 (e→E), exagerados un poco para que se lean en pantalla.
const STRING_WIDTHS = [3.1, 2.6, 2.1, 1.55, 1.2, 0.95]
const WOUND = [true, true, true, false, false, false]

interface Props {
  numFrets:       number
  activeStrings?: Set<number> | null
  /** se dibuja sobre la madera y debajo de cuerdas (ej. resaltar una posición) */
  underlay?:      (g: NeckGeometry) => ReactNode
  children:       (g: NeckGeometry) => ReactNode
}

export default function FretboardNeck({ numFrets, activeStrings = null, underlay, children }: Props) {
  const { SS, FW, LM, TM, BM, LW } = NECK
  const finishId = useSyncExternalStore(subscribeFinish, readFinish, () => "ebony" as const)
  const FINISH = FINISHES[finishId]
  const uid = useId().replace(/:/g, "")
  const id = (k: string) => `${k}-${uid}`

  const W = LW + LM + numFrets * FW + 14
  const H = TM + 5 * SS + BM

  const nutX   = LW + LM
  const sx     = (fret: number) => nutX + fret * FW
  const sy     = (str: number) => TM + (5 - str) * SS   // e aguda arriba
  const noteX  = (fret: number) => fret === 0 ? nutX - 24 : sx(fret) - FW / 2
  const boardT = TM - SS * 0.55
  const boardB = sy(0) + SS * 0.55
  const boardR = sx(numFrets) + 6
  const midY   = (boardT + boardB) / 2

  const geo: NeckGeometry = { sx, sy, noteX, FW, SS, numFrets, noteShadow: id("noteShadow") }
  const isActive = (s: number) => !activeStrings || activeStrings.has(s)

  // Indicador de scroll: degradado en el borde que aún tiene contenido oculto.
  const scrollRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => setEdges({
      left:  el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    })
    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => { el.removeEventListener("scroll", update); ro.disconnect() }
  }, [])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <div className="mc-fretboard-wrap" data-fade-left={edges.left || undefined} data-fade-right={edges.right || undefined}>
      <div ref={scrollRef} className="mc-fretboard-scroll">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ minWidth: W, display: "block" }}>
          <defs>
            {/* Palisandro: base cálida + vetas horizontales finas */}
            <linearGradient id={id("wood")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={FINISH.wood[0]} />
              <stop offset="50%"  stopColor={FINISH.wood[1]} />
              <stop offset="100%" stopColor={FINISH.wood[2]} />
            </linearGradient>
            <filter id={id("grain")} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.006 0.45" numOctaves="3" seed="7" />
              <feColorMatrix values={FINISH.grain} />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
            <linearGradient id={id("fret")} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="oklch(0.62 0.01 250)" />
              <stop offset="45%"  stopColor="oklch(0.93 0.008 250)" />
              <stop offset="100%" stopColor="oklch(0.55 0.01 250)" />
            </linearGradient>
            <linearGradient id={id("nut")} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={FINISH.nut[0]} />
              <stop offset="50%"  stopColor={FINISH.nut[1]} />
              <stop offset="100%" stopColor={FINISH.nut[2]} />
            </linearGradient>
            <radialGradient id={id("pearl")} cx="0.35" cy="0.35" r="0.75">
              <stop offset="0%"   stopColor="oklch(0.97 0.01 90)" />
              <stop offset="60%"  stopColor="oklch(0.86 0.03 200)" />
              <stop offset="100%" stopColor="oklch(0.74 0.04 300)" />
            </radialGradient>
            <radialGradient id={id("blackDot")} cx="0.4" cy="0.4" r="0.7">
              <stop offset="0%"   stopColor="oklch(0.30 0 0)" />
              <stop offset="100%" stopColor="oklch(0.12 0 0)" />
            </radialGradient>
            {/* Juego eléctrico: E-A-D entorchadas en níquel, G-B-e lisas de acero */}
            <linearGradient id={id("wound")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="oklch(0.94 0.012 85)" />
              <stop offset="100%" stopColor="oklch(0.60 0.015 75)" />
            </linearGradient>
            <linearGradient id={id("plain")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="oklch(0.97 0.005 250)" />
              <stop offset="100%" stopColor="oklch(0.70 0.01 250)" />
            </linearGradient>
            <filter id={id("noteShadow")} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor="#000" floodOpacity="0.55" />
            </filter>
          </defs>

          {/* Etiquetas de cuerda */}
          {STRING_LABELS.map((label, s) => (
            <text key={s} x={LW / 2} y={sy(s)} textAnchor="middle" dominantBaseline="middle"
              fontSize={11} fontWeight="600"
              fill={isActive(s) ? "var(--text-2)" : "var(--text-4)"}
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
              {label}
            </text>
          ))}

          {/* Diapasón */}
          <rect x={nutX} y={boardT} width={boardR - nutX} height={boardB - boardT} fill={`url(#${id("wood")})`} />
          <rect x={nutX} y={boardT} width={boardR - nutX} height={boardB - boardT} fill="#000" filter={`url(#${id("grain")})`} opacity={FINISH.grainOpacity} />
          {/* Canto del diapasón sin filete, como en un mástil eléctrico */}
          <line x1={nutX} y1={boardT + 0.5} x2={boardR} y2={boardT + 0.5} stroke="rgba(0,0,0,0.5)" strokeWidth={1} />
          <line x1={nutX} y1={boardB - 0.5} x2={boardR} y2={boardB - 0.5} stroke="rgba(255,235,210,0.12)" strokeWidth={1} />

          {/* Inlays */}
          {SINGLE_DOTS.filter(f => f <= numFrets).map(f => (
            <circle key={f} cx={sx(f) - FW / 2} cy={midY} r={5.5} fill={`url(#${id(FINISH.inlay === "pearl" ? "pearl" : "blackDot")})`} opacity={0.8} />
          ))}
          {DOUBLE_DOTS.filter(f => f <= numFrets).map(f => (
            <g key={f} opacity={0.8}>
              <circle cx={sx(f) - FW / 2} cy={TM + 1.5 * SS} r={5.5} fill={`url(#${id(FINISH.inlay === "pearl" ? "pearl" : "blackDot")})`} />
              <circle cx={sx(f) - FW / 2} cy={TM + 3.5 * SS} r={5.5} fill={`url(#${id(FINISH.inlay === "pearl" ? "pearl" : "blackDot")})`} />
            </g>
          ))}

          {/* Marcas laterales (side dots) en el canto superior */}
          {[...SINGLE_DOTS, ...DOUBLE_DOTS].filter(f => f <= numFrets).map(f => (
            <circle key={f} cx={sx(f) - FW / 2} cy={boardT - 4} r={1.8} fill="oklch(0.92 0.02 90 / 0.75)" />
          ))}

          {underlay?.(geo)}

          {/* Trastes */}
          {Array.from({ length: numFrets }, (_, i) => i + 1).map(f => (
            <g key={f}>
              <rect x={sx(f)} y={boardT} width={2.5} height={boardB - boardT} fill="rgba(0,0,0,0.4)" />
              <rect x={sx(f) - 2} y={boardT} width={4} height={boardB - boardT} rx={1.5} fill={`url(#${id("fret")})`} />
            </g>
          ))}

          {/* Cejuela */}
          <rect x={nutX - 7} y={boardT - 2} width={7} height={boardB - boardT + 4} rx={1.5} fill={`url(#${id("nut")})`} />

          {/* Cuerdas: sombra sobre la madera + cuerda + entorchado */}
          {STRING_WIDTHS.map((w, s) => {
            const y = sy(s)
            const on = isActive(s)
            return (
              <g key={s} opacity={on ? 1 : 0.28} style={{ transition: "opacity 0.18s ease" }}>
                <line x1={nutX} y1={y + w * 0.9 + 1} x2={boardR} y2={y + w * 0.9 + 1} stroke="rgba(0,0,0,0.45)" strokeWidth={w} />
                <rect x={nutX - 7} y={y - w / 2} width={boardR - nutX + 7} height={w}
                  fill={`url(#${id(WOUND[s] ? "wound" : "plain")})`} />
                {WOUND[s] && (
                  <line x1={nutX - 7} y1={y} x2={boardR} y2={y} stroke="rgba(0,0,0,0.18)"
                    strokeWidth={w} strokeDasharray="0.5 0.7" />
                )}
              </g>
            )
          })}

          {/* Números de traste */}
          {[3, 5, 7, 9, 12, 15, 17, 19, 21, 24].filter(f => f <= numFrets).map(f => {
            const octave = f === 12 || f === 24
            return (
              <text key={f} x={sx(f) - FW / 2} y={boardB + 17} textAnchor="middle"
                fontSize={11} fill={octave ? "var(--text-1)" : "var(--text-3)"}
                fontWeight={octave ? "700" : "500"}
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                {f}
              </text>
            )
          })}

          {children(geo)}
        </svg>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
      <span className="mc-eyebrow">Diapasón</span>
      <div className="mm-seg" role="group" aria-label="Madera del diapasón">
        {(Object.keys(FINISHES) as FinishId[]).map(f => (
          <button key={f} data-on={finishId === f || undefined} onClick={() => writeFinish(f)}>{FINISH_LABEL[f]}</button>
        ))}
      </div>
    </div>
    </div>
  )
}
