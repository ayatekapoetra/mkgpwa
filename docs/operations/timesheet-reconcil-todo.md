## TODO Timesheet Reconcil

1) Routing & kerangka halaman
- Tambah route `/timesheet-reconcil` (page + layout jika perlu) di Next.js.
- Siapkan state filter (startDate, endDate, karyawan_id) + default range 7 hari.

2) Integrasi data
- Buat service/fetcher `POST /api/operation/timesheet/reconcil` (body: startDate, endDate, karyawan_id optional).
- Pastikan Authorization bearer token terikut dari mekanisme global (interceptor/fetch wrapper).
- Tambah handling loading, error, empty.

3) Header filter
- Pasang date range picker (dua input tanggal) + validasi start <= end.
- Pasang OptionOperatorDriver untuk pilih karyawan (nullable).
- Tombol Terapkan (trigger fetch) & Reset (kembali ke default range & clear karyawan).

4) Tabel nested
- Container tabel dengan overflow-x auto + sticky header.
- Baris utama memuat kolom: Tanggal, Karyawan, Start-End, SMU start/finish/used, Istirahat, Lembur, Jam Kerja, Earning (kerja/OT/bonus ages/tipes/tools), Total Trip, Grand Total, Narasi, Status.
- Tambahkan summary bar (jumlah rows, total grand earning) di atas tabel.
- Expand/collapse per baris menampilkan `items`: kegiatan, alat, lokasi, durasi, earning item, kode, overtime, insentif; gaya grid 2 kolom.

5) UI/UX
- Styling modern (accent biru/teal), badge status, chip narasi/err, zebra row, hover highlight, caret animasi untuk expand.
- Format rupiah & angka, format waktu HH:mm, tanggal lokal, monospace untuk angka.
- Empty state ilustratif, error banner dengan retry, skeleton/spinner untuk loading.

6) Testing cepat
- Kasus sukses dengan data contoh (3 rows, items nested).
- Kasus empty (backend rows=[]).
- Kasus error 401/500: pastikan pesan tampil dan retry jalan.
- Scroll horizontal berfungsi di desktop dan mobile.

7) Dokumentasi
- Update README/CHANGELOG jika diperlukan untuk rilis fitur.
