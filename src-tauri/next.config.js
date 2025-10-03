/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.TAURI_BUILD === 'true' ? 'standalone' : undefined,
  trailingSlash: false,
  webpack: (config) => {
    config.cache = false;
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true
    };

    config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['tesseract.js']
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'cdn.makkuragatama.id',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'apinext.makkuragatama.id',
        pathname: '/**'
      },
      {
        protocol: process.env.NODE_ENV === 'development' ? 'http' : 'https',
        hostname: process.env.NODE_ENV === 'development' ? 'localhost' : 'apinext.makkuragatama.id',
        port: process.env.NODE_ENV === 'development' ? '3003' : undefined,
        pathname: '/uploads/**'
      }
    ]
  },
  transpilePackages: ['react-syntax-highlighter'],
  env: {
    NEXT_APP_VERSION: 'v1.0.0',
    NEXTAUTH_SECRET: 'LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=',
    NEXTAUTH_URL: process.env.NODE_ENV === 'development' ? 'http://localhost:3005' : process.env.NEXTAUTH_URL || 'http://localhost:3006',
    REACT_APP_GOOGLE_MAPS_API_KEY: 'AIzaSyAXv4RQK39CskcIB8fvM1Q7XCofZcLxUXw',
    NEXT_APP_API_URL: process.env.NODE_ENV === 'development' ? 'http://localhost:3003' : process.env.NEXT_APP_API_URL || 'https://apinext.makkuragatama.id',
    NEXT_APP_JWT_SECRET: 'ikRgjkhi15HJiU78-OLKfjngiu',
    NEXT_APP_JWT_TIMEOUT: '86400',
    NEXTAUTH_SECRET_KEY: 'LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=',
    OCR_SPACE_API_KEY: 'K81999842088957',
    AWS_ACCESS_KEY_ID: 'AKIAU6GDYCCD3LWVYZGV',
    AWS_SECRET_ACCESS_KEY: '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',
    AWS_REGION: 'ap-southeast-1'
  }
};

module.exports = nextConfig;