# 04 — Workflow

Dokumen ini mendefinisikan alur lengkap setiap aksi pada Purchasing Request, termasuk validasi, transaksi, side effects, dan notifikasi.

## 1. Create Draft

### Trigger
User dengan permission `insert` membuat PR baru.

### Input
```json
{
  "bisnis_id, cabang_id, gudang_id, date_ro, prioritas, description",
  "backlog_id (opsional, dari backlog)",
  "status": "draft",
  "items": [{ "barang_id", "equipment_id", "description", "qty_req", "stn" }]
}
```

### Validasi
1. User punya permission `insert`.
2. `bisnis_id` dalam scope user.
3. `cabang_id` milik `bisnis_id`.
4. `gudang_id` milik `cabang_id`.
5. `date_ro` valid (tidak di masa lalu kecuali admin).
6. `prioritas` dalam enum `P1`,`P2`,`P3`.
7. Minimal 1 item aktif.
8. Setiap item: `barang_id` atau `coa_id` wajib (tidak keduanya kosong).
9. `qty_req` > 0.
10. `stn` tersedia (dari master barang atau input manual).
11. Jika `backlog_id` ada, verifikasi backlog valid dan belum punya PR.

### Proses (Transaksi)
```text
BEGIN
  1. Generate kode PR (lock + retry)
  2. Insert trx_request_orders (status='draft', source_system='next', createdby=user.id)
  3. Insert trx_request_orders_items (aktif='Y')
  4. Insert mon_request_part (status=1 NPR) untuk setiap item
  5. Jika backlog_id: update backlog.status = 'pr_created'
  6. Insert pr_command_audit (command='create')
  7. Save attachment (jika ada)
COMMIT
```

### Notifikasi
- Tidak ada notifikasi untuk create draft (belum masuk antrean).

### Response
`201 Created` dengan `id`, `kode`, `status='draft'`, `version=1`.

---

## 2. Submit (Draft → Active)

### Trigger
Requester men-submit draft.

### Validasi
1. User punya permission `insert` atau `update`.
2. PR status = `draft`.
3. User adalah owner atau admin.
4. Minimal 1 item aktif.
5. Header lengkap (bisnis, cabang, gudang, date_ro, prioritas).

### Proses (Transaksi)
```text
BEGIN
  1. SELECT ... FOR UPDATE pada header PR
  2. Verifikasi status masih 'draft'
  3. UPDATE status='active', datestatus=NOW()
  4. Increment version
  5. Insert pr_command_audit (command='submit')
  6. Insert pr_notification_outbox (event='submitted', recipient=purchasing users)
COMMIT
```

### Notifikasi (Outbox)
- Push ke semua user dengan permission `validate` pada bisnis tersebut.
- Payload: kode PR, requester, prioritas, jumlah item.

### Idempotency
Wajib `Idempotency-Key`.

---

## 3. Edit Header/Item

### Status yang dapat diedit
| Status | Header | Item | Catatan |
|---|---|---|---|
| `draft` | ✓ (owner/admin) | ✓ (owner/admin) | Tambah/hapus/ubah item |
| `active` | ✓ (owner/admin, jika belum ada item tervalidasi) | ✓ (owner/admin, jika belum tervalidasi) | Tambah/hapus item yang belum tervalidasi |
| `approved` | ✗ | ✗ | Gunakan rollback |
| `finish` | ✗ | ✗ | Gunakan rollback |

### Validasi
1. User punya permission `update`.
2. User adalah owner atau admin.
3. Status memenuhi aturan di atas.
4. Jika menambah item: barang/COA valid, qty > 0.
5. Jika menghapus item: item belum tervalidasi.
6. Optimistic version check.

### Proses (Transaksi)
```text
BEGIN
  1. SELECT ... FOR UPDATE pada header + item
  2. Verifikasi version
  3. UPDATE header/item
  4. Jika item ditambah: insert item + mon_request_part (status=1)
  5. Jika item dihapus: soft-delete item (aktif='N'), hapus mon_request_part
  6. Recompute status header + total_ro
  7. Increment version
  8. Insert pr_command_audit
COMMIT
```

---

## 4. Validate (Check) — Active → Approved

### Trigger
Purchasing user dengan permission `validate` memvalidasi item PR.

### Pemilihan Item

