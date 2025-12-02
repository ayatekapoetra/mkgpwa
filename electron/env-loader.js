/**
 * Environment Loader for Electron
 * This script ensures all environment variables are set before Next.js starts
 */

function loadElectronEnv() {
  const port = process.env.PORT || "3006";
  const hostname = process.env.HOSTNAME || "localhost";
  
  // Core environment variables
  const electronEnv = {
    NODE_ENV: "production",
    PORT: port,
    HOSTNAME: hostname,
    
    // NextAuth configuration
    NEXTAUTH_URL: `http://${hostname}:${port}`,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=",
    NEXTAUTH_TRUST_HOST: "true",
    NEXTAUTH_SECRET_KEY: process.env.NEXTAUTH_SECRET_KEY || "LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=",
    
    // Application configuration
    NEXT_APP_VERSION: "v1.4.8",
    NEXT_APP_API_URL: process.env.NEXT_APP_API_URL || "https://apinext.makkuragatama.id",
    NEXT_APP_JWT_SECRET: process.env.NEXT_APP_JWT_SECRET || "ikRgjkhi15HJiU78-OLKfjngiu",
    NEXT_APP_JWT_TIMEOUT: "86400",
    NEXT_APP_JWT_TIMEOUT_REMEMBER: "604800",
    
    // Google Maps
    REACT_APP_GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyAXv4RQK39CskcIB8fvM1Q7XCofZcLxUXw",
    
    // OCR & AWS
    OCR_SPACE_API_KEY: process.env.OCR_SPACE_API_KEY || "K81999842088957",
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "AKIAU6GDYCCD3LWVYZGV",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "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",
    AWS_REGION: process.env.AWS_REGION || "ap-southeast-1",
  };
  
  // Set all environment variables
  Object.keys(electronEnv).forEach((key) => {
    if (!process.env[key]) {
      process.env[key] = electronEnv[key];
    }
  });
  
  console.log("✅ Electron environment loaded:");
  console.log("  - PORT:", process.env.PORT);
  console.log("  - NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
  console.log("  - NEXT_APP_API_URL:", process.env.NEXT_APP_API_URL);
  
  return electronEnv;
}

module.exports = { loadElectronEnv };
