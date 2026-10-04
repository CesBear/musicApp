import { defineConfig } from "@playwright/test"
import fs from "fs"

// Pruebas de navegador (tests/e2e). Por defecto levantan `next start` en el puerto 3100
// sobre el build de producción; con E2E_BASE_URL se pueden correr contra otro servidor
// (p. ej. E2E_BASE_URL=http://localhost:3000 con el dev server, o la URL de producción).
for (const line of fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8").split("\n") : []) {
  const i = line.indexOf("=")
  if (i > 0 && !line.trim().startsWith("#")) process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim().replace(/^["']|["']$/g, "")
}

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100"

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: BASE,
    launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] },
  },
  projects: [
    { name: "login", testMatch: /login\.setup\.ts/ },
    { name: "app", dependencies: ["login"], use: { storageState: "tests/e2e/.auth/user.json" } },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: "npx next start -p 3100",
    url: "http://localhost:3100/login",
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
