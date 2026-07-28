# PRD - Migrasi Fitur Pengajuan Dana / Pengajuan Non Part

## Ringkasan

Dokumen ini mendefinisikan migrasi penuh fitur legacy `pengajuan-non-part` dari `./mrt-v3` ke arsitektur baru:

- Backend: `./be`
- Frontend: `./nextjs`

Keputusan utama yang sudah dikunci:

- URL web tetap: `/pengajuan-dana`
- Namespace API backend tetap: `/api/pengajuan-dana`
- Database tetap memakai tabel legacy yang sama
- Cakupan migrasi tahap ini adalah full flow end-to-end
- Ditambahkan aksi baru `return` untuk mengembalikan berkas ke status `open` agar pembuat dapat melakukan revisi

Fitur ini bukan sekadar form pengajuan. Fitur mencakup proses transaksi akunting, approval, verifikasi finance, pembentukan faktur/pembayaran, dan integrasi logistik untuk item yang memiliki gudang tujuan.

## Latar Belakang

Pada sistem legacy `mrt-v3`, menu `/acc/pengajuan-non-part` dipakai untuk mengajukan pengeluaran non persediaan atau non part, dengan kemungkinan pembayaran langsung, reimbursement, atau proses hutang pemasok. Pada frontend target, URL web disederhanakan menjadi `/pengajuan-dana`.

Setelah pengajuan dibuat, dokumen tidak berhenti pada approval administratif. Pada tahap verifikasi finance, sistem juga dapat membentuk dokumen turunan:

- faktur beli
- item faktur beli
- pembayaran
- item pembayaran
- request transit logistik
- waiting delivery logistik

Saat ini target backend `./be` sudah memiliki implementasi parsial dengan nama `pengajuan-dana`, tetapi baru mencakup:

- list
- detail
- permission check
- approve
- reject
- verify

Target frontend `./nextjs` belum memiliki implementasi fitur ini.

## Tujuan

- Memigrasikan seluruh flow bisnis legacy ke stack `be` + `nextjs`.
- Mempertahankan perilaku bisnis inti yang sudah dipakai user.
- Membersihkan defect legacy pada validasi, otorisasi, transaksi, dan audit.
- Menambahkan proses `return` agar dokumen bisa dikembalikan untuk revisi, bukan hanya ditolak final.
- Menjaga kompatibilitas istilah backend yang sudah berjalan di mobile melalui `/api/pengajuan-dana`.

## Non-Tujuan

- Mengganti nama endpoint backend menjadi `/api/pengajuan-non-part`.
- Mengganti database legacy menjadi database baru.
- Mendesain ulang modul akunting turunan seperti pembayaran atau faktur dari nol.
- Mengubah seluruh permission framework aplikasi di luar kebutuhan fitur ini.

## Istilah

- Pengajuan Dana: nama endpoint backend dan kontrak API target.
- Pengajuan Non Part: nama menu web legacy yang dipertahankan sebagai URL frontend.
- Approver: role pemeriksa awal sebelum finance.
- Finance Verifier: role verifikasi akhir sebelum pembentukan transaksi turunan.
- Reject: penolakan final, status akhir `reject`.
- Return: pengembalian untuk revisi, status akhir `open`.

## Ruang Lingkup

### Termasuk

- Halaman list `/pengajuan-dana`
- Halaman create
- Halaman detail
- Halaman edit
- Upload dan tampilan lampiran
- Approval atasan
- Reject
- Return untuk revisi
- Verify finance
- History workflow
- Export Excel
- API option/master-data yang dibutuhkan form
- Pengetatan validasi, kalkulasi, transaksi, dan permission backend

### Tidak Termasuk

- UI rollback pembayaran dari modul pembayaran lain
- Migrasi total modul pembayaran/faktur ke frontend baru pada fase ini
- Refactor global semua endpoint agar memakai satu format response tunggal di seluruh aplikasi

## Referensi Source of Truth

### Legacy utama

- `mrt-v3/start/routes.js`
- `mrt-v3/app/Controllers/Http/akunting/PengajuanNonpartController.js`
- `mrt-v3/app/Helpers/PengajuanNonPart.js`
- `mrt-v3/public/script/acc-pengajuan-non-part.js`
- `mrt-v3/resources/views/akunting/pengajuan-non-part/*`

### Target backend

- `be/app/Controllers/Http/mobile/PengajuanDanaController.js`
- `be/app/Helpers/PengajuanDanaVerifyHelper.js`
- `be/app/Models/Transaksi/TrxPengajuanNonPart.js`
- `be/app/Models/Transaksi/TrxPengajuanNonPartItem.js`

### Target frontend

- `nextjs/src/views/operational/mining/mining-production-plan/*`
- `nextjs/src/views/scm/pickup-order/*`
- `nextjs/src/views/human-capital/crew-work-activity/*`
- `nextjs/src/views/operational/timesheet/*`

