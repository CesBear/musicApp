"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"
import { DEGREE_COLORS } from "@/data/scales"

type IconProps = { active?: boolean }

const Icon = {
  triads: ({ active }: IconProps) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <line x1="2" y1="4.5"  x2="14" y2="4.5"  stroke="currentColor" strokeWidth={active ? 1.4 : 1.1} strokeLinecap="round" opacity="0.45"/>
      <line x1="2" y1="8.5"  x2="14" y2="8.5"  stroke="currentColor" strokeWidth={active ? 1.4 : 1.1} strokeLinecap="round" opacity="0.45"/>
      <line x1="2" y1="12.5" x2="14" y2="12.5" stroke="currentColor" strokeWidth={active ? 1.4 : 1.1} strokeLinecap="round" opacity="0.45"/>
      <circle cx="4"  cy="4.5"  r="2" fill="currentColor"/>
      <circle cx="8"  cy="8.5"  r="2" fill="currentColor"/>
      <circle cx="12" cy="12.5" r="2" fill="currentColor"/>
      <line x1="4" y1="4.5" x2="8"  y2="8.5"  stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
      <line x1="8" y1="8.5" x2="12" y2="12.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
    </svg>
  ),
  scales: ({ active }: IconProps) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 12 L3 4 M3 4 Q5 3 7 4 Q5 5 3 4 Z" stroke="currentColor" strokeWidth={active ? 1.7 : 1.4} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 12 L3 14" stroke="currentColor" strokeWidth={active ? 1.7 : 1.4} strokeLinecap="round"/>
      <circle cx="11" cy="11" r="2.5" stroke="currentColor" strokeWidth={active ? 1.7 : 1.4}/>
      <path d="M13.5 11 L13.5 4" stroke="currentColor" strokeWidth={active ? 1.7 : 1.4} strokeLinecap="round"/>
    </svg>
  ),
  circle: ({ active }: IconProps) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth={active ? 1.7 : 1.4}/>
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth={active ? 1.7 : 1.4}/>
      <line x1="8" y1="2" x2="8" y2="5.5" stroke="currentColor" strokeWidth={active ? 1.7 : 1.4}/>
    </svg>
  ),
  chord: ({ active }: IconProps) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="2.5" width="10" height="11" rx="1" stroke="currentColor" strokeWidth={active ? 1.7 : 1.4}/>
      <line x1="3" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth={active ? 1.7 : 1.4}/>
      <line x1="3" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth={active ? 1.7 : 1.4}/>
      <circle cx="6" cy="7.5" r="1" fill="currentColor"/>
      <circle cx="10" cy="10.5" r="1" fill="currentColor"/>
    </svg>
  ),
  book: ({ active }: IconProps) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3 L8 4.5 L13 3 L13 13 L8 14.5 L3 13 Z" stroke="currentColor" strokeWidth={active ? 1.7 : 1.4} strokeLinejoin="round"/>
      <line x1="8" y1="4.5" x2="8" y2="14.5" stroke="currentColor" strokeWidth={active ? 1.7 : 1.4}/>
    </svg>
  ),
  progress: ({ active }: IconProps) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="10" width="3" height="4" rx="1" stroke="currentColor" strokeWidth={active ? 1.6 : 1.3}/>
      <rect x="6.5" y="7" width="3" height="7" rx="1" stroke="currentColor" strokeWidth={active ? 1.6 : 1.3}/>
      <rect x="11" y="3" width="3" height="11" rx="1" stroke="currentColor" strokeWidth={active ? 1.6 : 1.3}/>
    </svg>
  ),
  rhythm: ({ active }: IconProps) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      {[0,1,2].map(row => [0,1,2].map(col => (
        <rect key={`${row}-${col}`}
          x={1.5 + col * 4.5} y={1.5 + row * 4.5} width={3} height={3} rx={0.7}
          fill="currentColor"
          opacity={(row + col) % 2 === 0 ? (active ? 1 : 0.85) : (active ? 0.35 : 0.25)}/>
      )))}
    </svg>
  ),
  logout: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M9 3 L4 3 L4 13 L9 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M9 8 L14 8 M11.5 5.5 L14 8 L11.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
}

