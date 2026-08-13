# Purchase Order — Product Requirements Document

**Modul:** Supply Chain Management / Purchase Order  
**Sumber legacy:** `./mrt-v3` — `/acc/purchase-order`  
**Backend target:** `./be` — `/api/scm/purchase-orders`  
**Frontend target:** `./nextjs` — `/purchase-orders`  
**Database:** shared database existing; tabel utama tidak disalin  
**Versi:** 1.0 (draft)  
**Tanggal analisis:** 12 Agustus 2026

## 1. Ringkasan Eksekutif

Purchase Order (PO) menerima dokumen hasil approval Purchasing Request (PR), melengkapi atribut yang dibutuhkan akuntansi, memverifikasi nilai finansial, lalu memfinalisasi pesanan ke proses logistik dan keuangan. PO kredit menghasilkan Faktur Pembelian/hutang untuk proses pembayaran berikutnya, sedangkan PO tunai menghasilkan Faktur Pembelian berstatus lunas dan dokumen Pembayaran yang masuk ke antrean kasir. Migrasi wajib mempertahankan data existing dan integrasi downstream, tetapi memindahkan seluruh aturan bisnis dari Edge/jQuery dan helper monolitik ke service OPS-BE yang transaksional, aman, idempotent, dan dapat diaudit. WEB-NEXT hanya mengirim intent dan data input; status, total, PPN, hak akses, dan dokumen downstream selalu ditentukan oleh backend.

## 2. Temuan Analisis Legacy

Analisis dilakukan dari routes, controller, helper, model, Edge views, dan JavaScript OLD-WEB. Browser lokal tidak tersedia pada sesi analisis, sehingga detail visual final perlu divalidasi kembali melalui walkthrough pengguna sebelum cutover.

### 2.1 Kemampuan saat ini

- List server-side dengan filter bisnis, periode, pemasok, status, kode PO/PR, gudang, narasi, dan jumlah baris.
- Detail PO berisi bisnis, cabang, gudang, prioritas, pemasok/rekening, PR asal, item, foto, COA, metode bayar, harga, diskon, PPN, dan total.
- Tahap persiapan: edit narasi, rekening pemasok, gudang, prioritas, COA, deskripsi item, dan metode `tunai`/`kredit`.
- Upload nota/lampiran, tambah rekening pemasok, hapus file, print PDF, export Excel, serta update kode Sales Order khusus vendor tertentu.
- Verifikasi finance melakukan validasi rekening, COA, qty, harga, deskripsi dan menghitung ulang nilai item/header.
- Finalisasi membuat `log_request_transit` dan `delivery_waiting` per item.
- Finalisasi item kredit membuat Faktur Pembelian dan detailnya; item tunai membuat Faktur Pembelian lunas, Pembayaran, dan item pembayaran untuk antrean kasir.
- Update harga beli dan status `mon_request_part`; rollback ke PO baru atau kembali ke PR; soft delete PO.

### 2.2 Status legacy

| DB status | `sts_code` | Label target | Makna |
|---|---:|---|---|
| `open` | 1 | Baru | PO otomatis terbentuk dari PR approved dan menunggu dilengkapi purchasing. |
| `verify` | 2 | Menunggu Verifikasi | Data procurement, lampiran, COA, rekening, dan metode sudah dilengkapi. |
| `accept` | 3 | Terverifikasi | Finance telah memverifikasi nilai dan akun. |
| `close` | 4 | Diproses | PO difinalisasi; dokumen logistik dan keuangan downstream sudah dibuat. |

Catatan: controller legacy dapat menjalankan verifikasi lalu finalisasi dalam satu request untuk role tertentu. Target memisahkan kedua transisi secara eksplisit agar segregation of duties, audit, retry, dan rekonsiliasi lebih aman. Label `close` tidak boleh ditampilkan sebagai sekadar “selesai”, karena kewajiban penerimaan barang dan pembayaran dapat masih terbuka.

### 2.3 Masalah dan risiko legacy

