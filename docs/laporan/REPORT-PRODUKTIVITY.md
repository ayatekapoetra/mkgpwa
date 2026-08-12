# PRD Report Productivity

## Informasi Dokumen

| Atribut | Nilai |
|---|---|
| Status | Draft |
| Tanggal | 2026-08-12 |
| Owner | TBD |
| Produk | MKG Mobile - Web Dashboard |
| Frontend | `nextjs` |
| Backend | `be` |
| Route frontend | `/laporan/productivity` |

## Ringkasan

Productivity adalah laporan read-only yang menampilkan ringkasan produktivitas equipment per penyewa dalam periode tertentu. Laporan menggabungkan identitas baris (penyewa, unit, type), metrik operasional (HM/KM, standby, opportunity), dan metrik KPI maintenance (PA, MA, UA, EU, MTTFS, MTTR, MTBS, MTBF) dalam satu tabel.

Laporan dibangun secara bertahap menggunakan arsitektur **Base + Metric Endpoints**. Endpoint base menyediakan identitas baris dan pagination. Endpoint metrik terpisah menyediakan nilai per kolom secara bertahap. Frontend menggabungkan hasil berdasarkan `row_key` stabil yang dikembalikan oleh endpoint base.

Pada tahap awal, frontend hanya menampilkan visualisasi dengan data dummy. Endpoint backend akan dihubungkan bertahap dimulai dari endpoint base, lalu HM/KM, standby, opportunity, dan terakhir KPI maintenance. Kolom yang belum memiliki endpoint tetap menampilkan `0.00`.

## Latar Belakang

Operasional rental equipment memerlukan visibilitas produktivitas per unit per penyewa. Saat ini, data durasi event tersebar di Daily Activity, Daily Breakdown, dan Timesheet. Tanpa laporan khusus, user harus mengakses beberapa layanan dan menghitung manual untuk mendapatkan HM/KM, standby, opportunity, dan indikator maintenance.

Productivity menyatukan metrik tersebut dalam satu tabel per penyewa + equipment. Metrik ditambahkan bertahap agar setiap kolom dapat divalidasi secara independen tanpa mengubah identitas baris atau merusak integrasi frontend yang sudah berjalan.

## Tujuan

- Menampilkan identitas baris (no, penyewa, id unit, type) menggunakan sumber yang sama dengan Event History.
- Menampilkan HM/KM, standby, dan opportunity secara bertahap melalui endpoint terpisah.
- Menyediakan placeholder `0.00` untuk kolom KPI maintenance hingga sumber datanya disepakati.
- Menjamin konsistensi identitas baris antar endpoint melalui `row_key` stabil.
- Memungkinkan penambahan kolom metrik baru tanpa mengubah endpoint base atau merusak frontend.
- Menyediakan filter periode, lokasi, equipment, dan shift.

## Sasaran Pengguna

- Tim operasional.
- Pengawas lapangan.
- Manajemen cabang dan site.
- Tim reporting atau analis operasional.
- Tim maintenance.
- User lain yang memiliki hak baca laporan Productivity.

## Ruang Lingkup

- Halaman laporan Productivity di frontend `nextjs`.
- Endpoint backend base untuk identitas baris terpaginasikan.
- Endpoint backend metrik (HM/KM, standby, opportunity) yang ditambahkan bertahap.
- Endpoint backend download PDF dan Excel (ditambahkan setelah seluruh metrik utama selesai).
- Agregasi data dari `ops_daily_activity`, `ops_daily_activity_items`, `ops_daily_breakdown`, `ops_daily_timesheet`, dan `mas_equipment`.
- Filter berdasarkan periode, lokasi, equipment, dan shift.
- Pengamanan endpoint dengan autentikasi.
- Dokumentasi kontrak data dan skenario pengujian.

## Di Luar Ruang Lingkup

- Create, edit, atau delete data sumber.
- Perubahan struktur tabel sumber.
- Perubahan master kegiatan, equipment, lokasi, atau shift.
- Konfigurasi mapping kategori melalui UI atau database.
- Perhitungan KPI maintenance (PA, MA, UA, EU, MTTFS, MTTR, MTBS, MTBF) pada tahap awal.
- Penggabungan atau koreksi interval item yang saling overlap.
- Rekonsiliasi Productivity dengan Timesheet.
- Perubahan data sumber saat laporan dibuat atau diunduh.

## Sumber Data

### Sumber Identitas Baris

Identitas baris (no, penyewa, id unit, type) menggunakan sumber yang sama dengan Event History:

| Kebutuhan | Tabel | Kolom | Catatan |
|---|---|---|---|
| ID penyewa | `ops_daily_activity` / `ops_daily_breakdown` / `ops_daily_timesheet` | `lokasi_site_id` / `penyewa_id` | Resolusi prioritas mengikuti Event History |
| Nama penyewa | `mas_pelanggans` | `nama` | Fallback ke snapshot nama jika ID kosong |
| ID equipment | `ops_daily_activity_items` / `ops_daily_breakdown` / `ops_daily_timesheet` | `equipment_id` | ID master, bukan kode |
| Kode equipment | `ops_daily_activity_items.kdunit` / `mas_equipment.kode` | - | Fallback ke snapshot jika ID kosong |
| Type equipment | `mas_equipment` | `tipe` | Join via `mas_equipment.id = equipment_id` |

### Sumber Metrik (Tahap Berikutnya)

