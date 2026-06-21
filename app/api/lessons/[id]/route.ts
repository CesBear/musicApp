import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { redis } from "@/lib/redis"
import type { Lesson } from "@/lib/storage"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({}, { status: 401 })

  const { id } = await params
  const body   = await req.json()
  const key    = `lessons:${session.user.id}`
  const all    = await redis.get<Lesson[]>(key) ?? []
  const idx    = all.findIndex(l => l.id === id)

  if (idx === -1) return NextResponse.json({}, { status: 404 })

  all[idx] = { ...all[idx], ...body, updated_at: new Date().toISOString() }
  await redis.set(key, all)
  return NextResponse.json(all[idx])
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({}, { status: 401 })

  const { id } = await params
  const key = `lessons:${session.user.id}`
  const all = await redis.get<Lesson[]>(key) ?? []
  await redis.set(key, all.filter(l => l.id !== id))
  return NextResponse.json({ ok: true })
}
