import { NextResponse } from "next/server"
import { getUserByEmail, createUser } from "@/lib/users"
import { redeemInvite } from "@/lib/invites"

export async function POST(req: Request) {
  const body = await req.json()
  const name     = String(body.name ?? "").trim()
  const email    = String(body.email ?? "").trim().toLowerCase()
  const password = String(body.password ?? "")
  const code     = String(body.code ?? "").trim()

  if (!name || !email || !password || !code) {
    return NextResponse.json({ error: "Completá todos los campos." }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 })
  }

  const existing = await getUserByEmail(email)
  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email." }, { status: 409 })
  }

  // Check email before redeeming so a doomed signup doesn't burn the invite code.
  const valid = await redeemInvite(code)
  if (!valid) {
    return NextResponse.json({ error: "Código de invitación inválido o ya usado." }, { status: 400 })
  }

  await createUser(email, password, name)
  return NextResponse.json({ ok: true })
}