| Area | Risiko |
|---|---|
| Integritas finansial | Sebagian qty, harga, PPN, grand total, dan subtotal diterima dari hidden field browser. |
| Konkurensi | Finalisasi tidak memiliki idempotency key/row lock yang jelas; faktur, pembayaran, atau delivery waiting dapat terduplikasi saat retry/double click. |
| Kode dokumen | Nomor faktur/pembayaran berbasis pembacaan record terakhir rawan race condition. |
| Akses | Kombinasi middleware CRUD dan pemeriksaan `usertype` hard-coded belum cukup untuk scope bisnis/cabang/dokumen. |
| State machine | Endpoint dan tombol dapat menggabungkan `verify → accept → close`; rollback tidak selalu memeriksa dokumen downstream yang sudah diposting. |
| Akuntansi | Pembuatan faktur, pembayaran, update harga beli, logistik, dan monitoring berada dalam helper sangat besar sehingga sulit diuji dan direkonsiliasi. |
| Attachment | Validasi berfokus pada ekstensi/gambar; lifecycle file dan transaksi DB/S3 tidak atomik. |
| Error handling | Ada cabang error yang tidak rollback atau mengembalikan `success: true` walaupun proses lanjutan gagal. |
| Data mapping | Field deskripsi tidak konsisten (`narasi` vs `description`); lookup monitoring/downstream berpotensi memakai atribut non-unik. |
| Audit | Tidak ada event log terstruktur yang menjelaskan siapa mengubah nilai finansial, status, rekening, atau melakukan rollback. |

## 3. Tujuan dan Non-Goals

### Tujuan

1. Memigrasikan lifecycle PO `open → verify → accept → close` ke OPS-BE dan WEB-NEXT tanpa memutus PR dan data lama.
2. Menjamin finalisasi PO tepat satu kali dan seluruh hasil downstream dapat direkonsiliasi.
3. Menjadikan backend sumber kebenaran untuk permission, state transition, perhitungan finansial, dan nomor dokumen.
4. Mendukung pemisahan tugas Purchasing, Finance Verifier, Approver, Kasir, Logistik, dan Auditor.
5. Menyediakan jejak audit, histori status, attachment aman, print/export, dan rollout paralel dengan OLD-WEB.

### Non-goals release pertama

- Mendesain ulang jurnal buku besar atau chart of accounts perusahaan.
- Mengganti penuh modul Faktur Pembelian, Kasir/Pembayaran, Delivery Order, Goods Receipt, atau inventory costing.
- Mengubah proses approval PR; PRD ini dimulai saat PO sudah dibuat oleh approval PR.
- Migrasi data ke database baru.

## 4. Persona dan Hak Akses

Permission memakai `sys_accesspermission`, deny-by-default, dan selalu dibatasi workspace bisnis/cabang user.

| Persona | Hak utama |
|---|---|
| Purchasing | read, prepare, upload attachment, pilih rekening/metode/COA, submit verification |
| Finance Verifier | read, verify/reject ke tahap persiapan, koreksi finansial sesuai policy |
| Approver/Manager | finalize setelah verified sesuai limit nominal |
| Kasir | melihat payment yang dihasilkan; tidak mengubah PO |
| Logistik | melihat PO/delivery waiting; tidak mengubah nilai finansial |
| Administrator | rollback/cancel dengan alasan dan pemeriksaan dampak |
| Auditor | read, print/export, audit trail, reconciliation; tanpa mutation |

Permission canonical: `po.read`, `po.prepare`, `po.verify`, `po.finalize`, `po.rollback`, `po.cancel`, `po.attachment`, `po.print`, `po.export`, dan `po.admin_override`.

## 5. Workflow Target

```text
PR approved
    │ auto-create, idempotent
    ▼
OPEN ──prepare/submit──> VERIFY ──finance verify──> ACCEPT
 ▲                         │                         │
 └────return/revise────────┘                         │ finalize
                                                    ▼
                                                  CLOSE
                                                    ├─ delivery waiting
                                                    ├─ CREDIT → AP invoice/open payable
                                                    └─ CASH → paid invoice + cashier payment queue
```

### Aturan transisi

- `open → verify`: semua item aktif memiliki COA valid, metode bayar, qty/harga valid, deskripsi, supplier, rekening supplier, gudang, dan attachment wajib sesuai policy.
- `verify → accept`: hanya Finance Verifier; backend mengambil ulang item dari DB dan menghitung seluruh nilai menggunakan decimal, bukan float/browser value.
- `accept → close`: hanya Approver yang memenuhi approval limit; operasi harus idempotent dan berada dalam satu transaksi DB.
- `verify → open`: return untuk revisi dengan alasan wajib.
- `accept → verify`: reverify hanya sebelum ada downstream document yang posted/paid/received.
- `close` tidak boleh dihapus. Pembatalan menggunakan reversal/compensating transaction dan reason code.
- Mixed payment method diperbolehkan per item, tetapi menghasilkan dokumen downstream terpisah per metode. UI wajib menampilkan preview hasil grouping sebelum finalisasi.