## Ringkasan Kondisi Existing

### Legacy `mrt-v3`

Sudah mencakup flow lengkap:

- list
- create
- edit
- upload lampiran
- approve
- reject
- verify
- delete own/admin
- delete item
- export excel

Namun legacy juga memiliki masalah penting:

- business-unit scoping tidak konsisten
- mutation tidak cukup ketat terhadap role dan state
- update item tidak konsisten menyimpan semua field
- perhitungan total item dan header tidak konsisten
- alasan reject tidak terdokumentasi dengan baik
- tidak ada immutable workflow history
- upload S3 tidak awaited dengan benar

### Backend `./be`

Sudah ada pondasi model dan workflow parsial, tetapi belum lengkap untuk parity web:

- belum ada create
- belum ada update
- belum ada delete
- belum ada upload attachment
- belum ada option endpoints lengkap
- belum ada export
- belum ada return
- alasan reject belum tersimpan historis

### Frontend `./nextjs`

Belum ada implementasi fitur ini, tetapi sudah memiliki pola yang bisa dipakai:

- App Router
- MUI
- Formik/Yup
- SWR
- NextAuth + bearer token via axios
- responsive list desktop/mobile
- multipart upload pattern
- confirm dialog pattern

## Target User

- Pembuat pengajuan
- Approver
- Finance verifier
- Administrator
- Developer internal

## Role dan Otorisasi

### Pembuat

Hak akses:

- membuat pengajuan
- mengedit pengajuan saat status `open`
- menghapus pengajuan milik sendiri saat status `open`
- melihat detail pengajuan yang berada dalam scope bisnisnya
- melihat alasan return dan melakukan revisi

### Approver

Role:

- `pjo`
- `hrd`
- `wadir`
- `logistik`
- `direktur`
- `administrator`
- `developer`

Hak akses:

- melihat pengajuan dalam scope bisnis yang diotorisasi
- approve saat status `open`
- reject saat status `open`
- return saat status `open`

### Finance Verifier

Role:

- `keuangan`
- `wadir`
- `direktur`
- `administrator`
- `developer`

Hak akses:

- melihat pengajuan dalam scope bisnis yang diotorisasi
- verify saat status `approval`
- reject saat status `approval`
- return saat status `approval`

### Catatan penting

- Semua list, detail, dan mutation wajib discoping berdasarkan business-unit access yang valid.
- Permission di UI tidak boleh menjadi satu-satunya pengaman. Backend adalah otoritas final.
- Endpoint permission per dokumen wajib mengembalikan capability aktual user terhadap dokumen.

## Workflow Bisnis Target

### 1. Pembuatan

Pembuat membuat dokumen dengan header, item, dan lampiran.

Status setelah create:

```text
status = open
sts_code = 1
```

### 2. Edit oleh pembuat

Pembuat hanya dapat mengubah dokumen jika:

- status `open`
- dokumen aktif
- dokumen berada di scope bisnis user
- user adalah pembuat dokumen atau role privileged sesuai kebijakan akhir

### 3. Approval

Approver meninjau dokumen pada status `open`.

Kemungkinan aksi:

- approve
- reject
- return

Transisi approve:

```text
open -> approval
sts_code 1 -> 3
```

### 4. Return oleh approver

Approver dapat mengembalikan berkas untuk revisi.

Transisi:

```text
open -> open
last_action = returned
revision_no + 1
```

Walaupun status tetap `open`, event workflow wajib tercatat dan pembuat harus melihat bahwa dokumen dikembalikan untuk revisi.

### 5. Verifikasi finance

Finance memproses dokumen yang sudah berstatus `approval`.

Kemungkinan aksi:

- verify
- reject
- return

Transisi verify:

```text
approval -> close
sts_code 3 -> 0
```

Pada tahap ini sistem juga dapat membentuk dokumen turunan akunting dan logistik.

### 6. Return oleh finance

Finance dapat mengembalikan berkas agar pembuat memperbaiki data.

Transisi:

```text
approval -> open
sts_code 3 -> 1
last_action = returned
revision_no + 1
```

Dokumen yang sudah di-return finance wajib melalui approval atasan ulang setelah pembuat selesai revisi.

### 7. Reject

Reject adalah penolakan final.

Transisi:

```text
open -> reject
approval -> reject
sts_code -> -1
```

Dokumen reject tidak dapat diedit ulang dalam flow normal.

## State Machine

```text
open
  ├── approve ─────────────→ approval
  ├── return by approver ─→ open
  └── reject ─────────────→ reject

approval
  ├── verify ─────────────→ close
  ├── return by finance ──→ open
  └── reject ─────────────→ reject

close
  └── rollback pembayaran dari modul lain → approval
```

