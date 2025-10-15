# Troubleshooting Guide

## macOS: "MKG Desktop is damaged and can't be opened"

Jika Anda mengalami error **"MKG Desktop" is damaged and can't be opened. You should move it to the Trash"** saat membuka aplikasi di macOS, ini disebabkan oleh **Gatekeeper** yang memblokir aplikasi yang tidak ter-sign oleh Apple Developer Certificate.

### Penyebab

- Aplikasi diunduh dari internet tanpa notarisasi Apple
- macOS menandai aplikasi sebagai "quarantined" untuk keamanan
- Gatekeeper memblokir aplikasi dari developer yang tidak terverifikasi

### Solusi 1: Remove Quarantine Attribute (Recommended)

Buka **Terminal** dan jalankan perintah berikut:

```bash
xattr -d com.apple.quarantine "/Applications/MKG Desktop.app"
```

**Penjelasan:**

- `xattr` = tool untuk mengelola extended attributes di macOS
- `-d` = delete/hapus attribute
- `com.apple.quarantine` = attribute yang ditambahkan oleh macOS untuk file yang diunduh
- Path menuju aplikasi MKG Desktop

Setelah menjalankan perintah ini, coba buka aplikasi lagi.

### Solusi 2: Remove All Attributes dan Force Sign

Jika Solusi 1 tidak berhasil, coba:

```bash
sudo xattr -cr "/Applications/MKG Desktop.app"
codesign --force --deep --sign - "/Applications/MKG Desktop.app"
```

**Penjelasan:**

- `xattr -cr` = clear all attributes secara recursive
- `codesign --force --deep --sign -` = re-sign aplikasi dengan ad-hoc signature

### Solusi 3: Disable Gatekeeper Sementara

⚠️ **Perhatian:** Ini akan menurunkan keamanan sistem Anda sementara.

```bash
# Disable Gatekeeper
sudo spctl --master-disable

# Buka aplikasi MKG Desktop

# Enable kembali Gatekeeper
sudo spctl --master-enable
```

### Solusi 4: Buka via Finder (GUI Method)

1. Buka **Finder** → **Applications**
2. **Control + Click** (atau klik kanan) pada **MKG Desktop**
3. Pilih **Open**
4. Klik **Open** pada dialog konfirmasi

Setelah dibuka sekali dengan cara ini, aplikasi akan diijinkan untuk dibuka di masa mendatang.

### Verifikasi

Setelah menjalankan salah satu solusi di atas, Anda dapat memverifikasi dengan:

```bash
# Cek attribute file
xattr "/Applications/MKG Desktop.app"

# Harusnya tidak ada output atau tidak ada com.apple.quarantine
```

### FAQ

**Q: Apakah ini aman?**  
A: Ya, selama Anda mengunduh aplikasi dari sumber resmi. Perintah ini hanya menghapus flag quarantine yang ditambahkan macOS.

**Q: Kenapa aplikasi tidak di-sign?**  
A: Apple Developer Certificate memerlukan biaya tahunan $99. Untuk aplikasi internal/development, biasanya tidak di-sign.

**Q: Apakah saya perlu menjalankan ini setiap kali update?**  
A: Ya, setiap kali ada update baru, macOS akan menandai ulang aplikasi sebagai quarantined.

---

## Windows: SmartScreen Warning

Jika di Windows muncul warning **"Windows protected your PC"**:

1. Klik **More info**
2. Klik **Run anyway**

Atau via PowerShell:

```powershell
Unblock-File -Path "C:\Path\To\MKG Desktop Setup.exe"
```

---

## Update Issues

### Auto-Update Tidak Bekerja

Jika auto-update gagal:

1. Periksa koneksi internet
2. Cek versi terbaru di: https://github.com/ayatekapoetra/mkgpwa/releases
3. Download dan install manual

### Error Saat Download Update

```
Error checking for updates: ZIP file not provided
```

**Solusi:**

- Update akan segera tersedia
- Sementara download versi terbaru manual dari GitHub Releases

---

## Kontak Support

Jika masih mengalami masalah, hubungi:

- Email: ayatekapoetra@gmail.com
- GitHub Issues: https://github.com/ayatekapoetra/mkgpwa/issues
