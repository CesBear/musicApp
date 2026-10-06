import { test, expect } from "@playwright/test"
import { instrument } from "./helpers"

const ROUTES = ["/escalas", "/triadas", "/circulo-quintas", "/chord-builder", "/progresiones", "/rasgueos",
  "/solfeo", "/entrenamiento", "/lector", "/material", "/material/tapping-1", "/progreso"]

for (const route of ROUTES) {
  test(`${route} carga sin errores`, async ({ page }) => {
    const errors = await instrument(page)
    const res = await page.goto(route, { waitUntil: "networkidle" })
    expect(res?.status()).toBeLessThan(400)
    await expect(page.locator("h1").first()).toBeVisible()
    expect(errors, errors.join("\n")).toEqual([])
  })
}
