/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  // ここに output: 'export' は絶対に入れない
  // output: 'standalone' も今回は不要です
};

module.exports = nextConfig;