- Validasi menggunakan batch selection eksplisit.
- Saat mode validasi dibuka, tidak ada item yang dipilih secara default.
- User dapat memilih satu, beberapa, atau seluruh item yang belum tervalidasi.
- Form supplier dan harga hanya aktif pada item yang dipilih.
- Backend hanya menerima dan memproses ID item yang dipilih.
- Item yang tidak dipilih tetap menunggu validasi dan tidak berubah.
- Jika masih ada item aktif yang belum tervalidasi, status header tetap `active`.

### Input (per item)
```json
{
  "id": 1001,
  "pemasok_id": 300,
  "qty_acc": "2.00",
  "currency": "IDR",
  "kurs": "1.000000",
  "unit_price": "500000.00",
  "discount": "25000.00",
  "tax_rate": "11.00",
  "payment_method": "kredit",
  "description": "Validated"
}
```

### Validasi
1. User punya permission `validate`.
2. PR status = `active` (atau `approved` untuk revalidasi item yang belum di-approve).
3. Setiap item:
   - Item milik PR pada URL (`ro_id` cocok).
   - Item aktif (`aktif='Y'`).
   - Item belum divalidasi (`user_validated IS NULL`).
   - `pemasok_id` aktif, scope bisnis.
   - `qty_acc` > 0, ≤ `qty_req` (kecuali admin override).
   - `unit_price` > 0.
   - `kurs` > 0 (wajib jika currency=USD).
   - `discount` ≥ 0, ≤ gross.
   - `tax_rate` dalam whitelist (0, 11).
   - `payment_method` dalam enum.
4. Tidak ada item dari PR lain dalam payload.
5. Tidak ada duplicate item ID.

### Proses (Transaksi)
```text
BEGIN
  1. SELECT ... FOR UPDATE pada header PR + semua item
  2. Verifikasi status PR
  3. Untuk setiap item dalam payload:
     a. Hitung finansial server-side:
        gross = qty_acc × unit_price × exchange_rate
        taxable = gross - discount
        tax_amount = taxable × tax_rate / 100
        subtotal = taxable + tax_amount
     b. UPDATE item:
        pemasok_id, qty_acc, currency, kurs, harga, harga_usd,
        potongan, tot_harga, ppn, ppn_rp, subtotal, metode,
        user_validated=user.id, date_validated=NOW()
     c. UPDATE mon_request_part: status=2 (CPR)
     d. Jika barang_id berubah, update referensi MRO (jika ada woid/mro_id)
  4. Recompute status header:
     - Jika semua item aktif tervalidasi → status='approved'
     - Jika masih ada yang belum → status='active'
  5. Recompute total_ro = SUM(subtotal) WHERE aktif='Y'
  6. Increment version
  7. Insert pr_command_audit (command='validate', before/after)
  8. Insert pr_notification_outbox:
     - Jika status → 'approved': notifikasi approver users
COMMIT
```

### Notifikasi (Outbox)
- Jika PR menjadi `approved`: push ke user dengan permission `approve` pada bisnis.
- Payload: kode PR, jumlah item, total.

### Idempotency
Wajib `Idempotency-Key`.

---

## 5. Approve — Approved → Finish

### Trigger
Approver dengan permission `approve` menyetujui item yang sudah divalidasi.

### Pemilihan Item

- Approval menggunakan batch selection eksplisit.
- Saat mode approval dibuka, tidak ada item yang dipilih secara default.
- User dapat memilih satu, beberapa, atau seluruh item yang sudah tervalidasi dan belum di-approve.
- Preview PO dan konfirmasi hanya menghitung item terpilih.
- Backend hanya membuat PO untuk item terpilih.
- Item yang tidak dipilih tetap menunggu approval.
- Jika masih ada item aktif yang belum di-approve, status header tetap `approved`.

### Input
```json
{
  "item_ids": [1001, 1002],
  "note": "Disetujui"
}
```

### Validasi
1. User punya permission `approve`.
2. PR status = `approved`.
3. Setiap `item_id`:
   - Milik PR pada URL.
   - Aktif (`aktif='Y'`).
   - Sudah divalidasi (`user_validated IS NOT NULL`).
   - Belum di-approve (`user_approved IS NULL`).
   - `po_sts='N'`.
4. Tidak ada item dari PR lain.
5. Tidak ada duplicate item ID.

