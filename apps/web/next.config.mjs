/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  // Emits a self-contained server bundle — required by apps/web/Dockerfile
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
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