| Kolom | Sumber Kandidat | Tabel | Catatan |
|---|---|---|---|
| HM/KM | `hmkm_end - hmkm_start` | `ops_daily_breakdown` | Field `hmkm_start` dan `hmkm_end` tersedia di breakdown |
| HM/KM (alternatif) | `smufinish - smustart` | `ops_daily_timesheet` | Operating History menggunakan `MAX(smufinish)` |
| Standby | `kegiatan.subctg = 'standby'` | `ops_daily_timesheet_items` + `mas_kegiatan` | Durasi item dengan subctg standby |
| Standby (alternatif) | `status = 'standby'` | `ops_daily_activity_items` | Status item Daily Activity |
| Opportunity | Event History categories | `ops_daily_activity` + `ops_daily_breakdown` | Rumus menjumlahkan kategori positif dan mengurangi negatif |

### Tabel Master

| Tabel | Kolom Penting | Penggunaan |
|---|---|---|
| `mas_equipment` | `id`, `kode`, `tipe` | Identitas type equipment |
| `mas_pelanggans` | `id`, `nama` | Identitas penyewa |
| `mas_lokasikerja` | `id`, `nama` | Filter lokasi |
| `mas_shift` | `id`, `nama` | Filter shift |
| `mas_kegiatan` | `id`, `subctg` | Klasifikasi standby |

## Grain dan Aturan Pengelompokan

Satu baris Productivity mewakili agregasi:

```text
penyewa + equipment
```

Grain ini sama dengan implementasi Event History saat ini. Seluruh tanggal dan shift dalam periode filter digabungkan ke kelompok tersebut.

Konsekuensi grain:

1. Unit yang sama pada beberapa tanggal untuk penyewa yang sama menjadi satu baris.
2. Unit yang sama pada penyewa berbeda menjadi baris berbeda.
3. Perubahan pagination tidak boleh mengubah hasil agregasi.
4. Semua endpoint metrik harus menggunakan grain, filter, dan urutan yang sama dengan endpoint base.

Identitas utama pengelompokan menggunakan:

```text
penyewa_key = penyewa_id (jika terisi), selain itu nama penyewa yang dinormalisasi
equipment_key = equipment_id (jika terisi), selain itu kode unit yang dinormalisasi
```

ID disimpan sebagai string pada sumber dan harus dinormalisasi dengan `TRIM`. String kosong tidak boleh diperlakukan sebagai ID `0`.

### row_key

Setiap baris memiliki `row_key` yang stabil:

```text
row_key = "project:<penyewa_id>|equipment:<equipment_id>"
```

Jika ID kosong, fallback menggunakan nama/kode yang dinormalisasi:

```text
row_key = "project:name:<penyewa_name_normalized>|equipment:code:<equipment_code_normalized>"
```

`row_key` wajib identik antara endpoint base dan seluruh endpoint metrik. Frontend menggunakan `row_key` untuk menggabungkan hasil, bukan nomor urut atau kode unit.

### Fallback Identitas

Data historis dapat memiliki ID penyewa atau equipment yang kosong, tetapi masih memiliki snapshot nama/kode. Resolusi prioritas mengikuti Event History:

1. `penyewa_id` langsung dari breakdown/activity/timesheet.
2. Fallback ke Daily Activity `lokasi_site_id` yang cocok.
3. Fallback ke Timesheet `penyewa_id` yang cocok.
4. String kosong.

Strategi pemilihan nilai display ketika satu ID memiliki beberapa snapshot harus deterministik. Implementasi Event History menggunakan `GROUP_CONCAT(... ORDER BY updated_at DESC, id DESC)` untuk fallback. Productivity harus menggunakan strategi yang sama.

## Definisi Kolom Laporan

| No | Kolom | Sumber/Perhitungan | Tahap |
|---:|---|---|---|
| 1 | `No` | Nomor urut global hasil laporan | Base |
| 2 | `Project` | Nama penyewa (`penyewa_name`) | Base |
| 3 | `ID Unit` | Kode equipment (`equipment_code`) | Base |
| 4 | `Type` | `mas_equipment.tipe` | Base |
| 5 | `HM/KM` | `hmkm_end - hmkm_start` | Metrik HM/KM |
| 6 | `Standby` | Durasi waktu standby | Metrik Standby |
| 7 | `Opportunity` | `(nojob + fuel + hujan + jalan_licin + public + arahan + commissioning) - (breakdown + no_opr_drv)` | Metrik Opportunity |
| 8 | `Operating` | Default `0.00` | Ditangguhkan |
| 9 | `PA` | Default `0.00` | Ditangguhkan |
| 10 | `MA` | Default `0.00` | Ditangguhkan |
| 11 | `UA` | Default `0.00` | Ditangguhkan |
| 12 | `EU` | Default `0.00` | Ditangguhkan |
| 13 | `MTTFS` | Default `0.00` | Ditangguhkan |
| 14 | `MTTR` | Default `0.00` | Ditangguhkan |
| 15 | `MTBS` | Default `0.00` | Ditangguhkan |
| 16 | `MTBF` | Default `0.00` | Ditangguhkan |

Tidak ada kolom tanggal dan shift pada hasil laporan.

## Rumus Opportunity

```text
opportunity = (nojob + fuel + hujan + jalan_licin + public + arahan + commissioning)
            - (breakdown + no_opr_drv)
```

### Komponen Positif

