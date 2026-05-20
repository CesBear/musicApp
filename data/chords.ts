export type Barre = { fret: number; from: number; to: number }

export type ChordVoicing = {
  frets:   number[]   // string 6→1 (low E to high e), -1=muted, 0=open
  fingers: number[]   // 0=none, 1=index, 2=mid, 3=ring, 4=pinky
  barre?:  Barre
}

// ─── E-shape generators (root on string 6 at fret p) ───────────────────────
// esus2 at p>4 requires a 4-fret stretch on D+G strings — advanced voicing
const e     = (p: number): ChordVoicing => ({ frets: p===0?[0,2,2,1,0,0]:[p,p+2,p+2,p+1,p,p],       fingers: p===0?[0,2,3,1,0,0]:[1,3,4,2,1,1],       barre: p>0?{fret:p,from:0,to:5}:undefined })
const em    = (p: number): ChordVoicing => ({ frets: p===0?[0,2,2,0,0,0]:[p,p+2,p+2,p,p,p],           fingers: p===0?[0,2,3,0,0,0]:[1,3,4,1,1,1],       barre: p>0?{fret:p,from:0,to:5}:undefined })
const e7    = (p: number): ChordVoicing => ({ frets: p===0?[0,2,0,1,0,0]:[p,p+2,p,p+1,p,p],           fingers: p===0?[0,2,0,1,0,0]:[1,3,1,2,1,1],       barre: p>0?{fret:p,from:0,to:5}:undefined })
const emaj7 = (p: number): ChordVoicing => ({ frets: p===0?[0,2,1,1,0,0]:[p,p+2,p+1,p+1,p,p],         fingers: p===0?[0,3,1,2,0,0]:[1,4,2,3,1,1],       barre: p>0?{fret:p,from:0,to:5}:undefined })
const em7   = (p: number): ChordVoicing => ({ frets: p===0?[0,2,0,0,0,0]:[p,p+2,p,p,p,p],             fingers: p===0?[0,2,0,0,0,0]:[1,2,1,1,1,1],       barre: p>0?{fret:p,from:0,to:5}:undefined })
const esus4 = (p: number): ChordVoicing => ({ frets: p===0?[0,2,2,2,0,0]:[p,p+2,p+2,p+2,p,p],         fingers: p===0?[0,1,2,3,0,0]:[1,2,3,4,1,1],       barre: p>0?{fret:p,from:0,to:5}:undefined })
const esus2 = (p: number): ChordVoicing => ({ frets: p===0?[0,2,4,4,0,0]:[p,p+2,p+4,p+4,p,p],         fingers: p===0?[0,1,3,4,0,0]:[1,2,4,4,1,1],       barre: p>0?{fret:p,from:0,to:5}:undefined })
const eadd9 = (p: number): ChordVoicing => ({ frets: p===0?[0,2,2,1,0,2]:[p,p+2,p+2,p+1,p,p+2],       fingers: p===0?[0,2,3,1,0,4]:[1,3,4,2,1,4],       barre: p>0?{fret:p,from:0,to:4}:undefined })
const e6    = (p: number): ChordVoicing => ({ frets: p===0?[0,2,2,1,2,0]:[p,p+2,p+2,p+1,p+2,p],       fingers: p===0?[0,1,2,0,3,0]:[1,2,3,0,4,1],       barre: p>0?{fret:p,from:0,to:5}:undefined })
const e9    = (p: number): ChordVoicing => ({ frets: p===0?[0,2,0,1,0,2]:[p,p+2,p,p+1,p,p+2],         fingers: p===0?[0,2,0,1,0,3]:[1,3,1,2,1,4],       barre: p>0?{fret:p,from:0,to:5}:undefined })

// ─── A-shape generators (root on string 5 at fret p) ───────────────────────
const a     = (p: number): ChordVoicing => ({ frets: [-1,p,p+2,p+2,p+2,p],       fingers: p===0?[0,0,1,2,3,0]:[0,1,3,3,3,1],       barre: {fret:p===0?2:p+2,from:2,to:4} })
const am    = (p: number): ChordVoicing => ({ frets: [-1,p,p+2,p+2,p+1,p],       fingers: p===0?[0,0,2,3,1,0]:[0,1,3,4,2,1],       barre: p>0?{fret:p,from:1,to:5}:undefined })
const a7    = (p: number): ChordVoicing => ({ frets: [-1,p,p+2,p,p+2,p],         fingers: p===0?[0,0,2,0,3,0]:[0,1,3,1,2,1],       barre: p>0?{fret:p,from:1,to:5}:undefined })
const amaj7 = (p: number): ChordVoicing => ({ frets: [-1,p,p+2,p+1,p+2,p],       fingers: p===0?[0,0,3,1,4,0]:[0,1,3,2,4,1],       barre: p>0?{fret:p,from:1,to:5}:undefined })
const am7   = (p: number): ChordVoicing => ({ frets: [-1,p,p+2,p,p+1,p],         fingers: p===0?[0,0,3,0,2,0]:[0,1,3,1,2,1],       barre: p>0?{fret:p,from:1,to:5}:undefined })
const asus4 = (p: number): ChordVoicing => ({ frets: [-1,p,p+2,p+2,p+3,p],       fingers: p===0?[0,0,1,2,3,0]:[0,1,2,3,4,1],       barre: p>0?{fret:p,from:1,to:5}:undefined })
const asus2 = (p: number): ChordVoicing => ({ frets: [-1,p,p+2,p+4,p,p],         fingers: p===0?[0,0,1,3,0,0]:[0,1,2,4,1,1],       barre: p>0?{fret:p,from:1,to:5}:undefined })
const aadd9 = (p: number): ChordVoicing => ({ frets: [-1,p,p+2,p+4,p+2,p],       fingers: p===0?[0,0,1,4,3,0]:[0,1,2,4,3,1],       barre: p>0?{fret:p,from:1,to:5}:undefined })
const a6    = (p: number): ChordVoicing => ({ frets: [-1,p,p+2,p+2,p+2,p+2],     fingers: p===0?[0,0,1,2,3,4]:[0,1,2,3,4,4],       barre: undefined })
// voicing 1-5-b7-9 (jazz standard — omits 3rd, common in guitar due to range limitations)
const a9    = (p: number): ChordVoicing => ({ frets: [-1,p,p+2,p,p,p],           fingers: p===0?[0,0,2,0,0,0]:[0,1,3,1,1,1],       barre: p>0?{fret:p,from:1,to:5}:undefined })

