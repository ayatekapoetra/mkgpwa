/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: false,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
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
        hostname: "apinext.makkuragatama.id",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "apinext.makkuragatama.id",
        pathname: "/uploads/**",
      },
    ],
  },
  transpilePackages: ["react-syntax-highlighter"],
  env: {
    NEXT_APP_VERSION: process.env.NEXT_APP_VERSION || "v1.4.4",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3005",
    NEXTAUTH_TRUST_HOST: process.env.NEXTAUTH_TRUST_HOST || "true",
    REACT_APP_GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyAXv4RQK39CskcIB8fvM1Q7XCofZcLxUXw",
    NEXT_APP_API_URL: process.env.NEXT_APP_API_URL || "http://localhost:3003",
    NEXT_APP_JWT_SECRET: process.env.NEXT_APP_JWT_SECRET || "ikRgjkhi15HJiU78-OLKfjngiu",
    NEXT_APP_JWT_TIMEOUT: process.env.NEXT_APP_JWT_TIMEOUT || "86400",
    NEXT_APP_JWT_TIMEOUT_REMEMBER: process.env.NEXT_APP_JWT_TIMEOUT_REMEMBER || "604800",
    NEXTAUTH_SECRET_KEY: process.env.NEXTAUTH_SECRET_KEY || "LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=",
    OCR_SPACE_API_KEY: process.env.OCR_SPACE_API_KEY || "K81999842088957",
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "AKIAU6GDYCCD3LWVYZGV",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "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",
    AWS_REGION: process.env.AWS_REGION || "ap-southeast-1",
  },
  generateBuildId: async () => {
    if (process.env.ELECTRON_BUILD === 'true') {
      return 'electron-build';
    }
    // Use consistent build ID for production to avoid chunk mismatch
    return process.env.BUILD_ID || 'production-build';
  },
  webpack: (config) => {
    config.cache = false;
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };

    config.output.webassemblyModuleFilename = "static/wasm/[modulehash].wasm";
    return config;
  },
};

module.exports = nextConfig;
