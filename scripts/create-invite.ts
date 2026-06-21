import fs from "fs"
import path from "path"

// Load .env.local if Upstash vars aren't set
if (!process.env.UPSTASH_REDIS_REST_URL) {
  const envPath = path.join(process.cwd(), ".env.local")
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n")
    for (const line of lines) {
      const [key, ...rest] = line.split("=")
      if (key?.trim() && rest.length) {
        process.env[key.trim()] = rest.join("=").trim()
      }
    }
  }
}

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.error("❌  Faltan UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN en .env.local")
  process.exit(1)
}

async function main() {
  const { createInvite } = await import("../lib/invites")
  const code = await createInvite()
  console.log(`✅  Código de invitación (válido 7 días): ${code}`)
}

main()
