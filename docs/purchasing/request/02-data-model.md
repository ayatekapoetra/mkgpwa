# 02 — Data Model

## 1. Tabel Utama

### `trx_request_orders` (Header PR)

| Kolom | Tipe | Wajib | Default | Keterangan |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | ✓ | AUTO_INCREMENT | PK |
| `bisnis_id` | INT | ✓ | | Bisnis unit |
| `kode` | VARCHAR(50) | ✓ | | Kode PR, unique, generated backend |
| `prioritas` | ENUM `P1`,`P2`,`P3` | ✓ | `P3` | Prioritas PR |
| `cabang_id` | INT | ✓ | | Cabang |
| `gudang_id` | INT | ✓ | | Gudang tujuan |
| `date_ro` | DATE | ✓ | | Tanggal permintaan |
| `datestatus` | DATETIME | | NULL | Timestamp status terakhir |
| `description` | TEXT | | NULL | Narasi PR |
| `backlog_id` | BIGINT | | NULL | Link ke operational backlog |
| `total_ro` | DECIMAL(18,2) | | 0 | Total nilai PR (dihitung server) |
| `createdby` | INT | ✓ | | User pembuat |
| `status` | ENUM `draft`,`active`,`approved`,`finish`,`done` | ✓ | `draft` | Status header |
| `aktif` | ENUM `Y`,`N` | ✓ | `Y` | Soft-delete |
| `deleted_by` | INT | | NULL | User yang menghapus |
| `source_system` | VARCHAR(20) | | `legacy` | Penanda origin: `legacy`, `next`, `mro`, `backlog` |
| `version` | INT UNSIGNED | ✓ | 1 | Optimistic locking |
| `whatsapp_reminder_sent` | TINYINT | | 0 | Flag cron reminder |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP | |
| `updated_at` | DATETIME | | CURRENT_TIMESTAMP ON UPDATE | |

### `trx_request_orders_items` (Item PR)

| Kolom | Tipe | Wajib | Default | Keterangan |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | ✓ | AUTO_INCREMENT | PK |
| `ro_id` | BIGINT | ✓ | | FK → `trx_request_orders.id` |
| `barang_id` | INT | | NULL | FK → master barang |
| `coa_id` | INT | | NULL | FK → COA (untuk item non-barang) |
| `pemasok_id` | INT | | NULL | FK → master pemasok (diisi saat validate) |
| `equipment_id` | BIGINT | | NULL | FK → master equipment |
| `woid` | BIGINT | | NULL | Link ke work order / MRO |
| `mro_id` | BIGINT | | NULL | Link ke Material Request Order |
| `stn` | VARCHAR(20) | | NULL | Satuan |
| `qty_act` | DECIMAL(18,2) | | 0 | Qty actual (diterima) |
| `qty_req` | DECIMAL(18,2) | ✓ | | Qty diminta |
| `qty_acc` | DECIMAL(18,2) | | NULL | Qty disetujui (diisi saat validate) |
| `prioritas` | VARCHAR(10) | | NULL | Prioritas item |
| `metode` | ENUM `tunai`,`kredit` | | NULL | Metode pembayaran (diisi saat validate) |
| `currency` | ENUM `IDR`,`USD` | | `IDR` | Mata uang |
| `kurs` | DECIMAL(18,6) | | 1.000000 | Kurs ke IDR |
| `harga` | DECIMAL(18,2) | | 0 | Harga satuan (diisi saat validate) |
| `harga_usd` | DECIMAL(18,2) | | 0 | Harga USD (jika currency=USD) |
| `potongan` | DECIMAL(18,2) | | 0 | Diskon |
| `tot_harga` | DECIMAL(18,2) | | 0 | Gross = qty_acc × harga × kurs |
| `ppn` | DECIMAL(5,2) | | 0 | Tarif PPN (%) |
| `ppn_rp` | DECIMAL(18,2) | | 0 | Nilai PPN |
| `subtotal` | DECIMAL(18,2) | | 0 | Total line = taxable + tax |
| `user_validated` | INT | | NULL | User purchasing yang memvalidasi |
| `date_validated` | DATETIME | | NULL | Timestamp validasi |
| `user_approved` | INT | | NULL | User approver |
| `date_approved` | DATETIME | | NULL | Timestamp approval |
| `po_sts` | ENUM `Y`,`N` | ✓ | `N` | Status PO sudah dibuat |
| `description` | TEXT | | NULL | Catatan item |
| `aktif` | ENUM `Y`,`N` | ✓ | `Y` | Soft-delete |
| `deleted_by` | INT | | NULL | User yang menghapus item |
| `source_system` | VARCHAR(20) | | `legacy` | Origin item |
| `version` | INT UNSIGNED | ✓ | 1 | Optimistic locking |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP | |
| `updated_at` | DATETIME | | CURRENT_TIMESTAMP ON UPDATE | |

### `trx_procurement` (Header Purchase Order)

Dibuat otomatis saat approval. Lihat `docs/purchasing/order/` untuk detail lengkap.

### `trx_procurement_items` (Item PO)

