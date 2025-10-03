#!/bin/bash

echo "=== Verifying API Configuration ==="
echo ""

# Check next.config.js
echo "1. Checking next.config.js..."
if grep -q "https://apinext.makkuragatama.id" next.config.js; then
    echo "   ✅ Production API configured in next.config.js"
else
    echo "   ❌ Production API NOT found in next.config.js"
fi

# Check .env.production
echo "2. Checking .env.production..."
if grep -q "NEXT_APP_API_URL=https://apinext.makkuragatama.id" .env.production; then
    echo "   ✅ Production API in .env.production"
else
    echo "   ❌ Production API NOT in .env.production"
fi

# Check build files
echo "3. Checking build files..."
if [ -d "src-tauri/.next" ]; then
    COUNT=$(grep -r "apinext.makkuragatama.id" src-tauri/.next/server/ 2>/dev/null | wc -l)
    if [ "$COUNT" -gt 0 ]; then
        echo "   ✅ Found $COUNT references to production API in build"
    else
        echo "   ❌ No production API references in build"
    fi
else
    echo "   ⚠️  Build directory not found. Run 'npm run build:tauri' first"
fi

# Check for localhost:3003
echo "4. Checking for development API references..."
COUNT_DEV=$(grep -r "localhost:3003" src-tauri/.next/server/ 2>/dev/null | wc -l)
if [ "$COUNT_DEV" -eq 0 ]; then
    echo "   ✅ No development API references"
else
    echo "   ⚠️  Found $COUNT_DEV development API references (may be unused code)"
fi

# Check if app is running
echo "5. Checking if application is running..."
if lsof -i:3006 > /dev/null 2>&1; then
    echo "   ✅ Next.js server running on port 3006"
else
    echo "   ⚠️  Next.js server not running"
fi

echo ""
echo "=== Verification Complete ==="
echo ""
echo "To test in browser:"
echo "1. Open MKG Desktop App"
echo "2. Press Cmd+Option+I (macOS) or F12 (Windows)"
echo "3. In Console, run: console.log(window.location.href)"
echo "4. Go to Network tab and try to login"
echo "5. Check that API calls go to https://apinext.makkuragatama.id"
echo ""
