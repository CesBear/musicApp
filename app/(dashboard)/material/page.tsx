"use client"

import { useState } from "react"
import { DEGREE_COLORS } from "@/data/scales"
import { TEACHER, LESSONS, REPERTOIRE, ROUTINE } from "@/data/lessons"

type Tab = "lecciones" | "repertorio" | "rutina"

export default function MaterialPage() {
  const [selectedId, setSelectedId] = useState(LESSONS[0].id)
  const [tab, setTab] = useState<Tab>("lecciones")

  const lesson = LESSONS.find(l => l.id === selectedId)

  return (
    <div className="flex flex-col gap-7">
      <div className="mc-hero">
        <div>
          <div className="mc-eyebrow">Estudio · Material del Maestro</div>
          <h1 className="mc-h1">
            <span style={{ color: "rgba(255,255,255,0.95)", fontStyle: "italic" }}>Tus </span>
            <span style={{ color: DEGREE_COLORS[0] }}>lecciones</span>
          </h1>
          <p className="mc-lede">Todo el material, deberes y grabaciones que te pasa tu maestro. Sincronizado después de cada clase.</p>
        </div>

        <div className="mc-teacher-card">
          <div className="mc-avatar">{TEACHER.avatar}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{TEACHER.name}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>{TEACHER.studio}</span>
          </div>
          <div className="mc-live-dot" />
        </div>
      </div>

      <div className="mc-tabs">
        {([
          { id: "lecciones",  label: "Lecciones",      count: LESSONS.length    },
          { id: "repertorio", label: "Repertorio",     count: REPERTOIRE.length },
          { id: "rutina",     label: "Rutina diaria",  count: ROUTINE.length    },
        ] as { id: Tab; label: string; count: number }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`mc-tab ${tab === t.id ? "active" : ""}`}>
            {t.label}
            <span className="mc-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "lecciones" && (
        <div className="mc-lessons-layout">
          <div className="mc-lessons-list">
            {LESSONS.map(l => (
              <button key={l.id} onClick={() => setSelectedId(l.id)}
                className={`mc-lesson-item ${selectedId === l.id ? "active" : ""}`}>
                <div className="mc-lesson-status">
                  {l.status === "current"
                    ? <span className="mc-lesson-current">EN CURSO</span>
                    : <span className="mc-lesson-done">✓</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>{l.week.toUpperCase()} · {l.date}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.92)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</span>
                  <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.42)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.focus}</span>
                </div>
              </button>
            ))}
          </div>

          {lesson && (
            <div className="mc-lesson-detail">
              <div className="mc-lesson-detail-head">
                <div>
                  <span style={{ fontSize: 11, color: DEGREE_COLORS[0], fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>{lesson.week.toUpperCase()} · {lesson.date.toUpperCase()}</span>
                  <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 38, lineHeight: 1.1, color: "#fff", margin: "6px 0 4px", letterSpacing: "-0.02em" }}>{lesson.title}</h2>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>{lesson.focus}</p>
                </div>
                <div className="mc-lesson-meta">
                  <span className="mc-mono-tag">{lesson.duration}</span>
                  {lesson.homework > 0 && <span className="mc-mono-tag mc-mono-tag-warn">{lesson.homework} deberes</span>}
                </div>
              </div>

              <div>
                <p className="mc-info-label">Materiales</p>
                <div className="mc-materials-grid">
                  {lesson.materials.map((m, i) => (
                    <div key={i} className="mc-material-row">
                      <div className={`mc-material-icon mc-material-${m.kind}`}>
                        {m.kind === "pdf" ? "PDF" : m.kind === "audio" ? "♪" : "TAB"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, color: "#fff", fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.label}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono)", margin: "3px 0 0" }}>
                          {m.size && <span>{m.size}</span>}
                          {m.duration && <span>{m.size ? " · " : ""}{m.duration}</span>}
                        </p>
                      </div>
                      <button className="mc-material-action">{m.kind === "audio" ? "▷" : "↓"}</button>
                    </div>
                  ))}
                </div>
              </div>

              {lesson.notes && (
                <div>
                  <p className="mc-info-label">Notas del maestro</p>
                  <blockquote className="mc-quote">
                    <span className="mc-quote-mark">&ldquo;</span>
                    {lesson.notes}
                  </blockquote>
                </div>
              )}

              {lesson.status === "current" && (
                <div className="mc-cta-row">
                  <button className="mc-play-btn">Marcar como practicado</button>
                  <button className="mc-btn-ghost">Pedir aclaración</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "repertorio" && (
        <div>
          <table className="mc-table">
            <thead>
              <tr>
                <th>Canción</th><th>Artista</th><th>Tonalidad</th><th>Dificultad</th>
                <th style={{ width: 200 }}>Progreso</th><th></th>
              </tr>
            </thead>
            <tbody>
              {REPERTOIRE.map((r, i) => (
                <tr key={i}>
                  <td><span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#fff", letterSpacing: "-0.01em" }}>{r.song}</span></td>
                  <td><span style={{ color: "rgba(255,255,255,0.55)" }}>{r.artist}</span></td>
                  <td><span className="mc-mono-tag">{r.key}</span></td>
                  <td><span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{r.difficulty}</span></td>
                  <td>
                    <div className="mc-progress">
                      <div className="mc-progress-bar" style={{ width: `${r.progress * 100}%`, background: r.progress === 1 ? DEGREE_COLORS[2] : DEGREE_COLORS[0] }} />
                    </div>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-mono)", marginLeft: 4 }}>{Math.round(r.progress * 100)}%</span>
                  </td>
                  <td><button className="mc-icon-btn">→</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "rutina" && (
        <div className="mc-routine-grid">
          {ROUTINE.map((r, i) => (
            <div key={i} className="mc-routine-card">
              <div className="mc-routine-num">0{i + 1}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: "#fff" }}>{r.label}</span>
                  <span className="mc-mono-tag">{r.duration}</span>
                </div>
                <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, margin: 0 }}>{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
