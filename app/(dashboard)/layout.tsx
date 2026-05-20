import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/Sidebar"
import Providers from "@/components/Providers"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <Providers>
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto" style={{
        background: `
          radial-gradient(1200px 600px at 80% -10%, rgba(255,200,120,0.025), transparent 60%),
          radial-gradient(900px 500px at -10% 90%, rgba(120,180,255,0.015), transparent 60%),
          var(--bg-1)
        `,
      }}>
        <div className="mx-auto w-full" style={{ maxWidth: 1280, padding: "56px 64px 80px" }}>
          {children}
        </div>
      </main>
    </div>
    </Providers>
  )
}
