// Circle of Fifths layout data
export type CircleNote = {
  major: string
  minor: string
  rootIdx: number    // semitone index of the major key
  sharps: number     // positive = sharps, negative = flats
}

export const CIRCLE_NOTES: CircleNote[] = [
  { major: "C",  minor: "Am",  rootIdx: 0,  sharps: 0  },
  { major: "G",  minor: "Em",  rootIdx: 7,  sharps: 1  },
  { major: "D",  minor: "Bm",  rootIdx: 2,  sharps: 2  },
  { major: "A",  minor: "F#m", rootIdx: 9,  sharps: 3  },
  { major: "E",  minor: "C#m", rootIdx: 4,  sharps: 4  },
  { major: "B",  minor: "G#m", rootIdx: 11, sharps: 5  },
  { major: "F#", minor: "D#m", rootIdx: 6,  sharps: 6  },
  { major: "Db", minor: "Bbm", rootIdx: 1,  sharps: -5 },
  { major: "Ab", minor: "Fm",  rootIdx: 8,  sharps: -4 },
  { major: "Eb", minor: "Cm",  rootIdx: 3,  sharps: -3 },
  { major: "Bb", minor: "Gm",  rootIdx: 10, sharps: -2 },
  { major: "F",  minor: "Dm",  rootIdx: 5,  sharps: -1 },
]
