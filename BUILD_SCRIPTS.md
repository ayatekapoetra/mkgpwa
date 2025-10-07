# 🚀 Build Scripts Documentation

## 📋 Available Scripts

### 1. **build-tauri.sh** - Full Build (Recommended)
Complete build dengan opsi multiple output formats.

```bash
./build-tauri.sh
```

**Options:**
- `1` - .app Bundle only (fastest, recommended)
- `2` - DMG Installer only
- `3` - Both .app + DMG (complete)
- `4` - Debug build (development)

**Features:**
- ✅ Full clean sebelum build
- ✅ Auto-detect build errors
- ✅ Build time tracking
- ✅ Auto-install ke /Applications
- ✅ Remove quarantine attribute
- ✅ Launch app setelah install

**Estimasi Waktu:**
- First build: 10-15 menit
- Subsequent: 5-8 menit

---

### 2. **quick-build.sh** - Quick Rebuild
Incremental build tanpa clean full (lebih cepat).

```bash
./quick-build.sh
```

**Use Case:**
- Minor code changes
- Testing fixes
- Iterative development

**Estimasi Waktu:** 3-5 menit

**⚠️ Warning:** 
- Tidak clean Rust dependencies
- Gunakan `build-tauri.sh` jika ada masalah

---

### 3. **dev-tauri.sh** - Development Mode
Run development server dengan hot-reload.

```bash
./dev-tauri.sh
```

**Options:**
- `1` - Browser only (http://localhost:3006)
- `2` - Tauri Desktop App only
- `3` - Both (recommended)

**Features:**
- ✅ Hot-reload Next.js
- ✅ Auto-restart on errors
- ✅ Clean shutdown (Ctrl+C)
- ✅ Log output ke `/tmp/nextjs-dev.log`

---

### 4. **cleanup-tauri.sh** - Cleanup & Uninstall
Remove semua build artifacts dan installed app.

```bash
./cleanup-tauri.sh
```

**Removes:**
- `/Applications/MKG Desktop App.app`
- `src-tauri/target/*`
- `.next` folder
- All caches
- App data (optional)

---

## 🎯 Typical Workflows

### **First Time Setup**
```bash
# 1. Make scripts executable
chmod +x *.sh

# 2. Full build
./build-tauri.sh
# Select option 1 (.app)

# 3. Install to /Applications
# Answer 'y' when prompted
```

---

### **Daily Development**
```bash
# Morning: Start dev mode
./dev-tauri.sh
# Select option 3 (both)

# Edit code... (hot-reload active)

# Evening: Build for testing
./quick-build.sh
```

---

### **Release Build**
```bash
# 1. Clean everything
./cleanup-tauri.sh

# 2. Full rebuild
./build-tauri.sh
# Select option 3 (both .app + DMG)

# 3. Distribute DMG file
# Location: src-tauri/target/release/bundle/dmg/
```

---

### **Fix Build Issues**
```bash
# 1. Clean everything
./cleanup-tauri.sh

# 2. Rebuild from scratch
./build-tauri.sh
# Select option 1
```

---

## 📁 Build Outputs

### **.app Bundle**
```
src-tauri/target/release/bundle/macos/
└── MKG Desktop App.app/
    ├── Contents/
    │   ├── Info.plist
    │   ├── MacOS/
    │   │   └── femkgpwa          (binary)
    │   └── Resources/
    │       ├── .next/             (Next.js build)
    │       ├── node_modules/
    │       └── public/
```

**Size:** ~200-300 MB

---

### **DMG Installer**
```
src-tauri/target/release/bundle/dmg/
├── MKG Desktop App_1.0.0_aarch64.dmg  (Apple Silicon)
└── MKG Desktop App_1.0.0_x64.dmg      (Intel Mac)
```

**Size:** ~100-150 MB (compressed)

---

## 🔧 Troubleshooting

### **Error: "Permission denied"**
```bash
chmod +x build-tauri.sh quick-build.sh dev-tauri.sh cleanup-tauri.sh
```

---

### **Error: "Port 3006 already in use"**
```bash
# Kill process on port 3006
lsof -ti:3006 | xargs kill -9

# Or restart script (auto-kill enabled)
./dev-tauri.sh
```

---

### **Error: "App is damaged"**
```bash
# Remove quarantine (auto-done in script)
xattr -cr "/Applications/MKG Desktop App.app"
```

---

### **Error: "Out of memory"**
```bash
# Increase Node memory (auto-set in script)
export NODE_OPTIONS="--max-old-space-size=4096"
```

---

### **Error: "Cargo build failed"**
```bash
# Clean Rust target
rm -rf src-tauri/target

# Rebuild
./build-tauri.sh
```

---

## 📊 Build Comparison

| Script | Clean | Time | Output | Use Case |
|--------|-------|------|--------|----------|
| build-tauri.sh | Full | 10-15 min | Production | Release, First build |
| quick-build.sh | Partial | 3-5 min | Production | Iterative testing |
| dev-tauri.sh | None | 2 min | Development | Active coding |
| cleanup-tauri.sh | Complete | 1 min | - | Fix issues |

---

## 💡 Tips & Best Practices

### **1. Use Quick Build for iterations**
```bash
# Edit code
./quick-build.sh
# Test
# Repeat
```

---

### **2. Full build before release**
```bash
./cleanup-tauri.sh
./build-tauri.sh  # Option 3 (full)
```

---

### **3. Monitor build logs**
```bash
# Dev mode logs
tail -f /tmp/nextjs-dev.log

# Build logs
./build-tauri.sh 2>&1 | tee build.log
```

---

### **4. Test before distribute**
```bash
# Build
./build-tauri.sh

# Test locally
open "/Applications/MKG Desktop App.app"

# If OK, create DMG
./build-tauri.sh  # Option 2 or 3
```

---

## 🚀 Quick Reference

```bash
# Development
./dev-tauri.sh              # Start dev mode

# Build
./quick-build.sh            # Quick rebuild
./build-tauri.sh            # Full build

# Maintenance
./cleanup-tauri.sh          # Clean all

# Make executable (first time)
chmod +x *.sh
```

---

## 📞 Support

**Build issues?**
1. Run `./cleanup-tauri.sh`
2. Run `./build-tauri.sh` (option 1)
3. Check logs in `/tmp/nextjs-dev.log`

**App issues?**
1. Check console: `open -a Console`
2. Filter: "MKG Desktop App"
3. Look for errors

---

**Happy Building! 🎉**
