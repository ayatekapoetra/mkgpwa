# CRITICAL FIX - Browser Cache Issue

## Problem
Browser aggressively caching old JavaScript chunks causing filter error.

## Root Cause
- Chunk hash `2117-26cdb34d5a5c5415.js` remains same
- Browser refuses to load new chunks
- User sees old buggy code even after rebuild

## Solution Applied

### Code Fixes (Already Done)
1. ✅ OptionLokasiPitMulti.js - Added `(array || []).filter()`
2. ✅ OptionKaryawanMulti.js - Added `(array || []).filter()`  
3. ✅ OptionPenyewa.js - Added `Array.isArray(array) ? array : []`
4. ✅ OptionCabang.js - Added `data?.rows || []`
5. ✅ grouptag-timesheet.js - Return full data object
6. ✅ cabang.js - Return `data?.rows || []`
7. ✅ lokasi-mining.js - Return `data?.rows || []`

### Cache Busting (Already Done)
1. ✅ next.config.js - timestamp-based buildId
2. ✅ next.config.js - fullhash in webpack output
3. ✅ layout.js - Cache-Control headers
4. ✅ Force rebuild script

## Required User Actions

### For Developers/Testers
```bash
# Server
cd /www/wwwroot/makkuragatama/mkgpwa
git pull origin main
# Stop from aaPanel
rm -rf .next public/_next
bash force-rebuild.sh
# Start from aaPanel
```

### For End Users (CRITICAL!)

**Method 1: Incognito Mode (Easiest)**
1. Open Incognito/Private window
2. Go to https://pwa.makkuragatama.id/lokasikerja-tag/create
3. Test the form

**Method 2: Clear Cache (Recommended)**

Chrome/Edge:
1. Press `Ctrl+Shift+Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Close ALL tabs with pwa.makkuragatama.id
5. Restart browser
6. Open https://pwa.makkuragatama.id/lokasikerja-tag/create

Firefox:
1. Press `Ctrl+Shift+Delete`
2. Select "Cache"
3. Click "Clear Now"
4. Close ALL tabs
5. Restart browser
6. Test

**Method 3: Hard Refresh (Quick)**
1. Go to https://pwa.makkuragatama.id/lokasikerja-tag/create
2. Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
3. Repeat 5-10 times
4. Test the form

**Method 4: Different Browser/Device**
- Test on mobile phone
- Test on different browser
- Test on different computer

## Verification

After cache clear, user should see:
- No error in console when clicking "Nama Penyewa" select
- No error when clicking "Lokasi Kerja" select
- Form works normally

## If Still Error

1. Check Network tab in DevTools
2. Verify chunk files being loaded
3. Check if `2117-26cdb34d5a5c5415.js` is still being loaded
4. If yes, cache not cleared properly - try Method 2 again

## Server-Side Cache

If aaPanel has Nginx cache or CDN:
1. Login to aaPanel
2. Website → mkgpwa → Clear cache
3. Or restart Nginx