## Kebutuhan Data dan Skema

### Tabel existing yang dipakai

- `trx_pengajuan_nonpart`
- `trx_pengajuan_nonpart_items`
- `lampiran_files`
- `trx_faktur_belis`
- `trx_faktur_beli_items`
- `trx_pembayarans`
- `trx_pembayaran_items`
- `log_request_transit`
- `log_wait_delivery`

### Tambahan skema yang disarankan

Tambahan additive agar audit dan flow return aman:

Catatan implementasi:

- seluruh perubahan skema pada database legacy harus bersifat additive
- hindari drop column, rename column, atau perubahan destructive pada fase migrasi ini
- eksekusi DDL harus diuji terlebih dahulu pada clone database staging yang strukturnya identik dengan production
- nama tipe dan index di bawah ini adalah baseline yang direkomendasikan, finalisasi tetap mengikuti hasil discovery DDL aktual

#### Header tambahan

Pada `trx_pengajuan_nonpart`:

- `revision_no` integer default `0`
- `last_action` string nullable

Opsional jika bisnis menyetujui:

- `returned_at`
- `returned_by`
- `returned_reason_last`

Namun sumber audit utama tetap history table, bukan kolom header.

#### DDL alter table existing

Script baseline untuk menambah field pada tabel existing `trx_pengajuan_nonpart`:

```sql
ALTER TABLE trx_pengajuan_nonpart
  ADD COLUMN revision_no INT NOT NULL DEFAULT 0 AFTER sts_code,
  ADD COLUMN last_action VARCHAR(30) NULL AFTER revision_no,
  ADD COLUMN returned_at DATETIME NULL AFTER rejected_at,
  ADD COLUMN returned_by INT UNSIGNED NULL AFTER returned_at,
  ADD COLUMN returned_reason_last TEXT NULL AFTER returned_by;

ALTER TABLE trx_pengajuan_nonpart
  ADD INDEX idx_trx_pengajuan_nonpart_revision_no (revision_no),
  ADD INDEX idx_trx_pengajuan_nonpart_last_action (last_action),
  ADD INDEX idx_trx_pengajuan_nonpart_returned_by (returned_by),
  ADD INDEX idx_trx_pengajuan_nonpart_status_aktif (status, aktif),
  ADD INDEX idx_trx_pengajuan_nonpart_bisnis_cabang (bisnis_id, cabang_id),
  ADD INDEX idx_trx_pengajuan_nonpart_createdby (createdby);
```

Jika database sudah memiliki sebagian index di atas, migration nyata harus memakai pengecekan `hasColumn` dan `hasIndex` agar idempotent.

#### Workflow history baru

Tabel baru:

```text
trx_pengajuan_nonpart_histories
```

Kolom minimum:

- `id`
- `pengajuan_id`
- `action`
- `from_status`
- `to_status`
- `actor_id`
- `actor_role`
- `reason`
- `notes`
- `revision_no`
- `metadata` JSON/text
- `created_at`

Value `action`:

- `created`
- `updated`
- `approved`
- `returned`
- `rejected`
- `verified`
- `deleted`
- `rollback`

#### DDL create table baru

Script baseline untuk tabel history workflow:

```sql
CREATE TABLE trx_pengajuan_nonpart_histories (
  id INT NOT NULL AUTO_INCREMENT,
  pengajuan_id INT NOT NULL,
  action VARCHAR(30) NOT NULL,
  from_status VARCHAR(30) NULL,
  to_status VARCHAR(30) NULL,
  actor_id INT NOT NULL,
  actor_role VARCHAR(50) NOT NULL,
  reason TEXT NULL,
  notes TEXT NULL,
  revision_no INT NOT NULL DEFAULT 0,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tpnph_pengajuan (pengajuan_id),
  KEY idx_tpnph_action (action),
  KEY idx_tpnph_actor (actor_id),
  KEY idx_tpnph_revision (revision_no),
  KEY idx_tpnph_created_at (created_at),
  CONSTRAINT fk_tpnph_pengajuan
    FOREIGN KEY (pengajuan_id) REFERENCES trx_pengajuan_nonpart(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Alasan perubahan di atas:

- foreign key MySQL mensyaratkan tipe kolom parent dan child benar-benar kompatibel
- pada schema legacy sangat mungkin `trx_pengajuan_nonpart.id` bertipe `INT` signed, bukan `INT UNSIGNED`
- karena itu `pengajuan_id` harus mengikuti tipe aktual kolom parent

Jika hasil `SHOW CREATE TABLE trx_pengajuan_nonpart;` menunjukkan `id` bertipe `INT UNSIGNED`, maka ubah kembali `pengajuan_id` menjadi `INT UNSIGNED`.

Jika server MySQL target belum stabil memakai kolom `JSON`, maka `metadata` dapat diganti sementara menjadi `LONGTEXT` dengan isi JSON string.

#### DDL opsional untuk memperkuat integritas data

Script berikut tidak wajib pada fase pertama, tetapi direkomendasikan bila data existing sudah bersih:

```sql
ALTER TABLE trx_pengajuan_nonpart_items
  ADD INDEX idx_trx_pengajuan_nonpart_items_pengajuan (pengajuan_id),
  ADD INDEX idx_trx_pengajuan_nonpart_items_pengajuan_aktif (pengajuan_id, aktif),
  ADD INDEX idx_trx_pengajuan_nonpart_items_coa (coa_id),
  ADD INDEX idx_trx_pengajuan_nonpart_items_penerima (penerima),
  ADD INDEX idx_trx_pengajuan_nonpart_items_pemasok (pemasok_id),
  ADD INDEX idx_trx_pengajuan_nonpart_items_karyawan (karyawan_id),
  ADD INDEX idx_trx_pengajuan_nonpart_items_gudang (gudang_id);

