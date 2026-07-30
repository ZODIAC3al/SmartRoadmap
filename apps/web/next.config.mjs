import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits a self-contained server bundle — required by apps/web/Dockerfile
  output: 'standalone',
  experimental: {
    // This Next.js build reads the monorepo tracing root from `experimental`.
    outputFileTracingRoot: fileURLToPath(new URL('../../', import.meta.url)),
  },

  webpack: (config, { dev }) => {
    // Disable webpack caching to save disk space on low-storage systems
    if (!dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
