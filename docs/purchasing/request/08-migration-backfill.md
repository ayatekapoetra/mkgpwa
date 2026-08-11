# 08 — Migration & Backfill

## 1. Strategi Database

`mrt-v3` dan `be` berbagi database produksi yang sama. Tabel utama (`trx_request_orders`, `trx_request_orders_items`, `trx_procurement`, `trx_procurement_items`, `mon_request_part`) tidak disalin. Yang dibutuhkan adalah **schema hardening** dan **data reconciliation**.

### Prinsip

- Tabel utama tetap, tidak dibuat tabel baru untuk data PR.
- Tabel tambahan hanya untuk: audit, idempotency, outbox.
- Tidak ada perubahan ID atau PK.
- Tidak ada perubahan tipe kolom existing yang breaking.
- Migration idempotent (safe to re-run).
- Backfill dapat dijalankan dry-run sebelum production.

## 2. Schema Migration

### 2.1 Migration: Tabel Tambahan

```sql
-- pr_command_audit
CREATE TABLE IF NOT EXISTS pr_command_audit (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pr_id BIGINT,
  pr_item_ids JSON,
  command VARCHAR(50) NOT NULL,
  actor_id INT NOT NULL,
  actor_role VARCHAR(50),
  before_state JSON,
  after_state JSON,
  reason TEXT,
  idempotency_key VARCHAR(100),
  po_ids JSON,
  source_system VARCHAR(20) DEFAULT 'next',
  request_id VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_pr (pr_id),
  INDEX idx_audit_command (command),
  INDEX idx_audit_actor (actor_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;

-- pr_idempotency
CREATE TABLE IF NOT EXISTS pr_idempotency (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  pr_id BIGINT,
  command VARCHAR(50) NOT NULL,
  status ENUM('pending','success','failed') DEFAULT 'pending',
  response_hash VARCHAR(64),
  response_body LONGTEXT,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_idem_key (key),
  INDEX idx_idem_expires (expires_at)
) ENGINE=InnoDB;

-- pr_notification_outbox
CREATE TABLE IF NOT EXISTS pr_notification_outbox (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pr_id BIGINT,
  event VARCHAR(50) NOT NULL,
  recipient_id INT NOT NULL,
  payload JSON,
  status ENUM('pending','sent','failed') DEFAULT 'pending',
  attempts INT DEFAULT 0,
  next_retry_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_outbox_status (status),
  INDEX idx_outbox_retry (next_retry_at)
) ENGINE=InnoDB;
```

### 2.2 Migration: Kolom Tambahan pada Tabel Existing

```sql
-- trx_request_orders
ALTER TABLE trx_request_orders
  ADD COLUMN IF NOT EXISTS source_system VARCHAR(20) DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS version INT UNSIGNED DEFAULT 1,
  ADD COLUMN IF NOT EXISTS whatsapp_reminder_sent TINYINT DEFAULT 0;

-- trx_request_orders_items
ALTER TABLE trx_request_orders_items
  ADD COLUMN IF NOT EXISTS source_system VARCHAR(20) DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS version INT UNSIGNED DEFAULT 1,
  ADD COLUMN IF NOT EXISTS deleted_by INT NULL;

-- trx_procurement_items
ALTER TABLE trx_procurement_items
  ADD COLUMN IF NOT EXISTS pr_item_id BIGINT NULL,
  ADD COLUMN IF NOT EXISTS pr_id BIGINT NULL;
```

### 2.3 Migration: Unique Constraint PO Item

MySQL tidak mendukung partial unique index. Gunakan generated column:

```sql
ALTER TABLE trx_procurement_items
  ADD COLUMN pr_item_active_key BIGINT AS (
    CASE WHEN pr_item_id IS NOT NULL AND aktif = 'Y' THEN pr_item_id ELSE NULL END
  ) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS uc_poitem_pr_active
  ON trx_procurement_items (pr_item_active_key);
```

### 2.4 Migration: Index

