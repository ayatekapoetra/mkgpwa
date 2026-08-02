# PRD Report Event History

## Informasi Dokumen

| Atribut | Nilai |
|---|---|
| Status | Draft |
| Tanggal | 2026-08-02 |
| Owner | TBD |
| Produk | MKG Mobile - Web Dashboard |
| Frontend | `nextjs` |
| Backend | `be` |
| Route frontend | `/laporan/event-history` |

## Ringkasan

Event History adalah laporan read-only untuk melihat akumulasi durasi event operasional setiap unit pada lokasi kerja dalam periode tertentu. Data berasal dari Daily Activity dan dikelompokkan menjadi kategori event tetap berdasarkan `kegiatan_id`.

Satu baris laporan mewakili satu kombinasi lokasi pit dan unit untuk seluruh tanggal dalam periode filter. Laporan tidak menampilkan kolom tanggal. Jika unit yang sama memiliki aktivitas pada beberapa tanggal dalam periode tersebut, seluruh durasinya dijumlahkan ke baris yang sama.

Laporan ditampilkan dalam tabel terpaginasikan di frontend `nextjs` dan dapat diunduh dalam format PDF serta Excel. Hasil tabel, PDF, dan Excel harus menggunakan sumber, filter, grain, mapping kegiatan, dan aturan perhitungan yang sama.

## Latar Belakang

Daily Activity mencatat interval kegiatan equipment dengan berbagai `kegiatan_id`. Informasi tersebut perlu diringkas menjadi kelompok event operasional agar user dapat mengetahui berapa jam setiap unit mengalami breakdown, tidak memiliki operator/driver, melakukan pengisian fuel, terdampak hujan, dan event lain selama periode terpilih.

Tanpa laporan khusus, user harus membaca item Daily Activity satu per satu dan menghitung selisih `finish_time` dengan `start_time` secara manual. Event History menghilangkan proses manual tersebut dan menyediakan hasil yang dapat digunakan di luar aplikasi melalui PDF dan Excel.

## Tujuan

- Menampilkan akumulasi durasi event per lokasi dan unit.
- Mengelompokkan Daily Activity ke kategori event bisnis yang telah ditetapkan.
- Memudahkan analisis hambatan operasional dalam periode tertentu.
- Menyediakan filter periode, lokasi, unit, dan shift.
- Menjamin konsistensi hasil antara tabel frontend, PDF, dan Excel.
- Menyediakan nilai durasi Excel sebagai angka agar dapat dihitung kembali.

## Sasaran Pengguna

- Tim operasional.
- Pengawas lapangan.
- Manajemen cabang dan site.
- Tim reporting atau analis operasional.
- User lain yang memiliki hak baca laporan Event History.

## Ruang Lingkup

- Halaman laporan Event History di frontend `nextjs`.
- Endpoint backend untuk list terpaginasikan.
- Endpoint backend untuk download PDF.
- Endpoint backend untuk download Excel.
- Agregasi data `ops_daily_activity` dan `ops_daily_activity_items`.
- Mapping `kegiatan_id` ke kategori Event History yang bersifat tetap.
- Filter berdasarkan periode `date_ops`, lokasi pit, equipment, dan shift.
- Pengamanan endpoint dengan autentikasi dan hak baca laporan.
- Dokumentasi kontrak data dan skenario pengujian.

## Di Luar Ruang Lingkup

- Create, edit, atau delete Daily Activity.
- Perubahan struktur tabel sumber.
- Perubahan master kegiatan, equipment, lokasi, atau shift.
- Konfigurasi mapping kategori melalui UI atau database.
- Filter kegiatan yang dapat dipilih user.
- Penggabungan atau koreksi interval item yang saling overlap.
- Pengurangan waktu istirahat atau aturan waktu lain di luar interval item.
- Rekonsiliasi Event History dengan Timesheet.
- Perubahan data sumber saat laporan dibuat atau diunduh.

## Sumber Data

Tabel header:

```text
ops_daily_activity
```

Tabel detail:

```text
ops_daily_activity_items
```

Relasi utama:

```text
ops_daily_activity.id
  -> ops_daily_activity_items.header_id
```

Kolom sumber utama:

| Kebutuhan | Tabel | Kolom |
|---|---|---|
| Tanggal operasi | `ops_daily_activity` | `date_ops` |
| Shift | `ops_daily_activity` | `shift_id` |
| ID lokasi | `ops_daily_activity` | `lokasi_pit_id` |
| Nama lokasi | `ops_daily_activity` | `lokasi_pit_nama` |
| Status header | `ops_daily_activity` | `aktif` |
| ID unit | `ops_daily_activity_items` | `equipment_id` |
| Kode unit | `ops_daily_activity_items` | `kdunit` |
| Kategori event | `ops_daily_activity_items` | `kegiatan_id` |
| Status aktivitas | `ops_daily_activity_items` | `status` |
| Waktu mulai | `ops_daily_activity_items` | `start_time` |
| Waktu selesai | `ops_daily_activity_items` | `finish_time` |
| Status sinkronisasi item | `ops_daily_activity_items` | `sync_status` |

## Data yang Diperhitungkan

Data yang masuk ke laporan harus memenuhi seluruh kondisi berikut:

1. `ops_daily_activity.aktif = 'Y'`.
2. `ops_daily_activity.date_ops` berada dalam periode filter secara inklusif.
3. Item memiliki `kegiatan_id` yang termasuk mapping Event History.
4. `ops_daily_activity_items.sync_status` bukan `DELETED`.

Untuk kompatibilitas data lama, `sync_status` bernilai `NULL` tetap dianggap aktif. Kondisi SQL yang digunakan secara konseptual adalah:

```sql
(i.sync_status IS NULL OR i.sync_status <> 'DELETED')
```

Seluruh nilai `status` item dapat diperhitungkan:

- `beroperasi`
- `standby`
- `breakdown`

Kolom `status` tidak menentukan kategori laporan. Kategori hanya ditentukan oleh `kegiatan_id`.

## Grain dan Aturan Pengelompokan

Satu baris Event History mewakili agregasi:

```text
lokasi pit + equipment/unit
```

Seluruh tanggal dan shift dalam periode filter digabungkan ke kelompok tersebut. Filter shift dapat membatasi data sumber, tetapi shift tidak menjadi bagian dari kolom atau grain hasil.

Konsekuensi grain:

1. Unit yang sama pada beberapa tanggal di lokasi yang sama menjadi satu baris.
2. Unit yang sama pada lokasi berbeda menjadi baris berbeda.
3. Banyak item dengan kategori sama pada unit dan lokasi yang sama dijumlahkan.
4. Perubahan pagination tidak boleh mengubah hasil agregasi.

Identitas utama pengelompokan menggunakan:

```text
location_key = lokasi_pit_id
equipment_key = equipment_id
```

ID disimpan sebagai string pada sumber dan harus dinormalisasi dengan `TRIM`. String kosong tidak boleh diperlakukan sebagai ID `0`.

### Fallback Identitas

Data historis dapat memiliki ID lokasi atau equipment yang kosong, tetapi masih memiliki snapshot nama/kode. Asumsi awal implementasi:

```text
location_key = lokasi_pit_id jika terisi,
               selain itu nama lokasi yang dinormalisasi

equipment_key = equipment_id jika terisi,
                selain itu kdunit yang dinormalisasi
```

Normalisasi fallback menggunakan trim dan perbandingan case-insensitive. Jika ID sama memiliki beberapa snapshot nama atau kode, data tetap menjadi satu kelompok berdasarkan ID dan backend memilih satu nilai display secara deterministik. Strategi pemilihan nilai display, misalnya nilai nonkosong maksimum atau snapshot terbaru, harus divalidasi saat implementasi terhadap data produksi.

Fallback ini merupakan asumsi teknis dan perlu dikonfirmasi melalui profiling data sebelum implementasi dinyatakan selesai.

## Mapping Kategori Event

Mapping berikut bersifat tetap dan tidak dapat diubah melalui filter frontend:

| Kolom Laporan | `kegiatan_id` yang Dihitung |
|---|---|
| `Breakdown` | `3`, `39` |
| `No Opr/Drv` | `77` |
| `Fuel` | `40`, `41`, `42`, `43`, `47`, `66`, `78`, `79`, `80`, `81` |
| `Hujan` | `45`, `68` |
| `Jalan Licin` | `46`, `65` |
| `Public` | `2`, `50` |
| `No Job` | `74` |
| `Arahan` | `1`, `48`, `67` |

Ketentuan penting:

- `kegiatan_id = 74` hanya dihitung pada kolom `No Job`.
- `kegiatan_id = 74` tidak dihitung pada kolom `No Opr/Drv`.
- `No Opr/Drv` hanya menghitung `kegiatan_id = 77`.
- Satu item hanya boleh masuk ke satu kategori berdasarkan mapping saat ini.
- Nilai `kegiatan_id` dinormalisasi sebagai string agar data varchar dan input numeric dapat dibandingkan secara konsisten.

