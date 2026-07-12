"use client"

import { useState, useEffect, useCallback } from "react"
import { type Lesson, type LessonMaterial, getLessons, addLesson, updateLesson, deleteLesson, getLessonMaterials } from "@/lib/storage"
import { DEGREE_COLORS } from "@/data/scales"

type Tab = "temas" | "lecciones" | "nueva"
const KIND_ICON: Record<string, string> = { pdf: "PDF", audio: "♪", tab: "TAB", video: "▷" }

// ─── Data ──────────────────────────────────────────────────────────────────

type ClassEntry = {
  fecha: string
  fechaDisplay: string
  titulo: string
  descripcion: string
  archivos: string[]
  areaId: string
}

type TemaArea = {
  id: string
  area: string
  color: string
  entries: ClassEntry[]
}

const TEMAS: TemaArea[] = [
  {
    id: "plan", area: "Plan de Práctica", color: DEGREE_COLORS[3],
    entries: [{
      fecha: "2025-11-20", fechaDisplay: "20 Nov 2025", areaId: "plan",
      titulo: "Rutina semanal",
      descripcion: "Lunes/Miércoles: técnica e improvisación (15 min pauta + 15 min técnica). Martes/Jueves: mapa armónico — escala/tonalidad, arpegios, acordes/voicings. Viernes: repertorio — aprender, reposar, setlist. Sábado: composición.",
      archivos: ["rutina-semanal.jpg"],
    }],
  },
  {
    id: "mastil", area: "Mapa del Mástil", color: DEGREE_COLORS[2],
    entries: [{
      fecha: "2025-11-07", fechaDisplay: "7 Nov 2025", areaId: "mastil",
      titulo: "Notas en el diapasón",
      descripcion: "Mapa completo de notas naturales en las 6 cuerdas del trastes 1–15, con codificación de color por nota.",
      archivos: ["notas-diapason.jpg"],
    }],
  },
  {
    id: "triadas", area: "Tríadas y Arpegios", color: DEGREE_COLORS[0],
    entries: [
      {
        fecha: "2025-10-23", fechaDisplay: "23 Oct 2025", areaId: "triadas",
        titulo: "Arpegios – Sweep Picking F.2",
        descripcion: "Arpegios con técnica de sweep picking: C mayor, Am, B° y C aumentado. Dos posiciones por acorde a lo largo del mástil.",
        archivos: ["sweep-picking-f2.jpg"],
      },
      {
        fecha: "2025-11-07", fechaDisplay: "7 Nov 2025", areaId: "triadas",
        titulo: "Tríadas en el mástil – Pos. fundamental",
        descripcion: "Tríadas diatónicas de C mayor: C, Am, F, Dm y B°/D con sus inversiones visualizadas sobre el mástil.",
        archivos: ["triadas-mastil-pos-fund.jpg"],
      },
      {
        fecha: "2025-11-07", fechaDisplay: "7 Nov 2025", areaId: "triadas",
        titulo: "Tríadas pt.2 – Inversiones",
        descripcion: "Posición fundamental, 1ª inversión (acorde/bajo) y 2ª inversión. Tabla completa de las 7 tríadas de C mayor en las tres inversiones.",
        archivos: ["triadas-inversiones.jpg"],
      },
      {
        fecha: "2026-02-06", fechaDisplay: "6 Feb 2026", areaId: "triadas",
        titulo: "Acordes de Séptima (voicings)",
        descripcion: "CΔ7, Dm7, G7, Bø y C6 visualizados en el mástil con sus posiciones de raíz y extensión.",
        archivos: ["acordes-septima-voicings.jpg"],
      },
      {
        fecha: "2026-02-06", fechaDisplay: "6 Feb 2026", areaId: "triadas",
        titulo: "Tétradas / Intervalos de 7ª",
        descripcion: "Las tétradas son acordes de 4 notas: 1-3-5-7. Tétradas diatónicas de C mayor: CΔ7 Dm7 Em7 FΔ7 G7 Am7 Bø. Tabla de estructura, intervalos y poliacordes.",
        archivos: ["tetradas-diatonicas.jpg", "intervalos-7ma.jpg"],
      },
      {
        fecha: "2026-05-20", fechaDisplay: "20 May 2026", areaId: "triadas",
        titulo: "Tríadas Menor Armónica P.F.",
        descripcion: "Tríadas de Am armónica (Am, B°, C+, Dm, E, F, G#°) en posición fundamental sobre 4 cuerdas del mástil.",
        archivos: ["triadas-menor-armonica.jpg"],
      },
    ],
  },
  {
    id: "circulo", area: "Círculo de Quintas", color: DEGREE_COLORS[4],
    entries: [
      {
        fecha: "2025-11-17", fechaDisplay: "17 Nov 2025", areaId: "circulo",
        titulo: "Armaduras: #'s y b's",
        descripcion: "Para #'s: contar una 5ta justa desde la nota de partida, la alterada es la anterior a la 5ta. Para b's: contar una 4ta justa. Secuencias: F# C# G# D# A# E# B# y Bb Eb Ab Db Gb Cb Fb.",
        archivos: ["circulo-quintas-armaduras.jpg", "circulo-quintas-visual.jpg"],
      },
      {
        fecha: "2025-11-17", fechaDisplay: "17 Nov 2025", areaId: "circulo",
        titulo: "Tonalidades más usadas en música",
        descripcion: "Gráfica de Spotify: G mayor (10.7%) y C mayor (10.2%) dominan. Le siguen D mayor, A mayor, C# mayor y F mayor.",
        archivos: ["tonalidades-spotify.jpg"],
      },
    ],
  },
  {
    id: "modos", area: "Modos Griegos", color: DEGREE_COLORS[1],
    entries: [
      {
        fecha: "2025-12-11", fechaDisplay: "11 Dic 2025", areaId: "modos",
        titulo: "Los 7 Modos Griegos",
        descripcion: "I Jónico 1 2 3 4 5 6 7 (feliz). II Dórico 1 2 b3 4 5 6 b7 (triste-cachondo). III Frigio b2 b3. IV Lidio #4. V Mixolidio b7 (dominante). VI Eólico (menor natural). VII Locrio b2 b5 (tenso/metal).",
        archivos: ["modos-griegos-lista.jpg"],
      },
      {
        fecha: "2025-12-11", fechaDisplay: "11 Dic 2025", areaId: "modos",
        titulo: "D Dórico – modo relativo de C",
        descripcion: "D dórico usa exactamente las notas de C mayor pero partiendo de D. Sonido 'triste-cachondo'. El modo II de la escala mayor.",
        archivos: ["d-dorico.jpg"],
      },
      {
        fecha: "2025-12-11", fechaDisplay: "11 Dic 2025", areaId: "modos",
        titulo: "Triángulo de modos",
        descripcion: "Clasificación visual: base Mayor (Jónico) ↔ Menor (Eólico). Vértice superior = Tenso (Locrio). Frigio, Lidio y Mixolidio en los lados del triángulo.",
        archivos: ["triangulo-modos.jpg"],
      },
      {
        fecha: "2026-01-15", fechaDisplay: "15 Ene 2026", areaId: "modos",
        titulo: "Modos pt.2 – F Lidio",
        descripcion: "F Lidio es el modo IV de C mayor: F G Am B° C Dm Em F. Fórmula 1 2 3 #4 5 6 7. Armonía modal: la B° actúa como acorde del tritono (#4), característica del Lidio.",
        archivos: ["modos-f-lidio.jpg"],
      },
      {
        fecha: "2026-01-30", fechaDisplay: "30 Ene 2026", areaId: "modos",
        titulo: "Modo Mixolidio",
        descripcion: "G Mixolidio: G A B C D E F G. Fórmula 1 2 3 4J 5J 6 b7 → acorde dominante G7. Comparativa de los 7 modos con sus intervalos alterados.",
        archivos: ["mixolidio-1.jpg", "mixolidio-2.jpg"],
      },
    ],
  },
  {
    id: "tecnica", area: "Técnica", color: DEGREE_COLORS[5],
    entries: [{
      fecha: "2026-01-15", fechaDisplay: "15 Ene 2026", areaId: "tecnica",
      titulo: "Retros – Secuencias escalísticas",
      descripcion: "Ejercicios de digitación sobre la escala: retros de 2, 3 y 4 notas, y desplazadas (1-3-2-4). En diesiseisavos (grupos 1-3) y tresillos/seisillos (grupo 4).",
      archivos: ["retros-digitacion.jpg"],
    }],
  },
  {
    id: "pentatonica", area: "Escala Pentatónica", color: DEGREE_COLORS[6] ?? "#a78bfa",
    entries: [
      {
        fecha: "2026-03-02", fechaDisplay: "2 Mar 2026", areaId: "pentatonica",
        titulo: "Pentatónica Menor – 5 posiciones",
        descripcion: "Las 5 cajitas de la pentatónica menor a lo largo del mástil. Se deriva de la escala mayor eliminando las notas sensibles IV y VII. Generada por 5tas justas: C G D A E.",
        archivos: ["pentatonica-menor-5pos.jpg", "pentatonica-teoria.jpg"],
      },
      {
        fecha: "2026-03-02", fechaDisplay: "2 Mar 2026", areaId: "pentatonica",
        titulo: "Pentatónica + Blue Note",
        descripcion: "Se agrega la blue note (b5) a cada una de las 5 posiciones, formando la escala de blues de 6 notas.",
        archivos: ["pentatonica-blue-note.jpg"],
      },
      {
        fecha: "2026-03-19", fechaDisplay: "19 Mar 2026", areaId: "pentatonica",
        titulo: "Double Stops – Pentatónica + Mayor",
        descripcion: "Combinación de notas de la pentatónica y la escala mayor en cuerdas adyacentes (double stops). Cuatro grupos de cuerdas mapeados en el mástil.",
        archivos: ["pentatonica-double-stops.jpg"],
      },
    ],
  },
  {
    id: "blues", area: "Blues", color: "#60a5fa",
    entries: [{
      fecha: "2026-03-09", fechaDisplay: "9 Mar 2026", areaId: "blues",
      titulo: "Blues pt.1 – Dominante 8 compases",
      descripcion: "Forma: |A7|D7|A7|/|E7|D7|A7|E7|| con turnaround. G7 = Mixolidio. Rítmica con shuffle (corcheas swingueadas) en A7. Pentatónica de C: C D E G A.",
      archivos: ["blues-pt1.jpg"],
    }],
  },
  {
    id: "repertorio", area: "Repertorio", color: "#f472b6",
    entries: [{
      fecha: "2026-05-12", fechaDisplay: "12 May 2026", areaId: "repertorio",
      titulo: "Carín León – Despídase Bien",
      descripcion: "Tonalidad D mayor. Verso: |D|A|Em|Bm-A|. Pre-coro: |D|A|Em|D-F#7|. Coro: |Bm|F#m|G|C#°-F#7|. Análisis con grados romanos (I, II, III, V, VI).",
      archivos: ["carin-leon-despidase-bien.jpg"],
    }],
  },
  {
    id: "menor-armonica", area: "Menor Armónica", color: "#34d399",
    entries: [
      {
        fecha: "2026-05-20", fechaDisplay: "20 May 2026", areaId: "menor-armonica",
        titulo: "Teoría – Escala Menor Armónica",
        descripcion: "Am natural (eólico): A B C D E F G. Am armónica: sube el 7° → A B C D E F G#. Intervalo clave: 6a menor → 7a mayor. Tríadas: Am B° C+ Dm E F G#°.",
        archivos: ["menor-armonica-teoria.jpg"],
      },
      {
        fecha: "2026-05-20", fechaDisplay: "20 May 2026", areaId: "menor-armonica",
        titulo: "Menor Armónica – 7 posiciones",
        descripcion: "Las 7 posiciones modales de Am armónica en el mástil (I/A, II/B, III/C, IV/D, V/E, VI/F, VII/G#). Tónica G# marcada en azul.",
        archivos: ["menor-armonica-pos-4-5.jpg", "menor-armonica-pos-6-1-2-3.jpg"],
      },
    ],
  },
]