```sql
CREATE INDEX IF NOT EXISTS idx_ro_status_bisnis
  ON trx_request_orders(status, aktif, bisnis_id);
CREATE INDEX IF NOT EXISTS idx_ro_cabang_date
  ON trx_request_orders(cabang_id, date_ro);
CREATE INDEX IF NOT EXISTS idx_ro_createdby
  ON trx_request_orders(createdby);
CREATE INDEX IF NOT EXISTS idx_ro_kode
  ON trx_request_orders(kode);

CREATE INDEX IF NOT EXISTS idx_roitem_ro_aktif
  ON trx_request_orders_items(ro_id, aktif);
CREATE INDEX IF NOT EXISTS idx_roitem_validated
  ON trx_request_orders_items(ro_id, aktif, user_validated);
CREATE INDEX IF NOT EXISTS idx_roitem_approved
  ON trx_request_orders_items(ro_id, aktif, user_approved);

CREATE INDEX IF NOT EXISTS idx_monreq_roitem
  ON mon_request_part(roitem);
CREATE INDEX IF NOT EXISTS idx_monreq_barang_id
  ON mon_request_part(barang_id);
```

### 2.5 Migration: Fix `barangid` → `barang_id`

```sql
-- Jika kolom barangid masih ada dan barang_id belum ada:
ALTER TABLE mon_request_part
  CHANGE COLUMN barangid barang_id INT;
-- Atau tambahkan kolom baru dan backfill:
ALTER TABLE mon_request_part ADD COLUMN IF NOT EXISTS barang_id INT;
UPDATE mon_request_part SET barang_id = barangid WHERE barang_id IS NULL AND barangid IS NOT NULL;
```

### 2.6 Migration: Permission Submenu

```sql
-- Pastikan submenu purchasing-request ada
INSERT INTO sys_submenupermission (menu_id, name, url, icon, aktif, urut)
SELECT m.id, 'Purchasing Request', '/purchasing-request', 'shopping', 'Y', 11
FROM sys_menupermission m
WHERE m.url = '/scm' OR m.name = 'SCM'
AND NOT EXISTS (
  SELECT 1 FROM sys_submenupermission s
  WHERE s.url = '/purchasing-request'
);
```

### 2.7 Format Migration

Migration harus berupa Adonis migration class (bukan raw SQL), mengikuti pola:

```text
be/database/migrations/{timestamp}_{name}.js
```

```js
'use strict'

const Schema = use('Schema')

class CreatePrAuditTableSchema extends Schema {
  up() {
    this.create('pr_command_audit', (table) => {
      table.increments()
      table.bigint('pr_id').unsigned()
      table.json('pr_item_ids')
      table.string('command', 50).notNullable()
      table.integer('actor_id').unsigned().notNullable()
      table.string('actor_role', 50)
      table.json('before_state')
      table.json('after_state')
      table.text('reason')
      table.string('idempotency_key', 100)
      table.json('po_ids')
      table.string('source_system', 20).defaultTo('next')
      table.string('request_id', 100)
      table.datetime('created_at')
      table.index(['pr_id'])
      table.index(['command'])
      table.index(['created_at'])
    })
  }

  down() {
    this.drop('pr_command_audit')
  }
}

module.exports = CreatePrAuditTableSchema
```

## 3. Data Backfill

### 3.1 Recompute Status Header

```sql
-- Dry-run: identifikasi PR yang status header tidak konsisten
SELECT ro.id, ro.status,
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM trx_request_orders_items ri WHERE ri.ro_id = ro.id AND ri.aktif = 'Y') THEN 'draft'
    WHEN NOT EXISTS (SELECT 1 FROM trx_request_orders_items ri WHERE ri.ro_id = ro.id AND ri.aktif = 'Y' AND ri.user_validated IS NULL) THEN
      CASE WHEN NOT EXISTS (SELECT 1 FROM trx_request_orders_items ri WHERE ri.ro_id = ro.id AND ri.aktif = 'Y' AND ri.user_approved IS NULL) THEN 'finish' ELSE 'approved' END
    ELSE 'active'
  END AS expected_status
FROM trx_request_orders ro
WHERE ro.aktif = 'Y'
HAVING ro.status != expected_status;

-- Fix:
UPDATE trx_request_orders ro
SET status = (
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM trx_request_orders_items ri WHERE ri.ro_id = ro.id AND ri.aktif = 'Y') THEN 'draft'
    WHEN NOT EXISTS (SELECT 1 FROM trx_request_orders_items ri WHERE ri.ro_id = ro.id AND ri.aktif = 'Y' AND ri.user_validated IS NULL) THEN
      CASE WHEN NOT EXISTS (SELECT 1 FROM trx_request_orders_items ri WHERE ri.ro_id = ro.id AND ri.aktif = 'Y' AND ri.user_approved IS NULL) THEN 'finish' ELSE 'approved' END
    ELSE 'active'
  END
)
WHERE ro.aktif = 'Y';
```