## 6. Kebutuhan Fungsional

### FR-01 — Inbox dan pencarian

- Server-side pagination, sorting, dan filter: bisnis, cabang, gudang, supplier, status, metode, prioritas, kode PO/PR, narasi, tanggal, nilai, serta “menunggu aksi saya”.
- Summary count dan total nominal per status sesuai filter dan scope user.
- Saved filter, URL query state, desktop table, dan mobile card.

### FR-02 — Detail dan traceability

- Header, item, foto, attachment, rekening, nilai, PR sumber, creator, verifier, approver, dan timestamp.
- Timeline PR → PO → Faktur/Pembayaran → Delivery/Receipt.
- Link langsung ke PR, faktur pembelian, payment kasir, delivery waiting/order, dan monitoring part berdasarkan ID canonical.

### FR-03 — Persiapan PO

- Edit hanya field yang diizinkan: gudang tujuan, rekening supplier, narasi, prioritas, COA/expense account, deskripsi, dan metode bayar.
- Harga/qty dari PR menjadi baseline; perubahan setelah PR approval memerlukan reason dan batas toleransi. Perubahan di atas toleransi meminta reapproval PR, bukan langsung diteruskan.
- Rekening wajib milik supplier aktif dan tervalidasi; penambahan rekening menjadi workflow master supplier terpisah, bukan mutation tersembunyi dari PO.

### FR-04 — Verifikasi finansial

- Backend memvalidasi precision currency, kurs, qty > 0, harga >= 0, discount tidak melebihi bruto, PPN sesuai tax profile, COA aktif dan satu bisnis.
- Formula canonical per item:

```text
gross       = round(qty × unit_price × exchange_rate, currency_precision)
net         = gross - discount
tax_amount  = round(net × tax_rate / 100, currency_precision)
grand_total = net + tax_amount
```

- Header adalah penjumlahan item aktif; aturan pembulatan disimpan eksplisit dan tidak menggunakan `Math.ceil` tanpa policy.
- Verification snapshot menyimpan input, hasil kalkulasi, user, waktu, dan version dokumen.

### FR-05 — Finalisasi dan akuntansi

- Tampilkan preview sebelum commit: grouping metode, nilai faktur, PPN, rekening, due date, COA debit, serta dokumen yang akan dibuat.
- Kredit: buat satu AP invoice/faktur per grouping canonical dan set `sisa = grand_total`; due date berdasarkan supplier terms yang disnapshot saat finalisasi.
- Tunai: buat faktur dan payment request/queue untuk kasir. Status faktur **tidak boleh `lunas` sebelum kasir benar-benar posting pembayaran**; bila kompatibilitas legacy mengharuskan flag tersebut, simpan status tambahan `cashier_pending` dan jangan posting jurnal kas/bank lebih awal.
- Pembuatan downstream memakai deterministic key seperti `po:{po_id}:method:{method}:version:{version}` dan unique constraint.
- Setiap item menghasilkan mapping eksplisit ke invoice item, payment item, delivery waiting, dan monitoring record.

### FR-06 — Logistik

- Buat tepat satu `delivery_waiting` per PO item aktif.
- Unique key `(po_id, poitem_id, aktif)` atau equivalent.
- Partial delivery/receipt ditangani downstream; PO detail menampilkan ordered, delivered, received, dan outstanding qty.

### FR-07 — Attachment

- Multi-file upload, preview/download, soft delete, kategori (`quotation`, `nota`, `invoice`, `tax`, `other`).
- Allowlist MIME, pemeriksaan signature file, batas ukuran/jumlah, nama object acak, dan authorization saat download.
- Metadata DB dibuat dengan status upload; cleanup job menangani orphan DB/S3.

### FR-08 — Print dan export

- PDF PO stabil dengan snapshot data pada waktu cetak, watermark status, QR/link verifikasi, nomor revisi, dan audit metadata.
- Excel memakai filter yang sama dengan list dan diproses streaming/background untuk data besar.

### FR-09 — Rollback/cancel

- Preflight endpoint mengembalikan daftar dampak dan apakah rollback diizinkan.
- Reason wajib, permission khusus, dan optimistic locking.
- Jika invoice/payment/receipt belum posted: soft-cancel downstream secara atomik.
- Jika sudah posted/paid/received: rollback langsung ditolak; user diarahkan ke reversal/credit note/return workflow.
- Rollback ke PR hanya jika seluruh PO turunan dari item PR terkait aman dibatalkan dan mapping item eksplisit tersedia.

