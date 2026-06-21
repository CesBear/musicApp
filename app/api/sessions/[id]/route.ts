import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { redis } from "@/lib/redis"
import type { PracticeSession } from "@/lib/storage"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({}, { status: 401 })

  const { id } = await params
  const key = `sessions:${session.user.id}`
  const all = await redis.get<PracticeSession[]>(key) ?? []
  await redis.set(key, all.filter(s => s.id !== id))
  return NextResponse.json({ ok: true })
}