### 3.2 Recompute `total_ro`

```sql
UPDATE trx_request_orders ro
SET total_ro = COALESCE(
  (SELECT SUM(ri.subtotal) FROM trx_request_orders_items ri
   WHERE ri.ro_id = ro.id AND ri.aktif = 'Y'), 0)
WHERE ro.aktif = 'Y';
```

### 3.3 Backfill `pr_item_id` Mapping

```sql
-- Link PO items ke PR items berdasarkan barang_id + PO yang berasal dari PR yang sama
UPDATE trx_procurement_items poi
JOIN trx_procurement po ON poi.procurement_id = po.id
JOIN trx_request_orders_items pri ON pri.barang_id = poi.barang_id
SET poi.pr_item_id = pri.id, poi.pr_id = pri.ro_id
WHERE po.ro_id = pri.ro_id
  AND poi.pr_item_id IS NULL
  AND poi.aktif = 'Y'
  AND pri.aktif = 'Y';
```

> Catatan: ini heuristic. Jika ada multiple item dengan barang yang sama dalam satu PR, mapping mungkin tidak akurat. Verifikasi manual diperlukan.

### 3.4 Backfill Monitoring

```sql
-- Identifikasi PR item tanpa monitoring
SELECT ri.id, ri.ro_id
FROM trx_request_orders_items ri
LEFT JOIN mon_request_part m ON m.roitem = ri.id
WHERE ri.aktif = 'Y' AND m.id IS NULL;

-- Insert monitoring untuk item tanpa record
INSERT INTO mon_request_part (roitem, ro_id, barang_id, status)
SELECT ri.id, ri.ro_id, ri.barang_id,
  CASE
    WHEN ri.user_approved IS NOT NULL THEN 3
    WHEN ri.user_validated IS NOT NULL THEN 2
    ELSE 1
  END
FROM trx_request_orders_items ri
LEFT JOIN mon_request_part m ON m.roitem = ri.id
WHERE ri.aktif = 'Y' AND m.id IS NULL;
```

### 3.5 Fix Monitoring `barangid` → `barang_id`

```sql
UPDATE mon_request_part
SET barang_id = barangid
WHERE barang_id IS NULL AND barangid IS NOT NULL;
```

### 3.6 Set `source_system` untuk Existing Data

```sql
-- Semua PR yang dibuat oleh legacy → source_system='legacy'
UPDATE trx_request_orders SET source_system = 'legacy' WHERE source_system IS NULL;
UPDATE trx_request_orders_items SET source_system = 'legacy' WHERE source_system IS NULL;
```

### 3.7 Init `version`

```sql
UPDATE trx_request_orders SET version = 1 WHERE version IS NULL OR version = 0;
UPDATE trx_request_orders_items SET version = 1 WHERE version IS NULL OR version = 0;
```

## 4. Data Quality Audit

### 4.1 Identifikasi Anomali

```sql
-- PR finish tapi ada item aktif belum di-approve
SELECT ro.id, ro.kode, ro.status, ri.id AS item_id
FROM trx_request_orders ro
JOIN trx_request_orders_items ri ON ri.ro_id = ro.id
WHERE ro.status = 'finish' AND ro.aktif = 'Y'
  AND ri.aktif = 'Y' AND ri.user_approved IS NULL;

-- Item approved tapi po_sts != Y
SELECT ri.id, ri.ro_id, ri.user_approved, ri.po_sts
FROM trx_request_orders_items ri
WHERE ri.user_approved IS NOT NULL AND ri.po_sts != 'Y' AND ri.aktif = 'Y';

-- po_sts = Y tapi tidak ada PO item
SELECT ri.id, ri.ro_id
FROM trx_request_orders_items ri
WHERE ri.po_sts = 'Y' AND ri.aktif = 'Y'
  AND NOT EXISTS (
    SELECT 1 FROM trx_procurement_items poi
    WHERE poi.pr_item_id = ri.id AND poi.aktif = 'Y'
  );

-- Multiple active PO items untuk satu PR item
SELECT pr_item_id, COUNT(*) AS cnt
FROM trx_procurement_items
WHERE pr_item_id IS NOT NULL AND aktif = 'Y'
GROUP BY pr_item_id
HAVING cnt > 1;

-- PR tanpa kode
SELECT id FROM trx_request_orders WHERE kode IS NULL OR kode = '';

-- PO tanpa kdpo
SELECT id FROM trx_procurement WHERE kdpo IS NULL OR kdpo = '';
```

