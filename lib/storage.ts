import type { PracticeSession, Lesson, LessonMaterial } from "./supabase"

const SESSIONS_KEY = "mc_practice_sessions"
const LESSONS_KEY  = "mc_lessons"

function uid()  { return crypto.randomUUID() }
function now()  { return new Date().toISOString() }

// ─── Practice Sessions ───────────────────────────────────────────────────────

export function getPracticeSessions(): PracticeSession[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? "[]") }
  catch { return [] }
}

export function addPracticeSession(
  data: Omit<PracticeSession, "id" | "created_at">,
): PracticeSession {
  const session: PracticeSession = { ...data, id: uid(), created_at: now() }
  const all = getPracticeSessions()
  localStorage.setItem(SESSIONS_KEY, JSON.stringify([session, ...all]))
  return session
}

export function deletePracticeSession(id: string): void {
  localStorage.setItem(
    SESSIONS_KEY,
    JSON.stringify(getPracticeSessions().filter(s => s.id !== id)),
  )
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export function getLessons(): Lesson[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(LESSONS_KEY) ?? "[]") }
  catch { return [] }
}

export function addLesson(
  data: Omit<Lesson, "id" | "created_at" | "updated_at" | "materials">,
): Lesson {
  const lesson: Lesson = { ...data, id: uid(), created_at: now(), updated_at: now() }
  const all = getLessons()
  localStorage.setItem(LESSONS_KEY, JSON.stringify([lesson, ...all]))
  return lesson
}

export function updateLesson(
  id: string,
  data: Partial<Omit<Lesson, "id" | "created_at" | "materials">>,
): Lesson | null {
  const all = getLessons()
  const idx = all.findIndex(l => l.id === id)
  if (idx === -1) return null
  const updated = { ...all[idx], ...data, updated_at: now() }
  all[idx] = updated
  localStorage.setItem(LESSONS_KEY, JSON.stringify(all))
  return updated
}

export function deleteLesson(id: string): void {
  localStorage.setItem(
    LESSONS_KEY,
    JSON.stringify(getLessons().filter(l => l.id !== id)),
  )
}

// Lesson materials are not editable via UI
export function getLessonMaterials(_lessonId: string): LessonMaterial[] {
  return []
}
