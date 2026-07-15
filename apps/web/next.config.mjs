/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits a self-contained server bundle — required by apps/web/Dockerfile
  output: 'standalone',
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,

  webpack: (config, { dev }) => {
    // Disable webpack caching to save disk space on low-storage systems
    if (!dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
