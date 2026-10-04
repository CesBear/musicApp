import type { Page } from "@playwright/test"

/** Registra el retraso (s) entre "ahora" y cada start() de audio, y los errores de la página. */
export async function instrument(page: Page) {
  const errors: string[] = []
  page.on("pageerror", e => errors.push(e.message))
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()) })
  await page.addInitScript(() => {
    const w = window as unknown as { __starts: { delay: number; kind: string }[] }
    w.__starts = []
    for (const proto of [AudioBufferSourceNode.prototype, OscillatorNode.prototype]) {
      const orig = proto.start
      proto.start = function (this: AudioScheduledSourceNode, when = 0, ...rest: number[]) {
        w.__starts.push({ delay: when - this.context.currentTime, kind: this.constructor.name })
        return (orig as (...a: number[]) => void).call(this, when, ...rest)
      }
    }
  })
  return errors
}

export const resetStarts = (page: Page) => page.evaluate(() => { (window as unknown as { __starts: unknown[] }).__starts = [] })
export const getStarts = (page: Page) =>
  page.evaluate(() => (window as unknown as { __starts: { delay: number; kind: string }[] }).__starts)
