"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { DEGREE_COLORS } from "@/data/scales"

interface Props {
  file: File
  onClear: () => void
}

// PlayerState enum from alphaTab: Paused = 0, Playing = 1
type PlayState = "stopped" | "playing" | "paused"

// Load the alphaTab UMD script once and resolve when ready.
// Using the UMD build from /public avoids any Turbopack bundling issues.
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
    s.id  = "alphatab-umd"
    s.src = "/alphatab/alphaTab.min.js"
    s.onload  = () => resolve()
    s.onerror = () => reject(new Error("alphaTab script failed to load"))
    document.head.appendChild(s)
  })
  return atScriptPromise
}

export default function GuitarProViewer({ file, onClear }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef        = useRef<any>(null)
  // If a file arrives before the api is ready, queue it here
  const pendingFile   = useRef<File | null>(null)
  const [ready,       setReady]      = useState(false)
  const [loaded,      setLoaded]     = useState(false)
  const [playState,   setPlayState]  = useState<PlayState>("stopped")
  const [sfProgress,  setSfProgress] = useState(0)
  const [title,       setTitle]      = useState("")
  const [trackCount,  setTrackCount] = useState(0)
  const [error,       setError]      = useState<string | null>(null)

  const initApi = useCallback(() => {
    if (!containerRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const at = (window as any).alphaTab
    if (!at) { setError("No se pudo cargar el motor de notación."); return }

    const api = new at.AlphaTabApi(containerRef.current, {
      core: {
        // alphaTab creates a Blob Worker that calls importScripts(scriptFile).
        // importScripts inside a Blob Worker requires a fully-qualified URL —
        // relative paths like '/alphatab/...' resolve against blob: and fail.
        scriptFile:    `${window.location.origin}/alphatab/alphaTab.min.js`,
        fontDirectory: "/alphatab/font/",
      },
      player: {
        enablePlayer: true,
        soundFont:    "/alphatab/sonivox.sf3",
        scrollElement: containerRef.current,
      },
    })

    apiRef.current = api

    api.soundFontLoad.on((e: { loaded: number; total: number }) => {
      if (e.total > 0) setSfProgress(Math.round((e.loaded / e.total) * 100))
    })

    api.playerReady.on(() => setReady(true))

    api.scoreLoaded.on((score: { title?: string; tracks?: unknown[] }) => {
      setLoaded(true)
      setTitle(score.title ?? "")
      setTrackCount(score.tracks?.length ?? 0)
    })

    // PlayerStateChangedEventArgs: { state: PlayerState, stopped: boolean }
    // PlayerState: Paused = 0, Playing = 1
    api.playerStateChanged.on((e: { state: number; stopped: boolean }) => {
      if (e.stopped) {
        setPlayState("stopped")
      } else {
        setPlayState(e.state === 1 ? "playing" : "paused")
      }
    })

    // If a file was selected before the api finished initializing, load it now
    if (pendingFile.current) {
      api.load(pendingFile.current)
      pendingFile.current = null
    }
  }, [])

  // Load UMD script once, then init alphaTab
  useEffect(() => {
    let cancelled = false
    loadAlphaTabScript()
      .then(() => {
        if (!cancelled) initApi()
      })
      .catch(() => {
        if (!cancelled) setError("Error al cargar alphaTab desde /public.")
      })
    return () => {
      cancelled = true
      if (apiRef.current) {
        try { apiRef.current.destroy() } catch { /**/ }
        apiRef.current = null
      }
    }
  }, [initApi])

  // Load file whenever it changes.
  // Pass the File object directly — alphaTab's browser impl reads it internally
  // and uses file.name to detect the GP format (gp3/4/5/gpx/gp).
  useEffect(() => {
    if (!file) return
    setLoaded(false); setTitle(""); setTrackCount(0); setPlayState("stopped"); setError(null)

    if (apiRef.current) {
      apiRef.current.load(file)
    } else {
      // api not ready yet — store it and initApi will pick it up
      pendingFile.current = file
    }
  }, [file])

  const handlePlayPause = () => apiRef.current?.playPause()
  const handleStop      = () => { apiRef.current?.stop(); setPlayState("stopped") }

  return (
    <div className="flex flex-col gap-4">
      {/* Transport */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        padding: "12px 16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
      }}>
        <button
          onClick={handlePlayPause}
          disabled={!loaded}
          className="mc-play-btn"
          style={{
            opacity: loaded ? 1 : 0.4,
            background: playState === "playing" ? "rgba(255,80,80,0.15)" : undefined,
            borderColor: playState === "playing" ? "rgba(255,80,80,0.4)" : undefined,
            color: playState === "playing" ? "#ff6060" : undefined,
          }}
        >
          {playState === "playing"
            ? <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="1" width="3" height="10" fill="currentColor"/><rect x="7" y="1" width="3" height="10" fill="currentColor"/></svg> Pausar</>
            : <><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2 L11 7 L3 12 Z" fill="currentColor"/></svg> {playState === "paused" ? "Continuar" : "Play"}</>
          }
        </button>

        <button
          onClick={handleStop}
          disabled={playState === "stopped"}
          className="mc-btn-ghost"
          style={{ opacity: playState !== "stopped" ? 1 : 0.3, padding: "6px 12px" }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="10" height="10" rx="1" fill="currentColor"/>
          </svg>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          {loaded ? (
            <>
              <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{title || file.name}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: 10, fontFamily: "var(--font-mono)" }}>
                {trackCount} {trackCount === 1 ? "pista" : "pistas"}
              </span>
              {!ready && (
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: 10, fontFamily: "var(--font-mono)" }}>
                  · Cargando sonidos {sfProgress}%…
                </span>
              )}
            </>
          ) : error ? (
            <span style={{ fontSize: 12, color: "#ff6060" }}>{error}</span>
          ) : (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)" }}>
              {sfProgress > 0 && sfProgress < 100 ? `Cargando sonidos ${sfProgress}%…` : "Procesando archivo…"}
            </span>
          )}
        </div>

        <button onClick={onClear} className="mc-btn-ghost" style={{ fontSize: 11, padding: "5px 10px" }}>
          Cerrar
        </button>
      </div>

      {/* Notation container — alphaTab renders into this div */}
      <div style={{
        background: "#fff",
        borderRadius: 10,
        overflow: "auto",
        minHeight: 200,
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div ref={containerRef} />
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        {[
          ["Formatos", ".gp3 · .gp4 · .gp5 · .gpx · .gp"],
          ["Privacidad", "Procesado local — no se sube nada"],
        ].map(([label, val]) => (
          <span key={label} style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            <span style={{ color: DEGREE_COLORS[0], marginRight: 6, fontFamily: "var(--font-mono)" }}>{label}</span>
            {val}
          </span>
        ))}
      </div>
    </div>
  )
}