## Perhitungan Durasi

Durasi setiap item dihitung dari:

```text
item_duration_seconds = finish_time - start_time
```

Perhitungan SQL konseptual:

```sql
CASE
  WHEN i.start_time IS NULL THEN 0
  WHEN i.finish_time IS NULL THEN 0
  WHEN i.finish_time < i.start_time THEN 0
  ELSE TIMESTAMPDIFF(SECOND, i.start_time, i.finish_time)
END
```

Aturan perhitungan:

1. Perhitungan dan agregasi internal menggunakan detik.
2. Durasi null atau interval terbalik menghasilkan `0`.
3. Interval dengan waktu mulai sama dengan waktu selesai menghasilkan `0`.
4. Durasi tidak boleh bernilai negatif.
5. Item overlap tetap dijumlahkan apa adanya dan tidak digabungkan.
6. Konversi ke jam dilakukan setelah seluruh item dalam kelompok dijumlahkan.
7. Pembulatan hanya dilakukan pada hasil akhir.

Rumus output:

```text
category_hours = category_total_seconds / 3600
```

Format output:

- Satuan jam desimal.
- Dua angka di belakang koma.
- Contoh: 90 menit ditampilkan sebagai `1.50`.
- Kategori tanpa durasi ditampilkan sebagai `0.00`.
- Nilai JSON dan Excel harus numeric, bukan string berformat.

## Definisi Kolom Laporan

| No | Kolom | Sumber/Perhitungan |
|---:|---|---|
| 1 | `No` | Nomor urut global hasil laporan |
| 2 | `Location` | `ops_daily_activity.lokasi_pit_nama` |
| 3 | `ID Unit` | `ops_daily_activity_items.kdunit` |
| 4 | `Breakdown` | Total jam kegiatan `3`, `39` |
| 5 | `No Opr/Drv` | Total jam kegiatan `77` |
| 6 | `Fuel` | Total jam kegiatan `40`, `41`, `42`, `43`, `47`, `66`, `78`, `79`, `80`, `81` |
| 7 | `Hujan` | Total jam kegiatan `45`, `68` |
| 8 | `Jalan Licin` | Total jam kegiatan `46`, `65` |
| 9 | `Public` | Total jam kegiatan `2`, `50` |
| 10 | `No Job` | Total jam kegiatan `74` |
| 11 | `Arahan` | Total jam kegiatan `1`, `48`, `67` |

Tidak ada kolom tanggal dan shift pada hasil laporan.

## Filter

### Filter Wajib

1. `startdate`: tanggal awal berdasarkan `ops_daily_activity.date_ops`.
2. `enddate`: tanggal akhir berdasarkan `ops_daily_activity.date_ops`.

Frontend mengisi nilai default:

```text
startdate = tanggal 1 pada bulan berjalan
enddate = tanggal hari ini
```

Rentang tanggal bersifat inklusif.

### Filter Opsional

1. `lokasi_ids`: multi-select lokasi pit.
2. `equipment_ids`: multi-select equipment/unit.
3. `shift_ids`: multi-select shift.

Tanpa pilihan pada filter opsional berarti seluruh nilai dalam periode ikut diperhitungkan.

### Pagination

1. `page`: halaman aktif, default `1`.
2. `perPage`: jumlah baris per halaman, default `25`.
3. Backend perlu menetapkan batas maksimum `perPage`, direkomendasikan `500`.
4. Parameter pagination diabaikan oleh endpoint download.

Filter multi-select dapat diterima sebagai array atau comma-separated string pada service, sedangkan query HTTP frontend mengirim comma-separated IDs.

## Urutan Data dan Nomor Laporan

Urutan default harus deterministik:

```text
location_name ASC,
equipment_code ASC,
location_key ASC,
equipment_key ASC
```

ID digunakan sebagai tie-breaker agar pagination stabil ketika nama lokasi atau kode unit sama.

Nomor urut list dihitung menggunakan:

```text
no = ((page - 1) * perPage) + row_index + 1
```

Pada PDF dan Excel, nomor dimulai dari `1` dan berlanjut sampai seluruh hasil selesai.

## Kontrak API

Semua endpoint membutuhkan Bearer token dan hak baca Event History.

### List Event History

- Method: `GET`
- Backend URL: `/api/laporan/event-history/list`
- Path dari API helper frontend: `/laporan/event-history/list`
- Content-Type: `application/json`

### Download PDF

- Method: `GET`
- Backend URL: `/api/laporan/event-history/download/pdf`
- Path dari API helper frontend: `/laporan/event-history/download/pdf`
- Output: binary PDF
- Content-Type: `application/pdf`

