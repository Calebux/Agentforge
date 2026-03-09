/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Required for better-sqlite3
    config.externals.push('better-sqlite3')
    return config
  },
}

export default nextConfig
