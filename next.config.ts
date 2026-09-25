import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ['@libsql/client', '@libsql/linux-x64-gnu'],
};

export default nextConfig;
