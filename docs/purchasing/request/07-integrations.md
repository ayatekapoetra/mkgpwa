# 07 — Integrations

Dokumen ini memetakan integrasi Purchasing Request dengan modul dan sistem lain, termasuk kontrak data, arah dependensi, dan aturan sinkronisasi.

## 1. Purchase Order (`trx_procurement`)

### Arah: PR → PO (outbound)

Approval final PR otomatis membuat PO. Satu PR dapat menghasilkan multiple PO berdasarkan grouping.

### Grouping Rule

```text
Group Key = supplier + PPN + currency + payment_method + bisnis + cabang + gudang
```

Setiap unique group key → satu PO header.

### Mapping

```text
PR header → PO header (bisnis, cabang, gudang, supplier, ppn, currency, metode)
PR item  → PO item (barang, qty, harga, kurs, diskon, ppn_rp, subtotal)
```

### Unique Constraint

Satu PR item hanya boleh ter-link ke satu active PO item:

```sql
-- trx_procurement_items
pr_item_id UNIQUE WHERE pr_item_id IS NOT NULL AND aktif = 'Y'
```

### Field PO dari PR

| PO field | Sumber |
|---|---|
| `bisnis_id` | PR `bisnis_id` |
| `cabang_id` | PR `cabang_id` |
| `gudang_id` | PR `gudang_id` |
| `pemasok_id` | PR item `pemasok_id` |
| `ppn` | PR item `ppn` |
| `currency` | PR item `currency` |
| `metode` | PR item `metode` |
| `date_po` | Tanggal approval |
| `total_po` | SUM(subtotal) group |
| `kdpo` | Generated (lock + retry) |
| `ro_id` | PR `id` (denormalized) |

### Field PO Item dari PR Item

| PO item field | Sumber |
|---|---|
| `barang_id` | PR item `barang_id` |
| `qty` | PR item `qty_acc` |
| `harga` | PR item `harga` |
| `kurs` | PR item `kurs` |
| `potongan` | PR item `potongan` |
| `ppn_rp` | PR item `ppn_rp` |
| `subtotal` | PR item `subtotal` |
| `pr_item_id` | PR item `id` (unique) |
| `pr_id` | PR `id` |

### Rollback PR → PO

Saat rollback approval:
- PO dan PO item di-soft-delete (`aktif='N'`).
- `po_sts` PR item direset ke `N`.
- Mapping `pr_item_id` pada PO item di-NULL-kan atau PO item di-soft-delete.

### PO Lifecycle (Out of Scope)

Pengelolaan PO setelah dibuat (verify, accept, update, upload nota, print PO, reject item, rollback PO → PR) ditangani di `docs/purchasing/order/`. Backend PR tidak boleh mengubah PO setelah dibuat kecuali melalui rollback PR.

## 2. Monitoring Part (`mon_request_part`)

### Arah: PR → Monitoring (outbound, otomatis)

Monitoring part melacak lifecycle setiap item PR dari pembuatan hingga PO/faktur/payment/delivery.

### Status Mapping

| Event PR | Monitoring Status | Label |
|---|---|---|
| Item PR dibuat (create/draft) | 1 | NPR (New PR) |
| Item divalidasi (check) | 2 | CPR (Checked PR) |
| Item di-approve | 3 | VPR (Validated PR) |
| PO item dibuat (approve) | 4 | NPO (PO Created) |

### Field Mapping

| Monitoring field | Sumber |
|---|---|
| `roitem` | PR item `id` |
| `ro_id` | PR `id` |
| `barang_id` | PR item `barang_id` (**bukan** `barangid`) |
| `status` | 1/2/3/4 sesuai event |
| `poitem` | PO item `id` (saat status=4) |
| `poqty` | PO item `qty` |
| `podate` | PO `date_po` |

### Perbaikan Bug

Backend target saat ini menggunakan `barangid` (typo). Wajib diperbaiki menjadi `barang_id`:

```diff
- monData.barangid
+ monData.barang_id
```

Referensi bug:
- `be/app/Models/Monitoring/MonRequestPart.js:31-33`
- `be/app/Controllers/Http/material-supply-chain/PurchaseRequestController.js:581-589`

### Mapping Eksplisit

Monitoring harus di-link berdasarkan `roitem` (PR item ID), bukan berdasarkan `barang_id` saja. Implementasi saat ini mencari PO item berdasarkan `barang_id` di seluruh PO yang baru dibuat, yang dapat salah jika barang sama tapi vendor/equipment berbeda.

```diff
- cari PO item berdasarkan barang_id
+ simpan pr_item_id → po_item_id mapping saat insert
+ update monitoring berdasarkan roitem = pr_item_id
```

### Trigger

