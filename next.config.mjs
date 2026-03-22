/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", process.env.NEXT_PUBLIC_APP_URL].filter(Boolean),
    },
  },
  images: {
    domains: [],
  },
};

export default nextConfig;
