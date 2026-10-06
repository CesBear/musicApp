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

test("Material: ordenar por fecha", async ({ page }) => {
  await page.goto("/material", { waitUntil: "networkidle" })
  const titles = () => page.locator("button:has(img) p").evaluateAll(ps => ps.filter((_, i) => i % 2 === 0).map(p => p.textContent ?? ""))
  // Por defecto: lo más reciente primero
  expect((await titles())[0]).toContain("Tapping 1")
  await page.getByRole("button", { name: "Más antiguas" }).click()
  expect((await titles())[0]).toContain("Sweep Picking")
  // Funciona junto con el filtro por tema
  await page.getByRole("button", { name: "TÉCNICA", exact: true }).click()
  await page.getByRole("button", { name: "Más recientes" }).click()
  const tecnica = await titles()
  expect(tecnica[0]).toContain("Tapping 1")
  expect(tecnica.length).toBe(2)
})