| Komponen | Sumber | Catatan |
|---|---|---|
| `nojob` | Event History `no_job` | `kegiatan_id = 74` |
| `fuel` | Event History `fuel` | `kegiatan_id = 40,41,42,43,47,66,78,79,80,81` |
| `hujan` | Event History `hujan` | `kegiatan_id = 45,68` |
| `jalan_licin` | Event History `jalan_licin` | `kegiatan_id = 46,65` |
| `public` | Event History `public` | Mapping saat ini kosong `[]`, perlu konfirmasi |
| `arahan` | Event History `arahan` | `kegiatan_id = 1,48,67` |
| `commissioning` | TBD | Belum ada di mapping Event History, perlu konfirmasi |

### Komponen Negatif

| Komponen | Sumber | Catatan |
|---|---|---|
| `breakdown` | Event History `breakdown` | Dari tabel `ops_daily_breakdown` |
| `no_opr_drv` | Event History `no_operator_driver` | `kegiatan_id = 77` |

### Catatan Penting

- Mapping `public` saat ini kosong di `config/eventHistory.js`. Perlu konfirmasi `kegiatan_id` yang termasuk kategori ini.
- `commissioning` belum ada dalam mapping Event History. Perlu konfirmasi `kegiatan_id` yang termasuk kategori ini.
- `breakdown` berasal dari tabel breakdown, bukan activity ID. Shift filter belum diterapkan pada cabang breakdown di Event History. Perlu diputuskan apakah productivity akan menerapkan shift filter pada breakdown.
- Durasi dihitung dalam detik, dikonversi ke jam desimal setelah agregasi.
- Pembulatan hanya dilakukan pada hasil akhir.

## Perhitungan Durasi

Durasi setiap item dihitung dari:

```text
item_duration_seconds = finish_time - start_time
```

Perhitungan SQL konseptual:

```sql
CASE
  WHEN start_time IS NULL THEN 0
  WHEN finish_time IS NULL THEN 0
  WHEN finish_time < start_time THEN 0
  ELSE TIMESTAMPDIFF(SECOND, start_time, finish_time)
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
metric_hours = metric_total_seconds / 3600
```

Format output:

- Satuan jam desimal.
- Dua angka di belakang koma.
- Contoh: 90 menit ditampilkan sebagai `1.50`.
- Metrik tanpa durasi ditampilkan sebagai `0.00`.
- Nilai JSON dan Excel harus numeric, bukan string berformat.

## Arsitektur Base + Metric Endpoints

### Prinsip

1. **Satu scope bersama** menentukan daftar `penyewa + equipment`, filter, urutan, dan pagination.
2. **Endpoint base** menggunakan scope untuk mengembalikan identitas baris.
3. **Endpoint metrik** menggunakan scope yang sama, melakukan `LEFT JOIN` agregat metrik, dan mengembalikan nilai per `row_key`.
4. **Frontend** menggabungkan hasil base dan metrik berdasarkan `row_key`.
5. **Kolom ditangguhkan** tetap menampilkan `0.00` di frontend tanpa memanggil endpoint.

### Alasan

- Menjamin urutan dan pasangan `penyewa + equipment` identik antar endpoint.
- Endpoint metrik yang tidak memiliki data tetap mengembalikan baris dengan `0.00`, bukan menghilangkan baris.
- Penambahan metrik baru tidak mengubah endpoint base atau merusak frontend.
- Setiap metrik dapat divalidasi dan dirilis secara independen.

### Shared Scope

```text
ProductivityScopeServices
```

Tanggung jawab:

- Validasi tanggal.
- Parse filter array.
- Menentukan daftar `penyewa + equipment` dari union Daily Activity + Daily Breakdown + Timesheet.
- Membuat `row_key`.
- Menentukan sorting.
- Menangani pagination.
- Menjadi sumber scope semua endpoint metrik.

### Pola Query Metrik

```sql
FROM productivity_scope scope
LEFT JOIN metric_aggregate metric
  ON metric.penyesa_key = scope.penyewa_key
 AND metric.equipment_key = scope.equipment_key
```

Metrik tanpa data mengembalikan `0.00` karena `LEFT JOIN`.

## Kontrak API

Semua endpoint membutuhkan Bearer token.

### Endpoint Base

```text
GET /api/laporan/productivity/base/list
```

Mengembalikan identitas baris terpaginasikan.

### Endpoint Metrik (Tahap Berikutnya)

```text
GET /api/laporan/productivity/metrics/hmkm/list
GET /api/laporan/productivity/metrics/standby/list
GET /api/laporan/productivity/metrics/opportunity/list
```

Mengembalikan nilai metrik per `row_key` untuk halaman aktif. Parameter filter dan pagination harus sama dengan request base.

### Endpoint Download (Tahap Akhir)

```text
GET /api/laporan/productivity/download/pdf
GET /api/laporan/productivity/download/excel
```

Ditambahkan setelah seluruh metrik utama selesai.

### Query Parameters

| Name | Type | Required | Default | Contoh | Keterangan |
|---|---|---:|---|---|---|
| `startdate` | date string | Yes | Awal bulan di frontend | `2026-08-01` | Tanggal awal |
| `enddate` | date string | Yes | Hari ini di frontend | `2026-08-12` | Tanggal akhir |
| `lokasi_ids` | comma-separated string | No | Semua | `10,11` | ID lokasi kerja |
| `equipment_ids` | comma-separated string | No | Semua | `20,21` | ID equipment |
| `shift_ids` | comma-separated string | No | Semua | `1,2` | ID shift |
| `page` | integer | No | `1` | `2` | Halaman list |
| `perPage` | integer | No | `25` | `50` | Jumlah baris list |

