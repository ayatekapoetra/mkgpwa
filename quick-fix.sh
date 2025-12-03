#!/bin/bash

# Quick Fix Script for Chunk Loading Error
# Run this on AWS EC2 server with aaPanel

echo "🔧 MKG Frontend - Quick Fix Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as www user
if [ "$(whoami)" != "www" ]; then
    echo -e "${RED}❌ Must run as 'www' user${NC}"
    echo "Run: sudo su - www"
    echo "Then: cd /www/wwwroot/pwa.makkuragatama.id && ./quick-fix.sh"
    exit 1
fi

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Must run from project directory${NC}"
    echo "Run: cd /www/wwwroot/pwa.makkuragatama.id"
    exit 1
fi

echo -e "${YELLOW}Step 1: Stop PM2 process${NC}"
pm2 stop mkg-frontend || true
sleep 2

echo -e "${YELLOW}Step 2: Backup current build${NC}"
if [ -d ".next" ]; then
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    tar -czf "/www/backup/mkg-frontend-backup-$TIMESTAMP.tar.gz" .next 2>/dev/null || true
    echo "✅ Backup created: mkg-frontend-backup-$TIMESTAMP.tar.gz"
fi

echo -e "${YELLOW}Step 3: Clean build directory${NC}"
rm -rf .next
echo "✅ .next directory removed"

echo -e "${YELLOW}Step 4: Pull latest code${NC}"
git fetch origin
git reset --hard origin/main
git pull origin main
echo "✅ Code updated to latest"

echo -e "${YELLOW}Step 5: Install dependencies${NC}"
npm ci --legacy-peer-deps
echo "✅ Dependencies installed"

echo -e "${YELLOW}Step 6: Build application${NC}"
BUILD_ID="production-$(date +%s)" NODE_ENV=production npm run build
echo "✅ Build completed"

echo -e "${YELLOW}Step 7: Start PM2 process${NC}"
pm2 start ecosystem.config.js --env production
pm2 save
sleep 3
echo "✅ PM2 process started"

echo ""
echo "=================================="
echo -e "${GREEN}✅ Quick Fix Completed!${NC}"
echo "=================================="
echo ""

# Health check
echo -e "${YELLOW}Health Check:${NC}"
echo ""

# Check PM2 status
PM2_STATUS=$(pm2 list | grep mkg-frontend | grep online)
if [ -n "$PM2_STATUS" ]; then
    echo -e "  ✅ PM2 Status: ${GREEN}Online${NC}"
else
    echo -e "  ❌ PM2 Status: ${RED}Not Running${NC}"
    pm2 logs mkg-frontend --lines 10 --nostream
    exit 1
fi

# Check localhost
if curl -f -s -o /dev/null http://localhost:3005; then
    echo -e "  ✅ Localhost: ${GREEN}Responding${NC}"
else
    echo -e "  ❌ Localhost: ${RED}Not Responding${NC}"
    exit 1
fi

# Check build ID
BUILD_ID_FILE=".next/BUILD_ID"
if [ -f "$BUILD_ID_FILE" ]; then
    CURRENT_BUILD_ID=$(cat $BUILD_ID_FILE)
    echo -e "  ✅ Build ID: ${GREEN}$CURRENT_BUILD_ID${NC}"
else
    echo -e "  ❌ Build ID: ${RED}Not Found${NC}"
fi

# Check static chunks
CHUNK_COUNT=$(ls -1 .next/static/chunks/*.js 2>/dev/null | wc -l)
if [ "$CHUNK_COUNT" -gt 0 ]; then
    echo -e "  ✅ JS Chunks: ${GREEN}$CHUNK_COUNT files${NC}"
else
    echo -e "  ❌ JS Chunks: ${RED}Not Found${NC}"
fi

echo ""
echo "Next Steps:"
echo "  1. Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)"
echo "  2. Visit: https://pwa.makkuragatama.id"
echo "  3. Check browser console for errors"
echo ""
echo "View logs: pm2 logs mkg-frontend"
echo "View status: pm2 status"
echo ""
