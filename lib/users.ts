import bcrypt from "bcryptjs"
import { redis } from "@/lib/redis"

export type StoredUser = {
  id:           string
  email:        string
  name:         string
  passwordHash: string
  createdAt:    string
}

const userKey = (email: string) => `user:${email.toLowerCase()}`

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  return await redis.get<StoredUser>(userKey(email))
}

export async function createUser(email: string, password: string, name: string): Promise<StoredUser> {
  const user: StoredUser = {
    id:           crypto.randomUUID(),
    email:        email.toLowerCase(),
    name,
    passwordHash: await bcrypt.hash(password, 10),
    createdAt:    new Date().toISOString(),
  }
  await redis.set(userKey(email), user)
  return user
}

export async function verifyPassword(user: StoredUser, password: string): Promise<boolean> {
  return await bcrypt.compare(password, user.passwordHash)
}
