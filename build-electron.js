const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Electron build process...');

try {
  // Step 1: Build the Next.js app normally (not static export)
  console.log('🔨 Building Next.js app for Electron...');
  execSync('cross-env ELECTRON_BUILD=true NODE_ENV=production next build', { 
    stdio: 'inherit',
    cwd: __dirname
  });

  console.log('✅ Build completed successfully!');
  console.log('📝 Note: This build creates a server-side rendered Next.js app that will be served by Electron');
  console.log('📝 The app will run with Next.js server inside Electron, not as static files');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

console.log('🎉 Electron build process completed!');