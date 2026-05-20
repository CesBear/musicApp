"use client"

import { useState, useRef } from "react"
import dynamic from "next/dynamic"
import { DEGREE_COLORS } from "@/data/scales"

// alphaTab is browser-only — must not SSR
const GuitarProViewer = dynamic(() => import("@/components/GuitarProViewer"), { ssr: false })

const ACCEPTED = ".gp,.gp3,.gp4,.gp5,.gpx"

export default function LectorPage() {
  const [file, setFile] = useState<File | null>(null)
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    if (f) setFile(f)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="mc-hero">
        <div>
          <div className="mc-eyebrow">Estudio · Lector de Tabs</div>
          <h1 className="mc-h1">
            <span style={{ color: DEGREE_COLORS[0] }}>Guitar</span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontStyle: "italic" }}> Pro</span>
          </h1>
          <p className="mc-lede">Abre cualquier archivo Guitar Pro y visualiza notación y TAB directamente en el navegador.</p>
          <div className="mc-meta-row">
            <span className="mc-mono-tag">.gp · .gp3 · .gp4 · .gp5 · .gpx</span>
            <span className="mc-meta-sep">·</span>
            <span className="mc-meta-text">Procesado localmente — no se sube a ningún servidor</span>
          </div>
        </div>
      </div>

      {!file ? (
        /* Drop zone */
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${drag ? DEGREE_COLORS[0] : "rgba(255,255,255,0.14)"}`,
            borderRadius: 14,
            padding: "60px 24px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
            cursor: "pointer",
            background: drag ? `${DEGREE_COLORS[0]}09` : "rgba(255,255,255,0.02)",
            transition: "all 0.15s",
          }}
        >
          {/* Icon */}
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.45 }}>
            <rect x="8" y="6" width="24" height="36" rx="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M32 6 L40 14 L32 14 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <rect x="32" y="6" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="14" y1="20" x2="28" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="14" y1="26" x2="28" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="14" y1="32" x2="22" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>

          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 15, color: "#fff", fontWeight: 500, margin: 0 }}>
              Arrastra tu archivo Guitar Pro aquí
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "6px 0 0", fontFamily: "var(--font-mono)" }}>
              o haz click para buscar — .gp .gp3 .gp4 .gp5 .gpx
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            style={{ display: "none" }}
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
          />
        </div>
      ) : (
        <GuitarProViewer file={file} onClear={() => setFile(null)} />
      )}
    </div>
  )
}
