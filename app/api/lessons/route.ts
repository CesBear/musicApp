import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { redis } from "@/lib/redis"
import type { Lesson } from "@/lib/storage"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json([], { status: 401 })

  const data = await redis.get<Lesson[]>(`lessons:${session.user.id}`) ?? []
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({}, { status: 401 })

  const body = await req.json()
  const key  = `lessons:${session.user.id}`
  const all  = await redis.get<Lesson[]>(key) ?? []
  const now  = new Date().toISOString()

  const entry: Lesson = {
    ...body,
    id:         crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  }

  await redis.set(key, [entry, ...all])
  return NextResponse.json(entry)
}