export type ChordType = "major"|"minor"|"dom7"|"maj7"|"m7"|"sus2"|"sus4"|"add9"|"6"|"9"

export const CHORD_VOICINGS: Record<string, Record<ChordType, ChordVoicing>> = {
  C:    { major:{frets:[-1,3,2,0,1,0],fingers:[0,3,2,0,1,0]}, minor:am(3),  dom7:{frets:[-1,3,2,3,1,0],fingers:[0,3,2,4,1,0]}, maj7:{frets:[-1,3,2,0,0,0],fingers:[0,3,2,0,0,0]}, m7:am7(3),  sus2:asus2(3), sus4:asus4(3), add9:aadd9(3), "6":a6(3),  "9":a9(3) },
  "C#": { major:a(4),  minor:am(4),  dom7:a7(4),   maj7:amaj7(4),  m7:am7(4),  sus2:asus2(4), sus4:asus4(4), add9:aadd9(4), "6":a6(4),  "9":a9(4) },
  D:    { major:{frets:[-1,-1,0,2,3,2],fingers:[0,0,0,1,3,2]}, minor:{frets:[-1,-1,0,2,3,1],fingers:[0,0,0,2,3,1]}, dom7:{frets:[-1,-1,0,2,1,2],fingers:[0,0,0,2,1,3]}, maj7:{frets:[-1,-1,0,2,2,2],fingers:[0,0,0,1,1,1],barre:{fret:2,from:3,to:5}}, m7:{frets:[-1,-1,0,2,1,1],fingers:[0,0,0,2,1,1],barre:{fret:1,from:4,to:5}}, sus2:asus2(5), sus4:asus4(5), add9:aadd9(5), "6":a6(5), "9":a9(5) },
  Eb:   { major:a(6),  minor:am(6),  dom7:a7(6),   maj7:amaj7(6),  m7:am7(6),  sus2:asus2(6), sus4:asus4(6), add9:aadd9(6), "6":a6(6),  "9":a9(6) },
  E:    { major:e(0),  minor:em(0),  dom7:e7(0),   maj7:emaj7(0),  m7:em7(0),  sus2:esus2(0), sus4:esus4(0), add9:eadd9(0), "6":e6(0),  "9":e9(0) },
  F:    { major:e(1),  minor:em(1),  dom7:e7(1),   maj7:emaj7(1),  m7:em7(1),  sus2:esus2(1), sus4:esus4(1), add9:eadd9(1), "6":e6(1),  "9":e9(1) },
  "F#": { major:e(2),  minor:em(2),  dom7:e7(2),   maj7:emaj7(2),  m7:em7(2),  sus2:esus2(2), sus4:esus4(2), add9:eadd9(2), "6":e6(2),  "9":e9(2) },
  G:    { major:{frets:[3,2,0,0,0,3],fingers:[2,1,0,0,0,3]}, minor:em(3), dom7:{frets:[3,2,0,0,0,1],fingers:[3,2,0,0,0,1]}, maj7:{frets:[3,2,0,0,0,2],fingers:[3,2,0,0,0,1]}, m7:em7(3), sus2:esus2(3), sus4:esus4(3), add9:eadd9(3), "6":e6(3), "9":e9(3) },
  Ab:   { major:e(4),  minor:em(4),  dom7:e7(4),   maj7:emaj7(4),  m7:em7(4),  sus2:esus2(4), sus4:esus4(4), add9:eadd9(4), "6":e6(4),  "9":e9(4) },
  A:    { major:a(0),  minor:am(0),  dom7:a7(0),   maj7:amaj7(0),  m7:am7(0),  sus2:asus2(0), sus4:asus4(0), add9:aadd9(0), "6":a6(0),  "9":a9(0) },
  Bb:   { major:a(1),  minor:am(1),  dom7:a7(1),   maj7:amaj7(1),  m7:am7(1),  sus2:asus2(1), sus4:asus4(1), add9:aadd9(1), "6":a6(1),  "9":a9(1) },
  B:    { major:a(2),  minor:am(2),  dom7:a7(2),   maj7:amaj7(2),  m7:am7(2),  sus2:asus2(2), sus4:asus4(2), add9:aadd9(2), "6":a6(2),  "9":a9(2) },
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