ALTER TABLE lampiran_files
  ADD INDEX idx_lampiran_files_pengajuan (pengajuan_id),
  ADD INDEX idx_lampiran_files_pengajuan_aktif (pengajuan_id, aktif);
```

Untuk `kode`, jangan langsung membuat unique key jika data legacy belum dibersihkan. Gunakan tahapan aman berikut.

##### Tahap 1 - Audit duplicate kode

```sql
SELECT kode, COUNT(*) AS total_duplikat
FROM trx_pengajuan_nonpart
WHERE kode IS NOT NULL AND kode <> ''
GROUP BY kode
HAVING COUNT(*) > 1
ORDER BY total_duplikat DESC, kode ASC;
```

Untuk melihat record yang bentrok secara detail:

```sql
SELECT id, kode, bisnis_id, cabang_id, trx_date, status, createdby, created_at, updated_at, aktif
FROM trx_pengajuan_nonpart
WHERE kode = 'PD-240904MKG00013'
ORDER BY id ASC;
```

##### Tahap 2 - Temporary non-unique index

Jika aplikasi butuh optimasi query lebih dulu, gunakan index biasa dahulu:

```sql
ALTER TABLE trx_pengajuan_nonpart
  ADD INDEX idx_trx_pengajuan_nonpart_kode (kode);
```

##### Tahap 3 - Data cleansing duplicate kode

Duplicate `kode` harus dibersihkan sebelum unique key dibuat. Strategi yang direkomendasikan:

- tentukan satu record yang mempertahankan `kode` asli
- record duplikat lain harus diberi `kode` baru yang unik
- jika ada dokumen turunan yang menyimpan salinan `kode` sebagai referensi display, lakukan penyesuaian terkontrol
- seluruh perubahan wajib diaudit dan diuji di staging terlebih dahulu

Contoh query identifikasi kandidat survivor per kode:

```sql
SELECT MIN(id) AS survivor_id, kode, COUNT(*) AS total_duplikat
FROM trx_pengajuan_nonpart
WHERE kode IS NOT NULL AND kode <> ''
GROUP BY kode
HAVING COUNT(*) > 1;
```

Contoh pola update manual setelah diputuskan record mana yang diubah:

```sql
UPDATE trx_pengajuan_nonpart
SET kode = 'PD-240904MKG00013-R1'
WHERE id = 99999;
```

Contoh pola renumber duplicate jika suffix numerik 5 digit terakhir ingin digeser menjadi `10026`, `20026`, dst, sementara baris pertama tetap mempertahankan kode asli:

```sql
WITH ranked AS (
  SELECT
    id,
    kode,
    ROW_NUMBER() OVER (PARTITION BY kode ORDER BY id ASC) AS rn
  FROM trx_pengajuan_nonpart
  WHERE kode = 'PD-251124MKG00026'
)
UPDATE trx_pengajuan_nonpart t
JOIN ranked r ON r.id = t.id
SET t.kode = CASE
  WHEN r.rn = 1 THEN t.kode
  ELSE CONCAT(
    LEFT(r.kode, CHAR_LENGTH(r.kode) - 5),
    LPAD((r.rn - 1) * 10000 + CAST(RIGHT(r.kode, 5) AS UNSIGNED), 5, '0')
  )
END
WHERE r.rn > 1;
```

Contoh hasil untuk 8 data duplicate `PD-251124MKG00026`:

```text
PD-251124MKG00026
PD-251124MKG10026
PD-251124MKG20026
PD-251124MKG30026
PD-251124MKG40026
PD-251124MKG50026
PD-251124MKG60026
PD-251124MKG70026
```

Jika server MySQL belum mendukung CTE + window function pada `UPDATE`, gunakan pendekatan temporary table.

```sql
CREATE TEMPORARY TABLE tmp_pengajuan_kode_fix AS
SELECT
  id,
  kode,
  (@rn := @rn + 1) AS rn