### Download Excel

- Method: `GET`
- Backend URL: `/api/laporan/event-history/download/excel`
- Path dari API helper frontend: `/laporan/event-history/download/excel`
- Output: binary XLSX
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### Query Parameters

| Name | Type | Required | Default | Contoh | Keterangan |
|---|---|---:|---|---|---|
| `startdate` | date string | Yes | Awal bulan di frontend | `2026-08-01` | Tanggal awal `date_ops` |
| `enddate` | date string | Yes | Hari ini di frontend | `2026-08-02` | Tanggal akhir `date_ops` |
| `lokasi_ids` | comma-separated string | No | Semua | `10,11` | ID lokasi pit |
| `equipment_ids` | comma-separated string | No | Semua | `20,21` | ID equipment |
| `shift_ids` | comma-separated string | No | Semua | `1,2` | ID shift |
| `page` | integer | No | `1` | `2` | Halaman list |
| `perPage` | integer | No | `25` | `50` | Jumlah baris list |

Endpoint PDF dan Excel menerima filter yang sama, tetapi mengabaikan `page` dan `perPage`.

## Format Response List

Response mengikuti envelope laporan yang sudah digunakan project:

```json
{
  "diagnostic": {
    "ver": 3.0,
    "error": false
  },
  "rows": {
    "total": 2,
    "perPage": 25,
    "page": 1,
    "lastPage": 1,
    "data": [
      {
        "no": 1,
        "location_id": "10",
        "location_name": "Pit Utara",
        "equipment_id": "20",
        "equipment_code": "DT-001",
        "breakdown": 1.50,
        "no_operator_driver": 0.50,
        "fuel": 0.75,
        "hujan": 2.00,
        "jalan_licin": 0.00,
        "public": 0.25,
        "no_job": 1.00,
        "arahan": 0.50
      },
      {
        "no": 2,
        "location_id": "10",
        "location_name": "Pit Utara",
        "equipment_id": "21",
        "equipment_code": "DT-002",
        "breakdown": 0.00,
        "no_operator_driver": 0.00,
        "fuel": 0.50,
        "hujan": 2.00,
        "jalan_licin": 1.00,
        "public": 0.00,
        "no_job": 0.50,
        "arahan": 0.25
      }
    ]
  }
}
```

Nama properti response bersifat kontrak awal dan harus digunakan konsisten oleh list, PDF, dan Excel.

## Struktur Query Backend

Query harus melakukan agregasi langsung pada sumber Daily Activity sesuai grain laporan. Join ke tabel master tidak diperlukan untuk perhitungan utama karena nama lokasi dan kode unit tersedia sebagai snapshot.

Pola SQL konseptual:

```sql
SELECT
  normalized_location_key,
  normalized_equipment_key,
  deterministic_location_name,
  deterministic_equipment_code,
  SUM(CASE WHEN kegiatan_id IN ('3', '39') THEN safe_duration_seconds ELSE 0 END) AS breakdown_seconds,
  SUM(CASE WHEN kegiatan_id IN ('77') THEN safe_duration_seconds ELSE 0 END) AS no_operator_driver_seconds,
  SUM(CASE WHEN kegiatan_id IN ('40', '41', '42', '43', '47', '66', '78', '79', '80', '81') THEN safe_duration_seconds ELSE 0 END) AS fuel_seconds,
  SUM(CASE WHEN kegiatan_id IN ('45', '68') THEN safe_duration_seconds ELSE 0 END) AS hujan_seconds,
  SUM(CASE WHEN kegiatan_id IN ('46', '65') THEN safe_duration_seconds ELSE 0 END) AS jalan_licin_seconds,
  SUM(CASE WHEN kegiatan_id IN ('2', '50') THEN safe_duration_seconds ELSE 0 END) AS public_seconds,
  SUM(CASE WHEN kegiatan_id IN ('74') THEN safe_duration_seconds ELSE 0 END) AS no_job_seconds,
  SUM(CASE WHEN kegiatan_id IN ('1', '48', '67') THEN safe_duration_seconds ELSE 0 END) AS arahan_seconds
FROM ops_daily_activity h
INNER JOIN ops_daily_activity_items i ON i.header_id = h.id
WHERE h.aktif = 'Y'
  AND (i.sync_status IS NULL OR i.sync_status <> 'DELETED')
  AND h.date_ops BETWEEN :startdate AND :enddate
GROUP BY normalized_location_key, normalized_equipment_key;
```

