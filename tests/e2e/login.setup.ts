import { test as setup, expect } from "@playwright/test"

// Inicia sesión una vez con la cuenta principal (.env.local) y guarda la sesión
setup("iniciar sesión", async ({ page }) => {
  const email = process.env.ALLOWED_EMAIL, password = process.env.ALLOWED_PASSWORD
  expect(email && password, "faltan ALLOWED_EMAIL / ALLOWED_PASSWORD en .env.local").toBeTruthy()
  await page.goto("/login")
  await page.locator("input").first().fill(email!)
  await page.locator('input[type="password"]').fill(password!)
  await page.keyboard.press("Enter")
  await page.waitForURL(/\/escalas/, { timeout: 30_000 })
  await page.context().storageState({ path: "tests/e2e/.auth/user.json" })
})
