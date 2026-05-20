export type Barre = { fret: number; from: number; to: number }

export type ChordVoicing = {
  frets:   number[]   // string 6→1 (low E to high e), -1=muted, 0=open
  fingers: number[]   // 0=none, 1=index, 2=mid, 3=ring, 4=pinky
  barre?:  Barre
  shape?:  string     // CAGED shape: "E" | "A" | "C" | "D" | "G"
}

const s = (v: Omit<ChordVoicing,"shape">, shape: string): ChordVoicing => ({ ...v, shape })

// ─── E-shape generators (root on string 6 at fret p) ───────────────────────
const e     = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: p===0?[0,2,2,1,0,0]:[p,p+2,p+2,p+1,p,p],       fingers: p===0?[0,2,3,1,0,0]:[1,3,4,2,1,1],       barre: p>0?{fret:p,from:0,to:5}:undefined })
const em    = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: p===0?[0,2,2,0,0,0]:[p,p+2,p+2,p,p,p],           fingers: p===0?[0,2,3,0,0,0]:[1,3,4,1,1,1],       barre: p>0?{fret:p,from:0,to:5}:undefined })
const e7    = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: p===0?[0,2,0,1,0,0]:[p,p+2,p,p+1,p,p],           fingers: p===0?[0,2,0,1,0,0]:[1,3,1,2,1,1],       barre: p>0?{fret:p,from:0,to:5}:undefined })
const emaj7 = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: p===0?[0,2,1,1,0,0]:[p,p+2,p+1,p+1,p,p],         fingers: p===0?[0,3,1,2,0,0]:[1,4,2,3,1,1],       barre: p>0?{fret:p,from:0,to:5}:undefined })
const em7   = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: p===0?[0,2,0,0,0,0]:[p,p+2,p,p,p,p],             fingers: p===0?[0,2,0,0,0,0]:[1,2,1,1,1,1],       barre: p>0?{fret:p,from:0,to:5}:undefined })
const esus4 = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: p===0?[0,2,2,2,0,0]:[p,p+2,p+2,p+2,p,p],         fingers: p===0?[0,1,2,3,0,0]:[1,2,3,4,1,1],       barre: p>0?{fret:p,from:0,to:5}:undefined })
const esus2 = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: p===0?[0,2,4,4,0,0]:[p,p+2,p+4,p+4,p,p],         fingers: p===0?[0,1,3,4,0,0]:[1,2,4,4,1,1],       barre: p>0?{fret:p,from:0,to:5}:undefined })
const eadd9 = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: p===0?[0,2,2,1,0,2]:[p,p+2,p+2,p+1,p,p+2],       fingers: p===0?[0,2,3,1,0,4]:[1,3,4,2,1,4],       barre: p>0?{fret:p,from:0,to:4}:undefined })
const e6    = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: p===0?[0,2,2,1,2,0]:[p,p+2,p+2,p+1,p+2,p],       fingers: p===0?[0,1,2,0,3,0]:[1,2,3,0,4,1],       barre: p>0?{fret:p,from:0,to:5}:undefined })
const e9    = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: p===0?[0,2,0,1,0,2]:[p,p+2,p,p+1,p,p+2],         fingers: p===0?[0,2,0,1,0,3]:[1,3,1,2,1,4],       barre: p>0?{fret:p,from:0,to:5}:undefined })

// ─── A-shape generators (root on string 5 at fret p) ───────────────────────
const a     = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: [-1,p,p+2,p+2,p+2,p],       fingers: p===0?[0,0,1,2,3,0]:[0,1,3,3,3,1],       barre: {fret:p===0?2:p+2,from:2,to:4} })
const am    = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: [-1,p,p+2,p+2,p+1,p],       fingers: p===0?[0,0,2,3,1,0]:[0,1,3,4,2,1],       barre: p>0?{fret:p,from:1,to:5}:undefined })
const a7    = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: [-1,p,p+2,p,p+2,p],         fingers: p===0?[0,0,2,0,3,0]:[0,1,3,1,2,1],       barre: p>0?{fret:p,from:1,to:5}:undefined })
const amaj7 = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: [-1,p,p+2,p+1,p+2,p],       fingers: p===0?[0,0,3,1,4,0]:[0,1,3,2,4,1],       barre: p>0?{fret:p,from:1,to:5}:undefined })
const am7   = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: [-1,p,p+2,p,p+1,p],         fingers: p===0?[0,0,3,0,2,0]:[0,1,3,1,2,1],       barre: p>0?{fret:p,from:1,to:5}:undefined })
const asus4 = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: [-1,p,p+2,p+2,p+3,p],       fingers: p===0?[0,0,1,2,3,0]:[0,1,2,3,4,1],       barre: p>0?{fret:p,from:1,to:5}:undefined })
const asus2 = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: [-1,p,p+2,p+4,p,p],         fingers: p===0?[0,0,1,3,0,0]:[0,1,2,4,1,1],       barre: p>0?{fret:p,from:1,to:5}:undefined })
const aadd9 = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: [-1,p,p+2,p+4,p+2,p],       fingers: p===0?[0,0,1,4,3,0]:[0,1,2,4,3,1],       barre: p>0?{fret:p,from:1,to:5}:undefined })
const a6    = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: [-1,p,p+2,p+2,p+2,p+2],     fingers: p===0?[0,0,1,2,3,4]:[0,1,2,3,4,4],       barre: undefined })
// voicing 1-5-b7-9 (jazz standard — omits 3rd, common in guitar due to range limitations)
const a9    = (p: number): Omit<ChordVoicing,"shape"> => ({ frets: [-1,p,p+2,p,p,p],           fingers: p===0?[0,0,2,0,0,0]:[0,1,3,1,1,1],       barre: p>0?{fret:p,from:1,to:5}:undefined })

