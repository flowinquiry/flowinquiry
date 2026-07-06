import nextra from "nextra";

const withNextra = nextra({
  latex: true,
  defaultShowCopyCode: true,
  whiteListTagsStyling: ["figure", "figcaption"],
});

export default withNextra({
  basePath: "",
  reactStrictMode: true,
  output: "export",
  images: {
    unoptimized: true,
  },
  webpack(config) {
    // rule.exclude doesn't work starting from Next.js 15
    const { test: _test, ...imageLoaderOptions } = config.module.rules.find(
      (rule) => rule.test?.test?.(".svg"),
    );
    config.module.rules.push({
      test: /\.svg$/,
      oneOf: [
        {
          resourceQuery: /svgr/,
          use: ["@svgr/webpack"],
        },
        imageLoaderOptions,
      ],
    });
    return config;
  },
  turbopack: {
    rules: {
      "./components/icons/*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  experimental: {
    optimizePackageImports: ["@components/icons"],
  },
});
