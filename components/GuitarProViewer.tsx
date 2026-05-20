"use client"

import { useEffect, useRef, useState } from "react"
import { DEGREE_COLORS } from "@/data/scales"

interface Props {
  file: File
  onClear: () => void
}

type PlayerState = "stopped" | "playing" | "paused"

// All alphaTab interaction is isolated to this client component.
// The parent page uses dynamic(() => import(...), { ssr: false }) to prevent SSR.
export default function GuitarProViewer({ file, onClear }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef       = useRef<any>(null)
  const [ready,       setReady]       = useState(false)
  const [loaded,      setLoaded]      = useState(false)
  const [playerState, setPlayerState] = useState<PlayerState>("stopped")
  const [sfProgress,  setSfProgress]  = useState(0)  // soundfont load 0-100
  const [title,       setTitle]       = useState("")
  const [trackCount,  setTrackCount]  = useState(0)

  useEffect(() => {
    if (!containerRef.current) return

    let destroyed = false
    import("@coderline/alphatab").then(({ AlphaTabApi }) => {
      if (destroyed || !containerRef.current) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const api = new AlphaTabApi(containerRef.current, {
        core: {
          // Point to standalone worker in /public so Next.js bundling doesn't interfere
          scriptFile:    "/alphatab/alphaTab.worker.min.mjs",
          fontDirectory: "/alphatab/font/",
        },
        player: {
          enablePlayer: true,
          soundFont:    "/alphatab/sonivox.sf3",
          scrollElement: containerRef.current,
        },
        display: {
          layoutMode: 1, // Page layout
        },
      } as unknown as object)

      apiRef.current = api

      api.soundFontLoad.on((e: { loaded: number; total: number }) => {
        setSfProgress(Math.round((e.loaded / e.total) * 100))
      })

      api.playerReady.on(() => {
        setReady(true)
      })

      api.scoreLoaded.on((score: { title?: string; tracks?: unknown[] }) => {
        setLoaded(true)
        setTitle(score.title ?? "Sin título")
        setTrackCount(score.tracks?.length ?? 0)
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      api.playerStateChanged.on((e: any) => {
        // PlayerState enum: 0 = Stopped, 1 = Playing, 2 = Paused  (varies by version)
        const s = e.state ?? e
        if (typeof s === "number") {
          setPlayerState(s === 1 ? "playing" : s === 2 ? "paused" : "stopped")
        }
      })
    })

    return () => {
      destroyed = true
      if (apiRef.current) {
        try { apiRef.current.destroy() } catch { /**/ }
        apiRef.current = null
      }
    }
  }, [])

  // Load the file whenever it changes
  useEffect(() => {
    if (!apiRef.current || !file) return
    setLoaded(false)
    setTitle("")
    setTrackCount(0)
    setPlayerState("stopped")

    const reader = new FileReader()
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer
      if (buffer) apiRef.current?.load(new Uint8Array(buffer))
    }
    reader.readAsArrayBuffer(file)
  }, [file])

  const handlePlayPause = () => {
    if (apiRef.current) apiRef.current.playPause()
  }
  const handleStop = () => {
    if (apiRef.current) apiRef.current.stop()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Transport bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        padding: "12px 16px", background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
      }}>
        {/* Play / Pause */}
        <button
          onClick={handlePlayPause}
          disabled={!loaded || !ready}
          className="mc-play-btn"
          style={{
            opacity: loaded && ready ? 1 : 0.4,
            background: playerState === "playing" ? "rgba(255,80,80,0.15)" : undefined,
            borderColor: playerState === "playing" ? "rgba(255,80,80,0.4)" : undefined,
            color: playerState === "playing" ? "#ff6060" : undefined,
          }}
        >
          {playerState === "playing"
            ? <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="1" width="3" height="10" fill="currentColor"/><rect x="7" y="1" width="3" height="10" fill="currentColor"/></svg> Pausar</>
            : <><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2 L11 7 L3 12 Z" fill="currentColor"/></svg> {playerState === "paused" ? "Continuar" : "Play"}</>
          }
        </button>

        {/* Stop */}
        <button
          onClick={handleStop}
          disabled={playerState === "stopped"}
          className="mc-btn-ghost"
          style={{ opacity: playerState !== "stopped" ? 1 : 0.35, padding: "6px 12px" }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="10" height="10" rx="1" fill="currentColor"/>
          </svg>
        </button>

        {/* File info */}
        {loaded ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{title || file.name}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: 10, fontFamily: "var(--font-mono)" }}>
              {trackCount} {trackCount === 1 ? "pista" : "pistas"}
            </span>
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            {sfProgress < 100 && sfProgress > 0 && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)" }}>
                Cargando sonidos… {sfProgress}%
              </span>
            )}
            {sfProgress === 0 && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)" }}>
                Procesando archivo…
              </span>
            )}
          </div>
        )}

        {/* Clear */}
        <button onClick={onClear} className="mc-btn-ghost" style={{ fontSize: 11, padding: "5px 10px" }}>
          Cerrar
        </button>
      </div>

      {/* alphaTab render container — needs explicit min-height while loading */}
      <div style={{
        background: "#fff",
        borderRadius: 10,
        overflow: "hidden",
        minHeight: loaded ? undefined : 120,
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div
          ref={containerRef}
          style={{ minHeight: 120 }}
          // alphaTab injects its own CSS; white bg is needed for notation readability
        />
      </div>

      {!ready && (
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono)", textAlign: "center" }}>
          Inicializando motor de notación…
        </p>
      )}

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[
          ["Soportado", ".gp3 · .gp4 · .gp5 · .gpx · .gp"],
          ["Playback", "SoundFont incluido (sonivox.sf3)"],
        ].map(([label, val]) => (
          <div key={label} style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            <span style={{ fontFamily: "var(--font-mono)", color: DEGREE_COLORS[0], marginRight: 6 }}>{label}</span>
            {val}
          </div>
        ))}
      </div>
    </div>
  )
}
