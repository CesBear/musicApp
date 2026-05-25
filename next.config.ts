import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  turbopack: {},  // alphaTab worker/worklet/soundfont are static assets in /public — no bundler config needed
}

export default nextConfig