### FR-10 — Audit dan notifikasi

- Audit event: created_from_pr, prepared, submitted, verified, returned, finalized, attachment changes, rekening/COA/value changes, rollback/cancel, dan downstream reconciliation.
- Simpan actor, role, timestamp, request ID, before/after, reason, source system, IP/device secukupnya.
- Transactional outbox mengirim notifikasi setelah commit; dedupe key mencegah pengiriman ganda.

## 7. API Target OPS-BE

Base resource: `/api/scm/purchase-orders`.

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/access` | Permission level menu |
| GET | `/` | List, summary, filter, pagination |
| GET | `/pending-count` | Badge tindakan user |
| GET | `/:id` | Detail lengkap dan downstream links |
| GET | `/:id/permissions` | Action yang sah untuk dokumen |
| PUT | `/:id/preparation` | Simpan field persiapan dengan version |
| POST | `/:id/submit-verification` | `open → verify` |
| POST | `/:id/verify` | `verify → accept` |
| POST | `/:id/return` | `verify/accept → state sebelumnya` |
| GET | `/:id/finalization-preview` | Preview grouping dan posting |
| POST | `/:id/finalize` | `accept → close` + downstream atomik |
| GET | `/:id/rollback-preview` | Dampak dan eligibility rollback |
| POST | `/:id/rollback` | Compensating rollback dengan reason |
| POST | `/:id/cancel` | Cancel aman, bukan hard delete |
| GET/POST | `/:id/attachments` | List/upload attachment |
| DELETE | `/:id/attachments/:fileId` | Soft delete attachment |
| GET | `/:id/audit-trail` | Histori terstruktur |
| GET | `/:id/print` | PDF PO |
| GET | `/export` | Export Excel sesuai filter |
| PATCH | `/:id/sales-order-code` | Update kode SO dengan permission khusus |
| GET | `/:id/reconciliation` | Status konsistensi downstream |

Semua mutation memakai `Idempotency-Key`, `If-Match`/field `version`, request validation, row lock pada PO, dan response envelope konsisten. Endpoint menerima ID, bukan HTML fragment; backend tidak mengirim button markup.

### Struktur service backend

```text
PurchaseOrderController
  ├─ PurchaseOrderQueryService
  ├─ PurchaseOrderPermissionService
  ├─ PurchaseOrderPreparationService
  ├─ PurchaseOrderVerificationService
  ├─ PurchaseOrderFinalizationService
  │    ├─ ProcurementCalculationService
  │    ├─ AccountsPayableAdapter
  │    ├─ CashierPaymentAdapter
  │    ├─ DeliveryWaitingAdapter
  │    └─ MonitoringPartAdapter
  ├─ PurchaseOrderRollbackService
  ├─ PurchaseOrderAttachmentService
  ├─ PurchaseOrderDocumentService
  └─ PurchaseOrderAuditService
```

Controller tipis; tidak ada side effect utama dalam model hook. Adapter memisahkan kontrak PO dari schema internal modul downstream.

## 8. Frontend Target WEB-NEXT

```text
nextjs/src/
  api/purchase-orders.js
  app/(dashboard)/purchase-orders/page.js
  app/(dashboard)/purchase-orders/[id]/page.js
  views/scm/purchase-order/
    index.js
    detail.js
    filter.js
    list-desktop.js
    list-mobile.js
    preparation-form.js
    finalization-preview.js
    rollback-dialog.js
    audit-timeline.js
    downstream-links.js