Monitoring update harus terjadi dalam transaksi yang sama dengan PR mutation:
- Create item → insert monitoring status=1
- Validate item → update monitoring status=2
- Approve item → update monitoring status=3, lalu 4 setelah PO item dibuat
- Rollback → reset status sesuai target
- Delete item → soft-delete monitoring

Implementasi: service eksplisit (bukan model hook) agar transaksi terkontrol. Hook model legacy (`MonitoringRequestPartHook`) dapat dipertahankan sebagai backup, tetapi service PR baru wajib memanggil update monitoring secara eksplisit.

## 3. Material Request Order (MRO)

### Arah: MRO → PR (inbound)

MRO dapat:
1. Membuat PR baru dengan item dari MRO.
2. Menambah item ke PR existing (draft/active yang belum divalidasi).

### Field Link

| PR item field | Sumber MRO |
|---|---|
| `mro_id` | MRO `id` |
| `woid` | Work order `id` (jika dari WO) |
| `barang_id` | MRO item `barang_id` |
| `qty_req` | MRO item `qty` (dikonversi satuan) |
| `stn` | MRO item `satuan` |

### Konversi Satuan

MRO menggunakan `pembagi_pakai` untuk konversi satuan. Pembulatan ke atas.

Referensi: `mrt-v3/app/Helpers/OpsMaterialRequestOrder.js:443-463`

### Aturan Append

- Append ke PR draft: diizinkan.
- Append ke PR active: diizinkan hanya jika item yang ditambah belum divalidasi.
- Append ke PR approved/finish: tidak diizinkan.

### Update Barang saat Validate

Saat purchasing mengubah `barang_id` pada saat validate, sistem harus memperbarui referensi MRO:

```text
Jika PR item punya mro_id:
  UPDATE MRO item SET barang_id = PR item.barang_id WHERE id = mro_id
```

Referensi legacy: `mrt-v3/app/Helpers/TrxOrderBeli.js:1397-1411`

### Kontrak API MRO → PR

Endpoint MRO yang membuat PR tetap di controller MRO. Backend PR hanya menerima `mro_id` dan `woid` sebagai field item. Validasi MRO ownership dilakukan di sisi MRO.

## 4. Operational Backlog

### Arah: Backlog → PR (inbound)

Backlog dapat otomatis membuat PR dan mengisi `backlog_id`.

### Field Link

| PR field | Sumber Backlog |
|---|---|
| `backlog_id` | Backlog `id` |
| `bisnis_id` | Backlog `bisnis_id` |
| `cabang_id` | Backlog `cabang_id` |
| `gudang_id` | Default gudang cabang |
| `date_ro` | Tanggal backlog |
| `prioritas` | Backlog `prioritas` |
| `description` | Backlog `description` |

### Status Backlog

- Saat PR dibuat dari backlog: backlog status → `pr_created`.
- Saat PR di-delete: backlog status → kembali ke `open`.
- Saat PR finish: backlog dapat di-update ke `po_created` (opsional, tergantung policy).

### Kontrak

Backend PR menerima `backlog_id` pada create. Validasi backlog ownership dilakukan di sisi backlog.

## 5. Notification & Badge

### Arsitektur: Transactional Outbox

Notifikasi dikirim **setelah** commit transaksi, melalui outbox table (`pr_notification_outbox`). Worker/job membaca outbox dan mengirim push.

### Event & Recipient

| Event | Recipient | Payload |
|---|---|---|
| `submitted` | User dengan `validate` permission (bisnis) | kode PR, requester, prioritas, item count |
| `validated` (partial) | Requester | kode PR, progress |
| `validated` (all → approved) | User dengan `approve` permission (bisnis) | kode PR, total, item count |
| `approved` | Requester, purchasing | kode PR, list PO dibuat, total |
| `rolled_back` | Requester, validator, approver | kode PR, target status, reason |
| `deleted` | Requester (jika oleh admin) | kode PR |
| `sla_warning` | Requester, purchasing | kode PR, umur, prioritas |
| `sla_expired` | Admin | kode PR, umur |

### Push Notification

Menggunakan `PushNotifyHelper` yang sudah ada:

Referensi: `be/app/Services/Push/PushNotifyHelper.js:222-250`

Idempotency key untuk push: `pr:{id}:{event}`.

### Badge Pending Count

Frontend menampilkan badge pada menu dan home:

```text
GET /api/scm/purchase-requests/pending-count
→ { pending_validation: 5, pending_approval: 3 }
```

SWR refresh interval: 60 detik.

### Deep Link (Fase Lanjutan)

Notifikasi push → buka aplikasi → navigasi ke detail PR.

Payload push:

```json
{
  "module": "purchasing-request",
  "id": 123,
  "action": "validate"
}
```

## 6. File Storage (Attachment)

### Tabel: `lampiran_files`

