import { test, expect, type Page } from "@playwright/test"
import { instrument, resetStarts, getStarts } from "./helpers"

// Cada botón de reproducir debe programar sonido YA (no segundos después) y con
// samples reales de guitarra (AudioBufferSourceNode), no solo con la síntesis de respaldo.
// Se espera unos segundos antes de tocar para que el reloj de audio avance: así un
// tiempo absoluto pasado por error como relativo se nota como un retraso grande.
async function expectPromptSound(page: Page, label: string, max = 0.3) {
  const starts = await getStarts(page)
  expect(starts.length, `${label}: no programó ningún sonido`).toBeGreaterThan(0)
  const first = Math.min(...starts.map(s => s.delay))
  expect(first, `${label}: el primer sonido tarda ${first.toFixed(2)} s`).toBeLessThan(max)
  return starts
}

async function warmUp(page: Page, button: ReturnType<Page["getByRole"]>) {
  await button.click()                       // crea el contexto y carga los samples
  await page.waitForTimeout(4000)            // el reloj avanza
  await resetStarts(page)
}

test("Solfeo: Escuchar suena al instante y con guitarra real", async ({ page }) => {
  const errors = await instrument(page)
  await page.goto("/solfeo", { waitUntil: "networkidle" })
  await page.getByRole("tab", { name: "Practicar" }).click()
  const listen = page.getByRole("button", { name: "▶ Escuchar" })
  await warmUp(page, listen)
  await listen.click(); await page.waitForTimeout(300)
  const starts = await expectPromptSound(page, "Solfeo")
  expect(starts.some(s => s.kind === "AudioBufferSourceNode"), "Solfeo no usó samples").toBe(true)
  expect(errors).toEqual([])
})

test("Entrenamiento: el entrenador de intervalos suena al instante", async ({ page }) => {
  await instrument(page)
  await page.goto("/entrenamiento", { waitUntil: "networkidle" })
  await page.locator(".mm-route-row").nth(3).click()            // hora 4: oído
  await page.locator(".mm-block-head").nth(1).click()
  await warmUp(page, page.getByRole("button", { name: /Escuchar intervalo/ }))
  await page.getByRole("button", { name: "Repetir" }).click(); await page.waitForTimeout(300)
  await expectPromptSound(page, "Intervalos")
})

test("Rasgueos: tocar arranca guitarra y banda a tiempo", async ({ page }) => {
  const errors = await instrument(page)
  await page.goto("/rasgueos", { waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Funk-pop · Kiko", exact: true }).click()
  await page.locator("button", { hasText: "Funk-pop · estilo Kiko" }).first().click()
  await warmUp(page, page.locator(".rz-voicing button").first())  // "Rasguear" del primer voicing
  const bpm = Number((await page.locator(".mc-section-hint", { hasText: "BPM" }).first().innerText()).match(/\d+/)![0])
  await page.getByRole("button", { name: /TOCAR/ }).click()
  await page.waitForTimeout(6000)
  await page.getByRole("button", { name: /PARAR/ }).click()
  const starts = await getStarts(page)
  // La cuenta de entrada dura 1 compás: nada debe quedar programado más lejos que eso + la ventana del scheduler
  expect(Math.max(...starts.map(s => s.delay))).toBeLessThan(60 / bpm * 4 + 0.3)
  expect(starts.filter(s => s.kind === "OscillatorNode").length, "la banda no sonó").toBeGreaterThan(10)
  expect(starts.filter(s => s.kind === "AudioBufferSourceNode").length, "la guitarra no sonó").toBeGreaterThan(10)
  expect(errors).toEqual([])
})

test("Chord Builder y Escalas: reproducir suena al instante", async ({ page }) => {
  await instrument(page)
  await page.goto("/chord-builder", { waitUntil: "networkidle" })
  const strum = page.getByRole("button", { name: /Rasguear acorde/ })
  await warmUp(page, strum)
  await strum.click(); await page.waitForTimeout(300)
  await expectPromptSound(page, "Chord Builder")
  await page.goto("/escalas", { waitUntil: "networkidle" })
  const scale = page.getByRole("button", { name: /Escuchar escala/ })
  await warmUp(page, scale)
  await scale.click(); await page.waitForTimeout(300)
  await expectPromptSound(page, "Escalas")
})

test("Panel Sonido: el preset se guarda y sobrevive a recargar", async ({ page }) => {
  await page.goto("/escalas", { waitUntil: "networkidle" })
  await page.locator(".mm-amp-presets button", { hasText: "Lead" }).click()
  await page.reload({ waitUntil: "networkidle" })
  await expect(page.locator(".mm-amp-presets button[data-on]")).toHaveText("Lead")
  await page.locator(".mm-amp-presets button", { hasText: "Limpio" }).click()
})

test("Progresiones: la base suena con banda y el panel sigue al acorde", async ({ page }) => {
  const errors = await instrument(page)
  await page.goto("/progresiones", { waitUntil: "networkidle" })
  await page.locator(".pg-preset", { hasText: "V/vi" }).click()       // C · E7 · Am · F
  await page.waitForTimeout(3000)                                      // carga samples y avanza el reloj
  await resetStarts(page)
  await page.getByRole("button", { name: /Tocar en loop/ }).click()
  const seen = new Set<string>()
  for (let k = 0; k < 10; k++) { await page.waitForTimeout(600); seen.add((await page.locator(".pg-now").innerText()).split("\n")[1]) }
  await page.getByRole("button", { name: /Parar/ }).click()
  const starts = await expectPromptSound(page, "Progresiones")
  expect(starts.filter(s => s.kind === "AudioBufferSourceNode").length, "la guitarra no sonó").toBeGreaterThan(20)
  expect(starts.filter(s => s.kind === "OscillatorNode").length, "la banda no sonó").toBeGreaterThan(10)
  expect([...seen], "el panel no siguió los cambios de acorde").toEqual(expect.arrayContaining(["C", "E7"]))
  expect(await page.locator(".pg-now").innerText()).not.toContain("A♭")
  expect(errors).toEqual([])
})

test("Tapping 1: los ejercicios de la clase suenan y Material enlaza a la práctica", async ({ page }) => {
  const errors = await instrument(page)
  await page.goto("/material", { waitUntil: "networkidle" })
  await page.locator("button", { hasText: "Tapping 1" }).first().click()
  await expect(page.getByRole("link", { name: /Practicar con audio/ })).toBeVisible()
  await expect(page.getByRole("link", { name: /PDF original/ })).toHaveAttribute("href", "/clases/tapping-1-shredmaster.pdf")
  await page.goto("/material/tapping-1", { waitUntil: "networkidle" })
  await expect(page.locator(".sf-lesson")).toHaveCount(12)
  const play = page.getByRole("button", { name: /TOCAR/ }).first()
  await play.click(); await page.waitForTimeout(3500); await page.getByRole("button", { name: /PARAR/ }).first().click()
  await resetStarts(page)
  await play.click(); await page.waitForTimeout(1500)
  const starts = await expectPromptSound(page, "Tapping A1")
  expect(starts.some(s => s.kind === "AudioBufferSourceNode"), "no usó samples").toBe(true)
  const pdf = await page.request.get("/clases/tapping-1-shredmaster.pdf")
  expect(pdf.headers()["content-type"]).toContain("pdf")
  expect(errors).toEqual([])
})