### Proses (Transaksi)
```text
BEGIN
  1. SELECT ... FOR UPDATE pada header PR + semua item
  2. Verifikasi status PR = 'approved'
  3. Untuk setiap item:
     a. UPDATE item: user_approved=user.id, date_approved=NOW(), po_sts='Y'
     b. UPDATE mon_request_part: status=3 (VPR)
  4. Group approved items by:
     supplier + PPN + currency + payment_method + bisnis + cabang + gudang
  5. Untuk setiap group:
     a. Generate kode PO (lock + retry)
     b. INSERT trx_procurement (header PO)
     c. INSERT trx_procurement_items untuk setiap item:
        - pr_item_id = item.id (unique mapping)
        - pr_id = pr.id
        - Salin nilai finansial dari PR item
     d. UPDATE mon_request_part: status=4 (NPO), poitem, poqty, podate
  6. Recompute status header:
     - Jika semua item aktif di-approve → status='finish'
     - Jika masih ada → status='approved'
  7. Recompute total_ro
  8. Increment version
  9. Insert pr_command_audit (command='approve', po_ids=[...])
  10. Insert pr_notification_outbox (event='approved', recipient=requester)
COMMIT
```

### Grouping PO Detail

```text
Item A: supplier=300, ppn=11, currency=IDR, method=kredit
Item B: supplier=300, ppn=11, currency=IDR, method=kredit
Item C: supplier=400, ppn=11, currency=IDR, method=kredit
Item D: supplier=300, ppn=0,  currency=IDR, method=tunai

→ Group 1: {supplier=300, ppn=11, IDR, kredit} → PO #1 (Item A, B)
→ Group 2: {supplier=400, ppn=11, IDR, kredit} → PO #2 (Item C)
→ Group 3: {supplier=300, ppn=0,  IDR, tunai} → PO #3 (Item D)
```

### Notifikasi (Outbox)
- Push ke requester: "PR {kode} approved, PO dibuat: {list kode PO}".
- Push ke purchasing: "PR {kode} approved".

### Idempotency
Wajib `Idempotency-Key`. Retry dengan key yang sama mengembalikan daftar PO yang sama (tidak membuat PO baru).

### Concurrency Protection
- `SELECT ... FOR UPDATE` mencegah dua approval paralel.
- Unique constraint `pr_item_id` pada PO item mencegah PO duplikat.
- Jika unique constraint violation → `409 Idempotency conflict`.

---

## 6. Rollback

### Trigger
Administrator melakukan rollback dengan alasan wajib.

### Tipe Rollback

#### 6.1 Rollback Validation (approved → active)

```json
{
  "target_status": "active",
  "item_ids": [1001, 1002],
  "reason": "Supplier salah"
}
```

Proses:
```text
BEGIN
  1. SELECT ... FOR UPDATE header + items
  2. Verifikasi status = 'approved' atau 'active'
  3. Verifikasi item belum di-approve (user_approved IS NULL)
  4. Untuk setiap item:
     a. CLEAR: user_validated, date_validated, pemasok_id, qty_acc,
              currency, kurs, harga, potongan, ppn, subtotal, metode
     b. UPDATE mon_request_part: status=1 (NPR)
  5. Recompute status header
  6. Recompute total_ro
  7. Insert pr_command_audit (command='rollback', reason)
  8. Insert pr_notification_outbox (event='rolled_back')
COMMIT
```

#### 6.2 Rollback Approval (finish → approved atau active)

```json
{
  "target_status": "active",
  "item_ids": [1001],
  "reason": "Supplier batal, perlu revalidasi"
}
```

Proses:
```text
BEGIN
  1. SELECT ... FOR UPDATE header + items + PO + PO items
  2. Cek downstream PO:
     - Apakah PO sudah ada faktur beli? → BLOCK (409 DOWNSTREAM_DEPENDENCY)
     - Apakah PO sudah ada pembayaran? → BLOCK
     - Apakah PO sudah ada delivery order? → BLOCK
     - Apakah PO sudah close? → BLOCK
  3. Jika aman:
     a. Untuk setiap item:
        - CLEAR: user_approved, date_approved, po_sts='N'
        - UPDATE mon_request_part: status=2 (CPR)
     b. Untuk setiap PO terkait:
        - Soft-delete PO (aktif='N')
        - Soft-delete PO items (aktif='N')
     c. Jika target_status='active':
        - CLEAR juga: user_validated, date_validated, pemasok, harga, dll
        - UPDATE mon_request_part: status=1 (NPR)
     d. Recompute status header
     e. Recompute total_ro
     f. Insert pr_command_audit (command='rollback', reason, cancelled_pos)
     g. Insert pr_notification_outbox
COMMIT
```