`safe_duration_seconds` menggunakan aturan timestamp null/terbalik bernilai nol. Contoh di atas hanya menunjukkan bentuk query, bukan SQL final yang dapat langsung dijalankan.

Ketentuan teknis query:

1. Gunakan parameter binding untuk seluruh filter.
2. Jangan melakukan interpolasi langsung nilai query parameter.
3. Normalisasi `kegiatan_id`, lokasi, equipment, dan shift secara aman.
4. Jangan melakukan join one-to-many tambahan sebelum agregasi karena dapat menggandakan durasi.
5. Jika nama master dibutuhkan untuk filter, gunakan subquery atau join yang dijamin one-to-one.
6. Count pagination harus dihitung dari jumlah kelompok final, bukan jumlah item sumber.
7. Pagination dilakukan oleh database, bukan dengan mengambil seluruh row ke memory.
8. Export menggunakan query agregasi yang sama tanpa limit dan offset.

## Arsitektur Backend

Lokasi implementasi yang direncanakan:

```text
be/app/Controllers/Http/laporan/EventHistoryController.js
be/app/Services/Laporan/EventHistoryServices.js
be/start/routes.js
```

Tanggung jawab controller:

- Meneruskan query parameter ke service.
- Mengembalikan envelope JSON untuk list.
- Mengirim binary PDF dan Excel dengan header yang benar.
- Mengembalikan status HTTP sesuai jenis error.

Tanggung jawab service:

- Parsing multi-select.
- Validasi tanggal dan pagination.
- Menyusun query agregasi.
- Serialisasi detik menjadi jam desimal.
- Menyediakan data list dan seluruh data export.
- Membuat PDF dan Excel.

## Arsitektur Frontend

File baru yang direncanakan:

```text
nextjs/src/app/(dashboard)/laporan/event-history/page.js
nextjs/src/views/laporan/event-history/index.js
nextjs/src/views/laporan/event-history/filter.js
nextjs/src/views/laporan/event-history/list.js
nextjs/src/api/event-history.js
```

Implementasi mengikuti pola Operating History:

1. App Router page hanya merender screen Event History.
2. Screen menyimpan state filter, pagination, drawer, dan proses download.
3. API helper menangani serialisasi query, SWR list, dan binary download.
4. Filter menggunakan `SwipeableDrawer`.
5. Tabel menggunakan MUI Table dan pagination project.
6. Download menggunakan response blob dari backend.
7. Export tidak dibuat dari data halaman aktif di browser.

## State Frontend

State minimum:

```js
{
  page: 1,
  perPage: 25,
  startdate: '<awal bulan berjalan>',
  enddate: '<tanggal hari ini>',
  lokasi_ids: [],
  equipment_ids: [],
  shift_ids: []
}
```

Perubahan filter mengembalikan `page` ke `1`. Reset filter mengembalikan periode default dan mengosongkan seluruh filter opsional.

## Struktur Halaman dan UX

Halaman menggunakan komponen dan visual language laporan existing:

- `MainCard` sebagai container.
- Judul `Event History`.
- Tombol download PDF.
- Tombol download Excel.
- Tombol filter.
- `SwipeableDrawer` untuk filter.
- MUI Table dengan sticky header.
- Pagination backend.
- Loading state dan empty state.
- Snackbar untuk hasil download.

Aturan responsif:

1. Drawer menggunakan lebar penuh pada layar kecil dan lebar tetap pada desktop.
2. Tabel mendukung horizontal scroll.
3. Kolom `Location` dan `ID Unit` tetap mudah dibaca.
4. Kolom durasi menggunakan alignment kanan dan angka tabular.
5. Tombol tetap memiliki accessible label dan tooltip.

## Download PDF

PDF harus memuat:

1. Branding atau logo perusahaan sesuai pola laporan existing.
2. Judul `Event History`.
3. Periode laporan.
4. Ringkasan filter lokasi, equipment, dan shift yang aktif.
5. Total baris hasil.
6. Waktu generate laporan.
7. Seluruh data sesuai filter tanpa pagination.
8. Semua kolom dalam urutan yang sama dengan tabel frontend.

PDF menggunakan orientasi landscape.

Nama file:

```text
report-event-history-<start>-to-<end>.pdf
```

Jika data kosong, PDF tetap dapat dibuat dan menampilkan informasi bahwa data tidak tersedia.

## Download Excel

Excel harus memuat:

1. Judul laporan.
2. Periode laporan.
3. Ringkasan filter aktif.
4. Header kolom sesuai tabel frontend.
5. Seluruh data sesuai filter tanpa pagination.
6. Nilai kategori durasi sebagai numeric cell.
7. Format tampilan angka dua desimal.

