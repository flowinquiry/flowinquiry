/** @type {import('next').NextConfig} */
import createNextIntlPlugin from "next-intl/plugin";

const backEndUrl = process.env.BACK_END_URL || "http://localhost:8080";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return {
      fallback: [
        {
          source: "/api/:path*",
          destination: `${backEndUrl}/api/:path*`,
        },
      ],
    };
  },
  output: "standalone",
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
