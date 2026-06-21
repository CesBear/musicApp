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

// ─── Practice Sessions ───────────────────────────────────────────────────────

export async function getPracticeSessions(): Promise<PracticeSession[]> {
  const res = await fetch("/api/sessions")
  if (!res.ok) return []
  return res.json()
}

export async function addPracticeSession(
  data: Omit<PracticeSession, "id" | "created_at">,
): Promise<PracticeSession> {
  const res = await fetch("/api/sessions", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  })
  return res.json()
}

export async function deletePracticeSession(id: string): Promise<void> {
  await fetch(`/api/sessions/${id}`, { method: "DELETE" })
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export async function getLessons(): Promise<Lesson[]> {
  const res = await fetch("/api/lessons")
  if (!res.ok) return []
  return res.json()
}

export async function addLesson(
  data: Omit<Lesson, "id" | "created_at" | "updated_at" | "materials">,
): Promise<Lesson> {
  const res = await fetch("/api/lessons", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  })
  return res.json()
}

export async function updateLesson(
  id: string,
  data: Partial<Omit<Lesson, "id" | "created_at" | "materials">>,
): Promise<Lesson | null> {
  const res = await fetch(`/api/lessons/${id}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  })
  if (!res.ok) return null
  return res.json()
}

export async function deleteLesson(id: string): Promise<void> {
  await fetch(`/api/lessons/${id}`, { method: "DELETE" })
}

export function getLessonMaterials(_lessonId: string): LessonMaterial[] {
  return []
}
