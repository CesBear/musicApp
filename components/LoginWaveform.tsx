"use client"

import { useEffect, useRef } from "react"

export default function LoginWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener("resize", resize)

    let raf = 0, t = 0
    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const W = rect.width, H = rect.height
      ctx.clearRect(0, 0, W, H)
      const lines = 5
      for (let l = 0; l < lines; l++) {
        ctx.beginPath()
        const yOff = H / 2 + (l - lines / 2) * 18
        const amp = 28 - l * 2
        const freq = 0.005 + l * 0.001
        const phase = t * 0.002 + l * 0.6
        for (let x = 0; x <= W; x += 4) {
          const y = yOff + Math.sin(x * freq + phase) * amp * Math.sin(phase * 0.3 + l)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(255, 220, 160, ${0.04 + l * 0.012})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
      t += 16
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="mc-login-waveform" />
}
