"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { BgStrings, BgPentagrama, BgEspectro, BgMastil } from "@/components/LoginBackgrounds"
import { DEGREE_COLORS } from "@/data/scales"

const BG_VARIANTS = [
  { id: "cuerdas",     label: "Cuerdas",     Component: BgStrings    },
  { id: "pentagrama",  label: "Pentagrama",  Component: BgPentagrama },
  { id: "espectro",    label: "Espectro",    Component: BgEspectro   },
  { id: "mastil",      label: "Mástil",      Component: BgMastil     },
] as const

type VariantId = typeof BG_VARIANTS[number]["id"]

// ─── Icons ────────────────────────────────────────────────────
const TuningForkIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M5 2 L5 8 Q5 10 6.5 10.5 L6.5 14 L9.5 14 L9.5 10.5 Q11 10 11 8 L11 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8" y1="10.5" x2="8" y2="14" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
)
const MailIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M2.5 4.5 L8 9 L13.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)
const LockIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M5 7 L5 5 Q5 2.5 8 2.5 Q11 2.5 11 5 L11 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
  </svg>
)
const ArrowIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M2 6 L10 6 M7 3 L10 6 L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function LoginPage() {
  const [variant, setVariant] = useState<VariantId>("cuerdas")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [forkBeat, setForkBeat] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setForkBeat(b => !b), 1600)
    return () => clearInterval(id)
  }, [])

  const Active = BG_VARIANTS.find(v => v.id === variant)!.Component

  const handleGoogle = () => {
    signIn("google", { callbackUrl: "/escalas" })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // If you wire up a credentials provider, swap this for:
    // signIn("credentials", { email, password, callbackUrl: "/escalas" })
    handleGoogle()
  }

  return (
    <div className="mc-login-stage-v2">
      <Active />
      <div className="mc-login-grid-bg" />

      <div className="mc-login-tag-top">
        <span className="mc-login-tag-dot" />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: "0.08em" }}>EN VIVO · TUNING A=440</span>
      </div>

      <div className="mc-login-content-v2">
        <div className="mc-login-brand-v2">
          <div className={`mc-login-mark-v2 ${forkBeat ? "beat" : ""}`}>
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <defs>
                <linearGradient id="brandStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.95)"/>
                  <stop offset="100%" stopColor="rgba(255,255,255,0.55)"/>
                </linearGradient>
              </defs>
              <path d="M7 28 Q17 4 27 28" stroke="url(#brandStroke)" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
              <path d="M4 19 Q17 14 30 19" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <circle cx="17" cy="25" r="2.4" fill={DEGREE_COLORS[0]}/>
              <circle cx="17" cy="25" r="5" fill="none" stroke={DEGREE_COLORS[0]} strokeWidth="0.8" opacity={forkBeat ? 0.6 : 0.2} style={{ transition: "opacity 0.8s" }}/>
            </svg>
          </div>

          <h1 className="mc-login-title-v2">
            <span style={{ fontStyle: "italic" }}>Music</span>
            <span style={{ color: DEGREE_COLORS[0] }}>App</span>
          </h1>

          <div className="mc-login-tagline-v2">
            <span style={{ color: "var(--text-3)" }}><TuningForkIcon /></span>
            <span>Afiná. Practicá. Improvisá.</span>
          </div>
        </div>

        <form className="mc-login-card-v2" onSubmit={handleSubmit}>
          <button type="button" className="mc-login-google-v2" onClick={handleGoogle}>
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <div className="mc-login-divider-v2">
            <span className="mc-login-divider-text">o con email</span>
          </div>

          <div className="mc-login-field-v2">
            <span className="mc-login-field-icon"><MailIcon /></span>
            <input type="email" placeholder="vos@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="mc-login-field-v2">
            <span className="mc-login-field-icon"><LockIcon /></span>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="mc-login-submit-v2">
            Entrar al estudio
            <span style={{ marginLeft: 4 }}><ArrowIcon /></span>
          </button>
        </form>

        <div className="mc-login-variant-picker">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)", letterSpacing: "0.12em", marginRight: 4 }}>FONDO</span>
          {BG_VARIANTS.map(v => (
            <button key={v.id} type="button"
              className={`mc-login-variant ${variant === v.id ? "active" : ""}`}
              onClick={() => setVariant(v.id)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
