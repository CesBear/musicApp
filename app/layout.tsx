import type { Metadata } from "next"
import { Geist, Geist_Mono, Instrument_Serif, Noto_Music } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
})

// Símbolos musicales (claves, figuras, silencios) para el pentagrama de Solfeo
const notoMusic = Noto_Music({
  variable: "--font-music",
  subsets: ["music"],
  weight: "400",
})

export const metadata: Metadata = {
  title: "MaestroMusic",
  description: "Tu espacio de guitarra eléctrica",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${notoMusic.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
