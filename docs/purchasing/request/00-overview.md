# 00 — Overview

## 1. Latar Belakang

Fitur Purchasing Request (PR) digunakan untuk melakukan permintaan order persediaan sparepart kebutuhan operasional. Dokumen PR melewati empat status:

1. **draft** — dokumen order yang masih draft.
2. **active** — dokumen siap untuk divalidasi oleh user purchasing.
3. **approved** — dokumen telah divalidasi, harga dan pemasok ditentukan oleh purchasing, siap di-approve oleh user approver (manager/koordinator).
4. **finish** — dokumen telah dilakukan approval oleh user approver.

### Implementasi legacy (`mrt-v3`)

Legacy adalah aplikasi monolitik AdonisJS 4.1 dengan Edge template, jQuery, DataTables, dan Select2. Alur lengkap sudah didukung:

- Create/submit, save/update draft, edit, remove item
- Check/validasi per item (supplier, harga, PPN, kurs, diskon, metode)
- Approval per item dengan auto-create PO per supplier + PPN
- Soft-delete PR/PO, attachment (lokal + S3), print PDF (PDFMake), export Excel (ExcelJS)
- Monitoring part (`mon_request_part`) via model hooks
- Integrasi MRO (create/append PR) dan backlog (auto-create PR)
- Cron eskalasi prioritas (P2 > 3 hari → P1; P3 > 6 hari → P2)

### Risiko & masalah legacy

| Kategori | Masalah |
|---|---|
| Keamanan | IDOR: operasi item/header hanya berdasarkan ID tanpa scope bisnis |
| Keamanan | Role check hanya pada GET form, POST hanya bergantung privilege `U` |
| Keamanan | CSRF dinonaktifkan (`config/shield.js`) |
| Integritas | Subtotal dipercaya dari browser (hidden field) |
| Integritas | Approval tidak idempotent, tidak ada row lock → PO duplikat |
| Integritas | Generator kode PR/PO rawan race condition |
| Integritas | Edit bisa membuka kembali dokumen `finish` |
| Integritas | Status create bergantung default schema (`status='active'` tidak eksplisit) |
| Integritas | Item lintas PR dapat dicampur dalam satu approval |
| Observability | Tidak ada audit trail terstruktur |
| Test | Tidak ada automated test |

### Implementasi target saat ini (`nextjs` + `be`)

| Area | Status |
|---|---|
| Frontend signage/analitik | Ada (14 chart) |
| Frontend transaksi PR | Tidak ada |
| Backend list/detail | Ada, tapi belum scope bisnis |
| Backend validasi item | Ada, tapi tanpa validasi field/parent/finansial |
| Backend approval + PO | Ada, tapi tanpa idempotency/lock/kode PO |
| Backend rollback | Berbahaya: tidak membatalkan PO/monitoring |
| Backend create/draft/edit/delete | Tidak ada |
| Backend attachment/print/export | Tidak ada |
| Permission | Hard-coded role, bukan `sys_accesspermission` |
| Test | Tidak ada |

## 2. Tujuan Produk

1. Memindahkan seluruh proses Purchasing Request ke `nextjs` (frontend) dan `be` (backend).
2. Mempertahankan data dan integrasi existing tanpa menyalin tabel utama (shared database).
3. Menjadikan backend sebagai sumber kebenaran status, permission, dan perhitungan finansial.
4. Menjamin satu item PR hanya menghasilkan satu PO item aktif (unique mapping).
5. Memperbaiki keamanan akses lintas bisnis, cabang, gudang, dan dokumen.
6. Menyediakan audit trail untuk seluruh perubahan penting.
7. Mengoptimalkan proses create, validasi, approval, attachment, print, dan export.
8. Mempertahankan integrasi MRO, backlog, monitoring part, dan Purchase Order.
9. Memungkinkan rollout bertahap tanpa menghentikan aplikasi legacy.

## 3. Terminologi Status

| Status DB | Label UI | Definisi | Transisi |
|---|---|---|---|
| `draft` | Draft | Dokumen masih disusun, belum masuk antrean purchasing | `draft → active` (submit) |
| `active` | Menunggu Validasi | Dokumen diajukan, menunggu validasi purchasing | `active → approved` (semua item tervalidasi) |
| `approved` | Menunggu Approval | Semua item aktif sudah divalidasi, menunggu approval final | `approved → finish` (semua item disetujui) |
| `finish` | Selesai | Semua item aktif disetujui, PO sudah dibuat | Terminal (kecuali rollback admin) |

### Catatan penting

- Status `approved` **tidak** ditampilkan sebagai "Disetujui" karena approval final belum dilakukan. UI wajib menggunakan label "Menunggu Approval".
- Status dihitung **hanya** berdasarkan item dengan `aktif='Y'`. Item yang dihapus (`aktif='N'`) tidak dihitung.
- `total_ro` dihitung ulang dari subtotal item aktif.
- Tidak ada endpoint `finish` manual; finish adalah hasil dari approval semua item aktif.

### Status DB tambahan (non-canonical)

| Status | Keterangan |
|---|---|
| `done` | Tidak ditangani oleh state machine baru; ditandai sebagai legacy/deprecated. Investigasi penggunaan diperlukan saat migration. |

### Status monitoring part (`mon_request_part`)

| Angka | Label | Trigger |
|---|---|---|
| 1 | NPR (New PR) | Item PR dibuat |
| 2 | CPR (Checked PR) | Item divalidasi purchasing |
| 3 | VPR (Validated PR) | Item di-approve |
| 4 | NPO (PO dibuat) | PO item terbentuk |

## 4. Persona

| Persona | Tanggung jawab | Permission utama |
|---|---|---|
| Requester | Membuat draft, mengubah, mengajukan, melihat, mencetak, menghapus dokumen yang diperbolehkan | `insert`, `update`, `remove` (terbatas owner/status) |
| Purchasing | Memvalidasi item: supplier, qty approved, harga, mata uang, kurs, diskon, PPN, metode | `validate` |
| Approver | Menyetujui item tervalidasi dan memicu pembuatan PO | `approve` |
| Administrator | Override akses, rollback, koreksi, rekonsiliasi | Override semua + `rollback` |
| Viewer/Auditor | Melihat, mencetak, mengekspor data tanpa mutation | `read` |

## 5. Prioritas Release

### MVP (Release Pertama)

1. Menu dan permission (`sys_accesspermission`)
2. List/filter/pagination server-side
3. Create/submit
4. Draft/edit
5. Detail dengan timeline status
6. Validasi/check item
7. Approval final + auto-create PO
8. Attachment (upload/delete/view)
9. Rollback (admin)
10. Delete (soft-delete sesuai state)
11. Print PDF
12. Export Excel
13. Integrasi MRO dan backlog
14. Notifikasi dan badge pending action
15. Responsive desktop/mobile/Electron

### Fase Lanjutan

- Deep-link dari notification
- Autosave draft lokal (offline)
- Reminder SLA otomatis
- Dashboard signage sinkron dengan transaksi
- Automated test lengkap
- Decommission legacy

## 6. Non-Goals

- Migrasi modul Purchase Order secara terpisah (PO lifecycle: verify, accept, reject, upload nota, print PO) ditangani di dokumen `docs/purchasing/order/`.
- Migrasi Faktur Pembelian, Pembayaran, Delivery Order, Shipping Order, Goods Receipt.
- Perubahan master data (barang, pemasok, gudang, equipment, COA).
- Penghapusan cron eskalasi prioritas (dipertahankan, perlu hardening).