# Uninstall MKG Desktop App

Panduan untuk menghapus aplikasi MKG Desktop App dari sistem Anda.

---

## 🍎 macOS

### Cara 1: Menggunakan Script Otomatis (Rekomendasi)

1. Buka Terminal
2. Navigate ke folder aplikasi:
   ```bash
   cd /path/to/project/fe
   ```
3. Jalankan script uninstall:
   ```bash
   ./uninstall-macos.sh
   ```

Script akan otomatis:
- ✓ Menutup aplikasi jika sedang berjalan
- ✓ Menghapus aplikasi dari /Applications
- ✓ Menghapus semua data dan cache aplikasi
- ✓ Menghentikan background processes
- ✓ Membersihkan preferences dan saved states

### Cara 2: Manual

1. **Tutup aplikasi** (jika sedang berjalan):
   ```bash
   pkill -f "MKG Desktop App"
   pkill -f femkgpwa
   ```

2. **Hapus aplikasi**:
   ```bash
   rm -rf "/Applications/MKG Desktop App.app"
   ```
   
   Atau drag aplikasi dari Applications ke Trash

3. **Hapus data aplikasi** (opsional):
   ```bash
   rm -rf ~/Library/Application\ Support/com.makkuragatama.femkgpwa
   rm -rf ~/Library/Caches/com.makkuragatama.femkgpwa
   rm -rf ~/Library/Preferences/com.makkuragatama.femkgpwa.plist
   rm -rf ~/Library/Saved\ Application\ State/com.makkuragatama.femkgpwa.savedState
   rm -rf ~/Library/WebKit/com.makkuragatama.femkgpwa
   ```

4. **Stop Node.js server** (jika masih berjalan):
   ```bash
   lsof -ti:3006 | xargs kill -9
   ```

---

## 🪟 Windows

### Cara 1: Menggunakan Script Otomatis (Rekomendasi)

1. Download atau copy file `uninstall-windows.bat` ke komputer Anda
2. **Klik kanan** pada file tersebut
3. Pilih **"Run as administrator"**
4. Ikuti instruksi di layar

Script akan otomatis:
- ✓ Menutup aplikasi jika sedang berjalan
- ✓ Menghapus aplikasi dari Program Files
- ✓ Menghapus shortcuts dari Start Menu dan Desktop
- ✓ Menghapus semua data dan cache aplikasi
- ✓ Menghentikan background processes
- ✓ Membersihkan registry entries

### Cara 2: Menggunakan Windows Settings

1. Buka **Settings** (tekan `Win + I`)
2. Pilih **Apps** → **Installed apps**
3. Cari **"MKG Desktop App"**
4. Klik tombol **"..."** atau **"Uninstall"**
5. Ikuti wizard uninstaller

### Cara 3: Manual

1. **Tutup aplikasi** (jika sedang berjalan):
   - Buka Task Manager (`Ctrl + Shift + Esc`)
   - Cari "femkgpwa.exe" atau "MKG Desktop App"
   - Klik **End Task**

2. **Hapus aplikasi**:
   - Navigate ke folder instalasi (biasanya):
     - `C:\Program Files\MKG Desktop App`
     - atau `C:\Users\[YourName]\AppData\Local\Programs\MKG Desktop App`
   - Hapus seluruh folder

3. **Hapus shortcuts**:
   - Start Menu: `C:\ProgramData\Microsoft\Windows\Start Menu\Programs`
   - Desktop: `C:\Users\[YourName]\Desktop`

4. **Hapus data aplikasi** (opsional):
   - `C:\Users\[YourName]\AppData\Roaming\com.makkuragatama.femkgpwa`
   - `C:\Users\[YourName]\AppData\Local\com.makkuragatama.femkgpwa`

5. **Bersihkan Registry** (Advanced - opsional):
   - Buka Registry Editor (`Win + R`, ketik `regedit`)
   - Navigate ke:
     - `HKEY_CURRENT_USER\Software\com.makkuragatama.femkgpwa`
     - `HKEY_LOCAL_MACHINE\SOFTWARE\com.makkuragatama.femkgpwa`
   - Delete key tersebut (jika ada)

---

## ❓ Troubleshooting

### "Cannot delete because file is in use"

**macOS:**
```bash
sudo lsof | grep "MKG Desktop App"
# Kill semua process yang muncul
sudo kill -9 [PID]
```

**Windows:**
1. Restart komputer dalam Safe Mode
2. Hapus aplikasi dari Safe Mode

### "Permission denied"

**macOS:**
```bash
sudo ./uninstall-macos.sh
```

**Windows:**
- Klik kanan script → "Run as administrator"

### Node.js Server masih berjalan di background

**macOS:**
```bash
lsof -ti:3006 | xargs kill -9
```

**Windows:**
```cmd
netstat -ano | findstr :3006
taskkill /F /PID [PID dari hasil di atas]
```

---

## 📝 Catatan

- Setelah uninstall, semua data lokal akan terhapus
- Data di server backend (`https://apinext.makkuragatama.id`) tetap aman
- Jika ingin install ulang, download installer terbaru
- Untuk bantuan lebih lanjut, hubungi support

---

## 🔄 Re-install

Jika ingin install ulang aplikasi setelah uninstall:

**macOS:**
1. Download DMG installer terbaru
2. Buka file DMG
3. Drag aplikasi ke folder Applications

**Windows:**
1. Download MSI installer terbaru
2. Double-click installer
3. Ikuti wizard instalasi