| Kolom tambahan | Tipe | Keterangan |
|---|---|---|
| `pr_item_id` | BIGINT | FK langsung → `trx_request_orders_items.id` (unique active) |
| `pr_id` | BIGINT | FK → `trx_request_orders.id` (denormalized) |

### `mon_request_part` (Monitoring)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `roitem` | BIGINT | FK → `trx_request_orders_items.id` |
| `barang_id` | INT | FK → master barang (bukan `barangid`) |
| `status` | TINYINT | 1=NPR, 2=CPR, 3=VPR, 4=NPO |
| `poitem` | BIGINT | FK → `trx_procurement_items.id` |
| `poqty` | DECIMAL | Qty PO |
| `podate` | DATE | Tanggal PO |

## 2. State Machine

```text
                    ┌─────────────────────────────────────────────┐
                    │                                             │
                    ▼                                             │
┌───────┐  submit  ┌────────┐ all validated ┌──────────┐ all approved ┌────────┐
│ draft │ ──────> │ active │ ────────────> │ approved │ ───────────> │ finish │
└───────┘         └────────┘               └──────────┘              └────────┘
   │  edit           │  validate               │  approve                 │
   │  delete         │  delete (belum dival)   │                          │ rollback
   │  attach         │  attach                 │                          │ (admin)
   └─────────────────┘                        └──────────────────────────┘
```

### Transisi valid

| Dari | Ke | Trigger | Syarat |
|---|---|---|---|
| `draft` | `active` | submit | ≥1 item aktif, header lengkap |
| `active` | `approved` | validate semua item aktif | semua item aktif punya `user_validated` |
| `approved` | `finish` | approve semua item aktif | semua item aktif punya `user_approved` & PO dibuat |
| `active` | `draft` | rollback (admin) | belum ada item tervalidasi |
| `approved` | `active` | rollback (admin) | reset validation |
| `finish` | `approved` | rollback (admin) | batalkan PO + reset approval |
| `finish` | `active` | rollback (admin) | batalkan PO + reset approval + reset validation |

### Transisi ilegal

- `finish → active` tanpa membatalkan PO ❌
- `approved → active` oleh non-admin ❌
- `draft → approved` (skip validasi) ❌
- `active → finish` (skip approval) ❌
- Edit `finish` langsung tanpa rollback ❌

### Perhitungan status header

```js
function computeStatus(items) {
  const active = items.filter(i => i.aktif === 'Y')
  if (active.length === 0) return 'draft'  // tidak ada item, tetap draft
  
  const allValidated = active.every(i => i.user_validated !== null)
  const allApproved = active.every(i => i.user_approved !== null)
  
  if (allApproved) return 'finish'
  if (allValidated) return 'approved'
  return 'active'
}
```

### Perhitungan `total_ro`

```sql
UPDATE trx_request_orders
SET total_ro = (
  SELECT COALESCE(SUM(subtotal), 0)
  FROM trx_request_orders_items
  WHERE ro_id = :prId AND aktif = 'Y'
)
WHERE id = :prId
```

## 3. Perhitungan Nilai Finansial

Semua perhitungan dilakukan **server-side** menggunakan DECIMAL. Client hanya mengirim input dasar; server menghitung turunan.

### Input dari client (validate)

```json
{
  "qty_acc": "2.00",
  "currency": "IDR",
  "kurs": "1.000000",
  "unit_price": "500000.00",
  "discount": "25000.00",
  "tax_rate": "11.00",
  "payment_method": "kredit"
}
```

### Perhitungan server

```text
exchange_rate = currency === 'IDR' ? 1 : kurs
gross = qty_acc × unit_price × exchange_rate
taxable = gross - discount
tax_amount = taxable × (tax_rate / 100)
subtotal = taxable + tax_amount

harga_usd = currency === 'USD' ? unit_price : 0
tot_harga = gross
ppn = tax_rate
ppn_rp = tax_amount
```

### Rounding policy

- Semua nilai finansial disimpan dengan 2 decimal places.
- Kurs disimpan dengan 6 decimal places.
- PPN disimpan dengan 2 decimal places (persen).
- Perhitungan antara menggunakan presisi penuh, pembulatan hanya pada penyimpanan akhir.
- `ROUND_HALF_UP` untuk semua pembulatan.

### Validasi finansial

| Field | Aturan |
|---|---|
| `qty_acc` | > 0, ≤ `qty_req` (kecuali admin override) |
| `unit_price` | > 0 |
| `kurs` | > 0, wajib jika currency=USD |
| `discount` | ≥ 0, ≤ gross |
| `tax_rate` | 0 atau 11 (whitelist enum) |
| `payment_method` | `tunai` atau `kredit` |

## 4. Generator Kode

### Kode PR

Format (legacy): `PR-YYYYMMDDHHmmss-XXX` atau format bisnis-specific.

Backend harus:

1. Gunakan `SELECT ... FOR UPDATE` pada counter/last record.
2. Atau gunakan sequence table dengan atomic increment.
3. Atau gunakan UUID + unique constraint + retry.
4. **Tidak boleh** membaca last record tanpa lock lalu increment.

### Kode PO

