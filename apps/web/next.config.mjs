/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracing: false, // Disable file tracing for local builds to save storage
  webpack: (config, { dev }) => {
    // Disable webpack caching to save disk space on low-storage systems
    if (!dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
