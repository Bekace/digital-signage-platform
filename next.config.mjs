/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['blob.vercel-storage.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  // Increase body size limit for file uploads
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
  // Add server configuration for larger uploads
  serverRuntimeConfig: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
  },
}

export default nextConfig
