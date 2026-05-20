import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // alphaTab's worker/worklet files are served from /public/alphatab/ as static assets.
      // Prevent webpack from trying to bundle them; alphaTab loads them at runtime via fetch.
      config.resolve.fallback = { ...config.resolve.fallback, fs: false }
    }
    return config
  },
}

export default nextConfig