// flat list for filtering
const ALL_ENTRIES: ClassEntry[] = TEMAS.flatMap(t => t.entries)
const AREA_MAP = Object.fromEntries(TEMAS.map(t => [t.id, t]))

// ─── Component ────────────────────────────────────────────────────────────────

export default function MaterialPage() {
  const [lessons,    setLessons]    = useState<Lesson[]>([])
  const [selected,   setSelected]   = useState<Lesson | null>(null)
  const [materials,  setMaterials]  = useState<LessonMaterial[]>([])
  const [tab,        setTab]        = useState<Tab>("temas")
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [filter,     setFilter]     = useState<string>("all")
  const [modal,      setModal]      = useState<ClassEntry | null>(null)
  const [imgIndex,   setImgIndex]   = useState(0)

  const [form, setForm] = useState({
    week: "", title: "", date: "", duration: "60 min",
    focus: "", homework: "0", notes: "", status: "current" as Lesson["status"],
  })

  const load = async () => {
    setLoading(true)
    const data = await getLessons()
    setLessons(data)
    if (data.length > 0 && !selected) setSelected(data[0])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!selected) return
    setMaterials(getLessonMaterials(selected.id))
  }, [selected])

  const closeModal = useCallback(() => setModal(null), [])

  useEffect(() => {
    if (!modal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal()
      if (e.key === "ArrowRight" && imgIndex < modal.archivos.length - 1) setImgIndex(i => i + 1)
      if (e.key === "ArrowLeft"  && imgIndex > 0) setImgIndex(i => i - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [modal, imgIndex, closeModal])

  const openModal = (entry: ClassEntry) => { setModal(entry); setImgIndex(0) }

  const markDone = async (lesson: Lesson) => {
    const next = lesson.status === "done" ? "current" : "done"
    await updateLesson(lesson.id, { status: next })
    setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, status: next } : l))
    if (selected?.id === lesson.id) setSelected(prev => prev ? { ...prev, status: next } : prev)
  }

  const saveLesson = async () => {
    setSaving(true)
    const data = await addLesson({
      week: form.week, title: form.title, date: form.date, duration: form.duration,
      focus: form.focus || null, homework: parseInt(form.homework) || 0,
      notes: form.notes || null, status: form.status,
    })
    setLessons(prev => [data, ...prev])
    setSelected(data)
    setTab("lecciones")
    setForm({ week: "", title: "", date: "", duration: "60 min", focus: "", homework: "0", notes: "", status: "current" })
    setSaving(false)
  }

  const removeLesson = async (id: string) => {
    await deleteLesson(id)
    setLessons(prev => prev.filter(l => l.id !== id))
    if (selected?.id === id) setSelected(lessons.find(l => l.id !== id) ?? null)
  }

  const visibleEntries = filter === "all" ? ALL_ENTRIES : ALL_ENTRIES.filter(e => e.areaId === filter)

  return (
    <div className="flex flex-col gap-6">

      {/* ─── Header ─── */}
      <div className="mc-hero">
        <div>
          <div className="mc-eyebrow">Estudio · Material del Maestro</div>
          <h1 className="mc-h1">
            <span style={{ color: "rgba(255,255,255,0.95)", fontStyle: "italic" }}>Tu </span>
            <span style={{ color: DEGREE_COLORS[0] }}>material</span>
          </h1>
        </div>
        <div className="mc-hero-aside">
          {tab !== "nueva" && (
            <button className="mc-play-btn" onClick={() => setTab("nueva")}>+ Nueva lección</button>
          )}
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="mc-tabs">
        {([
          ["temas",     `Temas (${ALL_ENTRIES.length})`],
          ["lecciones", `Lecciones (${lessons.length})`],
          ["nueva",     "Nueva"],
        ] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`mc-tab ${tab === t ? "active" : ""}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ════════ TEMAS ════════ */}
      {tab === "temas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Filter chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              onClick={() => setFilter("all")}
              style={{
                fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.06em",
                padding: "5px 12px", borderRadius: 20, border: "1px solid",
                cursor: "pointer", transition: "all 0.12s",
                background: filter === "all" ? "rgba(255,255,255,0.12)" : "transparent",
                borderColor: filter === "all" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                color: filter === "all" ? "#fff" : "rgba(255,255,255,0.4)",
              }}
            >
              TODOS
            </button>
            {TEMAS.map(t => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                style={{
                  fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.06em",
                  padding: "5px 12px", borderRadius: 20, border: "1px solid",
                  cursor: "pointer", transition: "all 0.12s",
                  background: filter === t.id ? t.color + "22" : "transparent",
                  borderColor: filter === t.id ? t.color + "88" : "rgba(255,255,255,0.1)",
                  color: filter === t.id ? t.color : "rgba(255,255,255,0.4)",
                }}
              >
                {t.area.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}>
            {visibleEntries.map((entry, i) => {
              const area = AREA_MAP[entry.areaId]
              return (
                <button
                  key={i}
                  onClick={() => openModal(entry)}
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border-1)",
                    borderRadius: 14,
                    overflow: "hidden",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "border-color 0.15s, transform 0.12s",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = area.color + "66"
                    e.currentTarget.style.transform = "translateY(-2px)"
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "var(--border-1)"
                    e.currentTarget.style.transform = "translateY(0)"
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: "100%", aspectRatio: "4/3", overflow: "hidden",
                    background: "#fff",
                    position: "relative",
                  }}>
                    <img
                      src={`/clases/${entry.archivos[0]}`}
                      alt={entry.titulo}
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                    />
                    {entry.archivos.length > 1 && (
                      <div style={{
                        position: "absolute", bottom: 6, right: 6,
                        background: "rgba(0,0,0,0.65)", borderRadius: 6,
                        fontSize: 10, fontFamily: "var(--font-mono)",
                        color: "#fff", padding: "2px 7px",
                      }}>
                        +{entry.archivos.length - 1}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: "12px 14px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: area.color, flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: 9, color: area.color, fontFamily: "var(--font-mono)",
                        letterSpacing: "0.08em", textTransform: "uppercase",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {area.area}
                      </span>
                    </div>
                    <p style={{
                      fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)",
                      margin: 0, lineHeight: 1.35,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {entry.titulo}
                    </p>
                    <p style={{
                      fontSize: 10, color: "rgba(255,255,255,0.3)",
                      fontFamily: "var(--font-mono)", margin: 0,
                    }}>
                      {entry.fechaDisplay}
                    </p>
                  </div>
                </button>
              )
            })}

            {/* PDF card */}
            {(filter === "all") && (
              <a
                href="/clases/regiones-tonales.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border-1)",
                    borderRadius: 14, overflow: "hidden",
                    cursor: "pointer", transition: "border-color 0.15s, transform 0.12s",
                    display: "flex", flexDirection: "column",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"
                    e.currentTarget.style.transform = "translateY(-2px)"
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "var(--border-1)"
                    e.currentTarget.style.transform = "translateY(0)"
                  }}
                >
                  <div style={{
                    width: "100%", aspectRatio: "4/3",
                    background: "rgba(239,68,68,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 32, fontFamily: "var(--font-mono)", color: "#f87171", fontWeight: 700 }}>PDF</span>
                  </div>
                  <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171" }} />
                      <span style={{ fontSize: 9, color: "#f87171", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
                        DOCUMENTO
                      </span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)", margin: 0 }}>
                      Regiones Tonales
                    </p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono)", margin: 0 }}>
                      abrir PDF ↗
                    </p>
                  </div>
                </div>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ════════ LECCIONES ════════ */}
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
                  <button className="mc-btn-ghost" onClick={() => removeLesson(selected.id)}
                    style={{ color: "rgba(255,80,80,0.6)" }}>
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ════════ NUEVA ════════ */}
      {tab === "nueva" && (
        <div className="mc-lesson-detail" style={{ maxWidth: 640 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, color: "#fff", marginBottom: 24 }}>
            Nueva lección
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Semana",   key: "week",     placeholder: "Semana 13" },
              { label: "Título",   key: "title",    placeholder: "Pentatónica en posición 3" },
              { label: "Fecha",    key: "date",     placeholder: "20 May 2026" },
              { label: "Duración", key: "duration", placeholder: "60 min" },
              { label: "Enfoque",  key: "focus",    placeholder: "Blues en A menor, trastes 5-8" },
              { label: "Deberes",  key: "homework", placeholder: "2" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <p className="mc-info-label" style={{ marginBottom: 6 }}>{label}</p>
                <input className="mc-input" placeholder={placeholder}
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
              <textarea className="mc-input" placeholder="Consejos, observaciones, qué mejorar..."
                value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
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
            <button className="mc-play-btn" onClick={saveLesson}
              disabled={!form.title || !form.week || saving}
              style={{ marginTop: 8, opacity: (!form.title || !form.week) ? 0.4 : 1 }}>
              {saving ? "Guardando..." : "Guardar lección"}
            </button>
          </div>
        </div>
      )}

      {/* ════════ MODAL ════════ */}
      {modal && (() => {
        const area = AREA_MAP[modal.areaId]
        return (
          <div
            onClick={closeModal}
            style={{
              position: "fixed", inset: 0, zIndex: 50,
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 24,
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: "oklch(0.19 0.006 60)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20, width: "100%", maxWidth: 680,
                maxHeight: "90vh", overflowY: "auto",
                display: "flex", flexDirection: "column",
              }}
            >
              {/* Modal header */}
              <div style={{
                padding: "20px 24px 18px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                display: "flex", alignItems: "flex-start", gap: 12,
                position: "sticky", top: 0,
                background: "oklch(0.19 0.006 60)",
                zIndex: 1,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: area.color }} />
                    <span style={{ fontSize: 10, color: area.color, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
                      {area.area.toUpperCase()} · {modal.fechaDisplay.toUpperCase()}
                    </span>
                  </div>
                  <h2 style={{
                    fontFamily: "var(--font-display)", fontStyle: "italic",
                    fontSize: 26, color: "#fff", margin: 0, lineHeight: 1.2, letterSpacing: "-0.01em",
                  }}>
                    {modal.titulo}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  style={{
                    background: "rgba(255,255,255,0.07)", border: "none",
                    borderRadius: 8, width: 32, height: 32, cursor: "pointer",
                    color: "rgba(255,255,255,0.5)", fontSize: 16, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal body */}
              <div style={{ padding: "20px 24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.65 }}>
                  {modal.descripcion}
                </p>

                {/* Image viewer */}
                {modal.archivos.length === 1 ? (
                  <img
                    src={`/clases/${modal.archivos[0]}`}
                    alt={modal.titulo}
                    style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }}
                  />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Main image */}
                    <div style={{ position: "relative" }}>
                      <img
                        src={`/clases/${modal.archivos[imgIndex]}`}
                        alt={modal.titulo}
                        style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "#fff", display: "block" }}
                      />
                      {/* Nav arrows */}
                      {imgIndex > 0 && (
                        <button onClick={() => setImgIndex(i => i - 1)} style={{
                          position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                          background: "rgba(0,0,0,0.6)", border: "none", borderRadius: 8,
                          width: 36, height: 36, cursor: "pointer", color: "#fff", fontSize: 16,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>‹</button>
                      )}
                      {imgIndex < modal.archivos.length - 1 && (
                        <button onClick={() => setImgIndex(i => i + 1)} style={{
                          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                          background: "rgba(0,0,0,0.6)", border: "none", borderRadius: 8,
                          width: 36, height: 36, cursor: "pointer", color: "#fff", fontSize: 16,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>›</button>
                      )}
                    </div>
                    {/* Thumbnails */}
                    <div style={{ display: "flex", gap: 8 }}>
                      {modal.archivos.map((f, idx) => (
                        <button key={f} onClick={() => setImgIndex(idx)} style={{
                          width: 56, height: 42, borderRadius: 8, overflow: "hidden",
                          border: `2px solid ${idx === imgIndex ? area.color : "rgba(255,255,255,0.1)"}`,
                          cursor: "pointer", background: "#fff", padding: 0, flexShrink: 0,
                          transition: "border-color 0.12s",
                        }}>
                          <img src={`/clases/${f}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