### 4.2 Fix Plan

| Anomali | Fix |
|---|---|
| Status tidak konsisten | Recompute status (3.1) |
| Item approved tanpa po_sts | Set `po_sts='Y'` |
| po_sts=Y tanpa PO | Set `po_sts='N'` atau buat PO record |
| Multiple PO items | Soft-delete duplikat, keep earliest |
| PR tanpa kode | Generate kode, update |
| PO tanpa kdpo | Generate kdpo, update |

## 5. Coexistence Strategy

### 5.1 Single Writer Principle

Hanya satu sistem yang boleh menulis per PR. Tidak ada dual-write untuk aksi yang sama.

### 5.2 `source_system` Routing

| `source_system` | Reader | Writer |
|---|---|---|
| `legacy` | Both | Legacy |
| `next` | Both | Target (nextjs + be) |
| `mro` | Both | MRO (create), Target (validate onward) |
| `backlog` | Both | Backlog (create), Target (validate onward) |

### 5.3 Feature Flag

```text
PURCHASE_REQUEST_NEXT_WRITE_ENABLED=false
PURCHASE_REQUEST_NEXT_CREATE_ENABLED=false
PURCHASE_REQUEST_NEXT_VALIDATE_ENABLED=false
PURCHASE_REQUEST_NEXT_APPROVE_ENABLED=false
PURCHASE_REQUEST_NEXT_ROLLBACK_ENABLED=false
PURCHASE_REQUEST_LEGACY_READ_ONLY=false
```

Set per bisnis/cabang jika perlu:

```text
PURCHASE_REQUEST_NEXT_BISNIS_WHITELIST=1,2,3
```

### 5.4 Kill Switch

Setiap mutation endpoint memiliki kill switch:

```text
POST /api/scm/purchase-requests/:id/validate
→ if !PURCHASE_REQUEST_NEXT_VALIDATE_ENABLED → 503 Service Unavailable
→ redirect ke legacy atau tampilkan pesan
```

### 5.5 Reconciliation Job

Job harian yang membandingkan:

```text
PR count (legacy vs target)
Item count (legacy vs target)
Status consistency
total_ro accuracy
Monitoring coverage
PO mapping completeness
```

Output: report dengan mismatch untuk investigasi.

## 6. Cutover Checklist

### Sebelum Cutover

- [ ] Schema migration dijalankan di staging.
- [ ] Data backfill dijalankan dry-run di staging.
- [ ] Data quality audit tidak menemukan anomali critical.
- [ ] Permission submenu `/purchasing-request` dikonfigurasi.
- [ ] Feature flag `false` (mutation target disabled).
- [ ] Read-only shadow: list/detail target 100% match legacy.
- [ ] Test suite lulus (unit, integration, E2E, concurrency).
- [ ] Rollback drill sukses di staging.
- [ ] Monitoring job berjalan.

### Cutover (Per Bisnis/Cabang)

- [ ] Set `PURCHASE_REQUEST_NEXT_CREATE_ENABLED=true` untuk bisnis canary.
- [ ] Set `PURCHASE_REQUEST_LEGACY_READ_ONLY=true` untuk PR `source_system='next'`.
- [ ] Pantau error rate, latency, data consistency 24 jam.
- [ ] Aktifkan validate → pantau 24 jam.
- [ ] Aktifkan approve → pantau 24 jam.
- [ ] Aktifkan rollback → pantau.

### Setelah Cutover

- [ ] Semua bisnis menggunakan target.
- [ ] Legacy mutation disabled (`PURCHASE_REQUEST_LEGACY_READ_ONLY=true` global).
- [ ] Reconciliation job harian bersih (0 mismatch).
- [ ] Observasi 2 minggu.
- [ ] Decommission legacy PR routes.

## 7. Rollback Cutover

Jika target bermasalah:

1. Set `PURCHASE_REQUEST_NEXT_*_ENABLED=false`.
2. Set `PURCHASE_REQUEST_LEGACY_READ_ONLY=false`.
3. PR yang sudah `source_system='next'` tetap bisa diedit di legacy (schema compatible).
4. Investigasi dan fix di target.
5. Ulangi canary.