/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits a self-contained server bundle — required by apps/web/Dockerfile
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  },
};

export default nextConfig;