| Kolom | Keterangan |
|---|---|
| `id` | PK |
| `ro_id` | FK → PR `id` |
| `filename` | Nama file asli |
| `path` | Path storage (lokal/S3) |
| `mime` | MIME type |
| `size` | Ukuran bytes |
| `uploaded_by` | User |
| `aktif` | Soft-delete |

### Storage

- Primer: S3 (jika dikonfigurasi).
- Fallback: lokal (`public/upload/`).
- File dipindahkan ke storage setelah PR record dibuat (bukan sebelum).
- Kegagalan storage: rollback transaksi atau mark file sebagai `pending_upload`.

### Format & Limit

| Aspek | Aturan |
|---|---|
| Format | JPG, PNG, PDF, DOCX, XLSX |
| Maks size | 10 MB per file |
| Maks count | 10 file per PR |
| Maks total | 50 MB per PR |
| MIME whitelist | `image/jpeg`, `image/png`, `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

### Legacy Attachment

Attachment yang dibuat di legacy tetap tersimpan di `lampiran_files.ro_id`. Frontend baru wajib dapat menampilkan dan mengelola attachment lama.

### Akses File

Endpoint terpisah dengan auth check:

```text
GET /api/files/:fileId
```

Response: file blob dengan `Content-Type` dan `Content-Disposition`.

## 7. Dashboard/Signage

### Endpoint Existing (Public)

15 endpoint signage sudah ada di backend:

Referensi: `be/start/routes.js:74-89`, `be/app/Services/Signages/DailyPurchasingServices.js`

### Status Consistency

Dashboard saat ini menggunakan definisi status berbeda dari transaksi:
- Dashboard: status tertinggi dari item (satu item finish → PR finish).
- Transaksi: finish hanya jika semua item approved.

PRD wajib menyamakan: dashboard menggunakan aturan transaksi (semua item aktif).

### Subtotal Calculation

Dashboard saat ini menghitung `subtotal = qty_req × harga`, mengabaikan `qty_acc`, diskon, kurs, PPN.

PRD wajib memperbaiki: dashboard menggunakan `subtotal` dari DB.

### Scope

Endpoint signage saat ini **public** tanpa auth. PRD merekomendasikan:
- Tambahkan token/signature untuk signage.
- Atau pindahkan ke protected group dengan role khusus.

## 8. Cron Jobs

### Prioritas Eskalasi

| Rule | Trigger |
|---|---|
| P2 > 3 hari → P1 | Cron harian |
| P3 > 6 hari → P2 | Cron harian, reset timer |

Referensi: `be/app/Helpers/CronPurchaseRequest.js`, `mrt-v3/app/Controllers/Http/ajax/CronJobAjaxController.js:10-61`

### WhatsApp Reminder

- Hari ke-23: kirim WA ke requester.
- Hari ke-30: nonaktifkan PR/item.

Perbaikan yang diperlukan:
- Hapus hard-coded timestamp (`2026-02-01 00:00:00`).
- Jangan swallow error update item.
- Null-safe `order.creator.handphone`.
- Reminder range, bukan exact day.
- Dry-run sebelum produksi.
- Flag `whatsapp_reminder_sent` wajib ada di schema.

### Kill Switch

Cron harus memiliki feature flag untuk disable tanpa restart.

## 9. Faktur Pembelian (Downstream)

### Arah: PO → Faktur (outbound, via PO)

Faktur beli dibuat dari PO, bukan langsung dari PR. PR tidak berinteraksi langsung dengan faktur.

### Blocking Rollback

Jika PO sudah memiliki faktur → rollback PR diblokir (`409 DOWNSTREAM_DEPENDENCY`) kecuali admin force dengan kompensasi.

## 10. Pembayaran (Downstream)

Sama seperti faktur — melalui PO. Pembayaran blok rollback PR.

## 11. Delivery/Shipping/Receipt (Downstream)

Sama — melalui PO. Activity ini blok rollback PR.

## 12. Master Data

### Barang (`master_barang`)
- Autocomplete dengan pencarian kode/nama.
- Filter berdasarkan bisnis.
- Menampilkan satuan dan stok gudang.

### Pemasok (`master_pemasok`)
- Autocomplete dengan pencarian kode/nama.
- Filter berdasarkan bisnis.
- Hanya `aktif='Y'`.

### Gudang (`master_gudang`)
- Dropdown/filter berdasarkan cabang.
- Hanya `aktif='Y'`.

### Equipment (`master_equipment`)
- Autocomplete dengan pencarian kode/nama.
- Filter berdasarkan cabang.

### COA (`acc_coa`)
- Untuk item non-barang.
- Filter berdasarkan bisnis.

### Cabang (`master_cabang`)
- Dropdown berdasarkan bisnis.

### Bisnis (`master_bisnis`)
- Dropdown/autocomplete.
- Dibatasi berdasarkan user grants.