Nama file:

```text
report-event-history-<start>-to-<end>.xlsx
```

Excel tidak boleh hanya mengekspor data halaman yang sedang ditampilkan.

## Menu, Autentikasi, dan Otorisasi

- Event History ditempatkan sebagai submenu pada grup Report/Laporan.
- Halaman frontend membutuhkan session/token yang valid.
- Endpoint list, PDF, dan Excel membutuhkan Bearer token.
- Backend harus memeriksa hak baca Event History sesuai mekanisme akses menu project.
- Hak baca yang sama berlaku untuk list dan download, kecuali tersedia permission download terpisah di masa depan.
- Menyembunyikan menu di frontend bukan kontrol keamanan.
- User tanpa hak baca tidak boleh memperoleh data dengan memanggil endpoint secara langsung.

## Validasi

Backend harus memvalidasi:

1. `startdate` wajib dan menggunakan format `YYYY-MM-DD` yang valid.
2. `enddate` wajib dan menggunakan format `YYYY-MM-DD` yang valid.
3. `startdate` tidak boleh lebih besar daripada `enddate`.
4. `page` harus berupa integer positif.
5. `perPage` harus berupa integer positif dalam batas maksimum.
6. Multi-select ID harus dinormalisasi dan nilai kosong diabaikan.
7. Input filter tidak boleh dapat mengubah struktur query SQL.

Frontend harus mencegah pemilihan tanggal akhir sebelum tanggal awal dan menampilkan error backend secara informatif.

## Error Handling

- Input tidak valid menghasilkan HTTP `400` dan diagnostic error.
- User belum terautentikasi menghasilkan HTTP `401`.
- User tidak memiliki hak baca menghasilkan HTTP `403`.
- Error internal menghasilkan HTTP `500` tanpa membocorkan SQL atau stack trace.
- List tanpa data mengembalikan `data: []` dengan metadata pagination valid.
- Download tanpa data tetap menghasilkan file valid dengan keterangan `Tidak ada data`.
- Error download berbentuk blob harus tetap dapat dibaca frontend sebagai pesan JSON/text.
- Timeout download mengikuti pola laporan existing dengan batas yang memadai.

Contoh error:

```json
{
  "diagnostic": {
    "ver": 3.0,
    "error": true,
    "message": "startdate tidak boleh lebih besar daripada enddate"
  },
  "rows": null
}
```

## Pertimbangan Performa

- Agregasi dan pagination dilakukan di database.
- Filter tanggal diterapkan sebelum agregasi.
- Hanya `kegiatan_id` yang termasuk mapping Event History yang perlu diproses.
- Hindari fungsi yang tidak diperlukan pada kolom filter berindeks.
- Gunakan urutan deterministik setelah agregasi.
- Query list dan export harus memakai implementasi sumber yang sama untuk mencegah perbedaan hasil.
- Kebutuhan index perlu diverifikasi menggunakan `EXPLAIN` pada data representatif.

Index yang perlu dievaluasi, bukan otomatis diwajibkan oleh fitur ini:

```text
ops_daily_activity(date_ops, aktif, lokasi_pit_id, shift_id)
ops_daily_activity_items(header_id, kegiatan_id, equipment_id, sync_status)
```

Penambahan atau perubahan index harus diputuskan berdasarkan skema aktual, volume data, dan query plan produksi.

## Observability dan Logging

Backend dapat mencatat metadata berikut:

- Nama laporan.
- User ID atau correlation ID.
- Periode laporan.
- Jumlah filter yang dipilih.
- Jumlah hasil.
- Durasi eksekusi query.
- Jenis output list, PDF, atau Excel.
- Status sukses atau gagal.

Log tidak boleh memuat seluruh payload row, catatan operasional, token, binary file, atau informasi sensitif lain yang tidak dibutuhkan untuk diagnosis.

## Konsistensi Data

List, PDF, dan Excel harus menggunakan:

- Filter yang sama.
- Kondisi data aktif yang sama.
- Grain yang sama.
- Mapping `kegiatan_id` yang sama.
- Aturan durasi aman yang sama.
- Pembulatan yang sama.
- Urutan kolom yang sama.

Jika data sumber berubah di antara request list dan download, hasil dapat berbeda karena laporan tidak menggunakan snapshot transaksi lintas request. Kondisi tersebut diterima sebagai perilaku laporan real-time.

## Kriteria Penerimaan Backend

