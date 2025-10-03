# 🚀 Petunjuk Build Tauri

## 📍 Lokasi Kerja
Pastikan Anda berada di direktori yang benar:
```bash
cd /Users/makkuragatama/Project/nextjs/ai-project/mkg/fe
```

## 🔧 Opsi Build Tauri

### 1. Development Mode (Hot Reload)
```bash
npm run tauri
# atau
npm run tauri:start
```

### 2. Production Build (Rebuild Lengkap)
```bash
npm run build:tauri
```

### 3. Production Build dengan DMG (untuk macOS)
```bash
npm run build:tauri:dmg
```

### 4. Clean Build (Hapus cache lama terlebih dahulu)
```bash
npm run clean
npm run build:tauri
```

## 📋 Penjelasan Script

- **`npm run tauri`** - Menjalankan Tauri dalam mode development dengan hot reload
- **`npm run build:tauri`** - Build production untuk aplikasi desktop (app bundle)
- **`npm run build:tauri:dmg`** - Build production + membuat file DMG untuk macOS
- **`npm run clean`** - Membersihkan cache dan build artifacts

## 🔄 Proses Build

Ketika Anda menjalankan `npm run build:tauri`, proses berikut akan terjadi:

1. **Build Next.js** - `TAURI_BUILD=true npm run build`
2. **Prepare Tauri** - `npm run prepare:tauri` (menyalin file build ke folder src-tauri)
3. **Build Tauri** - `cd src-tauri && tauri build --bundles app`

## 🛠️ Troubleshooting

### Hapus node_modules dan install ulang
```bash
rm -rf node_modules package-lock.json
npm install
```

### Hapus folder .next dan build ulang
```bash
rm -rf .next
npm run build:tauri
```

### Clear Tauri cache
```bash
cd src-tauri
rm -rf target
cd ..
npm run build:tauri
```

## 📁 Lokasi Output Build

Setelah build berhasil, file aplikasi akan berada di:
```
fe/src-tauri/target/release/bundle/
```

## 💡 Rekomendasi

### Untuk development sehari-hari:
```bash
npm run tauri
```

### Untuk build production yang bersih:
```bash
npm run clean && npm run build:tauri
```

## 📝 Catatan

- Pastikan semua dependencies sudah terinstall dengan benar
- Untuk build DMG, pastikan Anda menggunakan macOS
- File build akan memiliki format yang berbeda tergantung sistem operasi:
  - macOS: `.app` dan `.dmg`
  - Windows: `.exe` dan `.msi`
  - Linux: `.deb`, `.AppImage`, dll.

## 🔍 Verifikasi Build

Untuk memastikan build berhasil, periksa:
1. Tidak ada error selama proses build
2. File aplikasi muncul di folder `target/release/bundle/`
3. Aplikasi dapat dijalankan tanpa masalah