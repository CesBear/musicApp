"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { playMetronomeClick, getAudioTime } from "@/lib/audio"
import { DEGREE_COLORS } from "@/data/scales"

type TimeSig   = "2/4" | "3/4" | "4/4" | "6/8"
type Subdiv    = "none" | "8th"

// Number of main beats shown per time signature
const BEATS_PER_BAR: Record<TimeSig, number> = { "2/4": 2, "3/4": 3, "4/4": 4, "6/8": 6 }
// Which beat indices are accented
const ACCENT_MAP: Record<TimeSig, Set<number>> = {
  "2/4": new Set([0]),
  "3/4": new Set([0]),
  "4/4": new Set([0]),
  "6/8": new Set([0, 3]),   // two groups of 3
}

export default function Metronome() {
  const [on,       setOn]       = useState(false)
  const [bpm,      setBpm]      = useState(80)
  const [timeSig,  setTimeSig]  = useState<TimeSig>("4/4")
  const [subdiv,   setSubdiv]   = useState<Subdiv>("none")
  const [beatViz,  setBeatViz]  = useState(-1)   // which main beat is lit

  // Live refs so the scheduler always sees the latest values without restarting
  const liveRef = useRef({ bpm, timeSig, subdiv })
  liveRef.current = { bpm, timeSig, subdiv }

  const schedRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const nextTimeRef  = useRef(0)   // AudioContext time of next click to schedule
  const tickRef      = useRef(0)   // absolute tick index (resets on start)

  const schedule = useCallback(() => {
    const LOOKAHEAD = 0.10   // seconds — how far ahead to schedule
    const { bpm, timeSig, subdiv } = liveRef.current
    const mainBeats   = BEATS_PER_BAR[timeSig]
    const totalTicks  = mainBeats * (subdiv === "8th" ? 2 : 1)
    const secPerTick  = 60 / bpm / (subdiv === "8th" ? 2 : 1)
    const audioNow    = getAudioTime()

    while (nextTimeRef.current < audioNow + LOOKAHEAD) {
      const tick      = tickRef.current % totalTicks
      const mainBeat  = subdiv === "8th" ? Math.floor(tick / 2) : tick
      const isSub     = subdiv === "8th" && tick % 2 === 1
      const clickType = isSub ? "sub" : ACCENT_MAP[timeSig].has(mainBeat) ? "accent" : "beat"

      playMetronomeClick(clickType, nextTimeRef.current)

      // Sync visual indicator — schedule a timeout that fires when the audio plays
      if (!isSub) {
        const delayMs = Math.max(0, (nextTimeRef.current - audioNow) * 1000)
        const beat = mainBeat
        setTimeout(() => setBeatViz(beat), delayMs)
      }

      nextTimeRef.current += secPerTick
      tickRef.current++
    }
  }, [])

  useEffect(() => {
    if (on) {
      nextTimeRef.current = getAudioTime() + 0.05
      tickRef.current = 0
      setBeatViz(-1)
      schedRef.current = setInterval(schedule, 25)
    } else {
      if (schedRef.current) clearInterval(schedRef.current)
      schedRef.current = null
      setBeatViz(-1)
    }
    return () => { if (schedRef.current) clearInterval(schedRef.current) }
  }, [on, schedule])

  // Tap tempo
  const tapsRef = useRef<number[]>([])
  const handleTap = () => {
    const now = Date.now()
    tapsRef.current = [...tapsRef.current, now].filter(t => now - t < 3000).slice(-6)
    if (tapsRef.current.length >= 2) {
      const gaps = tapsRef.current.slice(1).map((t, i) => t - tapsRef.current[i])
      setBpm(Math.round(60000 / (gaps.reduce((a, b) => a + b) / gaps.length)))
    }
  }

  const mainBeats  = BEATS_PER_BAR[timeSig]
  const accentSet  = ACCENT_MAP[timeSig]

  return (
    <div className="mc-metronome">
      {/* Toggle */}
      <button className={`mc-metro-toggle ${on ? "on" : ""}`} onClick={() => setOn(v => !v)}>
        <span className="mc-metro-icon">▣</span>
        {on ? "Detener" : "Metrónomo"}
      </button>

      {/* BPM row */}
      <div className="mc-metro-bpm">
        <input type="range" min="40" max="220" value={bpm}
          onChange={e => setBpm(+e.target.value)} className="mc-slider" />
        <span className="mc-mono-tag" style={{ minWidth: 52, textAlign: "right" }}>{bpm} BPM</span>
        <button onClick={handleTap} className="mc-btn-ghost"
          style={{ fontSize: 11, padding: "4px 10px", whiteSpace: "nowrap" }}>
          Tap
        </button>
      </div>

      {/* Options row: time signature + subdivision */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {(["2/4","3/4","4/4","6/8"] as TimeSig[]).map(ts => (
            <button key={ts} onClick={() => setTimeSig(ts)}
              className={`mc-pos-chip ${timeSig === ts ? "active" : ""}`}
              style={{ fontSize: 11, padding: "3px 9px" }}>
              {ts}
            </button>
          ))}
        </div>

        <span className="mc-meta-sep">·</span>

        <div style={{ display: "flex", gap: 4 }}>
          {([
            { id: "none" as Subdiv, label: "♩"   },
            { id: "8th"  as Subdiv, label: "♩♪"  },
          ]).map(sv => (
            <button key={sv.id} onClick={() => setSubdiv(sv.id)}
              className={`mc-pos-chip ${subdiv === sv.id ? "active" : ""}`}
              style={{ fontSize: 13, padding: "3px 9px" }}>
              {sv.label}
            </button>
          ))}
        </div>
      </div>

      {/* Beat visualizer */}
      {on && (
        <div className="mc-beat-dots">
          {Array.from({ length: mainBeats }, (_, i) => (
            <span key={i}
              className={`mc-beat ${beatViz === i ? "active" : ""} ${accentSet.has(i) ? "accent" : ""}`}
              style={timeSig === "6/8" && i === 3 ? { marginLeft: 6 } : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