FROM (
  SELECT id, kode
  FROM trx_pengajuan_nonpart
  WHERE kode = 'PD-251124MKG00026'
  ORDER BY id ASC
) src
JOIN (SELECT @rn := 0) vars;

UPDATE trx_pengajuan_nonpart t
JOIN tmp_pengajuan_kode_fix x ON x.id = t.id
SET t.kode = CASE
  WHEN x.rn = 1 THEN t.kode
  ELSE CONCAT(
    LEFT(x.kode, CHAR_LENGTH(x.kode) - 5),
    LPAD((x.rn - 1) * 10000 + CAST(RIGHT(x.kode, 5) AS UNSIGNED), 5, '0')
  )
END
WHERE x.rn > 1;

DROP TEMPORARY TABLE tmp_pengajuan_kode_fix;
```

Suffix final harus mengikuti kebijakan bisnis. Jika `kode` dipakai sebagai nomor dokumen resmi, perubahan kode historical harus mendapat persetujuan user bisnis dan tim finance.

##### Tahap 4 - Baru tambah unique key

Setelah query audit memastikan tidak ada duplikat lagi:

```sql
ALTER TABLE trx_pengajuan_nonpart
  ADD UNIQUE KEY uq_trx_pengajuan_nonpart_kode (kode);
```

##### Checklist sebelum unique key `kode`

- tidak ada duplicate `kode`
- tidak ada `kode` kosong jika bisnis mewajibkan semua dokumen punya nomor
- generator kode backend sudah tahan race condition
- seluruh environment penting sudah dibersihkan, bukan hanya local DB

## Model Data Fungsional

### Header pengajuan

Field inti:

- `kode`
- `bisnis_id`
- `cabang_id`
- `trx_date`
- `narasi`
- `total`
- `status`
- `sts_code`
- `revision_no`
- `last_action`
- `createdby`

### Item pengajuan

Field inti:

- `coa_id`
- `barang_id`
- `qty`
- `satuan`
- `curr`
- `kurs`
- `harga`
- `harga_usd`
- `potongan`
- `ppn`
- `ppn_rp`
- `grandtotal`
- `metode`
- `kategori`
- `penerima`
- `type_bayar`
- `pemasok_id`
- `karyawan_id`
- `nm_penerima`
- `nm_bank`
- `no_rekening`
- `an_rekening`
- `gudang_id`
- `prioritas`
- `narasi`

## Validasi Bisnis

### Header

Wajib:

- `bisnis_id`
- `cabang_id`
- `trx_date`
- `narasi`
- minimal 1 item aktif

### Item

Wajib:

- `coa_id`
- `qty > 0`
- `satuan`
- `prioritas`
- `penerima`
- `type_bayar`
- harga valid sesuai currency

Aturan tambahan:

- jika `curr = USD`, maka `kurs > 0` dan `harga_usd > 0`
- jika `kategori = reimburse`, penerima harus konsisten dengan karyawan
- jika `penerima = pemasok`, `pemasok_id` wajib
- jika `penerima = karyawan`, `karyawan_id` wajib
- jika `penerima = lainnya`, `nm_penerima` wajib
- jika pembayaran non-cash, data bank wajib lengkap
- jika item mengarah ke gudang dan COA terkait sparepart, `barang_id` wajib
- semua relasi master harus tervalidasi berada dalam scope bisnis yang benar

### Return dan Reject

- `reason` wajib
- `reason` harus disimpan ke workflow history
- reject tidak boleh dipakai sebagai mekanisme revisi

## Aturan Perhitungan

Perhitungan frontend hanya untuk preview. Backend wajib menghitung ulang seluruh item dan header sebelum save atau verify.

### Formula

Untuk IDR:

```text
base = qty * harga
subtotal = base - potongan
ppn_rp = subtotal * (ppn / 100)
grandtotal = subtotal + ppn_rp
```

Untuk USD:

```text
base = qty * harga_usd * kurs
subtotal = base - potongan
ppn_rp = subtotal * (ppn / 100)
grandtotal = subtotal + ppn_rp
```

Header total:

```text
total = sum(grandtotal seluruh item aktif)
```

### Aturan teknis

- gunakan satu fungsi kalkulasi terpusat di backend
- hindari dependensi pada hasil kalkulasi dari client
- gunakan tipe numerik dan pembulatan yang konsisten
- perubahan item pada approve atau update wajib memicu recalculation total header

## Kebutuhan Backend API

### Endpoint utama

```http
GET    /api/pengajuan-dana
POST   /api/pengajuan-dana
GET    /api/pengajuan-dana/:id
PATCH  /api/pengajuan-dana/:id
DELETE /api/pengajuan-dana/:id
```

### Endpoint workflow

```http
GET  /api/pengajuan-dana/:id/permissions
POST /api/pengajuan-dana/:id/approve
POST /api/pengajuan-dana/:id/reject
POST /api/pengajuan-dana/:id/return
POST /api/pengajuan-dana/:id/verify
```

### Endpoint utilitas

```http
GET    /api/pengajuan-dana/approval-count
GET    /api/pengajuan-dana/export
DELETE /api/pengajuan-dana/:id/items/:itemId
POST   /api/pengajuan-dana/:id/attachments
DELETE /api/pengajuan-dana/:id/attachments/:fileId
GET    /api/pengajuan-dana/options/coas
GET    /api/pengajuan-dana/options/barang
GET    /api/pengajuan-dana/options/pemasok
GET    /api/pengajuan-dana/options/karyawan
GET    /api/pengajuan-dana/options/gudang
GET    /api/pengajuan-dana/options/banks
GET    /api/pengajuan-dana/options/satuan
```

### List query params

- `page`
- `limit`
- `status`
- `kategori`
- `kode`
- `narasi`
- `min_amount`
- `max_amount`
- `date_start`
- `date_end`
- `bisnis_unit_id`

Catatan:

- `penerima` dan `prioritas` hanya boleh diekspos sebagai filter jika backend benar-benar mengaplikasikannya.

### Response list yang disarankan

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "total": 0,
    "perPage": 25,
    "page": 1,
    "lastPage": 1
  },
  "summary": {
    "total_all": 0,
    "open": 0,
    "approval": 0,
    "close": 0,
    "reject": 0,
    "returned_open": 0
  }
}
```

