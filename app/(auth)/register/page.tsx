"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { BgStrings } from "@/components/LoginBackgrounds"
import { DEGREE_COLORS } from "@/data/scales"

// ─── Icons ────────────────────────────────────────────────────
const UserIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M2.5 13.5 Q2.5 9.5 8 9.5 Q13.5 9.5 13.5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
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
const TicketIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M2 6 Q2 4.5 3.5 4.5 L12.5 4.5 Q14 4.5 14 6 L14 6.8 Q13 6.8 13 8 Q13 9.2 14 9.2 L14 10 Q14 11.5 12.5 11.5 L3.5 11.5 Q2 11.5 2 10 L2 9.2 Q3 9.2 3 8 Q3 6.8 2 6.8 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
)
const ArrowIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M2 6 L10 6 M7 3 L10 6 L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch("/api/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, email, password, code }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "No se pudo crear la cuenta.")
      setLoading(false)
      return
    }

    await signIn("credentials", { email, password, callbackUrl: "/escalas" })
  }

  return (
    <div className="mc-login-stage-v2">
      <BgStrings />
      <div className="mc-login-grid-bg" />

      <div className="mc-login-credit">
        Made with ❤️ by <a href="https://cesbear.com" target="_blank" rel="noopener noreferrer">CesBear</a>
      </div>

      <div className="mc-login-content-v2">
        <div className="mc-login-brand-v2">
          <h1 className="mc-login-title-v2">
            <span style={{ fontStyle: "italic" }}>Music</span>
            <span style={{ color: DEGREE_COLORS[0] }}>App</span>
          </h1>
          <div className="mc-login-tagline-v2">
            <span>Creá tu cuenta con tu código de invitación</span>
          </div>
        </div>

        <form className="mc-login-card-v2" onSubmit={handleSubmit}>
          <div className="mc-login-field-v2">
            <span className="mc-login-field-icon"><UserIcon /></span>
            <input type="text" placeholder="nombre" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="mc-login-field-v2">
            <span className="mc-login-field-icon"><MailIcon /></span>
            <input type="email" placeholder="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="mc-login-field-v2">
            <span className="mc-login-field-icon"><LockIcon /></span>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="mc-login-field-v2">
            <span className="mc-login-field-icon"><TicketIcon /></span>
            <input type="text" placeholder="código de invitación" value={code} onChange={e => setCode(e.target.value)} required />
          </div>

          {error && <div className="mc-login-error">{error}</div>}

          <button type="submit" className="mc-login-submit-v2" disabled={loading}>
            {loading ? "Creando cuenta…" : "Crear cuenta"}
            {!loading && <span style={{ marginLeft: 4 }}><ArrowIcon /></span>}
          </button>
        </form>

        <button type="button" className="mc-login-variant" onClick={() => router.push("/login")}>
          ¿Ya tenés cuenta? Entrá
        </button>
      </div>
    </div>
  )
}
