// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.discordapp.com'], // ✅ 여기에 도메인 추가
  },
};

module.exports = nextConfig;
