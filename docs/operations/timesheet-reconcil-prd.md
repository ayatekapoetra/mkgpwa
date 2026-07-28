## Timesheet Reconcil PRD

### Tujuan
- Menampilkan hasil rekonsiliasi insentif karyawan berbasis data timesheet.
- Memudahkan filter berdasarkan rentang tanggal dan karyawan (OptionOperatorDriver).
- Menyajikan tabel nested (row utama + detail items) yang informatif dan dapat scroll horizontal.

### Lokasi & Akses
- URL: `/timesheet-reconcil` (web, localhost:3005/timesheet-reconcil).

### Sumber Data
- Endpoint: `POST /api/operation/timesheet/reconcil`.
- Body (disarankan): `{ startDate: string, endDate: string, karyawan_id?: number }`.
- Response contoh: objek dengan `rows` (array) berisi field utama (earning, waktu, status) dan `items` (rinci per aktivitas).

### Filter (Header)
- Date range picker: `startDate` & `endDate` (default 7 hari terakhir). Validasi start <= end. Tabel baru ditampilkan hanya setelah kedua tanggal terisi dan tombol `Terapkan` diklik.
- Selector karyawan: OptionOperatorDriver (dengan pencarian). Jika backend mewajibkan karyawan, tampilkan error banner ketika respon `diagnostic.error` muncul (lihat di bawah).
- Tombol aksi: `Terapkan` untuk fetch, `Reset` untuk mengosongkan filter ke default.

### Tabel & Visual
- Struktur: satu baris per `row` (timesheet reconciled). Setiap baris dapat di-expand untuk menampilkan `items` terkait.
- Kolom utama (contoh prioritas): Tanggal (date_ops), Karyawan, Start-End, SMU start/finish/used, Istirahat, Lembur, Jam Kerja, Earning (kerja, lembur, bonus ages/tipes/tools), Total Trip, Grand Total, Narasi, Status (iserr/errmsg).
- Nested items: tampilkan rincian per aktivitas (kegiatan, alat, lokasi, durasi, earning per item). Format ringkas, grid 2 kolom jika lebar cukup.
- Styling: modern, gunakan accent biru/teal, badge status, chip untuk narasi/err, zebra row, hover highlight, expandable caret animasi, monospace untuk angka.
- Scroll horizontal: bungkus tabel dalam container dengan overflow-x auto + sticky header (kolom judul tetap saat scroll horizontal).
- Ringkasan/Info: tampilkan total bar (jumlah rows, total grand earning) di atas tabel.

### States
- Loading: skeleton row atau spinner di area tabel.
- Empty: kartu “Tidak ada data” dengan ilustrasi sederhana.
- Error: banner merah dengan pesan dari backend; tombol coba lagi. Khusus error karyawan wajib (contoh respon `diagnostic.error: "Karyawan harus ditentukan..."`), tampilkan peringatan dan highlight field karyawan.

### Format & Utility
- Angka uang: format rupiah dengan pemisah ribuan; 2 desimal jika nilai bukan bilangan bulat.
- Jam/tanggal: gunakan timezone lokal; tampilkan `date_ops` sebagai tanggal, `starttime`-`endtime` sebagai jam HH:mm.
- Status: `iserr === 'A'` hijau (“Valid”), selain itu merah/kuning; jika `errmsg` ada, tampilkan tooltip/label kecil.

### Interaksi
- Expand/collapse per baris (klik caret atau baris). Hanya satu terbuka sekaligus opsional; default tertutup.
- Refresh manual: tombol di header atau pull-to-refresh (opsional) memicu fetch ulang.

### Non-Functional
- Performa: gunakan pagination atau limit jika backend mendukung; default limit mis. 50.
- Responsif: desktop utama; mobile/tablet tetap bisa scroll horizontal tabel.
- Keamanan: selalu kirim Authorization bearer token (ambil dari penyimpanan yang sudah ada di app).
