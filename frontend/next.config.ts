import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',        // Static export for Vercel / S3
  images: { unoptimized: true },
};

export default nextConfig;
