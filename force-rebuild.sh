#!/bin/bash

# Force Rebuild Script untuk Production
# Menghapus semua cache dan rebuild dengan chunks baru

set -e

echo "🔥 Force Rebuild Script - v1.4.13"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Clean all caches
echo -e "${YELLOW}📦 Cleaning all caches...${NC}"
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/cache
rm -rf .swc

# 2. Clear npm cache
echo -e "${YELLOW}🗑️  Clearing npm cache...${NC}"
npm cache clean --force

# 3. Rebuild
echo -e "${YELLOW}🔨 Building application...${NC}"
NODE_ENV=production npm run build

# 4. Verify build
if [ -f ".next/standalone/server.js" ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo -e "${GREEN}📦 Build ID: $(cat .next/BUILD_ID)${NC}"
    
    # List new chunks
    echo -e "${YELLOW}📄 New chunk files:${NC}"
    ls -lh .next/static/chunks/*.js | tail -5
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Force rebuild completed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Start aplikasi dari aaPanel UI"
echo "  2. Test: https://pwa.makkuragatama.id/lokasikerja-tag"
echo "  3. Clear browser cache: Ctrl+Shift+R"
