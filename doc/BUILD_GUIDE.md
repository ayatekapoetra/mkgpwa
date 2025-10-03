# Build Guide - MKG Desktop App

Panduan lengkap untuk build aplikasi Tauri MKG Desktop App.

---

## 📋 Prerequisites

### 1. Install Dependencies

**Node.js & npm:**
```bash
node --version  # v20.x or higher
npm --version   # v9.x or higher
```

**Rust:**
```bash
# Install Rust
brew install rust

# Verify
rustc --version
cargo --version
```

**Tauri CLI:**
```bash
npm install -g @tauri-apps/cli
```

---

## 🛠️ Build Process

### Build untuk macOS

**Cara 1: Build .app saja (Recommended)**
```bash
cd fe
npm run build:tauri
```

Output:
- ✅ `src-tauri/target/release/bundle/macos/MKG Desktop App.app`

**Cara 2: Build .app + DMG**
```bash
cd fe
npm run build:tauri:dmg
```

Output:
- ✅ `src-tauri/target/release/bundle/macos/MKG Desktop App.app`
- ✅ `src-tauri/target/release/bundle/dmg/MKG Desktop App_1.0.0_aarch64.dmg`

**Jika DMG build gagal**, gunakan script manual:
```bash
cd fe
./create-dmg-manual.sh
```

### Build untuk Windows

**Dari Windows machine:**
```bash
cd fe
set TAURI_BUILD=true
npm run build
npm run prepare:tauri
cd src-tauri
tauri build
```

Output:
- ✅ `src-tauri/target/release/bundle/msi/MKG Desktop App_1.0.0_x64.msi`
- ✅ `src-tauri/target/release/bundle/nsis/MKG Desktop App_1.0.0_x64-setup.exe`

---

## 📦 Build Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build Next.js saja |
| `npm run build:tauri` | Build Next.js + Tauri (.app only) |
| `npm run build:tauri:dmg` | Build Next.js + Tauri + DMG |
| `npm run prepare:tauri` | Copy files ke src-tauri |
| `./create-dmg-manual.sh` | Create DMG manual |
| `./verify-api-config.sh` | Verify API configuration |

---

## 🔧 Troubleshooting

### Error: DMG bundle failed

**Penyebab:** Tauri DMG bundler issue

**Solusi:**
1. Build tanpa DMG:
   ```bash
   npm run build:tauri
   ```
2. Create DMG manual:
   ```bash
   ./create-dmg-manual.sh
   ```

### Error: Rust not found

**Solusi:**
```bash
brew install rust
source $HOME/.cargo/env
```

### Error: Node modules too large

**Penyebab:** node_modules di-copy ke bundle

**Solusi:** Ini normal, final app size ~600MB karena include:
- Next.js runtime
- Node.js dependencies
- React libraries
- All app assets

### Error: Port 3006 already in use

**Solusi:**
```bash
lsof -ti:3006 | xargs kill -9
```

### Error: API still points to localhost:3003

**Solusi:**
```bash
cd fe
./verify-api-config.sh
```

Pastikan output:
- ✅ Production API configured in next.config.js
- ✅ Production API in .env.production
- ✅ Found X references to production API in build

---

## 📊 Build Output Sizes

| Platform | File | Size |
|----------|------|------|
| macOS | .app | ~600 MB |
| macOS | .dmg | ~630 MB |
| Windows | .msi | ~400 MB |
| Windows | .exe | ~420 MB |

---

## 🚀 Distribution

### macOS

**Option 1: Distribute .app**
1. Zip the .app:
   ```bash
   cd src-tauri/target/release/bundle/macos
   zip -r "MKG Desktop App.zip" "MKG Desktop App.app"
   ```
2. Share ZIP file
3. User extracts dan drag to Applications

**Option 2: Distribute DMG (Recommended)**
1. Share DMG file
2. User double-click DMG
3. User drag app to Applications folder

### Windows

**Option 1: MSI Installer**
- Double-click to install
- Standard Windows installer experience
- Adds to "Programs and Features"

**Option 2: NSIS Installer**
- Custom installer with more options
- Smaller file size
- Can customize installation steps

---

## 🔐 Code Signing (Optional)

### macOS

**Get Developer Certificate:**
1. Join Apple Developer Program ($99/year)
2. Download certificate from developer.apple.com
3. Install in Keychain

**Sign the app:**
```bash
codesign --sign "Developer ID Application: Your Name" \
  --deep --force --verbose \
  "src-tauri/target/release/bundle/macos/MKG Desktop App.app"
```

**Notarize (for distribution outside App Store):**
```bash
xcrun notarytool submit \
  "MKG Desktop App_1.0.0_aarch64.dmg" \
  --apple-id "your@email.com" \
  --password "app-specific-password" \
  --team-id "TEAM_ID" \
  --wait
```

### Windows

**Get Code Signing Certificate:**
1. Purchase certificate from CA (DigiCert, Sectigo, etc)
2. Install certificate on Windows

**Sign the installer:**
```bash
signtool sign /a /tr http://timestamp.digicert.com \
  /td SHA256 \
  "MKG Desktop App_1.0.0_x64-setup.exe"
```

---

## 🧪 Testing Build

### Pre-Distribution Checklist

- [ ] App opens without errors
- [ ] Login works
- [ ] API calls go to `https://apinext.makkuragatama.id`
- [ ] Data loads from production
- [ ] No console errors
- [ ] All features work
- [ ] App can be closed and reopened
- [ ] No localhost:3003 references

### Test on Clean Machine

1. **macOS:**
   - Test on Mac without dev environment
   - Verify Gatekeeper doesn't block (if not signed)
   
2. **Windows:**
   - Test on Windows without dev tools
   - Verify SmartScreen doesn't block (if not signed)

---

## 📁 Build Directory Structure

```
fe/
├── src-tauri/
│   ├── target/
│   │   └── release/
│   │       ├── femkgpwa                    # Binary executable
│   │       └── bundle/
│   │           ├── macos/
│   │           │   └── MKG Desktop App.app # macOS App Bundle
│   │           └── dmg/
│   │               └── MKG Desktop App_1.0.0_aarch64.dmg
│   ├── .next/                              # Next.js build (copied)
│   ├── node_modules/                       # Dependencies (copied)
│   └── .env.local                          # Production config (copied)
```

---

## 🔄 Rebuild After Changes

### Code Changes
```bash
cd fe
npm run build:tauri
```

### Config Changes Only
```bash
cd fe
npm run prepare:tauri
cd src-tauri
tauri build --bundles app
```

### Clean Build
```bash
cd fe
npm run clean
rm -rf src-tauri/.next src-tauri/node_modules
npm run build:tauri
```

---

## 📞 Support

### Build Issues

1. Check prerequisites installed
2. Run verification: `./verify-api-config.sh`
3. Check logs in terminal
4. Clean and rebuild

### Runtime Issues

1. Open Developer Tools in app (Cmd+Option+I)
2. Check Console for errors
3. Check Network tab for API calls
4. Verify API endpoint configuration

---

## 📝 Notes

- Build time: ~2-5 minutes (depending on machine)
- First build slower due to Rust compilation
- Subsequent builds faster with cache
- DMG creation may fail on some machines (use manual script)
- Always test build on clean machine before distribution
