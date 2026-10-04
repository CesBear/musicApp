import { defineConfig } from "vitest/config"

// Pruebas de teoría musical (tests/unit) y de audio renderizado offline (tests/audio).
// Las de navegador viven en tests/e2e y corren con Playwright.
export default defineConfig({
  resolve: { alias: { "@": import.meta.dirname } },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/audio/**/*.test.ts"],
    environment: "node",
    testTimeout: 180_000,
    hookTimeout: 60_000,
  },
})