Endpoint metrik menerima parameter yang sama dan mengabaikan `page`/`perPage` dengan mengembalikan seluruh baris halaman aktif yang sesuai dengan scope.

### Format Response Base

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
        "row_key": "project:12|equipment:45",
        "no": 1,
        "penyewa_id": "12",
        "penyewa_name": "PT Mitra Tambang Sejahtera",
        "equipment_id": "45",
        "equipment_code": "DT-001",
        "equipment_type": "Dump Truck"
      },
      {
        "row_key": "project:12|equipment:46",
        "no": 2,
        "penyewa_id": "12",
        "penyewa_name": "PT Mitra Tambang Sejahtera",
        "equipment_id": "46",
        "equipment_code": "EX-012",
        "equipment_type": "Excavator"
      }
    ]
  }
}
```

### Format Response Metrik

```json
{
  "diagnostic": {
    "ver": 3.0,
    "error": false
  },
  "rows": {
    "data": [
      {
        "row_key": "project:12|equipment:45",
        "hmkm": 85.25
      },
      {
        "row_key": "project:12|equipment:46",
        "hmkm": 98.25
      }
    ]
  }
}
```

Setiap endpoint metrik hanya mengembalikan `row_key` dan kolom metrik yang relevan. Frontend menggabungkan berdasarkan `row_key`.

### Error Response

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

## Struktur Query Backend

### Query Base

Query base menggunakan union Daily Activity + Daily Breakdown untuk menentukan daftar `penyewa + equipment`, sama seperti Event History. Tambahan join ke `mas_equipment` untuk mengambil `tipe`.

Pola SQL konseptual untuk cabang Daily Activity:

```sql
SELECT
  penyewa_key,
  equipment_key,
  MAX(penyewa_id) AS penyewa_id,
  MAX(penyewa_name) AS penyewa_name,
  MAX(equipment_id) AS equipment_id,
  MAX(equipment_code) AS equipment_code,
  MAX(COALESCE(eq.tipe, '')) AS equipment_type
FROM ops_daily_activity h
INNER JOIN ops_daily_activity_items i ON i.header_id = h.id
LEFT JOIN mas_pelanggans project ON project.id = CAST(NULLIF(TRIM(h.lokasi_site_id), '') AS UNSIGNED)
LEFT JOIN mas_equipment eq ON eq.id = CAST(NULLIF(TRIM(i.equipment_id), '') AS UNSIGNED)
WHERE h.aktif = 'Y'
  AND (i.sync_status IS NULL OR i.sync_status <> 'DELETED')
  AND h.date_ops BETWEEN ? AND ?
GROUP BY penyewa_key, equipment_key
```

Pola SQL konseptual untuk cabang Daily Breakdown:

```sql
SELECT
  penyewa_key,
  equipment_key,
  MAX(penyewa_id) AS penyewa_id,
  MAX(penyewa_name) AS penyewa_name,
  MAX(equipment_id) AS equipment_id,
  MAX(equipment_code) AS equipment_code,
  MAX(COALESCE(eq.tipe, '')) AS equipment_type
FROM ops_daily_breakdown bd
LEFT JOIN mas_pelanggans bd_pelanggan ON bd_pelanggan.id = bd.penyewa_id
LEFT JOIN mas_equipment eq ON eq.id = bd.equipment_id
-- fallback joins untuk resolusi penyewa mengikuti Event History
WHERE bd.aktif = 'Y'
  AND bd.status = 9
  AND bd.date_issue BETWEEN ? AND ?
GROUP BY penyewa_key, equipment_key
```

Union kedua cabang dan group by final mengikuti pola `buildAggregateQuery` Event History.

### Query Metrik

Setiap endpoint metrik menggunakan scope base dan melakukan `LEFT JOIN` agregat:

```sql
SELECT
  scope.row_key,
  COALESCE(metric.metric_value, 0) AS metric_value
FROM productivity_scope scope
LEFT JOIN (
  -- agregasi metrik khusus
) metric
  ON metric.penyewa_key = scope.penyewa_key
 AND metric.equipment_key = scope.equipment_key