Format (legacy): `CBMTK-YYMMXXX` (bisnis-specific).

Backend harus memasang hook `beforeCreate` pada model `TrxProcurement` atau service yang setara, dengan mekanisme concurrency-safe yang sama.

## 5. Mapping Legacy → Target

| Legacy field | Target field | Catatan |
|---|---|---|
| `trx_request_orders` | `trx_request_orders` | Tabel sama |
| `TrxOrderBeli` | `PurchaseRequest` | Model berbeda, tabel sama |
| `trx_request_orders_items` | `trx_request_orders_items` | Tabel sama |
| `TrxOrderBeliItem` | `PurchaseRequestItem` | Model berbeda, tabel sama |
| `mon_request_part.barangid` | `mon_request_part.barang_id` | **Perbaikan typo** |
| Role hard-coded di controller | `sys_accesspermission` | Migration permission |
| `status` default via schema | `status` eksplisit `draft`/`active` | Eksplisit di backend |
| `total_ro` dari browser | `total_ro` dari server | Server-side calc |
| `subtotal` dari browser | `subtotal` dari server | Server-side calc |
| Generator kode tanpa lock | Generator dengan lock/retry | Concurrency-safe |
| Model hook monitoring | Service eksplisit atau hook | Pastikan terdaftar |

## 6. Index yang Direkomendasikan

```sql
-- Header
CREATE INDEX idx_ro_status_bisnis ON trx_request_orders(status, aktif, bisnis_id);
CREATE INDEX idx_ro_cabang_date ON trx_request_orders(cabang_id, date_ro);
CREATE INDEX idx_ro_createdby ON trx_request_orders(createdby);
CREATE UNIQUE INDEX idx_ro_kode ON trx_request_orders(kode);

-- Items
CREATE INDEX idx_roitem_ro_aktif ON trx_request_orders_items(ro_id, aktif);
CREATE INDEX idx_roitem_validated ON trx_request_orders_items(ro_id, aktif, user_validated);
CREATE INDEX idx_roitem_approved ON trx_request_orders_items(ro_id, aktif, user_approved);

-- PO items mapping
CREATE UNIQUE INDEX idx_poitem_pr_item_active
  ON trx_procurement_items(pr_item_id)
  WHERE pr_item_id IS NOT NULL AND aktif = 'Y';

-- Monitoring
CREATE INDEX idx_monreq_roitem ON mon_request_part(roitem);
CREATE INDEX idx_monreq_barang ON mon_request_part(barang_id);
```

## 7. Tabel Tambahan (Baru)

### `pr_command_audit` (Audit Trail)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BIGINT | PK |
| `pr_id` | BIGINT | PR yang terdampak |
| `pr_item_ids` | JSON | Item yang terdampak |
| `command` | VARCHAR(50) | `create`, `submit`, `validate`, `approve`, `rollback`, `delete`, `attach` |
| `actor_id` | INT | User yang melakukan |
| `actor_role` | VARCHAR(50) | Role saat aksi |
| `before` | JSON | Snapshot sebelum |
| `after` | JSON | Snapshot sesudah |
| `reason` | TEXT | Alasan (wajib untuk rollback) |
| `idempotency_key` | VARCHAR(100) | Key unik |
| `po_ids` | JSON | PO yang terbentuk (untuk approve) |
| `source_system` | VARCHAR(20) | `next`, `legacy` |
| `request_id` | VARCHAR(100) | Correlation ID |
| `created_at` | DATETIME | Timestamp |

### `pr_idempotency` (Idempotency Store)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BIGINT | PK |
| `key` | VARCHAR(100) | Unique |
| `pr_id` | BIGINT | PR terkait |
| `command` | VARCHAR(50) | |
| `status` | ENUM `pending`,`success`,`failed` | |
| `response_hash` | VARCHAR(64) | Hash response untuk replay |
| `response_body` | LONGTEXT | Response snapshot |
| `expires_at` | DATETIME | TTL |
| `created_at` | DATETIME | |

### `pr_notification_outbox` (Transactional Outbox)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BIGINT | PK |
| `pr_id` | BIGINT | |
| `event` | VARCHAR(50) | `submitted`, `validated`, `approved`, `rolled_back`, `deleted` |
| `recipient_id` | INT | |
| `payload` | JSON | |
| `status` | ENUM `pending`,`sent`,`failed` | |
| `attempts` | INT | |
| `next_retry_at` | DATETIME | |
| `created_at` | DATETIME | |

## 8. Constraint Unik

```sql
-- Satu PR item hanya boleh punya satu active PO item
ALTER TABLE trx_procurement_items
ADD CONSTRAINT uc_pr_item_active
UNIQUE (pr_item_id)
WHERE pr_item_id IS NOT NULL AND aktif = 'Y';

-- Idempotency key unik per command
ALTER TABLE pr_idempotency
ADD CONSTRAINT uc_idem_key UNIQUE (key);
```

> Catatan: MySQL tidak mendukung partial unique index. Gunakan generated column `pr_item_active_key` yang berisi `pr_item_id` jika `aktif='Y'` dan NULL jika tidak, lalu unique index pada kolom tersebut.