### Response detail yang disarankan

```json
{
  "success": true,
  "data": {
    "id": 123,
    "kode": "PD-...",
    "status": "open",
    "sts_code": 1,
    "last_action": "returned",
    "revision_no": 2,
    "bisnis": {},
    "cabang": {},
    "creator": {},
    "checker": {},
    "validator": {},
    "items": [],
    "files": [],
    "histories": []
  }
}
```

### Response permissions yang disarankan

```json
{
  "success": true,
  "data": {
    "status": "approval",
    "permissions": {
      "can_edit": false,
      "can_delete": false,
      "can_approve": false,
      "can_verify": true,
      "can_reject": true,
      "can_return": true
    },
    "user_role": "keuangan"
  }
}
```

### Payload return

```json
{
  "reason": "Nomor rekening pemasok belum sesuai"
}
```

### Payload reject

```json
{
  "reason": "Dokumen ditolak karena pengajuan tidak valid"
}
```

### Payload approve

Minimal:

```json
{
  "items": [
    {
      "id": 1,
      "qty": 2,
      "harga": 100000,
      "potongan": 0,
      "ppn": 11,
      "narasi": "Perbaikan catatan"
    }
  ],
  "notes": "optional"
}
```

### Payload create/update

Multipart:

- `json`: stringified payload header + items
- `lampiran`: multi file

## Kebutuhan Backend Implementasi

### Service layer

Disarankan membuat service khusus:

- `PengajuanNonPartServices`
- `PengajuanNonPartWorkflowService`
- `PengajuanNonPartExportService`

### Prinsip implementasi

- semua mutation melewati service
- authorization dilakukan sebelum atau tepat saat transaction dimulai
- header dibaca dengan lock saat mutation stateful
- verify harus idempotent dan aman terhadap race condition
- semua write terkait verify menggunakan transaction yang sama
- semua perubahan state menghasilkan history record

### Verify flow teknis

```text
authorize
-> lock header
-> validate current status = approval
-> validate items and totals
-> check existing downstream docs
-> create logistics rows jika perlu
-> create faktur rows
-> create pembayaran rows jika perlu
-> update header status close
-> write history verified
-> commit
```

### Return flow teknis

```text
authorize
-> lock header
-> validate current status sesuai actor
-> ensure no forbidden downstream docs exist
-> update status open
-> reset current-cycle approval/validation fields yang perlu
-> increment revision_no
-> set last_action returned
-> write history returned
-> commit
```

## Kebutuhan Frontend

### Route

Route target:

- `/pengajuan-dana`
- `/pengajuan-dana/create`
- `/pengajuan-dana/[id]`
- `/pengajuan-dana/[id]/edit`

Direktori yang disarankan:

