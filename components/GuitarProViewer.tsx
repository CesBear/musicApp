"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { DEGREE_COLORS } from "@/data/scales"

interface Props {
  file: File
  onClear: () => void
}

let atScriptPromise: Promise<void> | null = null
function loadAlphaTabScript(): Promise<void> {
  if (atScriptPromise) return atScriptPromise
  atScriptPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") { reject(); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).alphaTab) { resolve(); return }
    const existing = document.getElementById("alphatab-umd")
    if (existing) { existing.addEventListener("load", () => resolve()); return }
    const s = document.createElement("script")
    s.id = "alphatab-umd"
    s.src = "/alphatab/alphaTab.min.js"
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("alphaTab script failed to load"))
    document.head.appendChild(s)
  })
  return atScriptPromise
}

export default function GuitarProViewer({ file, onClear }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef      = useRef<any>(null)
  const apiReadyRef = useRef(false)
  const pendingFile = useRef<File | null>(null)

  const [loaded,     setLoaded]    = useState(false)
  const [title,      setTitle]     = useState("")
  const [trackCount, setTrackCount]= useState(0)
  const [error,      setError]     = useState<string | null>(null)

  const loadFileBytes = useCallback((f: File) => {
    const api = apiRef.current
    if (!api) return
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const bytes = new Uint8Array(e.target?.result as ArrayBuffer)
      try {
        const ok = api.load(bytes)
        if (ok === false) setError("Formato no reconocido. ¿Es un archivo Guitar Pro válido?")
      } catch (err) {
        setError(`Error al cargar: ${err}`)
      }
    }
    reader.onerror = () => setError("No se pudo leer el archivo.")
    reader.readAsArrayBuffer(f)
  }, [])

  const initApi = useCallback(() => {
    if (!containerRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const at = (window as any).alphaTab
    if (!at) { setError("No se pudo cargar el motor de notación."); return }

    const origin = window.location.origin

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = new at.AlphaTabApi(containerRef.current, {
      core: {
        scriptFile:    `${origin}/alphatab/alphaTab.min.js`,
        fontDirectory: `${origin}/alphatab/font/`,
      },
      player: { enablePlayer: false },
    })

    apiRef.current  = api
    apiReadyRef.current = true

    try {
      api.error?.on((e: Error) => {
        console.error("[alphaTab]", e)
        setError(`Error: ${e?.message ?? String(e)}`)
      })
    } catch { /**/ }

    api.scoreLoaded?.on((score: { title?: string; tracks?: unknown[] }) => {
      setLoaded(true)
      setTitle(score.title ?? "")
      setTrackCount(score.tracks?.length ?? 0)
    })

    if (pendingFile.current) {
      const f = pendingFile.current
      pendingFile.current = null
      setTimeout(() => loadFileBytes(f), 50)
    }
  }, [loadFileBytes])

  useEffect(() => {
    let cancelled = false
    loadAlphaTabScript()
      .then(() => { if (!cancelled) initApi() })
      .catch(() => { if (!cancelled) setError("Error al cargar el motor de notación.") })
    return () => {
      cancelled = true
      apiReadyRef.current = false
      if (apiRef.current) {
        try { apiRef.current.destroy() } catch { /**/ }
        apiRef.current = null
      }
    }
  }, [initApi])

  useEffect(() => {
    if (!file) return
    setLoaded(false); setTitle(""); setTrackCount(0); setError(null)
    if (apiReadyRef.current) {
      loadFileBytes(file)
    } else {
      pendingFile.current = file
    }
  }, [file, loadFileBytes])

  return (
    <div className="flex flex-col gap-4">
      {/* Header bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loaded ? (
            <>
              <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{title || file.name}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: 10, fontFamily: "var(--font-mono)" }}>
                {trackCount} {trackCount === 1 ? "pista" : "pistas"}
              </span>
            </>
          ) : error ? (
            <span style={{ fontSize: 12, color: "#ff6060" }}>{error}</span>
          ) : (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)" }}>
              Procesando {file.name}…
            </span>
          )}
        </div>
        <button onClick={onClear} className="mc-btn-ghost" style={{ fontSize: 11, padding: "5px 10px" }}>
          Cerrar
        </button>
      </div>

      {/* Notation */}
      <div style={{ background: "#fff", borderRadius: 10, overflow: "auto", minHeight: 200, border: "1px solid rgba(255,255,255,0.06)" }}>
        <div ref={containerRef} />
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        {[["Formatos", ".gp3 · .gp4 · .gp5 · .gpx · .gp"], ["Privacidad", "Procesado local — no se sube nada"]].map(([label, val]) => (
          <span key={label} style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            <span style={{ color: DEGREE_COLORS[0], marginRight: 6, fontFamily: "var(--font-mono)" }}>{label}</span>{val}
          </span>
        ))}
      </div>
    </div>
  )
}
