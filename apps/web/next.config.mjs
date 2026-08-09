import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // Suppress missing sourcemap 404s for third-party packages like framer-motion
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /LayoutGroupContext/,
      /com\.chrome\.devtools/,
    ];
    if (!dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
