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
  const all    = await redis.get<Lesson[]>("lessons") ?? []
  const idx    = all.findIndex(l => l.id === id)

  if (idx === -1) return NextResponse.json({}, { status: 404 })

  all[idx] = { ...all[idx], ...body, updated_at: new Date().toISOString() }
  await redis.set("lessons", all)
  return NextResponse.json(all[idx])
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({}, { status: 401 })

  const { id } = await params
  const all = await redis.get<Lesson[]>("lessons") ?? []
  await redis.set("lessons", all.filter(l => l.id !== id))
  return NextResponse.json({ ok: true })
}
