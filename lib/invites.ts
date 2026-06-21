import { redis } from "@/lib/redis"

const INVITE_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 días sin usar

const inviteKey = (code: string) => `invite:${code}`

export async function createInvite(): Promise<string> {
  const code = crypto.randomUUID().slice(0, 8).toUpperCase()
  await redis.set(inviteKey(code), { createdAt: new Date().toISOString() }, { ex: INVITE_TTL_SECONDS })
  return code
}

// Atomic: read + delete in one op, so a code can never be redeemed twice.
export async function redeemInvite(code: string): Promise<boolean> {
  const claimed = await redis.getdel(inviteKey(code.toUpperCase()))
  return claimed !== null
}
