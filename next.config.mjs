/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
    instrumentationHook: true,
  },
  webpack: (config) => {
    config.externals.push('better-sqlite3', 'fs', 'path', 'child_process', 'crypto')
    return config
  },
}

export default nextConfig
