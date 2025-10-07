# ⚡ QUICK START - Update .app

## 🎯 Cara Tercepat Update App

### **Method 1: Interactive Script (Recommended)**

```bash
./build-tauri.sh
```

**Pilih option:**
- Ketik `1` untuk .app bundle
- Ketik `y` untuk auto-install
- Ketik `y` untuk auto-launch

**Done!** App sudah terupdate di `/Applications/`

---

### **Method 2: NPM Command**

```bash
npm run build:app
```

Sama seperti method 1, tapi via npm.

---

### **Method 3: Quick Rebuild (Faster)**

Jika hanya update kode kecil:

```bash
./quick-build.sh
```

**Waktu:** 3-5 menit (vs 10-15 menit full build)

---

## 📋 All Available Commands

### **Via Shell Scripts:**
```bash
./build-tauri.sh      # Full build dengan opsi
./quick-build.sh      # Quick rebuild
./dev-tauri.sh        # Development mode
./cleanup-tauri.sh    # Clean all
```

### **Via NPM:**
```bash
npm run build:app     # Same as ./build-tauri.sh
npm run build:quick   # Same as ./quick-build.sh
npm run build:dev     # Same as ./dev-tauri.sh
npm run build:clean   # Same as ./cleanup-tauri.sh
```

---

## 🔄 Typical Update Workflow

1. **Edit Code** (src/...)
2. **Build**: `./quick-build.sh`
3. **Test**: Launch app from /Applications
4. **Repeat** if needed

---

## 🎬 First Time Setup

```bash
# 1. Make scripts executable (one time only)
chmod +x *.sh

# 2. Build
./build-tauri.sh

# 3. Done!
```

---

## 💡 Tips

### **When to use Quick Build:**
- ✅ Minor code changes
- ✅ Bug fixes
- ✅ UI updates
- ✅ Testing iterations

### **When to use Full Build:**
- ✅ First time build
- ✅ After npm install
- ✅ Before release/distribution
- ✅ When build has issues

---

## 🆘 Troubleshooting

### **Build fails?**
```bash
./cleanup-tauri.sh
./build-tauri.sh
```

### **App won't open?**
```bash
xattr -cr "/Applications/MKG Desktop App.app"
```

### **Port 3006 in use?**
```bash
lsof -ti:3006 | xargs kill -9
```

---

## 📖 Full Documentation

- **Build Scripts**: [BUILD_SCRIPTS.md](BUILD_SCRIPTS.md)
- **Offline Mode**: [OFFLINE_MODE_UPGRADE.md](OFFLINE_MODE_UPGRADE.md)
- **Troubleshooting**: [TROUBLESHOOTING_OFFLINE_MODE.md](TROUBLESHOOTING_OFFLINE_MODE.md)

---

**Happy Building! 🚀**
