"use client"

import { useEffect, useRef } from "react"

// ───────────────────────────────────────────────────────────────
// MusicApp · Login backgrounds
// Four music-themed animated canvas backgrounds for the login screen.
// All share a useCanvasAnim hook that handles DPR scaling and the raf loop.
// ───────────────────────────────────────────────────────────────

function useCanvasAnim(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    let rect = canvas.getBoundingClientRect()
    let t = 0
    let raf = 0
    function resize() {
      if (!canvas || !ctx) return
      rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener("resize", resize)
    function loop() {
      if (!ctx) return
      ctx.clearRect(0, 0, rect.width, rect.height)
      draw(ctx, rect.width, rect.height, t)
      t += 16
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [draw])
  return canvasRef
}

// ─── 1) Cuerdas — vibrating guitar strings, one plucked every ~2s ─
export function BgStrings() {
  const ref = useCanvasAnim((ctx, W, H, t) => {
    const N = 6
    const strokeWidths = [2.4, 2.0, 1.6, 1.3, 1.0, 0.85]
    const spacing = H / (N + 1)
    const pluckPhase = (t / 1000) * 0.5
    const pluckedIdx = Math.floor(pluckPhase) % N
    const pluckTime = pluckPhase - Math.floor(pluckPhase)
    for (let i = 0; i < N; i++) {
      const y0 = spacing * (i + 1)
      const isPlucked = i === pluckedIdx
      const decay = Math.exp(-pluckTime * 4)
      const baseAmp = isPlucked ? 14 * decay : 1.5
      const freq = 0.012 + i * 0.002
      const phase = t * 0.005 + i * 0.4
      ctx.beginPath()
      for (let x = 0; x <= W; x += 3) {
        const env = Math.sin((x / W) * Math.PI)
        const ripple = Math.sin(x * freq + phase) * baseAmp * env
        const y = y0 + ripple
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      const op = isPlucked ? 0.18 + 0.25 * decay : 0.06 + (i / N) * 0.04
      ctx.strokeStyle = isPlucked
        ? `oklch(0.80 0.15 70 / ${op})`
        : `rgba(255, 220, 180, ${op})`
      ctx.lineWidth = strokeWidths[i]
      ctx.stroke()
    }
  })
  return <canvas ref={ref} className="mc-login-bg-canvas" />
}

// ─── 2) Pentagrama — floating music glyphs drift upward over staff lines ─
type Note = { x: number; y: number; vy: number; drift: number; glyph: string; size: number; op: number; phase: number }

export function BgPentagrama() {
  const notesRef = useRef<Note[] | null>(null)
  if (!notesRef.current) {
    notesRef.current = Array.from({ length: 22 }).map(() => ({
      x: Math.random() * 1600,
      y: 600 + Math.random() * 800,
      vy: 0.15 + Math.random() * 0.35,
      drift: Math.random() * 0.4 - 0.2,
      glyph: ["♩", "♪", "♫", "♬", "♭", "♯"][Math.floor(Math.random() * 6)],
      size: 12 + Math.random() * 24,
      op: 0.15 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    }))
  }
  const ref = useCanvasAnim((ctx, W, H, t) => {
    const cy = H * 0.5
    const lineGap = 14
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath()
      ctx.moveTo(0, cy + i * lineGap)
      ctx.lineTo(W, cy + i * lineGap)
      ctx.strokeStyle = "rgba(255,255,255,0.05)"
      ctx.lineWidth = 0.7
      ctx.stroke()
    }
    const notes = notesRef.current!
    for (const n of notes) {
      n.y -= n.vy
      n.x += Math.sin(t * 0.001 + n.phase) * n.drift
      if (n.y < -50) {
        n.y = H + 50
        n.x = Math.random() * W
      }
      ctx.fillStyle = `rgba(255, 220, 180, ${n.op})`
      ctx.font = `${n.size}px "Instrument Serif", serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(n.glyph, n.x, n.y)
    }
    ctx.save()
    ctx.translate(W / 2, cy)
    ctx.fillStyle = "rgba(255,220,180,0.04)"
    ctx.font = '320px "Instrument Serif", serif'
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("𝄞", 0, 8)
    ctx.restore()
  })
  return <canvas ref={ref} className="mc-login-bg-canvas" />
}

// ─── 3) Espectro — equalizer bars across bottom with mirrored reflection ─
type Bar = { target: number; current: number; f1: number; f2: number; phase: number }

export function BgEspectro() {
  const barsRef = useRef<Bar[] | null>(null)
  if (!barsRef.current) {
    barsRef.current = Array.from({ length: 96 }).map((_, i) => ({
      target: 0.2, current: 0.2,
      f1: 0.0008 + (i % 7) * 0.0003,
      f2: 0.0015 + (i % 5) * 0.0004,
      phase: i * 0.4,
    }))
  }
  const ref = useCanvasAnim((ctx, W, H, t) => {
    const bars = barsRef.current!
    const N = bars.length
    const barW = W / N
    const padX = barW * 0.18
    const baseY = H * 0.62
    const maxH = H * 0.46
    for (let i = 0; i < N; i++) {
      const b = bars[i]
      const env = 1 - Math.abs((i / N) * 2 - 1) * 0.7
      const v = (Math.sin(t * b.f1 + b.phase) * 0.5 + 0.5)
              * (Math.sin(t * b.f2 + b.phase * 1.7) * 0.4 + 0.6)
      b.target = Math.max(0.08, v * env)
      b.current += (b.target - b.current) * 0.18
      const h = b.current * maxH
      const x = i * barW + padX
      const w = barW - padX * 2
      const grad = ctx.createLinearGradient(0, baseY - h, 0, baseY)
      grad.addColorStop(0, "rgba(255, 200, 130, 0.32)")
      grad.addColorStop(1, "rgba(255, 200, 130, 0.04)")
      ctx.fillStyle = grad
      const r = Math.min(w / 2, 2)
      ctx.beginPath()
      ctx.moveTo(x + r, baseY - h)
      ctx.lineTo(x + w - r, baseY - h)
      ctx.quadraticCurveTo(x + w, baseY - h, x + w, baseY - h + r)
      ctx.lineTo(x + w, baseY)
      ctx.lineTo(x, baseY)
      ctx.lineTo(x, baseY - h + r)
      ctx.quadraticCurveTo(x, baseY - h, x + r, baseY - h)
      ctx.closePath()
      ctx.fill()
      const grad2 = ctx.createLinearGradient(0, baseY, 0, baseY + h * 0.6)
      grad2.addColorStop(0, "rgba(255, 200, 130, 0.10)")
      grad2.addColorStop(1, "rgba(255, 200, 130, 0)")
      ctx.fillStyle = grad2
      ctx.fillRect(x, baseY, w, h * 0.6)
    }
    ctx.beginPath()
    ctx.moveTo(0, baseY)
    ctx.lineTo(W, baseY)
    ctx.strokeStyle = "rgba(255,200,130,0.18)"
    ctx.lineWidth = 1
    ctx.stroke()
  })
  return <canvas ref={ref} className="mc-login-bg-canvas" />
}

// ─── 4) Mástil — fretboard with notes lighting up in a pentatonic walk ─
export function BgMastil() {
  const ref = useCanvasAnim((ctx, W, H, t) => {
    const NS = 6
    const NF = 14
    const pad = 60
    const fbW = W - pad * 2
    const fbH = Math.min(H * 0.4, 320)
    const x0 = pad
    const y0 = (H - fbH) / 2
    const fretW = fbW / NF
    const stringH = fbH / (NS - 1)

    ctx.fillStyle = "rgba(255,255,255,0.012)"
    ctx.fillRect(x0, y0, fbW, fbH)

    for (let f = 0; f <= NF; f++) {
      ctx.beginPath()
      ctx.moveTo(x0 + f * fretW, y0)
      ctx.lineTo(x0 + f * fretW, y0 + fbH)
      const isOctave = f === 12
      ctx.strokeStyle = isOctave ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)"
      ctx.lineWidth = isOctave ? 1.2 : 0.7
      ctx.stroke()
    }
    for (let s = 0; s < NS; s++) {
      ctx.beginPath()
      ctx.moveTo(x0, y0 + s * stringH)
      ctx.lineTo(x0 + fbW, y0 + s * stringH)
      ctx.strokeStyle = `rgba(255,255,255,${0.04 + s * 0.01})`
      ctx.lineWidth = 0.8 + s * 0.18
      ctx.stroke()
    }
    ;[3, 5, 7, 9, 12].forEach(f => {
      const xx = x0 + (f - 0.5) * fretW
      const yy = y0 + fbH / 2
      ctx.beginPath()
      ctx.arc(xx, yy, 3, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(255,255,255,0.06)"
      ctx.fill()
    })

    const positions: [number, number][] = [
      [0, 5], [0, 7], [1, 5], [1, 7], [2, 5], [2, 7],
      [3, 5], [3, 7], [4, 5], [4, 8], [5, 5], [5, 7],
    ]
    const cycle = (t / 200) % positions.length
    positions.forEach(([s, f], i) => {
      const xx = x0 + (f - 0.5) * fretW
      const yy = y0 + s * stringH
      const dist = Math.abs(((cycle - i) + positions.length) % positions.length)
      const activeness = Math.max(0, 1 - Math.min(dist, positions.length - dist) * 0.6)
      const isCurrent = activeness > 0.3
      const op = 0.15 + activeness * 0.7
      if (isCurrent) {
        const grad = ctx.createRadialGradient(xx, yy, 0, xx, yy, 28)
        grad.addColorStop(0, `oklch(0.80 0.15 70 / ${activeness * 0.5})`)
        grad.addColorStop(1, `oklch(0.80 0.15 70 / 0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(xx, yy, 28, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.beginPath()
      ctx.arc(xx, yy, 5 + activeness * 1.5, 0, Math.PI * 2)
      ctx.fillStyle = isCurrent
        ? `oklch(0.80 0.15 70 / ${op})`
        : `rgba(255, 220, 180, ${op * 0.35})`
      ctx.fill()
    })
  })
  return <canvas ref={ref} className="mc-login-bg-canvas" />
}
