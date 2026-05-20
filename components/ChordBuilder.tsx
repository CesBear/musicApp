"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

const CHORD_TYPES = [
  { name: "Mayor", symbol: "", intervals: [0, 4, 7], description: "1 - 3 - 5" },
  { name: "Menor", symbol: "m", intervals: [0, 3, 7], description: "1 - b3 - 5" },
  { name: "Mayor 7", symbol: "maj7", intervals: [0, 4, 7, 11], description: "1 - 3 - 5 - 7" },
  { name: "Dominante 7", symbol: "7", intervals: [0, 4, 7, 10], description: "1 - 3 - 5 - b7" },
  { name: "Menor 7", symbol: "m7", intervals: [0, 3, 7, 10], description: "1 - b3 - 5 - b7" },
  { name: "Suspendido 2", symbol: "sus2", intervals: [0, 2, 7], description: "1 - 2 - 5" },
  { name: "Suspendido 4", symbol: "sus4", intervals: [0, 5, 7], description: "1 - 4 - 5" },
  { name: "Disminuido", symbol: "dim", intervals: [0, 3, 6], description: "1 - b3 - b5" },
  { name: "Aumentado", symbol: "aug", intervals: [0, 4, 8], description: "1 - 3 - #5" },
]

function buildChord(root: string, intervals: number[]) {
  const rootIdx = NOTES.indexOf(root)
  return intervals.map((interval) => NOTES[(rootIdx + interval) % 12])
}

export default function ChordBuilder() {
  const [root, setRoot] = useState("C")
  const [chordType, setChordType] = useState(CHORD_TYPES[0])

  const chordNotes = buildChord(root, chordType.intervals)
  const chordName = `${root}${chordType.symbol}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div>
          <p className="text-xs text-zinc-500 mb-2">Nota raíz</p>
          <div className="flex flex-wrap gap-2">
            {NOTES.map((note) => (
              <button
                key={note}
                onClick={() => setRoot(note)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                  root === note
                    ? "bg-amber-500 text-zinc-900"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {note}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs text-zinc-500 mb-2">Tipo de acorde</p>
        <div className="flex flex-wrap gap-2">
          {CHORD_TYPES.map((type) => (
            <button
              key={type.name}
              onClick={() => setChordType(type)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                chordType.name === type.name
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {type.name}
            </button>
          ))}
        </div>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-white text-3xl font-bold">{chordName}</CardTitle>
            <Badge variant="outline" className="border-zinc-600 text-zinc-400">
              {chordType.description}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-xs text-zinc-500 mb-3">Notas del acorde</p>
            <div className="flex gap-3 flex-wrap">
              {chordNotes.map((note, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ${
                      i === 0
                        ? "bg-amber-500 text-zinc-900"
                        : "bg-zinc-800 text-white"
                    }`}
                  >
                    {note}
                  </div>
                  <span className="text-xs text-zinc-500">
                    {["Raíz", "3ra", "5ta", "7ma"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