```text
src/app/(dashboard)/(accounting)/pengajuan-dana/page.js
src/app/(dashboard)/(accounting)/pengajuan-dana/create/page.js
src/app/(dashboard)/(accounting)/pengajuan-dana/[id]/page.js
src/app/(dashboard)/(accounting)/pengajuan-dana/[id]/edit/page.js

src/views/accounting/pengajuan-dana/index.js
src/views/accounting/pengajuan-dana/list.js
src/views/accounting/pengajuan-dana/list-desktop.js
src/views/accounting/pengajuan-dana/list-mobile.js
src/views/accounting/pengajuan-dana/filter.js
src/views/accounting/pengajuan-dana/form.js
src/views/accounting/pengajuan-dana/item-row.js
src/views/accounting/pengajuan-dana/detail.js
src/views/accounting/pengajuan-dana/reject-dialog.js
src/views/accounting/pengajuan-dana/return-dialog.js
src/views/accounting/pengajuan-dana/calculations.js

src/api/pengajuan-dana.js
```

### Struktur halaman list

Komponen utama:

- breadcrumbs
- filter drawer
- summary cards status
- tombol create
- tombol export excel
- table desktop
- card list mobile

Kolom utama list:

- aksi/detail
- kode
- tanggal
- bisnis/cabang
- narasi
- pembuat
- status
- kategori/prioritas ringkas
- jumlah item
- jumlah lampiran
- total

### Badge status

Status visual:

- `open`
- `open` + `last_action = returned` tampil sebagai `Open - Perlu Revisi`
- `approval`
- `close`
- `reject`

### Halaman create/edit

Harus mendukung:

- pilih bisnis
- pilih cabang
- tanggal transaksi
- narasi header
- upload multi lampiran
- item dinamis via `FieldArray`

Setiap item mendukung:

- COA
- barang
- qty
- satuan
- currency
- kurs
- harga/harga_usd
- potongan
- PPN
- grand total auto preview
- metode
- kategori
- penerima
- tipe bayar
- data rekening
- gudang
- prioritas
- narasi

Perilaku dinamis form:

- perubahan bisnis me-reset opsi item yang bergantung pada bisnis
- perubahan penerima menampilkan field identitas sesuai jenis
- perubahan tipe bayar menampilkan field bank bila diperlukan
- perubahan COA dapat memicu kebutuhan barang/gudang tertentu

### Halaman detail

Section minimum:

- informasi header
- status dan audit ringkas
- item detail
- lampiran
- history workflow
- action bar sesuai permission

Action yang dapat tampil:

- edit
- delete
- approve
- reject
- return
- verify

### Dialog reject

Wajib:

- reason multiline
- validasi non-empty
- tampilkan konsekuensi final

### Dialog return

Wajib:

- reason multiline
- validasi non-empty
- penjelasan bahwa dokumen kembali ke `open`
- penjelasan bahwa pembuat harus revisi dan approval harus diulang

### Export Excel

Output harus mempertahankan dua worksheet seperti legacy:

- `Master`
- `Detail`

Export harus mengikuti filter aktif, tidak hanya halaman yang sedang tampil.

## UX States

### Loading

- skeleton atau spinner pada list
- skeleton detail saat load awal
- tombol action disabled saat submit mutation

### Empty

- kartu kosong yang menjelaskan belum ada data

### Error

- banner error yang menampilkan pesan backend
- retry button untuk load failure

### Success

- snackbar untuk create, update, approve, reject, return, verify, delete, export start

## Responsive Requirement

- desktop memakai tabel dengan horizontal scroll
- mobile memakai card list yang tetap memuat status, tanggal, kode, narasi, dan total
- detail di mobile memakai section card atau tabs agar tidak terlalu panjang
- action penting di mobile tampil pada sticky bottom action area jika diperlukan

## Menu dan Navigasi

Menu harus didaftarkan melalui mekanisme menu backend agar muncul di `/menu/user-menu`.

URL menu:

```text
/pengajuan-dana
```

Judul menu yang disarankan:

```text
Pengajuan Non Part
```

## Logging dan Audit

Minimal audit yang harus tersedia:

- siapa membuat
- siapa approve
- siapa verify
- siapa reject
- siapa return
- kapan setiap aksi dilakukan
- alasan reject
- alasan return
- revision number saat event terjadi

History workflow harus dapat ditampilkan di UI detail.

## Non-Functional Requirements

### Security

- semua endpoint wajib menggunakan bearer auth
- seluruh query wajib discoping ke business-unit yang valid
- permission mutation tidak boleh hanya berbasis role, tetapi juga status dokumen

### Performance

- list wajib server-side pagination
- detail eager load relasi yang dibutuhkan saja
- export bisa async jika dataset besar

### Reliability

- verify dan return harus aman terhadap duplicate submit
- upload harus memiliki kompensasi jika write DB gagal atau upload file gagal

### Compatibility

- frontend baru harus kompatibel dengan API `/api/pengajuan-dana`
- mobile existing tidak boleh rusak oleh penambahan endpoint baru

## Rencana Migrasi Implementasi

### Fase 0 - Discovery dan hardening kontrak

- verifikasi DDL actual tabel legacy
- verifikasi unique key dan default value
- verifikasi enum field aktual
- tentukan rounding policy
- petakan seluruh foreign key dan validasi bisnis

