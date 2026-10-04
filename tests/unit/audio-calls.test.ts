import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

// Las funciones de lib/audio.ts reciben el momento como «segundos desde ahora».
// Pasarles la hora absoluta del reloj de audio (getAudioTime() / ctx.currentTime)
// retrasa cada nota tantos segundos como lleve abierta la página. Este bug ya pasó
// dos veces (Solfeo y el entrenador de intervalos); esta prueba lo detecta en el código.
const ROOTS = ["app", "components", "lib"]
const RELATIVE_FNS = ["playTone", "playGuitarString", "playMutedStrum", "playChugChord", "scheduleChord"]

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? files(p) : /\.(ts|tsx)$/.test(e.name) ? [p] : []
  })
}

describe("tiempos relativos del motor de audio", () => {
  it("nadie pasa la hora absoluta del reloj de audio como 'when'", () => {
    const offenders: string[] = []
    for (const f of ROOTS.flatMap(files)) {
      const src = fs.readFileSync(f, "utf8")
      for (const fn of RELATIVE_FNS) {
        const re = new RegExp(`(?<!function )\\b${fn}\\(([^;]*?)\\)`, "g")
        for (const m of src.matchAll(re)) {
          const args = m[1]
          // variables locales con la hora absoluta, como "const t0 = getAudioTime()"
          const absVars = [...src.matchAll(/const (\w+)\s*=\s*(?:getAudioTime\(\)|\w+\.currentTime)\b/g)].map(x => x[1])
          if (/getAudioTime\b|currentTime/.test(args) || absVars.some(v => new RegExp(`\\b${v}\\b`).test(args))) {
            const line = src.slice(0, m.index).split("\n").length
            offenders.push(`${f}:${line}  ${m[0]}`)
          }
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([])
  })
})
