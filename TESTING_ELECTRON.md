# Testing Electron Login Fix (v1.4.9)

## Problem yang Diperbaiki

Error: `POST http://localhost:3006/api/auth/callback/login 401 (Unauthorized)`

Disebabkan oleh environment variable `NEXTAUTH_URL` tidak ter-set dengan benar saat Electron build dijalankan.

## Solusi yang Diimplementasi

1. **electron/env-loader.js** - Module baru untuk load environment variables
2. **Early loading** - Environment di-load sebelum Next.js di-initialize
3. **Correct port** - NEXTAUTH_URL menggunakan port 3006 untuk electron
4. **trustHost: true** - Ditambahkan ke authOptions

## Testing Steps

### Test 1: Development Mode (Quick Test)

```bash
# Terminal 1: Start Next.js dev server untuk electron
npm run dev:electron

# Terminal 2: Start Electron
npm run electron

# Expected: Electron window terbuka tanpa error
# Test: Login dengan credentials yang valid
# Expected: Login berhasil tanpa 401 error
```

### Test 2: Production Build (Full Test)

```bash
# Clean previous build
rm -rf .next dist

# Build electron app
npm run electron:build

# Test build result
npm start:electron

# Di terminal lain
npm run electron:prod

# Expected: Electron window terbuka dengan Next.js production build
# Test: Login dengan credentials yang valid
# Expected: Login berhasil tanpa 401 error
```

### Test 3: Distribution Build (macOS)

```bash
# Build distributable
npm run electron:dist:mac:never

# Buka hasil build di dist/
open dist/MKG-Desktop.app

# Expected: App terbuka normal
# Test: Login
# Expected: Login berhasil
```

### Test 4: Distribution Build (Windows)

```bash
# Build distributable
npm run electron:dist:win:never

# Buka hasil build di dist/
# MKG-Desktop Setup 1.4.9.exe

# Install dan jalankan
# Test: Login
# Expected: Login berhasil
```

## Verification Checklist

Setelah fix ini, pastikan semua ini work:

- ✅ Electron dev mode bisa login
- ✅ Electron production build bisa login
- ✅ Environment variables ter-load dengan benar
- ✅ NEXTAUTH_URL = `http://localhost:3006`
- ✅ API calls ke backend berhasil
- ✅ Session management bekerja
- ✅ Remember me functionality bekerja
- ✅ Logout bekerja normal

## Debug Mode

Jika masih ada masalah, check environment variables:

1. Buka Electron DevTools (F12)
2. Console → ketik:
   ```javascript
   console.log({
     NEXTAUTH_URL: process.env.NEXTAUTH_URL,
     NEXT_APP_API_URL: process.env.NEXT_APP_API_URL,
     PORT: process.env.PORT
   })
   ```

Expected output:
```json
{
  "NEXTAUTH_URL": "http://localhost:3006",
  "NEXT_APP_API_URL": "https://apinext.makkuragatama.id",
  "PORT": "3006"
}
```

## Troubleshooting

### Error: Cannot find module './env-loader'

**Problem:** electron/env-loader.js tidak ter-bundle

**Solution:** 
```bash
# Clean dan rebuild
rm -rf .next dist node_modules/.cache
npm run build:electron
```

### Error: Still getting 401 Unauthorized

**Problem:** Old build cache

**Solution:**
```bash
# Clear all caches
rm -rf .next dist
rm -rf node_modules/.cache
npm run build:electron
npm run electron:dist:mac:never
```

### Error: NEXTAUTH_URL still points to 3005

**Problem:** Environment not reloaded

**Solution:**
1. Restart Electron completely
2. Check electron/env-loader.js is included in build
3. Verify main.js calls loadElectronEnv() at the top

## Files Changed in v1.4.9

```
electron/env-loader.js          (NEW) - Environment loader
electron/main.js                 (MODIFIED) - Load env early
src/utils/authOptions.js         (MODIFIED) - Add trustHost
package.json                     (MODIFIED) - Version bump
```

## Next Build Trigger

Setelah push tag v1.4.9, GitHub Actions akan otomatis:
1. Build untuk macOS (arm64)
2. Build untuk Windows (x64)
3. Publish ke GitHub Releases

Download hasil build dari: https://github.com/ayatekapoetra/mkgpwa/releases/tag/v1.4.9

## Success Criteria

✅ Login form muncul
✅ Input username & password
✅ Click Login
✅ **No 401 error in console**
✅ Redirect ke dashboard
✅ Session tersimpan
✅ Dapat akses fitur aplikasi

---

**Version:** 1.4.9  
**Fixed:** Electron login 401 authentication error  
**Date:** December 2024