### Fase 1 - Backend foundation

- tambah history table
- tambah kolom additive `revision_no` dan `last_action`
- refactor service dan validation
- lengkapi create/update/delete/upload/options/export
- tambahkan endpoint `return`
- perbaiki permission dan transaction scope

### Fase 2 - Frontend web

- implementasi API hook `src/api/pengajuan-dana.js`
- implementasi list/filter/detail
- implementasi create/edit dengan `FieldArray`
- implementasi upload lampiran
- implementasi approve/reject/return/verify
- implementasi history dan export

### Fase 3 - UAT dan cutover

- uji parity dengan legacy
- uji data existing
- uji role matrix
- uji dokumen yang di-return
- uji verify pembentukan downstream docs
- training user jika ada perubahan UX

## Acceptance Criteria

### Functional

1. User dapat membuka `/pengajuan-dana` dan melihat daftar pengajuan sesuai scope bisnis.
2. User pembuat dapat membuat pengajuan baru dengan item dinamis dan multi attachment.
3. User pembuat dapat mengedit pengajuan berstatus `open`.
4. Approver dapat approve pengajuan `open`.
5. Approver dapat reject pengajuan `open` dengan alasan wajib.
6. Approver dapat return pengajuan `open` dengan alasan wajib.
7. Finance dapat verify pengajuan `approval` dan sistem membentuk dokumen turunan yang diperlukan.
8. Finance dapat reject pengajuan `approval` dengan alasan wajib.
9. Finance dapat return pengajuan `approval` ke `open` dengan alasan wajib.
10. Pengajuan yang di-return dapat diedit kembali oleh pembuat.
11. Pengajuan yang di-return wajib melewati approval ulang sebelum verify.
12. History workflow tampil di detail dan memuat approve/reject/return/verify.
13. Export Excel menghasilkan sheet `Master` dan `Detail` sesuai filter.
14. Permission action di UI sesuai hasil endpoint permissions.

### Technical

1. Semua mutation workflow menulis record ke history table.
2. Semua mutation workflow divalidasi berdasarkan role, scope bisnis, dan status.
3. Verify dan return memakai lock/transaction yang aman.
4. Header total dihitung ulang oleh backend setiap save/update/approve yang memodifikasi item.
5. Alasan reject dan return tersimpan permanen dan dapat dibaca ulang.

## Test Scenario Minimum

### Backend

- create dengan IDR
- create dengan USD
- create dengan pemasok
- create dengan karyawan reimbursement
- create dengan penerima lainnya
- update saat `open`
- delete own saat `open`
- approve valid
- reject valid
- return oleh approver
- return oleh finance
- verify valid dan membentuk downstream docs
- verify gagal rollback penuh
- reject/return tanpa reason ditolak
- akses lintas business unit ditolak
- concurrent verify hanya satu yang lolos
- concurrent return hanya satu yang lolos

### Frontend

- list filter pagination
- create form item add/remove
- upload multi file
- edit returned document
- approve flow
- reject flow
- return flow
- verify flow
- export flow
- responsive mobile/desktop

## Risiko dan Mitigasi

### Risiko 1

Kontrak data legacy tidak sepenuhnya terdokumentasi.

Mitigasi:

- lakukan discovery DDL sebelum implementasi final
- buat migration additive, bukan destructive

### Risiko 2

Verify membentuk banyak dokumen turunan sehingga rawan inkonsistensi data.

Mitigasi:

- gunakan satu transaction dan row lock
- tambahkan idempotency guard

### Risiko 3

Pengguna bingung membedakan reject dan return.

Mitigasi:

- UI copy harus eksplisit
- reason wajib
- badge status `Open - Perlu Revisi`
- history harus terlihat jelas

### Risiko 4

Mobile existing memakai endpoint yang sama.

Mitigasi:

- endpoint existing dipertahankan
- perubahan response existing jangan breaking
- endpoint baru additive

## Open Item Implementasi

- konfirmasi apakah approver boleh mengubah item saat approve atau hanya approve tanpa edit
- konfirmasi daftar exact enum untuk `kategori`, `type_bayar`, `penerima`, dan `prioritas`
- konfirmasi apakah attachment tetap image-only atau ditambah PDF
- konfirmasi apakah delete admin untuk dokumen non-open tetap diizinkan
- konfirmasi apakah ringkasan status `returned_open` perlu summary khusus atau cukup dihitung dari `open + last_action`

## Definisi Selesai

Fitur dianggap selesai jika:

- backend dan frontend baru mendukung flow create sampai verify
- return berjalan pada level approver dan finance
- history workflow dapat ditinjau user
- data turunan setelah verify valid
- akses user sesuai scope bisnis dan role
- parity bisnis utama dengan legacy tercapai tanpa membawa defect kritis legacy
