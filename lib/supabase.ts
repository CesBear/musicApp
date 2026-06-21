// ─── Types ───────────────────────────────────────────────────────────────────

export type LessonMaterial = {
  id:         string
  lesson_id:  string
  kind:       "pdf" | "audio" | "tab" | "video"
  label:      string
  url:        string | null
  size:       string | null
  duration:   string | null
  created_at: string
}

export type Lesson = {
  id:         string
  week:       string
  title:      string
  date:       string
  duration:   string
  status:     "current" | "done" | "pending"
  focus:      string | null
  homework:   number
  notes:      string | null
  created_at: string
  updated_at: string
  materials?: LessonMaterial[]
}

export type PracticeSession = {
  id:           string
  date:         string
  duration_min: number
  what:         string | null
  notes:        string | null
  bpm:          number | null
  mood:         number | null
  created_at:   string
}
