import { signIn } from "@/auth"
import LoginWaveform from "@/components/LoginWaveform"
import { DEGREE_COLORS } from "@/data/scales"

export default function LoginPage() {
  return (
    <div className="mc-login-stage">
      <LoginWaveform />
      <div className="mc-login-grid-bg" />

      <div className="mc-login-content">
        <div className="mc-login-brand">
          <div className="mc-login-mark">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M6 26 Q16 2 26 26" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9"/>
              <path d="M3 18 Q16 13 29 18" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.45"/>
              <circle cx="16" cy="24" r="2.2" fill={DEGREE_COLORS[0]}/>
            </svg>
          </div>
          <h1 className="mc-login-title">
            <span style={{ fontStyle: "italic" }}>Music</span><span style={{ color: DEGREE_COLORS[0] }}>App</span>
          </h1>
          <p className="mc-login-tagline">Tu espacio de guitarra eléctrica</p>
        </div>

        <div className="mc-login-card">
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/escalas" })
            }}
          >
            <button type="submit" className="mc-login-google">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>
          </form>

          <p className="mc-login-fine">Acceso privado · Solo usuarios autorizados</p>
        </div>

        <div className="mc-login-footer">
          <span className="mc-mono-tag">v2.4</span>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>—</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11.5 }}>Diseñado para estudiantes de guitarra eléctrica</span>
        </div>
      </div>
    </div>
  )
}
