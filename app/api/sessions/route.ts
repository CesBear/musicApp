import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { redis } from "@/lib/redis"
import type { PracticeSession } from "@/lib/storage"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json([], { status: 401 })

  const data = await redis.get<PracticeSession[]>(`sessions:${session.user.id}`) ?? []
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({}, { status: 401 })

  const body = await req.json()
  const key  = `sessions:${session.user.id}`
  const all  = await redis.get<PracticeSession[]>(key) ?? []

  const entry: PracticeSession = {
    ...body,
    id:         crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }

  await redis.set(key, [entry, ...all])
  return NextResponse.json(entry)
}
