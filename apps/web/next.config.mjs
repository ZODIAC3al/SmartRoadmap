/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    // Disable webpack caching to save disk space on low-storage systems
    if (!dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