```

Ketentuan teknis query:

1. Gunakan parameter binding untuk seluruh filter.
2. Jangan melakukan interpolasi langsung nilai query parameter.
3. Normalisasi ID secara aman dengan `TRIM` dan `CAST`.
4. Jangan melakukan join one-to-many tambahan sebelum agregasi karena dapat menggandakan durasi.
5. Count pagination harus dihitung dari jumlah kelompok final, bukan jumlah item sumber.
6. Pagination dilakukan oleh database, bukan dengan mengambil seluruh row ke memory.
7. Export menggunakan query agregasi yang sama tanpa limit dan offset.
8. Query base dan metrik harus memakai implementasi scope yang sama untuk mencegah perbedaan hasil.

## Arsitektur Backend

Lokasi implementasi yang direncanakan:

```text
be/app/Controllers/Http/laporan/ProductivityController.js
be/app/Services/Laporan/ProductivityScopeServices.js
be/app/Services/Laporan/ProductivityBaseServices.js
be/app/Services/Laporan/ProductivityHmkmServices.js
be/app/Services/Laporan/ProductivityStandbyServices.js
be/app/Services/Laporan/ProductivityOpportunityServices.js
be/config/productivity.js
be/start/routes.js
```

### Tanggung Jawab Controller

- Meneruskan query parameter ke service.
- Mengembalikan envelope JSON untuk base dan metrik.
- Mengirim binary PDF dan Excel dengan header yang benar.
- Mengembalikan status HTTP sesuai jenis error.

### Tanggung Jawab ProductivityScopeServices

- Parsing multi-select.
- Validasi tanggal dan pagination.
- Menyusun query scope (daftar `penyewa + equipment`).
- Membuat `row_key`.
- Menentukan sorting.
- Menangani pagination.
- Menjadi sumber scope semua endpoint metrik.

### Tanggung Jawab ProductivityBaseServices

- Menggunakan scope services.
- Menambahkan join `mas_equipment` untuk `tipe`.
- Serialisasi baris base.
- Menyediakan data list terpaginasikan.

### Tanggung Jawab ProductivityMetrikServices

- Menggunakan scope services.
- Menyusun query agregasi metrik khusus.
- `LEFT JOIN` agregat ke scope.
- Serialisasi metrik per `row_key`.
- Mengembalikan `0.00` jika metrik tidak memiliki data.

### Konfigurasi

```text
be/config/productivity.js
```

Menyimpan mapping kategori opportunity jika diperlukan, mengikuti pola `config/eventHistory.js`.

## Arsitektur Frontend

File yang sudah ada:

```text
nextjs/src/app/(dashboard)/laporan/productivity/page.js
nextjs/src/views/laporan/productivity/index.js
nextjs/src/views/laporan/productivity/filter.js
nextjs/src/views/laporan/productivity/list.js
nextjs/src/views/laporan/productivity/dummy-data.js
```

File yang akan ditambahkan:

```text
nextjs/src/api/productivity.js
```

### Tahapan Integrasi Frontend

1. **Tahap 0 (sekarang):** Frontend menampilkan data dummy. Tidak memanggil API.
2. **Tahap 1:** Hubungkan ke endpoint base. Ganti dummy rows dengan `useGetProductivityBase`.
3. **Tahap 2:** Hubungkan ke endpoint HM/KM. Gabungkan berdasarkan `row_key`.
4. **Tahap 3:** Hubungkan ke endpoint standby.
5. **Tahap 4:** Hubungkan ke endpoint opportunity.
6. **Tahap 5:** Aktifkan download PDF dan Excel.
7. **Tahap 6:** Hubungkan KPI maintenance saat datanya tersedia.

### Pola Penggabungan Frontend

```js
const baseRows = useGetProductivityBase(params);
const hmkmRows = useGetProductivityHmkm(params);

const hmkmMap = useMemo(() => {
  const map = new Map();
  (hmkmRows || []).forEach((row) => map.set(row.row_key, row.hmkm));
  return map;
}, [hmkmRows]);

const mergedRows = (baseRows || []).map((row) => ({
  ...row,
  hmkm: hmkmMap.get(row.row_key) ?? 0.0
}));
```

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

## Filter

### Filter Wajib

1. `startdate`: tanggal awal.
2. `enddate`: tanggal akhir.

Frontend mengisi nilai default:

```text
startdate = tanggal 1 pada bulan berjalan
enddate = tanggal hari ini
```

Rentang tanggal bersifat inklusif.

### Filter Opsional

1. `lokasi_ids`: multi-select lokasi kerja.
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
penyewa_name ASC,
equipment_code ASC,
penyewa_key ASC,
equipment_key ASC
```

ID digunakan sebagai tie-breaker agar pagination stabil ketika nama penyewa atau kode unit sama.

Nomor urut list dihitung menggunakan:

```text
no = ((page - 1) * perPage) + row_index + 1
```

Pada PDF dan Excel, nomor dimulai dari `1` dan berlanjut sampai seluruh hasil selesai.

## Struktur Halaman dan UX

Halaman menggunakan komponen dan visual language laporan existing:

- `MainCard` sebagai container.
- Judul `Laporan Productivity`.
- Tombol filter.
- Tombol download PDF dan Excel (diaktifkan setelah endpoint download tersedia).
- `SwipeableDrawer` untuk filter.
- MUI Table dengan sticky header.
- Pagination backend.
- Loading state dan empty state.
- Snackbar untuk hasil download.
- Keterangan bahwa data masih dummy pada tahap awal.

Aturan responsif:

1. Drawer menggunakan lebar penuh pada layar kecil dan lebar tetap pada desktop.
2. Tabel mendukung horizontal scroll.
3. Kolom `Project` dan `ID Unit` tetap mudah dibaca.
4. Kolom metrik menggunakan alignment kanan dan angka tabular.
5. Tombol tetap memiliki accessible label dan tooltip.

## Download PDF

PDF harus memuat:

1. Branding atau logo perusahaan sesuai pola laporan existing.
2. Judul `Laporan Productivity`.
3. Periode laporan.
4. Ringkasan filter lokasi, equipment, dan shift yang aktif.
5. Total baris hasil.
6. Waktu generate laporan.
7. Seluruh data sesuai filter tanpa pagination.
8. Semua kolom dalam urutan yang sama dengan tabel frontend.

PDF menggunakan orientasi landscape.

Nama file:

```text
report-productivity-<start>-to-<end>.pdf
```

Jika data kosong, PDF tetap dapat dibuat dan menampilkan informasi bahwa data tidak tersedia.

## Download Excel

Excel harus memuat:

1. Judul laporan.
2. Periode laporan.
3. Ringkasan filter aktif.
4. Header kolom sesuai tabel frontend.
5. Seluruh data sesuai filter tanpa pagination.
6. Nilai metrik sebagai numeric cell.
7. Format tampilan angka dua desimal.