export type ChordType = "major"|"minor"|"dom7"|"maj7"|"m7"|"sus2"|"sus4"|"add9"|"6"|"9"

// Each chord has 2–3 voicings in ascending fret order (CAGED system).
// Shape labels: "E" = root on string 6 | "A" = root on string 5
//               "C" | "D" | "G" = open shapes named after their root chord
export const CHORD_VOICINGS: Record<string, Record<ChordType, ChordVoicing[]>> = {
  C: {
    major: [ s({frets:[-1,3,2,0,1,0],fingers:[0,3,2,0,1,0]},"C"),     s(a(3),"A"),     s(e(8),"E")  ],
    minor: [ s(am(3),"A"),    s(em(8),"E")  ],
    dom7:  [ s({frets:[-1,3,2,3,1,0],fingers:[0,3,2,4,1,0]},"C"),     s(a7(3),"A"),    s(e7(8),"E") ],
    maj7:  [ s({frets:[-1,3,2,0,0,0],fingers:[0,3,2,0,0,0]},"C"),     s(amaj7(3),"A"), s(emaj7(8),"E") ],
    m7:    [ s(am7(3),"A"),   s(em7(8),"E") ],
    sus2:  [ s(asus2(3),"A"), s(esus2(8),"E") ],
    sus4:  [ s(asus4(3),"A"), s(esus4(8),"E") ],
    add9:  [ s(aadd9(3),"A"), s(eadd9(8),"E") ],
    "6":   [ s(a6(3),"A"),    s(e6(8),"E")  ],
    "9":   [ s(a9(3),"A"),    s(e9(8),"E")  ],
  },
  "C#": {
    major: [ s(a(4),"A"),     s(e(9),"E")   ],
    minor: [ s(am(4),"A"),    s(em(9),"E")  ],
    dom7:  [ s(a7(4),"A"),    s(e7(9),"E")  ],
    maj7:  [ s(amaj7(4),"A"), s(emaj7(9),"E") ],
    m7:    [ s(am7(4),"A"),   s(em7(9),"E") ],
    sus2:  [ s(asus2(4),"A"), s(esus2(9),"E") ],
    sus4:  [ s(asus4(4),"A"), s(esus4(9),"E") ],
    add9:  [ s(aadd9(4),"A"), s(eadd9(9),"E") ],
    "6":   [ s(a6(4),"A"),    s(e6(9),"E")  ],
    "9":   [ s(a9(4),"A"),    s(e9(9),"E")  ],
  },
  D: {
    major: [ s({frets:[-1,-1,0,2,3,2],fingers:[0,0,0,1,3,2]},"D"),                      s(a(5),"A"),     s(e(10),"E") ],
    minor: [ s({frets:[-1,-1,0,2,3,1],fingers:[0,0,0,2,3,1]},"D"),                      s(am(5),"A"),    s(em(10),"E") ],
    dom7:  [ s({frets:[-1,-1,0,2,1,2],fingers:[0,0,0,2,1,3]},"D"),                      s(a7(5),"A"),    s(e7(10),"E") ],
    maj7:  [ s({frets:[-1,-1,0,2,2,2],fingers:[0,0,0,1,1,1],barre:{fret:2,from:3,to:5}},"D"), s(amaj7(5),"A") ],
    m7:    [ s({frets:[-1,-1,0,2,1,1],fingers:[0,0,0,2,1,1],barre:{fret:1,from:4,to:5}},"D"), s(am7(5),"A")   ],
    sus2:  [ s(asus2(5),"A"), s(esus2(10),"E") ],
    sus4:  [ s(asus4(5),"A"), s(esus4(10),"E") ],
    add9:  [ s(aadd9(5),"A"), s(eadd9(10),"E") ],
    "6":   [ s(a6(5),"A"),    s(e6(10),"E")  ],
    "9":   [ s(a9(5),"A"),    s(e9(10),"E")  ],
  },
  Eb: {
    major: [ s(a(6),"A"),     s(e(11),"E")  ],
    minor: [ s(am(6),"A"),    s(em(11),"E") ],
    dom7:  [ s(a7(6),"A"),    s(e7(11),"E") ],
    maj7:  [ s(amaj7(6),"A"), s(emaj7(11),"E") ],
    m7:    [ s(am7(6),"A"),   s(em7(11),"E") ],
    sus2:  [ s(asus2(6),"A"), s(esus2(11),"E") ],
    sus4:  [ s(asus4(6),"A"), s(esus4(11),"E") ],
    add9:  [ s(aadd9(6),"A"), s(eadd9(11),"E") ],
    "6":   [ s(a6(6),"A"),    s(e6(11),"E") ],
    "9":   [ s(a9(6),"A"),    s(e9(11),"E") ],
  },
  E: {
    major: [ s(e(0),"E"),     s(a(7),"A")   ],
    minor: [ s(em(0),"E"),    s(am(7),"A")  ],
    dom7:  [ s(e7(0),"E"),    s(a7(7),"A")  ],
    maj7:  [ s(emaj7(0),"E"), s(amaj7(7),"A") ],
    m7:    [ s(em7(0),"E"),   s(am7(7),"A") ],
    sus2:  [ s(esus2(0),"E"), s(asus2(7),"A") ],
    sus4:  [ s(esus4(0),"E"), s(asus4(7),"A") ],
    add9:  [ s(eadd9(0),"E"), s(aadd9(7),"A") ],
    "6":   [ s(e6(0),"E"),    s(a6(7),"A")  ],
    "9":   [ s(e9(0),"E"),    s(a9(7),"A")  ],
  },
  F: {
    major: [ s(e(1),"E"),     s(a(8),"A")   ],
    minor: [ s(em(1),"E"),    s(am(8),"A")  ],
    dom7:  [ s(e7(1),"E"),    s(a7(8),"A")  ],
    maj7:  [ s(emaj7(1),"E"), s(amaj7(8),"A") ],
    m7:    [ s(em7(1),"E"),   s(am7(8),"A") ],
    sus2:  [ s(esus2(1),"E"), s(asus2(8),"A") ],
    sus4:  [ s(esus4(1),"E"), s(asus4(8),"A") ],
    add9:  [ s(eadd9(1),"E"), s(aadd9(8),"A") ],
    "6":   [ s(e6(1),"E"),    s(a6(8),"A")  ],
    "9":   [ s(e9(1),"E"),    s(a9(8),"A")  ],
  },
  "F#": {
    major: [ s(e(2),"E"),     s(a(9),"A")   ],
    minor: [ s(em(2),"E"),    s(am(9),"A")  ],
    dom7:  [ s(e7(2),"E"),    s(a7(9),"A")  ],
    maj7:  [ s(emaj7(2),"E"), s(amaj7(9),"A") ],
    m7:    [ s(em7(2),"E"),   s(am7(9),"A") ],
    sus2:  [ s(esus2(2),"E"), s(asus2(9),"A") ],
    sus4:  [ s(esus4(2),"E"), s(asus4(9),"A") ],
    add9:  [ s(eadd9(2),"E"), s(aadd9(9),"A") ],
    "6":   [ s(e6(2),"E"),    s(a6(9),"A")  ],
    "9":   [ s(e9(2),"E"),    s(a9(9),"A")  ],
  },
  G: {
    major: [ s({frets:[3,2,0,0,0,3],fingers:[2,1,0,0,0,3]},"G"),  s(e(3),"E"),     s(a(10),"A") ],
    minor: [ s(em(3),"E"),    s(am(10),"A") ],
    dom7:  [ s({frets:[3,2,0,0,0,1],fingers:[3,2,0,0,0,1]},"G"),  s(e7(3),"E"),    s(a7(10),"A") ],
    maj7:  [ s({frets:[3,2,0,0,0,2],fingers:[3,2,0,0,0,1]},"G"),  s(emaj7(3),"E"), s(amaj7(10),"A") ],
    m7:    [ s(em7(3),"E"),   s(am7(10),"A") ],
    sus2:  [ s(esus2(3),"E"), s(asus2(10),"A") ],
    sus4:  [ s(esus4(3),"E"), s(asus4(10),"A") ],
    add9:  [ s(eadd9(3),"E"), s(aadd9(10),"A") ],
    "6":   [ s(e6(3),"E"),    s(a6(10),"A") ],
    "9":   [ s(e9(3),"E"),    s(a9(10),"A") ],
  },
  Ab: {
    major: [ s(e(4),"E"),     s(a(11),"A")  ],
    minor: [ s(em(4),"E"),    s(am(11),"A") ],
    dom7:  [ s(e7(4),"E"),    s(a7(11),"A") ],
    maj7:  [ s(emaj7(4),"E"), s(amaj7(11),"A") ],
    m7:    [ s(em7(4),"E"),   s(am7(11),"A") ],
    sus2:  [ s(esus2(4),"E"), s(asus2(11),"A") ],
    sus4:  [ s(esus4(4),"E"), s(asus4(11),"A") ],
    add9:  [ s(eadd9(4),"E"), s(aadd9(11),"A") ],
    "6":   [ s(e6(4),"E"),    s(a6(11),"A") ],
    "9":   [ s(e9(4),"E"),    s(a9(11),"A") ],
  },
  A: {
    major: [ s(a(0),"A"),     s(e(5),"E")   ],
    minor: [ s(am(0),"A"),    s(em(5),"E")  ],
    dom7:  [ s(a7(0),"A"),    s(e7(5),"E")  ],
    maj7:  [ s(amaj7(0),"A"), s(emaj7(5),"E") ],
    m7:    [ s(am7(0),"A"),   s(em7(5),"E") ],
    sus2:  [ s(asus2(0),"A"), s(esus2(5),"E") ],
    sus4:  [ s(asus4(0),"A"), s(esus4(5),"E") ],
    add9:  [ s(aadd9(0),"A"), s(eadd9(5),"E") ],
    "6":   [ s(a6(0),"A"),    s(e6(5),"E")  ],
    "9":   [ s(a9(0),"A"),    s(e9(5),"E")  ],
  },
  Bb: {
    major: [ s(a(1),"A"),     s(e(6),"E")   ],
    minor: [ s(am(1),"A"),    s(em(6),"E")  ],
    dom7:  [ s(a7(1),"A"),    s(e7(6),"E")  ],
    maj7:  [ s(amaj7(1),"A"), s(emaj7(6),"E") ],
    m7:    [ s(am7(1),"A"),   s(em7(6),"E") ],
    sus2:  [ s(asus2(1),"A"), s(esus2(6),"E") ],
    sus4:  [ s(asus4(1),"A"), s(esus4(6),"E") ],
    add9:  [ s(aadd9(1),"A"), s(eadd9(6),"E") ],
    "6":   [ s(a6(1),"A"),    s(e6(6),"E")  ],
    "9":   [ s(a9(1),"A"),    s(e9(6),"E")  ],
  },
  B: {
    major: [ s(a(2),"A"),     s(e(7),"E")   ],
    minor: [ s(am(2),"A"),    s(em(7),"E")  ],
    dom7:  [ s(a7(2),"A"),    s(e7(7),"E")  ],
    maj7:  [ s(amaj7(2),"A"), s(emaj7(7),"E") ],
    m7:    [ s(am7(2),"A"),   s(em7(7),"E") ],
    sus2:  [ s(asus2(2),"A"), s(esus2(7),"E") ],
    sus4:  [ s(asus4(2),"A"), s(esus4(7),"E") ],
    add9:  [ s(aadd9(2),"A"), s(eadd9(7),"E") ],
    "6":   [ s(a6(2),"A"),    s(e6(7),"E")  ],
    "9":   [ s(a9(2),"A"),    s(e9(7),"E")  ],
  },
}

