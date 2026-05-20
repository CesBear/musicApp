"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase, type PracticeSession } from "@/lib/supabase"
import { DEGREE_COLORS } from "@/data/scales"

const MOOD_LABELS = ["", "Frustrado", "Regular", "Bien", "Muy bien", "Excelente"]
const MOOD_COLORS = ["", "#ef4444", "#f59e0b", "#60a5fa", "#34d399", DEGREE_COLORS[0]]

function getTodayKey() { return new Date().toISOString().slice(0, 10) }

function buildCalendar(sessions: PracticeSession[]) {
  const dayMap = new Map<string, number>()
  for (const s of sessions) {
    dayMap.set(s.date, (dayMap.get(s.date) ?? 0) + s.duration_min)
  }
  const grid = []
  for (let i = 83; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    grid.push({ key, mins: dayMap.get(key) ?? 0, isToday: i === 0 })
  }
  return grid
}

function calcStreak(sessions: PracticeSession[]) {
  const days = new Set(sessions.map(s => s.date))
  let streak = 0
  let cursor = getTodayKey()
  while (days.has(cursor)) {
    streak++
    const d = new Date(cursor); d.setDate(d.getDate() - 1)
    cursor = d.toISOString().slice(0, 10)
  }
  return streak
}

export default function ProgresoPage() {
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    date: getTodayKey(), duration_min: "30",
    what: "", notes: "", bpm: "", mood: 3,
  })

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("practice_sessions")
      .select("*")
      .order("date", { ascending: false })
    setSessions(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    const { data } = await supabase.from("practice_sessions").insert({
      date:         form.date,
      duration_min: parseInt(form.duration_min) || 30,
      what:         form.what || null,
      notes:        form.notes || null,
      bpm:          parseInt(form.bpm) || null,
      mood:         form.mood,
    }).select().single()
    if (data) setSessions(prev => [data, ...prev])
    setShowForm(false)
    setSaving(false)
    setForm({ date: getTodayKey(), duration_min: "30", what: "", notes: "", bpm: "", mood: 3 })
  }

  const del = async (id: string) => {
    await supabase.from("practice_sessions").delete().eq("id", id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  const calendar  = useMemo(() => buildCalendar(sessions), [sessions])
  const streak    = useMemo(() => calcStreak(sessions), [sessions])
  const totalMins = useMemo(() => sessions.reduce((a, s) => a + s.duration_min, 0), [sessions])
  const totalH    = Math.floor(totalMins / 60)
  const totalM    = totalMins % 60

  const weekSessions = sessions.filter(s => {
    const d = new Date(s.date), now = new Date()
    const start = new Date(now); start.setDate(now.getDate() - 6)
    return d >= start
  })
  const weekMins = weekSessions.reduce((a, s) => a + s.duration_min, 0)

  return (
    <div className="flex flex-col gap-8">
      <div className="mc-hero">
        <div>
          <div className="mc-eyebrow">Estudio · Mi Progreso</div>
          <h1 className="mc-h1">
            <span style={{ color: "rgba(255,255,255,0.95)", fontStyle: "italic" }}>Tu </span>
            <span style={{ color: DEGREE_COLORS[0] }}>evolución</span>
          </h1>
          <p className="mc-lede">Registra cada sesión de práctica y ve cómo creces semana a semana.</p>
        </div>
        <div className="mc-hero-aside">
          <button className="mc-play-btn" onClick={() => setShowForm(v => !v)}>
            {showForm ? "Cancelar" : "+ Registrar sesión"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Racha actual", value: `${streak}d`, sub: streak === 1 ? "1 día consecutivo" : `${streak} días consecutivos` },
          { label: "Esta semana",  value: weekMins >= 60 ? `${Math.floor(weekMins/60)}h ${weekMins%60}m` : `${weekMins}m`, sub: `${weekSessions.length} sesiones` },
          { label: "Total",        value: totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM}m`, sub: `${sessions.length} sesiones` },
        ].map(s => (
          <div key={s.label} className="mc-info-card">
            <p className="mc-info-label">{s.label}</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: DEGREE_COLORS[0], fontFamily: "var(--font-mono)", lineHeight: 1.1, marginTop: 6 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4, fontFamily: "var(--font-mono)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Calendar heatmap */}
      <div className="mc-info-card">
        <p className="mc-info-label" style={{ marginBottom: 12 }}>Últimas 12 semanas</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 3 }}>
          {/* Group by week */}
          {Array.from({ length: 12 }).map((_, w) => (
            <div key={w} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {calendar.slice(w * 7, w * 7 + 7).map(d => {
                const intensity = d.mins === 0 ? 0 : d.mins < 20 ? 0.25 : d.mins < 45 ? 0.55 : 0.9
                return (
                  <div key={d.key}
                    title={`${d.key}: ${d.mins}min`}
                    style={{
                      width: "100%", aspectRatio: "1",
                      borderRadius: 3,
                      background: intensity === 0
                        ? "rgba(255,255,255,0.04)"
                        : `oklch(0.80 0.15 70 / ${intensity})`,
                      outline: d.isToday ? "1.5px solid rgba(255,255,255,0.3)" : "none",
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 10, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono)" }}>Menos</span>
          {[0.04, 0.25, 0.55, 0.9].map((op, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: 2,
              background: i === 0 ? "rgba(255,255,255,0.04)" : `oklch(0.80 0.15 70 / ${op})` }} />
          ))}
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono)" }}>Más</span>
        </div>
      </div>

      {/* Register form */}
      {showForm && (
        <div className="mc-info-card" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <p className="mc-info-label" style={{ marginBottom: 16 }}>Nueva sesión de práctica</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[
              { label: "Fecha",     key: "date",         placeholder: getTodayKey(), type: "date" },
              { label: "Duración (min)", key: "duration_min", placeholder: "30",     type: "number" },
              { label: "¿Qué practicaste?", key: "what",   placeholder: "Pentatónica menor, posición 1", type: "text" },
              { label: "BPM del ejercicio", key: "bpm",    placeholder: "80",        type: "number" },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 5, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</p>
                <input type={type} placeholder={placeholder}
                  value={(form as Record<string, string | number>)[key] as string}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none" }} />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Estado de ánimo</p>
            <div style={{ display: "flex", gap: 8 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setForm(p => ({ ...p, mood: n }))}
                  style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${form.mood === n ? MOOD_COLORS[n] : "rgba(255,255,255,0.1)"}`,
                    background: form.mood === n ? `${MOOD_COLORS[n]}20` : "rgba(255,255,255,0.03)",
                    color: form.mood === n ? MOOD_COLORS[n] : "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.15s" }}>
                  {n}
                </button>
              ))}
              <span style={{ alignSelf: "center", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{MOOD_LABELS[form.mood]}</span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 5, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Notas</p>
            <textarea placeholder="Qué salió bien, qué mejorar..."
              value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", resize: "vertical" }} />
          </div>

          <button className="mc-play-btn" onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar sesión"}</button>
        </div>
      )}

      {/* History */}
      <div>
        <p className="mc-info-label" style={{ marginBottom: 12 }}>Historial</p>
        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Cargando...</p>
        ) : sessions.length === 0 ? (
          <div className="mc-info-card mc-info-card-quiet" style={{ textAlign: "center", padding: 40 }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No hay sesiones registradas. ¡Empieza hoy!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sessions.slice(0, 20).map(s => (
              <div key={s.id} className="mc-info-card" style={{ flexDirection: "row", alignItems: "center", gap: 16, padding: "12px 16px" }}>
                <div style={{ minWidth: 90 }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono)" }}>{s.date}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: DEGREE_COLORS[0], fontFamily: "var(--font-mono)" }}>{s.duration_min}min</p>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {s.what && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.what}</p>}
                  {s.notes && <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.notes}</p>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  {s.bpm && <span className="mc-mono-tag">{s.bpm} BPM</span>}
                  {s.mood && (
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: `${MOOD_COLORS[s.mood]}20`,
                      border: `1px solid ${MOOD_COLORS[s.mood]}40`, color: MOOD_COLORS[s.mood],
                      fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {s.mood}
                    </span>
                  )}
                  <button onClick={() => del(s.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)",
                    cursor: "pointer", fontSize: 14, padding: "4px 6px" }} title="Eliminar">×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