Nama file:

```text
report-productivity-<start>-to-<end>.xlsx
```

Excel tidak boleh hanya mengekspor data halaman yang sedang ditampilkan.

## Menu, Autentikasi, dan Otorisasi

- Productivity ditempatkan sebagai submenu pada grup Report/Laporan.
- Halaman frontend membutuhkan session/token yang valid.
- Endpoint base, metrik, dan download membutuhkan Bearer token.
- Backend harus memeriksa hak baca Productivity sesuai mekanisme akses menu project.
- Hak baca yang sama berlaku untuk base, metrik, dan download.
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
- Metrik tanpa data mengembalikan `0.00` per `row_key`, bukan array kosong.
- Download tanpa data tetap menghasilkan file valid dengan keterangan `Tidak ada data`.
- Error download berbentuk blob harus tetap dapat dibaca frontend sebagai pesan JSON/text.
- Timeout download mengikuti pola laporan existing dengan batas yang memadai.

## Pertimbangan Performa

- Agregasi dan pagination dilakukan di database.
- Filter tanggal diterapkan sebelum agregasi.
- Scope query hanya memproses `kegiatan_id` yang termasuk mapping yang relevan.
- Hindari fungsi yang tidak diperlukan pada kolom filter berindeks.
- Gunakan urutan deterministik setelah agregasi.
- Query base dan metrik harus memakai implementasi scope yang sama untuk mencegah perbedaan hasil.
- Kebutuhan index perlu diverifikasi menggunakan `EXPLAIN` pada data representatif.

Index yang perlu dievaluasi, bukan otomatis diwajibkan oleh fitur ini:

