import Anthropic from "@anthropic-ai/sdk"
import fs from "fs"
import path from "path"

// Load .env.local if ANTHROPIC_API_KEY not set
if (!process.env.ANTHROPIC_API_KEY) {
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

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("❌  Falta ANTHROPIC_API_KEY")
  console.error("   Agrégala al .env.local:")
  console.error("   ANTHROPIC_API_KEY=sk-ant-...")
  process.exit(1)
}

const client = new Anthropic()
const BASE = path.resolve(process.cwd())

function read(rel: string): string {
  try {
    return fs.readFileSync(path.join(BASE, rel), "utf-8")
  } catch {
    return `[archivo no encontrado: ${rel}]`
  }
}

async function main() {
  const files = {
    "data/scales.ts":            read("data/scales.ts"),
    "data/chords.ts":            read("data/chords.ts"),
    "escalas page":              read("app/(dashboard)/escalas/page.tsx"),
    "chord-builder page":        read("app/(dashboard)/chord-builder/page.tsx"),
    "Fretboard component":       read("components/scales/Fretboard.tsx"),
    "ChordDiagram component":    read("components/chord-builder/ChordDiagram.tsx"),
    "CircleOfFifths component":  read("components/circulo-quintas/CircleOfFifths.tsx"),
  }

  const content = Object.entries(files)
    .map(([label, code]) => `### ${label}\n\`\`\`typescript\n${code}\n\`\`\``)
    .join("\n\n")

  console.log("\n🎸  MusicApp — Revisión de contenido musical\n")
  console.log("━".repeat(60))
  console.log()

  const stream = client.messages.stream({
    model: "claude-opus-4-7",
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high" },
    system: `Eres un experto en teoría musical y guitarra eléctrica con más de 20 años de experiencia como músico profesional, profesor de guitarra y arreglista. Dominas:

• Teoría musical: escalas, modos, armonía funcional, interválica
• Guitarra eléctrica: técnica, afinación estándar EADGBE, posiciones en el mástil, digitaciones
• Construcción de acordes: triadas, tétradas, voicings, inversiones, cifrado americano
• Círculo de quintas: relaciones armónicas, tonalidades relativas, modulaciones
• Pedagogía: cómo presentar teoría de manera clara, correcta y útil para guitarristas

MISIÓN: Revisar el código TypeScript de una app de teoría musical para guitarra y detectar:
1. Errores en fórmulas o intervalos de escalas
2. Voicings de acordes incorrectos en la guitarra (frets erróneos, cuerdas equivocadas)
3. Información del círculo de quintas incorrecta
4. Cálculos de notas mal implementados
5. Cualquier inexactitud musical en datos o lógica

Formato de respuesta:
- Sé específico y técnico
- Para cada sección: ✅ correcto / ⚠️ advertencia / ❌ error
- Si hay un error, explica exactamente qué está mal y cómo corregirlo
- Al final, da un resumen con las prioridades de corrección`,
    messages: [
      {
        role: "user",
        content: `Revisa el contenido musical de esta app de guitarra. Analiza la precisión técnica de cada archivo:\n\n${content}`,
      },
    ],
  })

  stream.on("text", (text) => process.stdout.write(text))

  const final = await stream.finalMessage()
  const usage = final.usage
  console.log("\n\n" + "━".repeat(60))
  console.log(`✅  Revisión completada`)
  console.log(`   Tokens entrada: ${usage.input_tokens} | salida: ${usage.output_tokens}`)
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
