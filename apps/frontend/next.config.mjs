/** @type {import('next').NextConfig} */
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return {
      fallback: [
        {
          source: "/api/:path*",
          destination: `${process.env.BACK_END_URL}/api/:path*`,
        },
      ],
    };
  },
  eslint: {
    // Only lint these specific directories
    dirs: [
      "src",
      "app",
      "components",
      "lib",
      "hooks",
      "utils",
      "providers",
      "types",
    ],
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  output: "standalone",
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