```text
ops_daily_activity(date_ops, aktif, lokasi_pit_id, shift_id)
ops_daily_activity_items(header_id, kegiatan_id, equipment_id, sync_status)
ops_daily_breakdown(date_issue, aktif, status, equipment_id)
ops_daily_timesheet(date_ops, aktif, equipment_id, penyewa_id)
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
- Jenis output base, metrik, PDF, atau Excel.
- Status sukses atau gagal.

Log tidak boleh memuat seluruh payload row, catatan operasional, token, binary file, atau informasi sensitif lain yang tidak dibutuhkan untuk diagnosis.

## Konsistensi Data

Endpoint base dan metrik harus menggunakan:

- Filter yang sama.
- Kondisi data aktif yang sama.
- Grain yang sama.
- Mapping `kegiatan_id` yang sama.
- Aturan durasi aman yang sama.
- Pembulatan yang sama.
- Urutan kolom yang sama.

Jika data sumber berubah di antara request base dan request metrik, hasil dapat berbeda karena laporan tidak menggunakan snapshot transaksi lintas request. Kondisi tersebut diterima sebagai perilaku laporan real-time. Frontend dapat mengatasi ini dengan memanggil base dan metrik dalam interval yang berdekatan.

## Kriteria Penerimaan Backend

### Endpoint Base

1. Endpoint base mengembalikan identitas baris per penyewa dan unit.
2. Seluruh tanggal dalam periode dijumlahkan menjadi satu baris untuk penyewa dan unit yang sama.
3. Unit yang sama pada penyewa berbeda menghasilkan baris berbeda.
4. Hanya header aktif dan item yang bukan `DELETED` yang dihitung.
5. `equipment_type` diambil dari `mas_equipment.tipe` berdasarkan `equipment_id`, bukan `kdunit`.
6. `row_key` stabil dan konsisten antara base dan metrik.
7. Filter tanggal, lokasi, equipment, dan shift bekerja sesuai kontrak.
8. Pagination dihitung dari kelompok final.
9. Nomor urut stabil dan berlanjut antarhalaman.
10. Query menggunakan parameter binding.
11. Endpoint dilindungi autentikasi.

### Endpoint Metrik

12. Setiap endpoint metrik mengembalikan nilai per `row_key`.
13. Metrik tanpa data mengembalikan `0.00`, bukan menghilangkan baris.
14. Metrik menggunakan scope, filter, dan urutan yang sama dengan base.
15. Durasi dihitung dalam detik dan dikonversi setelah agregasi.
16. Nilai metrik dikembalikan sebagai numeric dengan presisi dua desimal.
17. `row_key` metrik identik dengan `row_key` base untuk baris yang sama.

### Umum

18. Input tidak valid menghasilkan HTTP `400`.
19. Request tanpa autentikasi menghasilkan HTTP `401`.
20. Error internal menghasilkan HTTP `500` tanpa membocorkan SQL atau stack trace.

## Kriteria Penerimaan Frontend

1. Halaman dapat dibuka di `/laporan/productivity`.
2. Default periode adalah awal bulan berjalan sampai hari ini.
3. User dapat memilih periode, lokasi, equipment, dan shift.
4. Filter lokasi, equipment, dan shift mendukung multi-select.
5. Perubahan filter mengembalikan halaman ke `1`.
6. Tabel menampilkan seluruh enam belas kolom sesuai urutan PRD.
7. Kolom metrik tanpa endpoint menampilkan `0.00`.
8. Loading, empty, error, dan download state ditampilkan dengan jelas.
9. Pagination menggunakan metadata backend.
10. Tabel tetap dapat digunakan pada desktop dan mobile.
11. Penggabungan base dan metrik menggunakan `row_key`, bukan nomor urut.
12. Menu hanya ditampilkan kepada user yang sesuai mekanisme akses project.

## Kriteria Penerimaan Export

1. PDF dan Excel memuat seluruh hasil filter, bukan hanya halaman aktif.
2. Urutan baris export konsisten dengan list.
3. Nomor pada export dimulai dari `1`.
4. PDF menggunakan orientasi landscape.
5. PDF memuat judul, periode, filter, total data, dan waktu generate.
6. Excel menyimpan seluruh metrik sebagai numeric cell.
7. PDF dan Excel tetap valid ketika hasil kosong.
8. Nama file mengikuti format yang ditentukan.
9. Total metrik pada export dapat direkonsiliasi dengan list untuk filter yang sama.

## Skenario Pengujian Minimum

| No | Skenario | Hasil yang Diharapkan |
|---:|---|---|
| 1 | Satu item untuk setiap mapping kegiatan | Durasi masuk ke kolom yang tepat |
| 2 | `kegiatan_id = 74` | Hanya menambah `nojob` pada opportunity |
| 3 | `kegiatan_id = 77` | Hanya mengurangi `no_opr_drv` pada opportunity |
| 4 | Kegiatan di luar mapping | Item tidak memengaruhi laporan |
| 5 | Unit dan penyewa sama pada beberapa tanggal | Seluruh durasi menjadi satu baris |
| 6 | Unit sama pada dua penyewa | Menghasilkan dua baris |
| 7 | Banyak item kategori sama | Durasi dijumlahkan tanpa kehilangan item |
| 8 | Header `aktif = 'N'` | Data tidak dihitung |
| 9 | Item `sync_status = 'DELETED'` | Data tidak dihitung |
| 10 | Item `sync_status = NULL` | Data tetap dihitung |
| 11 | `start_time` null | Durasi item nol |
| 12 | `finish_time` null | Durasi item nol |
| 13 | `finish_time < start_time` | Durasi item nol dan tidak negatif |
| 14 | Dua interval overlap | Keduanya dijumlahkan apa adanya |
| 15 | Filter periode batas awal dan akhir | Kedua tanggal batas ikut dihitung |
| 16 | Filter location multi-select | Hanya lokasi terpilih muncul |
| 17 | Filter equipment multi-select | Hanya unit terpilih muncul |
| 18 | Filter shift multi-select | Hanya item dari header shift terpilih dihitung |
| 19 | ID berupa string dengan whitespace | ID dinormalisasi secara konsisten |
| 20 | ID kosong tetapi snapshot tersedia | Fallback grouping berjalan deterministik |
| 21 | ID sama dengan snapshot nama/kode berbeda | Tetap satu kelompok dengan display deterministik |
| 22 | Nama/kode sama tetapi ID berbeda | Kelompok tetap mengikuti ID utama |
| 23 | Dua baris memiliki nama dan kode sama | Tie-breaker ID menjaga pagination stabil |
| 24 | Halaman kedua | Nomor melanjutkan halaman pertama |
| 25 | `startdate > enddate` | Backend mengembalikan HTTP 400 |
| 26 | Request tanpa autentikasi | Backend mengembalikan HTTP 401 |
| 27 | Hasil filter kosong | List dan metadata valid, metrik mengembalikan `0.00` |
| 28 | Metrik tanpa data untuk baris tertentu | `row_key` tetap muncul dengan nilai `0.00` |
| 29 | `row_key` base dan metrik untuk baris yang sama | Identik |
| 30 | `mas_equipment.tipe` kosong | `equipment_type` menampilkan string kosong |
| 31 | Equipment tidak ada di `mas_equipment` | `equipment_type` menampilkan string kosong |
| 32 | Penggabungan base dan metrik di frontend | Kolom metrik muncul pada baris yang benar |
| 33 | Dataset lebih dari satu halaman | Export memuat seluruh baris |
| 34 | Durasi di Excel | Cell bertipe numeric dan dapat dijumlahkan |
| 35 | Rekonsiliasi list dan export | Total setiap metrik sama untuk filter yang sama |

## Dependensi

- Endpoint lookup lokasi, equipment, dan shift yang sudah tersedia di project.
- Middleware autentikasi backend.
- Mekanisme menu dan permission user.
- Library pembuat PDF dan Excel yang sudah digunakan laporan existing.
- Implementasi Event History sebagai referensi resolusi `penyewa` dan `equipment`.
- Kualitas snapshot `lokasi_site_nama` dan `kdunit` pada data Daily Activity.

Tidak diperlukan dependency frontend baru jika implementasi mengikuti pola laporan existing.

## Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Interval overlap | Durasi kategori dapat lebih besar dari waktu aktual | Dokumentasikan bahwa item dijumlahkan apa adanya; perbaikan overlap di luar scope |
| ID kosong atau snapshot tidak konsisten | Pengelompokan atau label dapat ambigu | Profiling data dan fallback deterministik mengikuti Event History |
| Mapping kegiatan berubah | Hasil laporan tidak mengikuti definisi bisnis terbaru | Perubahan mapping harus melalui perubahan PRD dan test |
| Dataset besar | List atau export lambat | Agregasi/pagination database, evaluasi index, timeout export |
| Perbedaan query base dan metrik | Baris tidak tergabung dengan benar | Gunakan satu scope services bersama |
| `row_key` tidak stabil | Penggabungan frontend gagal | `row_key` harus deterministik dan hanya bergantung pada ID |
| Sumber HM/KM ambigu | Nilai berbeda tergantung sumber | Konfirmasi sumber resmi sebelum implementasi metrik |
| Sumber standby ambigu | Nilai berbeda tergantung sumber | Konfirmasi sumber resmi sebelum implementasi metrik |
| `public` dan `commissioning` belum terdefinisi | Opportunity tidak akurat | Konfirmasi mapping sebelum implementasi opportunity |
| Shift filter tidak diterapkan pada breakdown | Breakdown tidak terfilter shift | Diputuskan saat implementasi metrik |
| Permission hanya diterapkan di menu | Data dapat diakses langsung | Terapkan authorization pada seluruh endpoint backend |
| Pembulatan per item | Total memiliki selisih | Bulatkan hanya setelah agregasi detik selesai |
| Data berubah antara request base dan metrik | Hasil gabungan tidak konsisten | Terima sebagai perilaku laporan real-time |

## Rencana Implementasi

### Tahap 0: Frontend Dummy (Selesai)

1. Buat route, view, filter, list, dan dummy data frontend.
2. Tambahkan menu Productivity di frontend.
3. Validasi visualisasi dan interaksi filter.

### Tahap 1: Endpoint Base

1. Buat `ProductivityScopeServices` dengan resolusi penyewa dan equipment mengikuti Event History.
2. Tambahkan join `mas_equipment` untuk `tipe`.
3. Buat `ProductivityBaseServices` dan controller.
4. Tambahkan route `/laporan/productivity/base/list`.
5. Tambahkan unit test untuk scope, base, `row_key`, dan pagination.
6. Tambahkan functional test untuk activity-only, breakdown-only, dan gabungan.
7. Hubungkan frontend ke endpoint base.

### Tahap 2: Endpoint HM/KM

1. Konfirmasi sumber HM/KM resmi (breakdown `hmkm_start`/`hmkm_end` atau timesheet `smustart`/`smufinish`).
2. Konfirmasi rumus agregasi (`SUM(end - start)` atau `MAX(end) - MIN(start)`).
3. Buat `ProductivityHmkmServices`.
4. Tambahkan route `/laporan/productivity/metrics/hmkm/list`.
5. Tambahkan unit dan functional test.
6. Hubungkan frontend ke endpoint HM/KM.

### Tahap 3: Endpoint Standby

1. Konfirmasi sumber standby resmi (`kegiatan.subctg = 'standby'` atau `activity_items.status = 'standby'`).
2. Buat `ProductivityStandbyServices`.
3. Tambahkan route `/laporan/productivity/metrics/standby/list`.
4. Tambahkan unit dan functional test.
5. Hubungkan frontend ke endpoint standby.

### Tahap 4: Endpoint Opportunity

1. Konfirmasi mapping `public` dan `commissioning`.
2. Konfirmasi apakah shift filter diterapkan pada breakdown.
3. Buat `ProductivityOpportunityServices`.
4. Tambahkan route `/laporan/productivity/metrics/opportunity/list`.
5. Tambahkan unit dan functional test.
6. Hubungkan frontend ke endpoint opportunity.

### Tahap 5: Download

1. Implementasikan endpoint PDF dan Excel.
2. Tambahkan unit dan functional test untuk export.
3. Aktifkan tombol download di frontend.
4. Rekonsiliasi hasil tabel, PDF, dan Excel.

### Tahap 6: KPI Maintenance

1. Definisikan formula PA, MA, UA, EU, MTTFS, MTTR, MTBS, MTBF.
2. Implementasikan endpoint untuk setiap KPI.
3. Hubungkan frontend ke endpoint KPI.

## Asumsi dan Keputusan Terbuka

Asumsi yang telah disepakati:

- Grain laporan adalah penyewa + equipment untuk seluruh periode.
- Identitas baris menggunakan sumber yang sama dengan Event History.
- `equipment_type` diambil dari `mas_equipment.tipe` berdasarkan `equipment_id`.
- Arsitektur menggunakan Base + Metric Endpoints dengan shared scope.
- `row_key` wajib stabil dan konsisten antar endpoint.
- Kolom KPI maintenance menampilkan `0.00` hingga sumber datanya disepakati.
- Durasi menggunakan jam desimal dua angka.

Keputusan yang perlu divalidasi saat implementasi:

1. Sumber resmi HM/KM: breakdown `hmkm_start`/`hmkm_end` atau timesheet `smustart`/`smufinish`.
2. Rumus agregasi HM/KM: `SUM(end - start)` atau `MAX(end) - MIN(start)`.
3. Sumber resmi standby: `kegiatan.subctg = 'standby'` atau `activity_items.status = 'standby'`.
4. Mapping `kegiatan_id` untuk `public` (saat ini kosong).
5. Mapping `kegiatan_id` untuk `commissioning` (belum ada).
6. Apakah shift filter diterapkan pada cabang breakdown.
7. Strategi display ketika satu ID memiliki beberapa snapshot nama/kode.
8. Kualitas dan jumlah data dengan ID penyewa/equipment kosong.
9. Batas maksimum periode laporan dan `perPage` berdasarkan performa aktual.
10. Nama permission/menu backend yang digunakan untuk hak baca Productivity.
11. Index tambahan yang benar-benar diperlukan berdasarkan hasil `EXPLAIN`.
12. Formula PA, MA, UA, EU, MTTFS, MTTR, MTBS, MTBF.

Perubahan keputusan terbuka yang memengaruhi grain, mapping, atau perhitungan durasi harus memperbarui PRD dan skenario pengujian sebelum fitur dirilis.