export const CHORD_TYPES: { label: string; type: ChordType; symbol: string; description: string; group: string }[] = [
  { label: "Mayor",  type: "major", symbol: "",      description: "1 · 3 · 5",          group: "tríadas" },
  { label: "Menor",  type: "minor", symbol: "m",     description: "1 · b3 · 5",         group: "tríadas" },
  { label: "sus2",   type: "sus2",  symbol: "sus2",  description: "1 · 2 · 5",          group: "tríadas" },
  { label: "sus4",   type: "sus4",  symbol: "sus4",  description: "1 · 4 · 5",          group: "tríadas" },
  { label: "add9",   type: "add9",  symbol: "add9",  description: "1 · 3 · 5 · 9",      group: "extendidos" },
  { label: "6",      type: "6",     symbol: "6",     description: "1 · 3 · 5 · 6",      group: "extendidos" },
  { label: "Dom 7",  type: "dom7",  symbol: "7",     description: "1 · 3 · 5 · b7",     group: "séptimas" },
  { label: "Maj 7",  type: "maj7",  symbol: "maj7",  description: "1 · 3 · 5 · 7",      group: "séptimas" },
  { label: "min 7",  type: "m7",    symbol: "m7",    description: "1 · b3 · 5 · b7",    group: "séptimas" },
  { label: "9",      type: "9",     symbol: "9",     description: "1 · 3 · 5 · b7 · 9", group: "extendidos" },
]

export const ROOT_NOTES = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"]
