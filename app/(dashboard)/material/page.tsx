"use client"

import { useState, useEffect } from "react"
import { supabase, type Lesson, type LessonMaterial } from "@/lib/supabase"
import { DEGREE_COLORS } from "@/data/scales"

type Tab = "lecciones" | "nueva"

const KIND_ICON: Record<string, string> = { pdf: "PDF", audio: "♪", tab: "TAB", video: "▷" }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
}

export default function MaterialPage() {
  const [lessons,     setLessons]     = useState<Lesson[]>([])
  const [selected,    setSelected]    = useState<Lesson | null>(null)
  const [materials,   setMaterials]   = useState<LessonMaterial[]>([])
  const [tab,         setTab]         = useState<Tab>("lecciones")
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)

  // New lesson form
  const [form, setForm] = useState({
    week: "", title: "", date: "", duration: "60 min",
    focus: "", homework: "0", notes: "", status: "current" as Lesson["status"],
  })

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("lessons")
      .select("*")
      .order("created_at", { ascending: false })
    setLessons(data ?? [])
    if (data && data.length > 0 && !selected) setSelected(data[0])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!selected) return
    supabase
      .from("lesson_materials")
      .select("*")
      .eq("lesson_id", selected.id)
      .then(({ data }) => setMaterials(data ?? []))
  }, [selected])

  const markDone = async (lesson: Lesson) => {
    const next = lesson.status === "done" ? "current" : "done"
    await supabase.from("lessons").update({ status: next, updated_at: new Date().toISOString() }).eq("id", lesson.id)
    setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, status: next } : l))
    if (selected?.id === lesson.id) setSelected(prev => prev ? { ...prev, status: next } : prev)
  }

  const saveLesson = async () => {
    setSaving(true)
    const { data, error } = await supabase.from("lessons").insert({
      week:     form.week,
      title:    form.title,
      date:     form.date,
      duration: form.duration,
      focus:    form.focus,
      homework: parseInt(form.homework) || 0,
      notes:    form.notes,
      status:   form.status,
    }).select().single()

    if (!error && data) {
      setLessons(prev => [data, ...prev])
      setSelected(data)
      setTab("lecciones")
      setForm({ week: "", title: "", date: "", duration: "60 min", focus: "", homework: "0", notes: "", status: "current" })
    }
    setSaving(false)
  }

  const deleteLesson = async (id: string) => {
    await supabase.from("lessons").delete().eq("id", id)
    setLessons(prev => prev.filter(l => l.id !== id))
    if (selected?.id === id) setSelected(lessons.find(l => l.id !== id) ?? null)
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="mc-hero">
        <div>
          <div className="mc-eyebrow">Estudio · Material del Maestro</div>
          <h1 className="mc-h1">
            <span style={{ color: "rgba(255,255,255,0.95)", fontStyle: "italic" }}>Tus </span>
            <span style={{ color: DEGREE_COLORS[0] }}>lecciones</span>
          </h1>
          <p className="mc-lede">Todo el material de tu maestro. Agrega, organiza y marca como practicado.</p>
        </div>
        <div className="mc-hero-aside">
          <button className="mc-play-btn" onClick={() => setTab(tab === "nueva" ? "lecciones" : "nueva")}>
            {tab === "nueva" ? "← Ver lecciones" : "+ Nueva lección"}
          </button>
        </div>
      </div>

      <div className="mc-tabs">
        {(["lecciones", "nueva"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`mc-tab ${tab === t ? "active" : ""}`}>
            {t === "lecciones" ? `Lecciones (${lessons.length})` : "Nueva lección"}
          </button>
        ))}
      </div>

      {/* ─── LECCIONES ─── */}
      {tab === "lecciones" && (
        loading ? (
          <div className="mc-info-card mc-info-card-quiet" style={{ textAlign: "center", padding: 40 }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Cargando...</p>
          </div>
        ) : lessons.length === 0 ? (
          <div className="mc-info-card mc-info-card-quiet" style={{ textAlign: "center", padding: 48 }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No hay lecciones todavía.</p>
            <button className="mc-play-btn" style={{ marginTop: 16 }} onClick={() => setTab("nueva")}>
              Agregar primera lección
            </button>
          </div>
        ) : (
          <div className="mc-lessons-layout">
            {/* List */}
            <div className="mc-lessons-list">
              {lessons.map(l => (
                <button key={l.id} onClick={() => setSelected(l)}
                  className={`mc-lesson-item ${selected?.id === l.id ? "active" : ""}`}>
                  <div className="mc-lesson-status">
                    {l.status === "current"
                      ? <span className="mc-lesson-current">EN CURSO</span>
                      : l.status === "done"
                      ? <span className="mc-lesson-done">✓</span>
                      : <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-mono)" }}>PENDIENTE</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
                      {l.week.toUpperCase()} · {l.date}
                    </p>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.92)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.title}
                    </p>
                    {l.focus && <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.42)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.focus}</p>}
                  </div>
                </button>
              ))}
            </div>

            {/* Detail */}
            {selected && (
              <div className="mc-lesson-detail">
                <div className="mc-lesson-detail-head">
                  <div>
                    <span style={{ fontSize: 11, color: DEGREE_COLORS[0], fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
                      {selected.week.toUpperCase()} · {selected.date.toUpperCase()}
                    </span>
                    <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 36, lineHeight: 1.1, color: "#fff", margin: "6px 0 4px", letterSpacing: "-0.02em" }}>
                      {selected.title}
                    </h2>
                    {selected.focus && <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>{selected.focus}</p>}
                  </div>
                  <div className="mc-lesson-meta">
                    <span className="mc-mono-tag">{selected.duration}</span>
                    {selected.homework > 0 && <span className="mc-mono-tag mc-mono-tag-warn">{selected.homework} deberes</span>}
                  </div>
                </div>

                {/* Materials */}
                {materials.length > 0 && (
                  <div>
                    <p className="mc-info-label">Materiales</p>
                    <div className="mc-materials-grid">
                      {materials.map(m => (
                        <div key={m.id} className="mc-material-row">
                          <div className={`mc-material-icon mc-material-${m.kind}`}>{KIND_ICON[m.kind]}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, color: "#fff", fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.label}</p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono)", margin: "3px 0 0" }}>
                              {[m.size, m.duration].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          {m.url && (
                            <a href={m.url} target="_blank" rel="noopener noreferrer" className="mc-material-action">
                              {m.kind === "audio" || m.kind === "video" ? "▷" : "↓"}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selected.notes && (
                  <div>
                    <p className="mc-info-label">Notas del maestro</p>
                    <blockquote className="mc-quote">
                      <span className="mc-quote-mark">&ldquo;</span>
                      {selected.notes}
                    </blockquote>
                  </div>
                )}

                <div className="mc-cta-row">
                  <button className="mc-play-btn" onClick={() => markDone(selected)}>
                    {selected.status === "done" ? "Marcar como pendiente" : "Marcar como practicado ✓"}
                  </button>
                  <button className="mc-btn-ghost" onClick={() => deleteLesson(selected.id)}
                    style={{ color: "rgba(255,80,80,0.6)" }}>
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ─── NUEVA LECCIÓN ─── */}
      {tab === "nueva" && (
        <div className="mc-lesson-detail" style={{ maxWidth: 640 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, color: "#fff", marginBottom: 24 }}>
            Nueva lección
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Semana", key: "week",     placeholder: "Semana 13" },
              { label: "Título", key: "title",    placeholder: "Pentatónica en posición 3" },
              { label: "Fecha",  key: "date",     placeholder: "20 May 2026" },
              { label: "Duración", key: "duration", placeholder: "60 min" },
              { label: "Enfoque", key: "focus",   placeholder: "Blues en A menor, trastes 5-8" },
              { label: "Deberes", key: "homework", placeholder: "2" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <p className="mc-info-label" style={{ marginBottom: 6 }}>{label}</p>
                <input
                  className="mc-input"
                  placeholder={placeholder}
                  value={(form as Record<string, string>)[key]}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13,
                    fontFamily: "var(--font-sans)", outline: "none",
                  }}
                />
              </div>
            ))}

            <div>
              <p className="mc-info-label" style={{ marginBottom: 6 }}>Notas del maestro</p>
              <textarea
                className="mc-input"
                placeholder="Consejos, observaciones, qué mejorar..."
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13,
                  fontFamily: "var(--font-sans)", outline: "none", resize: "vertical",
                }}
              />
            </div>

            <div>
              <p className="mc-info-label" style={{ marginBottom: 6 }}>Estado</p>
              <div style={{ display: "flex", gap: 8 }}>
                {(["current", "done", "pending"] as const).map(s => (
                  <button key={s} onClick={() => setForm(prev => ({ ...prev, status: s }))}
                    className={`mc-pos-chip ${form.status === s ? "active" : ""}`}>
                    {s === "current" ? "En curso" : s === "done" ? "Completada" : "Pendiente"}
                  </button>
                ))}
              </div>
            </div>

            <button className="mc-play-btn" onClick={saveLesson} disabled={!form.title || !form.week || saving}
              style={{ marginTop: 8, opacity: (!form.title || !form.week) ? 0.4 : 1 }}>
              {saving ? "Guardando..." : "Guardar lección"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
