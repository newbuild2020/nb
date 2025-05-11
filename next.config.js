/** @type {import('next').NextConfig} */
const nextConfig = {
  // 关闭 ESLint 阻断构建（Vercel 部署时即使有 ESLint 报错也能上线）
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 你可以在这里添加更多 Next.js 配置项
  // 例如：
  // reactStrictMode: true,
  // images: { domains: ['yourdomain.com'] },
};

module.exports = nextConfig; 