#### 6.3 Rollback dengan Downstream (Admin Compensating)

Jika PO sudah memiliki downstream, admin dapat memaksa rollback dengan kompensasi:

```json
{
  "target_status": "active",
  "item_ids": [1001],
  "reason": "Koreksi error data",
  "force": true,
  "compensate": true
}
```

Proses:
```text
BEGIN
  1. Untuk setiap downstream PO (faktur, payment, delivery):
     a. Soft-delete / reverse dengan audit
     b. Catat compensating entry
  2. Soft-delete PO
  3. Reset PR item
  4. Insert pr_command_audit dengan snapshot downstream
COMMIT
```

Jika kompensasi tidak dapat diselesaikan otomatis:
```text
→ Status rollback = 'pending_resolution'
→ Insert audit dengan status pending
→ Notifikasi admin untuk resolusi manual
→ PR tetap 'finish' sampai resolusi selesai
```

### Validasi Rollback
1. User adalah `administrator` (bukan developer).
2. PR status bukan `draft`.
3. `reason` wajib (min 10 karakter).
4. `item_ids` minimal 1.
5. Setiap item milik PR pada URL.
6. Jika `target_status='active'`: reset validation juga.
7. Jika `target_status='approved'`: hanya reset approval.

### Idempotency
Wajib `Idempotency-Key`.

---

## 7. Delete (Soft-Delete)

### Aturan per status

| Status | Bisa delete? | Syarat |
|---|---|---|
| `draft` | ✓ | Owner/admin, permission `remove` |
| `active` | ✓ | Owner/admin, belum ada item tervalidasi |
| `approved` | ✗ | Gunakan rollback dulu |
| `finish` | ✗ | Gunakan rollback dulu |

### Proses (Transaksi)
```text
BEGIN
  1. SELECT ... FOR UPDATE header
  2. Verifikasi status dan ownership
  3. UPDATE header: aktif='N', deleted_by=user.id
  4. UPDATE items: aktif='N' untuk semua item
  5. DELETE/soft-delete mon_request_part
  6. Jika backlog_id: update backlog.status kembali
  7. Insert pr_command_audit (command='delete')
COMMIT
```

### Tidak boleh hard delete
- ID tidak boleh berubah (referensi PO/faktur mungkin masih ada).
- Soft-delete dengan `aktif='N'` dan `deleted_by`.

---

## 8. Attachment

### Upload
- Format: JPG, PNG, PDF, DOCX, XLSX (whitelist MIME).
- Maks 10 MB per file.
- Maks 10 file per PR.
- Upload setelah PR dibuat (bukan sebelum create).
- File disimpan ke storage (lokal/S3) lalu record `lampiran_files` di-link ke `ro_id`.

### Delete
- Hanya bisa oleh owner/admin.
- Status draft/active.
- Soft-delete file record, tidak hard-delete fisik (retention).

### View
- Permission `read`.
- URL ditampilkan pada response detail.
- Akses file melalui endpoint terpisah dengan auth check.

---

## 9. Print PDF

### Trigger
User dengan permission `read` mencetak PR.

### Proses
1. Backend generate PDF (PDFMake atau library setara).
2. PDF berisi:
   - Header: logo, nama perusahaan/bisnis, kode PR, tanggal.
   - Info: requester, cabang, gudang, prioritas, status.
   - Tabel item: no, kode barang, nama, qty req, qty acc, satuan, supplier, harga, PPN, subtotal.
   - Footer: total, validator, approver, tanggal, signature block.
   - Kolom harga hanya jika user punya permission `validate`/`approve`/admin.
3. Response: `application/pdf` blob.
4. Audit: catat print event.

---

## 10. Export Excel

### Trigger
User dengan permission `read` mengekspor list PR.

### Proses
1. Backend generate Excel berdasarkan filter list.
2. Format: item-level (satu row per item PR).
3. Kolom:
   - Kode PR, tanggal, requester, bisnis, cabang, gudang
   - Kode barang, nama barang, equipment, qty req, qty acc, satuan
   - Supplier, harga, kurs, diskon, PPN, subtotal
   - Status item, validator, approver
   - Status PR, total, prioritas, deskripsi
4. Streaming untuk dataset besar.
5. Maks 10.000 row per export; lebih dari itu gunakan background job.
6. Response: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` blob.
7. Audit: catat export event dengan filter.
