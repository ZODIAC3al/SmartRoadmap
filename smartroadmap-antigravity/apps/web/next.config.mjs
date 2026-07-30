/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits a self-contained server bundle — required by apps/web/Dockerfile
  output: 'standalone',
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,

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
