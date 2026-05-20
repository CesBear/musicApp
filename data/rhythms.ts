export type DrumPattern = {
  kick:      boolean[]
  snare:     boolean[]
  hihat:     boolean[]
  hihatOpen: boolean[]
}

export type RhythmPreset = {
  name:    string
  genre:   string
  bpm:     number
  steps:   number   // 16 = 4/4, 12 = 3/4
  pattern: DrumPattern
}

const b = (s: string): boolean[] => s.split("").map(c => c === "X")

export const RHYTHM_PRESETS: RhythmPreset[] = [
  {
    name: "Rock Básico", genre: "Rock", bpm: 100, steps: 16,
    pattern: {
      kick:      b("X.......X......."),
      snare:     b("....X.......X..."),
      hihat:     b("X.X.X.X.X.X.X.X."),  // 8th notes
      hihatOpen: b("................"),
    },
  },
  {
    name: "Funk", genre: "Funk", bpm: 90, steps: 16,
    pattern: {
      kick:      b("X..X..X.....X..."),
      snare:     b("....X...X...X.X."),
      hihat:     b("XXXXXXXXXXXXXXXX"),  // all 16ths
      hihatOpen: b("................"),
    },
  },
  {
    name: "Reggae", genre: "Reggae", bpm: 78, steps: 16,
    pattern: {
      kick:      b("..X.....X......."),
      snare:     b("........X......."),   // rim on beat 3
      hihat:     b("X.X.X.X.X.X.X.X."),
      hihatOpen: b("...X...X...X...X"),   // off-beat opens
    },
  },
  {
    name: "Blues Shuffle", genre: "Blues", bpm: 80, steps: 16,
    pattern: {
      kick:      b("X.......X......."),
      snare:     b("....X.......X..."),
      hihat:     b("X..X..X..X..X..X"),   // triplet feel (every 3 16ths)
      hihatOpen: b("................"),
    },
  },
  {
    name: "Bossa Nova", genre: "Bossa", bpm: 130, steps: 16,
    pattern: {
      kick:      b("X..X....X..X...."),
      snare:     b("..X.....X.X....."),   // rimshot pattern
      hihat:     b("X.X.X.X.X.X.X.X."),
      hihatOpen: b("................"),
    },
  },
  {
    name: "Vals", genre: "3/4", bpm: 120, steps: 12,   // 12 steps = 3 beats × 4 16ths
    pattern: {
      kick:      b("X..........."),
      snare:     b("....X...X..."),
      hihat:     b("X.X.X.X.X.X."),
      hihatOpen: b("............"),
    },
  },
]

export const TRACK_LABELS: Record<keyof DrumPattern, string> = {
  kick:      "KICK",
  snare:     "SNARE",
  hihat:     "HI-HAT",
  hihatOpen: "HI OPEN",
}