const NAV = [
  { href: "/escalas",         label: "Escalas",              icon: Icon.scales },
  { href: "/triadas",         label: "Tríadas",              icon: Icon.triads },
  { href: "/circulo-quintas", label: "Círculo de Quintas",   icon: Icon.circle },
  { href: "/chord-builder",   label: "Chord Builder",        icon: Icon.chord  },
  { href: "/ritmos",           label: "Ritmos",               icon: Icon.rhythm },
  { href: "/material",        label: "Material",             icon: Icon.book   },
  { href: "/progreso",        label: "Mi Progreso",          icon: Icon.progress },
]

const STORAGE_KEY = "mc_practice_days"

function getTodayKey() {
  return new Date().toISOString().slice(0, 10) // "2026-05-20"
}

function usePracticeStreak() {
  const [days,    setDays]    = useState<string[]>([])
  const [streak,  setStreak]  = useState(0)
  const [weekMin, setWeekMin] = useState(0)

  useEffect(() => {
    supabase
      .from("practice_sessions")
      .select("date, duration_min")
      .then(({ data }) => {
        if (!data) return
        const uniqueDays = [...new Set(data.map(s => s.date))].sort().reverse()
        setDays(uniqueDays)

        // Streak: consecutive days ending today
        let s = 0, cursor = getTodayKey()
        const daySet = new Set(uniqueDays)
        while (daySet.has(cursor)) {
          s++
          const d = new Date(cursor); d.setDate(d.getDate() - 1)
          cursor = d.toISOString().slice(0, 10)
        }
        setStreak(s)

        // Week minutes
        const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6)
        const wk = weekStart.toISOString().slice(0, 10)
        const wMins = data.filter(s => s.date >= wk).reduce((a, s) => a + s.duration_min, 0)
        setWeekMin(wMins)
      })
  }, [])

  return { days, streak, weekMin }
}

function buildGrid(days: string[]) {
  const daySet = new Set(days)
  const result = []
  for (let i = 27; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const filled = daySet.has(key)
    const isToday = i === 0
    result.push({ filled, isToday })
  }
  return result
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { days, streak, weekMin } = usePracticeStreak()
  const grid = buildGrid(days)

  const userName  = session?.user?.name  ?? "—"
  const userInitial = userName.charAt(0).toUpperCase()
  const weekLabel = weekMin >= 60
    ? `${Math.floor(weekMin / 60)}h ${weekMin % 60 > 0 ? (weekMin % 60) + "m" : ""}`.trim()
    : weekMin > 0 ? `${weekMin}m` : "0m"

  return (
    <aside className="mc-sidebar">
      <div className="mc-sidebar-brand">
        <div className="mc-brand-mark">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <path d="M6 26 Q16 2 26 26" stroke="white" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
            <path d="M3 18 Q16 13 29 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.5"/>
            <circle cx="16" cy="24" r="2.5" fill={DEGREE_COLORS[0]}/>
          </svg>
        </div>
        <div className="flex flex-col leading-tight">
          <span style={{ fontFamily: "var(--font-display)", fontSize: 17, fontStyle: "italic", color: "#fff", letterSpacing: "-0.02em" }}>MusicApp</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}>ESTUDIO · v2.4</span>
        </div>
      </div>

      <nav className="mc-nav">
        {NAV.map((item) => {
          const active = pathname === item.href
          const IconC = item.icon
          return (
            <Link key={item.href} href={item.href}
              className={`mc-nav-item ${active ? "active" : ""}`}>
              <span className="mc-nav-icon"><IconC active={active} /></span>
              <span>{item.label}</span>
              {active && <span className="mc-nav-pip" />}
            </Link>
          )
        })}
      </nav>

      <div className="mc-practice-card">
        <div className="mc-practice-head">
          <span className="mc-mono-mini">RACHA</span>
          <span style={{ color: DEGREE_COLORS[0], fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 12 }}>
            {streak}d
          </span>
        </div>
        <div className="mc-practice-grid">
          {grid.map((cell, i) => (
            <div key={i} className={`mc-practice-cell ${cell.filled ? "filled" : ""} ${cell.isToday ? "recent" : ""}`} />
          ))}
        </div>
        <div className="mc-practice-foot">
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Esta semana</span>
          <span style={{ color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{weekLabel}</span>
        </div>
      </div>

      <div className="mc-sidebar-foot">
        <div className="mc-user-row">
          <div className="mc-user-avatar">{userInitial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12.5, color: "#fff", fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userName}
            </p>
            <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>Estudiante</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="mc-signout-btn" aria-label="Cerrar sesión">
            <Icon.logout />
          </button>
        </div>
      </div>
    </aside>
  )
}