1. Endpoint list mengembalikan agregasi per lokasi dan unit.
2. Seluruh tanggal dalam periode dijumlahkan menjadi satu baris untuk lokasi dan unit yang sama.
3. Unit yang sama pada lokasi berbeda menghasilkan baris berbeda.
4. Hanya header aktif dan item yang bukan `DELETED` yang dihitung.
5. Item dengan `sync_status = NULL` tetap dihitung.
6. Semua status item dapat dihitung selama `kegiatan_id` sesuai mapping.
7. Mapping kategori mengikuti tabel PRD tanpa tambahan kegiatan lain.
8. `kegiatan_id = 74` hanya dihitung pada `No Job`.
9. `kegiatan_id = 77` hanya dihitung pada `No Opr/Drv`.
10. Timestamp null atau terbalik menghasilkan durasi nol.
11. Durasi dihitung dalam detik dan dikonversi setelah agregasi.
12. Nilai jam dikembalikan sebagai numeric dengan presisi dua desimal.
13. Filter tanggal, lokasi, equipment, dan shift bekerja sesuai kontrak.
14. Pagination dihitung dari kelompok final.
15. Nomor urut stabil dan berlanjut antarhalaman.
16. Query menggunakan parameter binding.
17. Endpoint dilindungi autentikasi dan hak baca.

## Kriteria Penerimaan Frontend

1. Halaman dapat dibuka di `/laporan/event-history`.
2. Default periode adalah awal bulan berjalan sampai hari ini.
3. User dapat memilih periode, location, ID Unit, dan shift.
4. Filter location, ID Unit, dan shift mendukung multi-select.
5. Perubahan filter mengembalikan halaman ke `1`.
6. Tabel menampilkan seluruh sebelas kolom sesuai urutan PRD.
7. Kategori tanpa nilai ditampilkan sebagai `0.00`.
8. Loading, empty, error, dan download state ditampilkan dengan jelas.
9. Pagination menggunakan metadata backend.
10. Tabel tetap dapat digunakan pada desktop dan mobile.
11. Tombol PDF dan Excel meneruskan seluruh filter aktif.
12. Menu hanya ditampilkan kepada user yang sesuai mekanisme akses project.

## Kriteria Penerimaan Export

1. PDF dan Excel memuat seluruh hasil filter, bukan hanya halaman aktif.
2. Urutan baris export konsisten dengan list.
3. Nomor pada export dimulai dari `1`.
4. PDF menggunakan orientasi landscape.
5. PDF memuat judul, periode, filter, total data, dan waktu generate.
6. Excel menyimpan seluruh durasi sebagai numeric cell.
7. PDF dan Excel tetap valid ketika hasil kosong.
8. Nama file mengikuti format yang ditentukan.
9. Total kategori pada export dapat direkonsiliasi dengan list untuk filter yang sama.

## Skenario Pengujian Minimum

| No | Skenario | Hasil yang Diharapkan |
|---:|---|---|
| 1 | Satu item untuk setiap mapping kegiatan | Durasi masuk ke kolom yang tepat |
| 2 | `kegiatan_id = 74` | Hanya menambah `No Job` |
| 3 | `kegiatan_id = 77` | Hanya menambah `No Opr/Drv` |
| 4 | Kegiatan di luar mapping | Item tidak memengaruhi laporan |
| 5 | Unit dan lokasi sama pada beberapa tanggal | Seluruh durasi menjadi satu baris |
| 6 | Unit sama pada dua lokasi | Menghasilkan dua baris |
| 7 | Banyak item kategori sama | Durasi dijumlahkan tanpa kehilangan item |
| 8 | Status `beroperasi`, `standby`, dan `breakdown` | Seluruhnya dapat dihitung |
| 9 | Header `aktif = 'N'` | Data tidak dihitung |
| 10 | Item `sync_status = 'DELETED'` | Data tidak dihitung |
| 11 | Item `sync_status = NULL` | Data tetap dihitung |
| 12 | `start_time` null | Durasi item nol |
| 13 | `finish_time` null | Durasi item nol |
| 14 | `finish_time < start_time` | Durasi item nol dan tidak negatif |
| 15 | Waktu mulai sama dengan waktu selesai | Durasi item nol |
| 16 | Dua interval overlap | Keduanya dijumlahkan apa adanya |
| 17 | Filter periode batas awal dan akhir | Kedua tanggal batas ikut dihitung |
| 18 | Filter location multi-select | Hanya lokasi terpilih muncul |
| 19 | Filter equipment multi-select | Hanya unit terpilih muncul |
| 20 | Filter shift multi-select | Hanya item dari header shift terpilih dihitung |
| 21 | ID berupa string dengan whitespace | ID dinormalisasi secara konsisten |
| 22 | ID kosong tetapi snapshot tersedia | Fallback grouping berjalan deterministik |
| 23 | ID sama dengan snapshot nama/kode berbeda | Tetap satu kelompok dengan display deterministik |
| 24 | Nama/kode sama tetapi ID berbeda | Kelompok tetap mengikuti ID utama |
| 25 | Dua baris memiliki nama dan kode sama | Tie-breaker ID menjaga pagination stabil |
| 26 | Halaman kedua | Nomor melanjutkan halaman pertama |
| 27 | `startdate > enddate` | Backend mengembalikan HTTP 400 |
| 28 | Request tanpa autentikasi | Backend mengembalikan HTTP 401 |
| 29 | User tanpa hak baca | Backend mengembalikan HTTP 403 |
| 30 | Hasil filter kosong | List dan metadata valid, export tetap dapat dibuat |
| 31 | Download dengan filter aktif | PDF dan Excel hanya memuat hasil filter tersebut |
| 32 | Dataset lebih dari satu halaman | Export memuat seluruh baris |
| 33 | Durasi di Excel | Cell bertipe numeric dan dapat dijumlahkan |
| 34 | Rekonsiliasi list dan export | Total setiap kategori sama untuk filter yang sama |
| 35 | Data mapping `74` dan `77` pada unit sama | Masing-masing masuk kolom berbeda tanpa duplikasi |