```

- Mengikuti pola MUI + SWR/API yang sudah dipakai modul Pengajuan Dana dan Purchasing Request.
- Satu halaman detail dengan action bar berbasis permission API; hindari modal besar berisi form kompleks.
- Autosave hanya untuk draft persiapan, dengan indikator saved/conflict; mutation status selalu konfirmasi eksplisit.
- Item table melakukan virtualisasi untuk PO besar dan sticky financial summary.
- Preview finalisasi membandingkan nilai PO, invoice kredit, payment tunai, dan nilai pajak sebelum submit.
- Setelah mutation, frontend menampilkan request ID, hasil dokumen downstream, dan tombol menuju dokumen terkait.
- Aksesibilitas keyboard, label status berwarna + teks, responsive, dan kompatibel Electron.

## 9. Data dan Schema Hardening

Pertahankan `trx_procurement` dan `trx_procurement_items`, lalu tambahkan secara bertahap:

- `version`, `source_system`, `finalization_key`, `finalized_at`, `cancelled_at`, `cancel_reason`, `returned_reason`.
- Mapping PO item ke PR item (`pr_item_id`) yang wajib unik untuk record aktif.
- Tabel `purchase_order_events` untuk audit append-only.
- Tabel `purchase_order_downstream_links` berisi `po_id`, `po_item_id`, `type`, `target_id`, `idempotency_key`, `status`.
- Tabel `purchase_order_idempotencies` atau shared idempotency store.
- Constraint/check untuk status/sts_code, nilai non-negatif, supplier/rekening ownership, dan unique downstream keys.
- Index list: `(aktif,bisnis_id,status,request_date)`, `(pemasok_id,status)`, `(gudang_id,status)`, `kdpo`, `kode_pr`, dan foreign-key mapping.

Sebelum constraint diterapkan, jalankan report duplikasi PO item, delivery waiting, faktur, pembayaran, missing rekening/COA, mismatch total, dan orphan attachment.

## 10. Keamanan dan Kontrol Finansial

- Scope setiap query dan mutation berdasarkan bisnis/cabang yang diizinkan; ID saja tidak cukup.
- Segregation of duties: pembuat/persiapan tidak boleh memverifikasi/finalisasi dokumennya sendiri kecuali policy override tercatat.
- Approval limit dihitung dari grand total canonical dan currency yang dinormalisasi.
- Rekening supplier harus aktif, milik supplier PO, dan perubahan rekening setelah verifikasi memaksa reverification.
- Jangan log token, nomor rekening lengkap, file privat, atau payload finansial sensitif.
- Rate limit upload/export/mutation dan validasi CSRF sesuai arsitektur auth WEB-NEXT/OPS-BE.
- Tidak ada hard delete pada dokumen finansial; gunakan soft cancel dan reversal.

## 11. Observability dan Rekonsiliasi

- Metric: jumlah PO per status, aging per tahap, verification/finalization latency, retry/duplicate prevented, mismatch downstream, dan payment queue aging.
- Structured log selalu membawa `request_id`, `po_id`, `kdpo`, `actor_id`, transition, dan idempotency key.
- Reconciliation job membandingkan total PO dengan invoice/payment, jumlah item delivery, dan monitoring status; hasil tampil pada endpoint/detail.
- Alert kritis jika PO `close` tidak memiliki downstream link lengkap atau total debit/payment berbeda dari snapshot finalisasi.

## 12. Strategi Migrasi

1. **Discovery & data audit:** walkthrough OLD-WEB, konfirmasi role/approval limit/tax rounding, dan baseline query rekonsiliasi.
2. **Schema additive:** tambah index, version, audit, idempotency, dan mapping tanpa mengubah perilaku legacy.
3. **Backend read-only:** list/detail/permissions/reconciliation; bandingkan hasil dengan OLD-WEB.
4. **Preparation shadow:** mutation baru untuk `open → verify`, feature flag per bisnis, dual-read tanpa dual-write side effect.
5. **Verify/finalize canary:** satu bisnis/supplier; finalizer baru menjadi satu-satunya writer untuk PO terpilih. Jangan jalankan OLD-WEB dan OPS-BE sebagai writer pada dokumen yang sama.
6. **Frontend rollout:** WEB-NEXT menu, badge, deep-link, print/export; OLD-WEB tetap read-only fallback.
7. **Cutover:** semua mutation ke OPS-BE, legacy route dinonaktifkan bertahap, monitor reconciliation dan error budget.
8. **Decommission:** setelah minimal satu siklus pembayaran dan penerimaan barang tanpa mismatch.

Rollback rilis dilakukan melalui feature flag untuk dokumen yang belum dimutasi target; dokumen yang sudah difinalisasi tidak diulang di legacy.

## 13. Test Matrix Minimum

- Unit: state transition, money/PPN/discount/currency rounding, permission, grouping, approval limit.
- Integration: PR→PO mapping, preparation, verification, finalization kredit/tunai/mixed, attachment, rollback, monitoring, delivery waiting.
- Concurrency: double click, retry timeout, dua approver, generator nomor, optimistic conflict.
- Security: IDOR lintas bisnis/cabang, role escalation, rekening supplier lain, file spoofing, mass assignment.
- Failure injection: kegagalan invoice/payment/delivery/audit sebelum commit menghasilkan zero partial DB side effect.
- E2E: filter-list-detail, edit-submit-verify-finalize, return/revise, print/export, mobile/desktop/Electron.
- Reconciliation: total PO = invoice/payment snapshot; satu PO item = satu delivery waiting aktif; semua downstream links valid.

## 14. Acceptance Criteria MVP

- Semua PO aktif legacy tampil dengan total, status, dan scope yang sama atau memiliki discrepancy report yang disetujui.
- Tidak ada mutation yang dapat melewati transisi status atau permission backend.
- Double submit/retry finalize menghasilkan satu set dokumen downstream saja.
- Nilai header dan downstream dihitung backend dengan aturan decimal yang disepakati Finance.
- PO kredit masuk ke AP invoice; PO tunai masuk ke antrean kasir tanpa menyatakan kas/bank sudah terposting sebelum aksi kasir.
- Setiap PO item memiliki link PR item, delivery waiting, monitoring, serta invoice/payment yang relevan.
- Rollback menolak dokumen posted/paid/received dan menjelaskan reversal yang diperlukan.
- Audit trail mencakup seluruh perubahan status dan finansial.
- List p95 < 1 detik untuk 25 baris dan detail p95 < 1,5 detik pada jaringan internal normal.
- UAT ditandatangani Purchasing, Finance, Kasir, Logistik, dan Auditor; runbook cutover/rollback tersedia.

## 15. Rekomendasi Prioritas

1. **P0 — Idempotent finalization dan unique downstream mapping.** Ini kontrol terpenting untuk mencegah faktur/pembayaran ganda.
2. **P0 — Ubah konsep tunai menjadi `cashier_pending`.** PO boleh mempersiapkan payment, tetapi hanya kasir yang mem-posting kas/bank dan menandai lunas.
3. **P0 — Server-side financial calculation + decimal policy.** Hapus kepercayaan pada hidden field dan penggunaan float/`Math.ceil` yang tidak terdokumentasi.
4. **P0 — Scope permission dan segregation of duties.** Pisahkan prepare, verify, finalize, cashier-post, dan reversal.
5. **P1 — Audit/reconciliation dashboard.** Migrasi finansial tidak aman tanpa kemampuan mendeteksi mismatch secara cepat.
6. **P1 — Pisahkan master rekening pemasok.** Penambahan rekening perlu validasi vendor/finance, bukan dilakukan inline saat memproses PO.
7. **P1 — Satu detail workspace dengan preview posting.** Mengurangi perpindahan modal dan memberi pengguna pemahaman dampak sebelum finalisasi.
8. **P2 — SLA, saved views, bulk assignment, dan notifikasi outbox.** Dikerjakan setelah integritas transaksi dan kontrol finansial stabil.

## 16. Keputusan yang Masih Memerlukan Konfirmasi Bisnis

- Siapa yang boleh mengubah qty/harga setelah PR approved dan berapa toleransinya?
- Apakah satu user boleh prepare sekaligus verify/finalize pada kondisi darurat?
- Kapan PO tunai dianggap lunas: saat PO finalized atau saat kasir posting pembayaran?
- Apakah rekening supplier wajib telah diverifikasi Finance sebelum dipilih?
- Rounding policy per mata uang dan basis PPN (sebelum/setelah diskon).
- Approval limit per role/bisnis/currency dan aturan eskalasinya.
- Attachment minimum wajib per jenis/metode pembelian.
- Apakah mixed `tunai` dan `kredit` dalam satu PO tetap diperbolehkan atau harus dipisah sejak PR.

## 17. Referensi Source

- `mrt-v3/start/routes.js:331-359`
- `mrt-v3/app/Controllers/Http/akunting/PurchaseOrderController.js`
- `mrt-v3/app/Helpers/TrxPurchaseOrder.js`
- `mrt-v3/public/script/acc-purchase-order.js`
- `mrt-v3/resources/views/akunting/purchase-order/`
- `mrt-v3/app/Helpers/TrxPembayaran.js`
- `mrt-v3/app/Helpers/TrxFakturBeli.js`
- `be/app/Controllers/Http/material-supply-chain/PurchaseRequestController.js`
- `be/app/Models/Transaksi/TrxProcurement.js`
- `be/app/Models/Transaksi/TrxProcurementItem.js`
- `nextjs/docs/purchasing/request/`
- `nextjs/src/views/accounting/pengajuan-dana/`
- `nextjs/src/api/pengajuan-dana.js`
