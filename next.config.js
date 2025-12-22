/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: false,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Force cache invalidation with asset prefix
  assetPrefix: process.env.ASSET_PREFIX || undefined,
  experimental: {
    serverComponentsExternalPackages: ["tesseract.js"],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.makkuragatama.id",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "apimkglocal.makkuragatama.id",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "apimkglocal.makkuragatama.id",
        pathname: "/uploads/**",
      },
    ],
  },
  transpilePackages: ["react-syntax-highlighter"],
  env: {
    // All env variables will be loaded from .env file automatically
    // Fallback values provided for safety
    NEXT_APP_VERSION: process.env.NEXT_APP_VERSION || "v1.4.4",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3005",
    NEXTAUTH_TRUST_HOST: process.env.NEXTAUTH_TRUST_HOST || "true",
    REACT_APP_GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    NEXT_APP_API_URL: process.env.NEXT_APP_API_URL || "https://apimkglocal.makkuragatama.id",
    NEXT_APP_JWT_SECRET: process.env.NEXT_APP_JWT_SECRET || "ikRgjkhi15HJiU78-OLKfjngiu",
    NEXT_APP_JWT_TIMEOUT: process.env.NEXT_APP_JWT_TIMEOUT || "86400",
    NEXT_APP_JWT_TIMEOUT_REMEMBER: process.env.NEXT_APP_JWT_TIMEOUT_REMEMBER || "604800",
    NEXTAUTH_SECRET_KEY: process.env.NEXTAUTH_SECRET_KEY || "LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=",
    OCR_SPACE_API_KEY: process.env.OCR_SPACE_API_KEY || "",
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
    AWS_REGION: process.env.AWS_REGION || "ap-southeast-1",
  },
  generateBuildId: async () => {
    if (process.env.ELECTRON_BUILD === 'true') {
      return 'electron-build';
    }
    // Use timestamp-based build ID to force new chunks on each build
    return 'build-' + Date.now();
  },
  webpack: (config, { isServer }) => {
    config.cache = false;
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };

    config.output.webassemblyModuleFilename = "static/wasm/[modulehash].wasm";
    
    // Force unique chunk names on every build
    if (!isServer) {
      config.output.filename = config.output.filename?.replace('[name]', '[name].[fullhash]');
      config.output.chunkFilename = config.output.chunkFilename?.replace('[id]', '[id].[fullhash]');
    }
    
    return config;
  },
};

module.exports = nextConfig;