## Dependensi

- Endpoint lookup lokasi, equipment, dan shift yang sudah tersedia di project.
- Middleware autentikasi backend.
- Mekanisme menu dan permission user.
- Library pembuat PDF dan Excel yang sudah digunakan laporan existing.
- Kualitas snapshot `lokasi_pit_nama` dan `kdunit` pada data Daily Activity.

Tidak diperlukan dependency frontend baru jika implementasi mengikuti pola Operating History.

## Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Interval overlap | Durasi kategori dapat lebih besar dari waktu aktual | Dokumentasikan bahwa item dijumlahkan apa adanya; perbaikan overlap di luar scope |
| ID kosong atau snapshot tidak konsisten | Pengelompokan atau label dapat ambigu | Profiling data dan fallback deterministik |
| Mapping kegiatan berubah | Hasil laporan tidak mengikuti definisi bisnis terbaru | Perubahan mapping harus melalui perubahan PRD dan test |
| Dataset besar | List atau export lambat | Agregasi/pagination database, evaluasi index, timeout export |
| Perbedaan query list dan export | Angka tidak konsisten | Gunakan satu query builder dan serializer bersama |
| Permission hanya diterapkan di menu | Data dapat diakses langsung | Terapkan authorization pada seluruh endpoint backend |
| Pembulatan per item | Total memiliki selisih | Bulatkan hanya setelah agregasi detik selesai |

## Rencana Implementasi

1. Profiling read-only data sumber untuk memvalidasi fallback ID dan snapshot.
2. Implementasi service query dan serializer backend.
3. Implementasi controller dan route list/PDF/Excel.
4. Tambahkan unit dan functional test backend.
5. Implementasi API helper frontend.
6. Implementasi route, screen, filter, dan tabel frontend.
7. Integrasi submenu dan permission.
8. Verifikasi responsif desktop/mobile.
9. Rekonsiliasi hasil tabel, PDF, dan Excel menggunakan dataset yang sama.
10. Uji performa query dan export pada volume data representatif.

## Asumsi dan Keputusan Terbuka

Asumsi yang telah disepakati:

- Grain laporan adalah lokasi dan unit untuk seluruh periode.
- Semua status item dapat dihitung.
- Durasi menggunakan jam desimal dua angka.
- Mapping kegiatan bersifat tetap.
- `No Opr/Drv` hanya menggunakan kegiatan `77`.
- `No Job` hanya menggunakan kegiatan `74`.

Keputusan yang perlu divalidasi saat implementasi:

1. Strategi display ketika satu ID memiliki beberapa snapshot nama/kode.
2. Kualitas dan jumlah data dengan ID lokasi/equipment kosong.
3. Batas maksimum periode laporan dan `perPage` berdasarkan performa aktual.
4. Nama permission/menu backend yang digunakan untuk hak baca Event History.
5. Index tambahan yang benar-benar diperlukan berdasarkan hasil `EXPLAIN`.

Perubahan keputusan terbuka yang memengaruhi grain, mapping, atau perhitungan durasi harus memperbarui PRD dan skenario pengujian sebelum fitur dirilis.
