"use client"

import { useState } from "react"
import TabDiagram, { type TabExercise } from "@/components/TabDiagram"

/** Tablatura que suena, con su propio control de tempo y la meta de BPM. */
export default function TabPractice({ exercise, targetBpm }: { exercise: TabExercise; targetBpm?: number }) {
  const [bpm, setBpm] = useState(exercise.bpmHint ?? 70)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <TabDiagram exercise={exercise} bpm={bpm} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="mc-eyebrow">Tempo</span>
        <button className="mm-step-btn" onClick={() => setBpm(b => Math.max(30, b - 5))}>−5</button>
        <input type="range" min={30} max={200} value={bpm} onChange={e => setBpm(+e.target.value)} className="mc-slider" style={{ maxWidth: 220 }} />
        <button className="mm-step-btn" onClick={() => setBpm(b => Math.min(200, b + 5))}>+5</button>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-1)", minWidth: 64 }}>{bpm} BPM</span>
        {targetBpm && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: bpm >= targetBpm ? "oklch(0.80 0.16 145)" : "var(--text-3)" }}>
            {bpm >= targetBpm ? "✓ tempo de la clase" : `meta: ${targetBpm}`}
          </span>
        )}
      </div>
    </div>
  )
}
