## PRD Migrasi Transfer Antar Gudang

### Ringkasan
- Fitur `Transfer Antar Gudang` adalah migrasi penuh dari modul legacy `mrt-v3 /acc/transfer-persediaan` ke `./be` sebagai backend dan `./nextjs` sebagai frontend.
- Fitur ini mengelola perpindahan persediaan internal antar gudang tanpa melibatkan pemasok.
- Flow baru wajib memakai pipeline internal:
  - `Warehouse Transfer`
  - `Waiting Delivery`
  - `Shipping Order`
  - `Surat Jalan`
  - `Goods Receipt`
- Flow baru tidak menggunakan `Delivery Order` dan `Pickup Order`, karena perpindahan barang berasal dari gudang internal, bukan dari pemasok.
- Source of truth header dan item transfer tetap memakai tabel existing:
  - `trx_transfer_persediaans`
  - `trx_transfer_persediaan_items`

### Tujuan
- Menggantikan modul legacy transfer antar gudang yang masih berbasis Edge + jQuery.
- Menyatukan alur transfer internal dengan backend `#ops-be` yang sudah memiliki domain `shipping order` dan `goods receipt`.
- Menghilangkan bug satuan, bug pembulatan, dan ketidaksinkronan antara transfer, surat jalan, dan penerimaan barang.
- Menjamin integritas stok sumber dan stok tujuan dengan transaction, locking, dan validasi quantity.
- Menyediakan UX modern di `#web-next` dengan transparansi konversi satuan pakai ke satuan stok.

### Latar Belakang
- Modul legacy lama memiliki beberapa masalah utama:
  - quantity transfer diinput dalam `satuan pakai`, tetapi surat jalan dan penerimaan membaca quantity dalam `satuan order` tanpa kontrak yang eksplisit.
  - terdapat pemakaian `parseInt` pada quantity hasil konversi sehingga quantity pecahan dapat terpotong.
  - update transfer tidak menjaga sinkronisasi penuh dengan surat jalan dan dokumen turunannya.
  - nilai transfer dan jurnal berisiko salah karena quantity dan harga memakai pasangan satuan yang tidak konsisten.
  - flow transfer lama langsung menabrakkan logika transfer, waiting delivery, dan surat jalan dalam bentuk yang ambigu.
- `#ops-be` saat ini sudah memiliki jalur `SCM Shipping Order` dan `SCM Goods Receipt`, serta sudah mengenal `transfer_id` dan `transferitem_id` di shipping flow.
- Database existing juga sudah memiliki volume data transfer aktif dan relasi langsung ke `log_wait_delivery`, `log_surat_jalan_item`, dan flow stok.
- Karena itu, migrasi harus membangun ulang service transfer internal di atas tabel existing dengan kontrak bisnis yang tegas, bukan membuat source of truth baru.

### Scope

### In Scope
- List transfer antar gudang.
- Filter dan pencarian transfer antar gudang.
- Create draft transfer antar gudang.
- Edit draft transfer antar gudang.
- Submit transfer antar gudang.
- Pengurangan stok sumber saat submit.
- Pembuatan waiting delivery internal bertipe transfer.
- Pembuatan shipping order internal otomatis saat submit.
- Pembuatan surat jalan internal otomatis saat submit.
- Penerimaan barang transfer melalui `goods receipt` dengan filter `tipe=transfer`.
- Partial receipt dan full receipt.
- Cancel transfer selama belum ada penerimaan aktif.
- Reversal stok sumber saat cancel.
- Inactive shipping order, surat jalan, dan data terkait saat cancel.
- Audit trail event transfer.
- UI Next.js untuk list, create, detail, dan receive transfer.
- Kompatibilitas data agar old-web dan new-web dapat berjalan berdampingan pada tabel transfer yang sama.

### Out of Scope
- Approval multi-level sebelum submit transfer.
- Flow transfer yang melibatkan pemasok.
- Delivery Order untuk transfer internal.
- Pickup Order untuk transfer internal.
- Auto-create rack master baru bila rack tujuan belum siap.
- Bulk import transfer via Excel pada fase awal.
- Edit transfer setelah status bukan `draft`.
- Reverse receipt setelah barang sudah diterima.

### Lokasi & Akses
- Frontend URL list: `/warehouse/transfers`
- Frontend URL create: `/warehouse/transfers/create`
- Frontend URL detail: `/warehouse/transfers/[id]`
- Frontend URL receive: `/warehouse/transfers/[id]/receive`
- Menu diletakkan pada area `Warehouse` atau `SCM`, berdekatan dengan `Shipping Order` dan `Terima Barang`.

### Entitas Terkait
- `trx_transfer_persediaans`
- `trx_transfer_persediaan_items`
- `trx_transfer_persediaan_audits` atau tabel audit setara bila diperlukan
- `log_wait_delivery`
- `log_shipping_order`
- `log_shipping_order_items`
- `log_surat_jalan`
- `log_surat_jalan_item`
- `trx_terima_barangs`
- `trx_terima_barang_items`
- `log_barang_rack`
- `barang_lokasi`
- `mas_barangs`
- `mas_barang_rack`
- `mas_harga_beli`

### Definisi Satuan

### Prinsip utama
- User membuat transfer dalam `satuan pakai`.
- User menerima barang juga dalam `satuan pakai`.
- Stok sistem disimpan dan dimutasi dalam `satuan order` atau `satuan master barang`.

### Terminologi
- `satuan pakai`: satuan terkecil atau satuan operasional yang dipahami user, contoh `PCS`.
- `satuan order`: satuan stok master, contoh `BOX`.
- `pembagi_pakai`: faktor konversi dari `satuan pakai` ke `satuan order`.

### Rumus konversi
```text
qty_order = qty_pakai / pembagi_pakai
qty_pakai = qty_order * pembagi_pakai
```

### Contoh
```text
satuan_order  = BOX
satuan_pakai  = PCS
pembagi_pakai = 10

qty_pakai = 15 PCS
qty_order = 1.5 BOX
```

### Aturan penting
- Backend tidak boleh percaya `qty_order`, `harga`, `konversi`, atau `satuan` dari frontend.
- Frontend hanya mengirim quantity dalam `satuan pakai`.
- Backend wajib menghitung sendiri snapshot `qty_order`, `satuan_order`, `satuan_pakai`, dan `pembagi_pakai` dari master barang dan harga.
- Seluruh mutasi stok hanya memakai `qty_order`.

### Definisi Status
- `draft`: transfer baru dibuat, belum memengaruhi stok.
- `delivering`: transfer sudah disubmit, stok sumber sudah berkurang, shipping order internal dan surat jalan internal sudah terbentuk, dan transfer siap diterima.
- `partially_received`: transfer sudah diterima sebagian.
- `received`: seluruh quantity transfer sudah diterima penuh.
- `cancelled`: transfer dibatalkan sebelum ada penerimaan aktif, dengan reversal stok sumber serta inactive data shipping.

### Aturan Status
- Saat create draft:
  - `trx_transfer_persediaans.status = draft`
- Saat submit sukses:
  - stok sumber berkurang
  - `log_wait_delivery` bertipe transfer dibuat
  - `log_shipping_order` dibuat otomatis
  - `log_surat_jalan` dibuat otomatis
  - `trx_transfer_persediaans.status = delivering`
- Saat receipt parsial:
  - `trx_transfer_persediaans.status = partially_received`
- Saat receipt penuh:
  - `trx_transfer_persediaans.status = received`
- Saat cancel sebelum receipt:
  - stok sumber dikembalikan
  - waiting delivery, shipping order, shipping items, surat jalan, dan surat jalan items di-inactive
  - `trx_transfer_persediaans.status = cancelled`

### User Flow

### 1. List transfer antar gudang
- User membuka halaman `Transfer Antar Gudang`.
- Sistem menampilkan daftar transfer dengan status dan ringkasan quantity.
- User dapat filter berdasarkan:
  - tanggal transfer
  - kode transfer
  - gudang sumber
  - gudang tujuan
  - status
  - narasi

### 2. Membuat draft transfer
- User membuka halaman create transfer.
- User memilih gudang sumber dan gudang tujuan.
- User menambahkan item barang.
- Untuk setiap item, user memilih:
  - barang
  - rack sumber
  - harga beli snapshot
  - quantity dalam satuan pakai
- Sistem menampilkan konversi real-time:
  - quantity pakai
  - quantity order
  - stok sumber dalam satuan order dan pakai
- User submit draft.
- Draft tersimpan tanpa mutasi stok.

### 3. Edit draft transfer
- User dapat membuka draft dan mengubah header atau item.
- Quantity, rack, atau harga dapat diubah selama status masih `draft`.
- Backend menghitung ulang snapshot item.

### 4. Submit transfer
- User menekan tombol `Submit Transfer`.
- Backend melakukan validasi dan transaction.
- Jika seluruh item valid:
  - stok sumber berkurang
  - transfer audit `submitted` tercatat
  - waiting delivery transfer dibuat
  - shipping order internal otomatis dibuat
  - surat jalan internal otomatis dibuat
  - status transfer menjadi `delivering`
- Setelah submit sukses, user diarahkan ke detail transfer dengan status `delivering`.

### 5. Menerima transfer
- User membuka halaman receive atau masuk melalui daftar shipment siap diterima.
- Data shipment diambil dari:
  - `GET /scm/terima-barang/available-shipments?tipe=transfer`
- User memilih transfer / surat jalan yang masih aktif.
- Sistem menampilkan item yang masih punya sisa quantity.
- User mengisi quantity terima dalam `satuan pakai`.
- Backend mengonversi quantity ke `qty_order` untuk validasi dan mutasi stok.
- Jika diterima sebagian:
  - status transfer menjadi `partially_received`
- Jika diterima penuh:
  - status transfer menjadi `received`

### 6. Cancel transfer
- User dapat cancel transfer hanya bila:
  - status `delivering`
  - belum ada receipt aktif
  - belum ada quantity received
- Cancel akan:
  - reverse stok sumber
  - membuat audit `cancelled`
  - inactive waiting delivery
  - inactive shipping order dan itemnya
  - inactive surat jalan dan itemnya
  - set status transfer ke `cancelled`

### Business Rules

### Rule umum
- Gudang sumber dan gudang tujuan wajib berbeda.
- Rack sumber wajib milik gudang sumber.
- Rack tujuan wajib milik gudang tujuan.
- Quantity pakai wajib lebih dari `0`.
- `pembagi_pakai` wajib valid dan lebih dari `0`.
- Barang yang dipilih harus memiliki master satuan dan konversi yang valid.
- Harga yang dipakai harus konsisten dengan barang yang dipilih.

### Rule stok sumber
- Saat submit, backend wajib memeriksa stok tersedia pada gudang sumber.
- Validasi minimum:
  - stok barang tersedia pada rack sumber
  - quantity order transfer tidak melebihi stok tersedia
- Jika tidak cukup, submit ditolak.

### Rule update
- Update hanya boleh pada status `draft`.
- Transfer dengan status `delivering`, `partially_received`, `received`, atau `cancelled` tidak dapat diedit.

### Rule cancel
- Cancel hanya boleh jika belum ada receipt aktif.
- Cancel tidak boleh jika status `partially_received` atau `received`.
- Cancel tidak melakukan hard delete dokumen pengiriman, tetapi menandai inactive untuk menjaga audit.

### Rule receipt
- User menginput `qty_terima_pakai`.
- Backend menghitung `qty_terima_order`.
- `qty_terima_order` tidak boleh melebihi sisa `qty_order` item transfer / surat jalan.
- Penerimaan parsial diperbolehkan.
- Setelah total received sama dengan quantity shipped, status transfer dan dokumen shipping harus ditutup penuh.

### Desain API

### Warehouse Transfer API
```http
GET    /warehouse/transfers
GET    /warehouse/transfers/:id
POST   /warehouse/transfers
PUT    /warehouse/transfers/:id
POST   /warehouse/transfers/:id/submit
POST   /warehouse/transfers/:id/cancel
GET    /warehouse/transfers/:id/audit
```

### Supporting API
```http
GET /warehouse/transfers/options/barang
GET /warehouse/transfers/options/prices?barang_id=:id&gudang_id=:id
GET /warehouse/transfers/options/source-racks?barang_id=:id&gudang_id=:id
GET /warehouse/transfers/options/target-racks?barang_id=:id&gudang_id=:id
```

### Reuse API SCM
```http
GET /scm/shipping-order/ready-ship?tipe=transfer
GET /scm/terima-barang/available-shipments?tipe=transfer
```

### Catatan API
- `ready-ship?tipe=transfer` dipakai untuk monitoring atau daftar shipping transfer internal, bukan untuk create shipping manual.
- `available-shipments?tipe=transfer` wajib mengecualikan shipment non-transfer bila filter aktif.
- `POST /warehouse/transfers/:id/submit` harus otomatis membuat waiting delivery, shipping order, dan surat jalan internal.

### Request Create Draft
```json
{
  "trx_date": "2026-07-29",
  "gudang_src": 10,
  "gudang_target": 20,
  "narasi": "Transfer sparepart pit A ke gudang workshop",
  "items": [
    {
      "barang_id": 123,
      "rack_src_id": 55,
      "hargabeli_id": 99,
      "qty_pakai": 15
    }
  ]
}
```

### Request Submit
```json
{
  "submitted_at": "2026-07-29T10:15:00+08:00"
}
```

### Request Receive
```json
{
  "received_at": "2026-07-30",
  "narasi": "Penerimaan transfer workshop",
  "items": [
    {
      "transfer_item_id": 1,
      "sjitem_id": 200,
      "barang_id": 123,
      "rack_target_id": 88,
      "qty_terima_pakai": 5
    }
  ]
}
```

### Response Detail Minimum
```json
{
  "id": 1001,
  "kode": "TRF260700001",
  "status": "delivering",
  "trx_date": "2026-07-29",
  "gudang_src": { "id": 10, "nama": "Gudang Pit A" },
  "gudang_target": { "id": 20, "nama": "Gudang Workshop" },
  "shipping_order": { "id": 3001, "kode": "SHP260700012" },
  "surat_jalan": { "id": 4001, "kode": "SJ260700045" },
  "items": [
    {
      "id": 1,
      "barang_id": 123,
      "qty_pakai": 15,
      "satuan_pakai": "PCS",
      "qty_order": 1.5,
      "satuan_order": "BOX",
      "qty_received_pakai": 5,
      "qty_received_order": 0.5,
      "qty_remaining_pakai": 10,
      "qty_remaining_order": 1
    }
  ]
}
```

### DDL Tabel Baru
### Strategi DDL
- Tidak membuat tabel header/item transfer baru.
- Header transfer tetap memakai `trx_transfer_persediaans`.
- Item transfer tetap memakai `trx_transfer_persediaan_items`.
- Tabel baru hanya diperlukan untuk audit, bila histori event immutable belum tersedia di tempat lain.

### Tabel audit opsional `trx_transfer_persediaan_audits`
```sql
CREATE TABLE trx_transfer_persediaan_audits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transfer_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_label VARCHAR(100) NOT NULL,
  payload_json JSON NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_transfer_audit_transfer (transfer_id),
  INDEX idx_transfer_audit_event (event_type)
);
```

Keterangan field:
- `id`: primary key audit event.
- `transfer_id`: referensi ke `trx_transfer_persediaans.id`.
- `event_type`: kode event teknis, misalnya `created`, `submitted`, `received`, `cancelled`.
- `event_label`: label event yang lebih mudah dibaca user atau admin.
- `payload_json`: snapshot data tambahan saat event terjadi.
- `created_by`: user yang memicu event.
- `created_at`: waktu event tercatat.

### Alter Tabel Existing Yang Disarankan

### `trx_transfer_persediaans`
Tambahan metadata non-breaking agar old-web dan new-web bisa berjalan bersamaan:
```sql
ALTER TABLE trx_transfer_persediaans
  ADD COLUMN status ENUM('draft','delivering','partially_received','received','cancelled') NOT NULL DEFAULT 'delivering' AFTER narasi,
  ADD COLUMN submitted_at DATETIME NULL AFTER status,
  ADD COLUMN cancelled_at DATETIME NULL AFTER submitted_at,
  ADD COLUMN cancelled_by INT UNSIGNED NULL AFTER cancelled_at,
  ADD COLUMN shipping_order_id INT NULL AFTER cancelled_by,
  ADD COLUMN surat_jalan_id INT NULL AFTER shipping_order_id,
  ADD COLUMN source_app VARCHAR(30) NOT NULL DEFAULT 'old_web' AFTER surat_jalan_id,
  ADD INDEX idx_trx_transfer_status (status),
  ADD INDEX idx_trx_transfer_shipping (shipping_order_id),
  ADD INDEX idx_trx_transfer_sj (surat_jalan_id);
```

Keterangan field tabel `trx_transfer_persediaans`:
- `id`: primary key header transfer.
- `kode`: nomor dokumen transfer antar gudang.
- `trx_date`: tanggal dokumen transfer.
- `bisnis_id`: bisnis pemilik gudang sumber atau pembuat transfer.
- `target_bisnisid`: bisnis pemilik gudang tujuan, penting untuk transfer lintas bisnis.
- `cabang_id`: cabang yang merekam transaksi transfer.
- `gudang_src`: gudang sumber tempat stok keluar.
- `gudang_target`: gudang tujuan tempat stok akan diterima.
- `narasi`: keterangan bebas transfer.
- `nilai`: total nilai transfer berdasarkan item.
- `created_by`: user pembuat transfer.
- `aktif`: penanda aktif/nonaktif record legacy.
- `created_at`: waktu create record.
- `updated_at`: waktu update record terakhir.
- `status`: status bisnis transfer, dipakai flow baru (`draft`, `delivering`, `partially_received`, `received`, `cancelled`).
- `submitted_at`: waktu transfer resmi disubmit dan mulai mengurangi stok sumber.
- `cancelled_at`: waktu transfer dibatalkan.
- `cancelled_by`: user yang melakukan cancel transfer.
- `shipping_order_id`: relasi ke `log_shipping_order.id` yang dibuat otomatis saat submit.
- `surat_jalan_id`: relasi ke `log_surat_jalan.id` yang dibuat otomatis saat submit.
- `source_app`: penanda asal aplikasi pembuat data, misalnya `old_web` atau `ops_be`, untuk kompatibilitas dua sistem.

### `trx_transfer_persediaan_items`
Tambahan snapshot quantity dan harga agar kontrak satuan eksplisit, sambil mempertahankan `qty` dan `satuan` lama untuk kompatibilitas old-web:
```sql
ALTER TABLE trx_transfer_persediaan_items
  ADD COLUMN satuan_pakai VARCHAR(30) NULL AFTER satuan,
  ADD COLUMN satuan_order VARCHAR(30) NULL AFTER satuan_pakai,
  ADD COLUMN pembagi_pakai DECIMAL(18,6) NULL AFTER satuan_order,
  ADD COLUMN qty_pakai DECIMAL(18,6) NULL AFTER pembagi_pakai,
  ADD COLUMN qty_order DECIMAL(18,6) NULL AFTER qty_pakai,
  ADD COLUMN qty_received_pakai DECIMAL(18,6) NOT NULL DEFAULT 0 AFTER qty_order,
  ADD COLUMN qty_received_order DECIMAL(18,6) NOT NULL DEFAULT 0 AFTER qty_received_pakai,
  ADD COLUMN harga_pakai DECIMAL(18,6) NULL AFTER qty_received_order,
  ADD COLUMN harga_order DECIMAL(18,6) NULL AFTER harga_pakai,
  ADD COLUMN total_order DECIMAL(18,6) NULL AFTER harga_order,
  ADD COLUMN shipping_item_id INT NULL AFTER total_order,
  ADD COLUMN surat_jalan_item_id INT NULL AFTER shipping_item_id,
  ADD INDEX idx_trx_transfer_item_ship (shipping_item_id),
  ADD INDEX idx_trx_transfer_item_sj (surat_jalan_item_id);
```

Keterangan field tabel `trx_transfer_persediaan_items`:
- `id`: primary key item transfer.
- `pindah_id`: foreign key ke header `trx_transfer_persediaans.id`.
- `rack_id`: rack sumber tempat barang diambil.
- `barang_id`: barang yang ditransfer.
- `hargabeli_id`: referensi harga beli snapshot yang dipilih saat transfer dibuat.
- `satuan`: field legacy satuan item, tetap diisi `satuan_pakai` untuk kompatibilitas old-web.
- `qty`: field legacy quantity item, tetap diisi `qty_pakai` untuk kompatibilitas old-web.
- `harga`: field legacy harga item, dipertahankan agar old-web tetap membaca nilai yang sama.
- `total`: field legacy total item.
- `created_at`: waktu create record item.
- `updated_at`: waktu update record item terakhir.
- `satuan_pakai`: snapshot satuan pakai yang dipahami user, misalnya `PCS`.
- `satuan_order`: snapshot satuan stok/master yang dipakai untuk mutasi stok, misalnya `BOX`.
- `pembagi_pakai`: faktor konversi dari satuan pakai ke satuan order.
- `qty_pakai`: quantity input user dalam satuan pakai.
- `qty_order`: quantity hasil konversi yang dipakai untuk stok, shipping, dan receipt.
- `qty_received_pakai`: total quantity yang sudah diterima dalam satuan pakai.
- `qty_received_order`: total quantity yang sudah diterima dalam satuan order.
- `harga_pakai`: harga per satuan pakai.
- `harga_order`: harga per satuan order.
- `total_order`: total nilai item dalam basis satuan order.
- `shipping_item_id`: relasi ke `log_shipping_order_items.id` yang terbentuk saat submit.
- `surat_jalan_item_id`: relasi ke `log_surat_jalan_item.id` yang terbentuk saat submit.

### `log_wait_delivery`
Schema aktual sudah memiliki kolom transfer yang dibutuhkan:
- `kode_transfer`
- `transfer_id`
- `trfitem_id`
- `tipe`

DDL tambahan tidak wajib bila schema target sama dengan schema saat ini. Bila index belum ada, gunakan migration index-only seperti berikut:
```sql
ALTER TABLE log_wait_delivery
  ADD INDEX idx_wait_delivery_tipe (tipe),
  ADD INDEX idx_wait_delivery_transfer (transfer_id),
  ADD INDEX idx_wait_delivery_trfitem (trfitem_id);
```

Keterangan field terkait transfer pada `log_wait_delivery`:
- `kode_transfer`: nomor dokumen transfer asal.
- `transfer_id`: relasi ke header transfer `trx_transfer_persediaans.id`.
- `trfitem_id`: relasi ke item transfer `trx_transfer_persediaan_items.id`.
- `gudang_id`: gudang tujuan receipt, bukan gudang sumber.
- `barang_id`: barang yang menunggu proses shipping.
- `satuan`: satuan quantity waiting delivery, harus mengikuti satuan order.
- `qty`: quantity total yang harus diproses shipping.
- `qty_do`: quantity yang eligible masuk shipping pipeline.
- `pickup`: quantity yang sudah di-pickup bila flow lama masih ikut bermain.
- `send`: quantity yang sudah benar-benar dikirim.
- `harga`: nilai item untuk referensi dokumen dan monitoring.
- `tipe`: penanda asal flow, dipakai agar transfer internal bisa difilter terpisah dari purchasing.

### `log_shipping_order`
Schema aktual sudah memiliki kolom:
- `tipe`
- `transfer_id`

DDL tambahan hanya diperlukan bila index belum tersedia:
```sql
ALTER TABLE log_shipping_order
  ADD INDEX idx_shipping_tipe (tipe),
  ADD INDEX idx_shipping_transfer (transfer_id);
```

Keterangan field penting pada `log_shipping_order`:
- `id`: primary key shipping order.
- `trx_date`: tanggal shipping order.
- `kode`: nomor shipping order.
- `kode_sj`: nomor surat jalan yang terkait.
- `sj_id`: relasi ke `log_surat_jalan.id`.
- `cabang_src`: cabang pengirim dari gudang sumber.
- `gudang_rec`: gudang penerima atau gudang tujuan.
- `narasi`: keterangan shipping internal.
- `status`: status shipping order, minimal `pending` atau `received`.
- `tipe`: penanda jenis shipment, misalnya `purchasing` atau `transfer`.
- `transfer_id`: relasi ke `trx_transfer_persediaans.id` bila shipment berasal dari transfer antar gudang.
- `aktif`: penanda aktif/nonaktif data shipping.

### `log_shipping_order_items`
Schema aktual sudah memiliki kolom `transferitem_id`.

DDL tambahan hanya diperlukan bila index belum tersedia:
```sql
ALTER TABLE log_shipping_order_items
  ADD INDEX idx_shipping_item_transferitem (transferitem_id);
```

Keterangan field penting pada `log_shipping_order_items`:
- `id`: primary key shipping item.
- `ship_id`: relasi ke `log_shipping_order.id`.
- `wait_id`: relasi ke `log_wait_delivery.id`.
- `barang_id`: barang yang dikirim.
- `narasi`: deskripsi barang/item shipping.
- `satuan`: satuan quantity shipping, harus memakai satuan order.
- `kirim`: quantity yang dikirim.
- `harga_stn`: harga per satuan shipping.
- `transferitem_id`: relasi ke `trx_transfer_persediaan_items.id` untuk flow transfer.
- `aktif`: penanda item shipping masih aktif.

### `log_surat_jalan`
Schema aktual belum memiliki kolom:
- `tipe`
- `transfer_id`

Karena itu, migration add column berikut tetap diperlukan:
```sql
ALTER TABLE log_surat_jalan
  ADD COLUMN tipe VARCHAR(30) NULL AFTER kode_sj,
  ADD COLUMN transfer_id BIGINT UNSIGNED NULL AFTER tipe,
  ADD INDEX idx_sj_tipe (tipe),
  ADD INDEX idx_sj_transfer (transfer_id);
```

Keterangan field penting pada `log_surat_jalan`:
- `id`: primary key surat jalan.
- `bisnis_id`: bisnis pemilik dokumen pengiriman.
- `trx_date`: tanggal surat jalan.
- `kode_sj`: nomor surat jalan.
- `gudang_id`: gudang tujuan receipt.
- `delivered_at`: tanggal atau waktu barang dikirim.
- `received_at`: tanggal atau waktu barang dinyatakan diterima penuh.
- `est_received`: estimasi waktu terima.
- `narasi`: keterangan surat jalan.
- `status`: status dokumen, minimal `delivering` atau `receiving` pada schema existing.
- `tipe`: penanda asal shipment, dipakai untuk filter `transfer`.
- `transfer_id`: relasi ke `trx_transfer_persediaans.id`.
- `aktif`: penanda dokumen masih aktif.
- `author`: user pembuat surat jalan.

### `log_surat_jalan_item`
```sql
ALTER TABLE log_surat_jalan_item
  ADD COLUMN qty_pakai DECIMAL(18,6) NULL AFTER qty,
  ADD COLUMN uom_pakai VARCHAR(30) NULL AFTER uom,
  ADD INDEX idx_sj_item_transfer (transfer_id),
  ADD INDEX idx_sj_item_transferitem (transferitem_id);
```

Catatan schema aktual:
- `transfer_id` dan `transferitem_id` sudah ada pada `log_surat_jalan_item`.
- Kolom baru yang benar-benar dibutuhkan untuk UI baru hanyalah `qty_pakai` dan `uom_pakai`.
- Index `transfer_id` dan `transferitem_id` hanya ditambahkan bila belum ada.

Keterangan field penting pada `log_surat_jalan_item`:
- `id`: primary key surat jalan item.
- `sj_id`: relasi ke `log_surat_jalan.id`.
- `no_transfer`: nomor dokumen transfer asal.
- `transfer_id`: relasi ke `trx_transfer_persediaans.id`.
- `transferitem_id`: relasi ke `trx_transfer_persediaan_items.id`.
- `barang_id`: barang yang dikirim.
- `qty`: quantity kirim dalam satuan order.
- `qty_pakai`: snapshot quantity kirim dalam satuan pakai untuk kebutuhan UI baru.
- `harga_stn`: harga per satuan item.
- `terima`: quantity yang sudah diterima.
- `uom`: satuan order pada item surat jalan.
- `uom_pakai`: satuan pakai pada item surat jalan.
- `narasi`: deskripsi barang/item.
- `aktif`: penanda item surat jalan masih aktif.

### `trx_terima_barang_items`
Schema aktual belum memiliki kolom:
- `qty_pakai`
- `uom_pakai`
- `transferitem_id`

Tambahan snapshot penerimaan satuan pakai yang diperlukan:
```sql
ALTER TABLE trx_terima_barang_items
  ADD COLUMN qty_pakai DECIMAL(18,6) NULL AFTER qty,
  ADD COLUMN uom_pakai VARCHAR(30) NULL AFTER uom,
  ADD COLUMN transferitem_id BIGINT UNSIGNED NULL AFTER sjitem_id,
  ADD INDEX idx_receipt_item_transferitem (transferitem_id);
```

Keterangan field penting pada `trx_terima_barang_items`:
- `id`: primary key receipt item.
- `trx_terima`: relasi ke header penerimaan `trx_terima_barangs.id`.
- `sj_id`: relasi ke `log_surat_jalan.id`.
- `sjitem_id`: relasi ke `log_surat_jalan_item.id`.
- `transferitem_id`: relasi ke `trx_transfer_persediaan_items.id`.
- `barang_id`: barang yang diterima.
- `description`: narasi item receipt.
- `qty`: quantity diterima dalam satuan order.
- `qty_pakai`: quantity diterima dalam satuan pakai sesuai input user.
- `uom`: satuan order receipt.
- `uom_pakai`: satuan pakai receipt.
- `harga`: harga snapshot pada saat penerimaan.
- `pemasok_id`: pemasok, biasanya kosong untuk transfer internal kecuali dipakai untuk kompatibilitas schema lama.
- `rack_id`: rack tujuan tempat barang ditempatkan.
- `aktif`: penanda item receipt masih aktif.

### Catatan DDL
- Bila sebagian field transfer sudah ada pada tabel existing `SCM`, migration harus mendeteksi dan hanya menambah field yang benar-benar belum tersedia.
- `trx_transfer_persediaans` dan `trx_transfer_persediaan_items` tidak diganti, hanya diperkaya metadata secara non-breaking.
- `qty` dan `satuan` lama pada item tetap dipertahankan untuk backward compatibility dengan old-web.
- Tipe `JSON` dapat diganti `LONGTEXT` bila engine atau kompatibilitas DB menuntut.

### Mapping Data Antar Entitas
```text
trx_transfer_persediaans.id
  -> log_wait_delivery.transfer_id
  -> log_shipping_order.transfer_id
  -> log_surat_jalan.transfer_id

trx_transfer_persediaan_items.id
  -> log_wait_delivery.trfitem_id
  -> log_shipping_order_items.transferitem_id
  -> log_surat_jalan_item.transferitem_id
  -> trx_terima_barang_items.transferitem_id
```

### Mapping Kompatibilitas Quantity
```text
Old-web:
trx_transfer_persediaan_items.qty    = qty dalam satuan pakai
trx_transfer_persediaan_items.satuan = satuan pakai

New-web / ops-be:
qty_pakai        = quantity input user
satuan_pakai     = snapshot satuan pakai
qty_order        = quantity stok / shipping / receipt
satuan_order     = snapshot satuan order
pembagi_pakai    = snapshot konversi
```

### Aturan Mutasi Stok

### Saat draft
- Tidak ada mutasi stok.

### Saat submit
- Kurangi stok gudang sumber memakai `qty_order`.
- Update `log_barang_rack` gudang sumber.
- Buat movement `barang_lokasi` sumber sebagai aliran keluar transfer.
- Tidak ada penambahan stok gudang tujuan pada tahap ini.

### Saat receive
- Tambahkan stok gudang tujuan memakai `qty_terima_order`.
- Update `log_barang_rack` gudang tujuan.
- Buat movement `barang_lokasi` tujuan sebagai aliran masuk transfer.

### Saat cancel
- Tambahkan kembali stok gudang sumber memakai `qty_order` yang sempat dikurangi.
- Buat movement reversal pada gudang sumber.
- Gudang tujuan tidak disentuh karena cancel hanya boleh saat belum ada receipt.

### Integrasi Dengan Shipping Order

### Prinsip integrasi
- Transfer internal tetap direpresentasikan sebagai shipping order dan surat jalan agar konsisten dengan modul pengiriman dan penerimaan backend baru.
- Namun transfer internal tidak masuk ke flow `delivery order` dan `pickup order`.

### Perilaku submit
- `submit` otomatis melakukan:
  - create `log_wait_delivery` dengan `tipe=transfer`
  - create `log_shipping_order` dengan `tipe=transfer`
  - create `log_shipping_order_items`
  - create `log_surat_jalan` dengan `tipe=transfer`
  - create `log_surat_jalan_item`

### Perilaku filter SCM
- `GET /scm/shipping-order/ready-ship?tipe=transfer`
  - hanya menampilkan shipping order atau sumber shipping yang berasal dari transfer internal.
- `GET /scm/terima-barang/available-shipments?tipe=transfer`
  - hanya menampilkan shipment yang berasal dari transfer internal.

### UX Frontend Next.js

### Halaman list
- Tampilkan:
  - kode transfer
  - tanggal
  - gudang sumber
  - gudang tujuan
  - status
  - total item
  - total quantity pakai
  - total quantity order
  - progress receipt

### Halaman create/edit draft
- Form header:
  - tanggal transfer
  - gudang sumber
  - gudang tujuan
  - narasi
- Form item:
  - picker barang
  - rack sumber
  - harga snapshot
  - quantity pakai
  - preview quantity order
  - stok tersedia pada rack sumber
  - satuan pakai dan satuan order
- Tombol aksi:
  - `Simpan Draft`
  - `Submit Transfer`

### Halaman detail
- Tampilkan header transfer.
- Tampilkan shipping order dan surat jalan terkait.
- Tampilkan progress penerimaan.
- Tampilkan timeline audit.
- Bila status `delivering` dan belum ada receipt, tampilkan tombol `Cancel Transfer`.

### Halaman receive
- Header read-only dari shipment transfer.
- Item grid menampilkan:
  - qty kirim pakai
  - qty kirim order
  - qty sudah diterima pakai
  - qty sudah diterima order
  - sisa pakai
  - sisa order
  - rack tujuan
  - quantity terima pakai
  - preview quantity terima order

### UX penting
- User selalu input quantity dalam `satuan pakai`.
- UI selalu menampilkan konversi dua arah.
- Jika quantity tidak valid, tombol submit/receive diblok.

### Backend Validation Checklist

### Validasi create/update draft
- `trx_date` wajib valid.
- `gudang_src` wajib ada.
- `gudang_target` wajib ada.
- `gudang_src != gudang_target`.
- `items.length >= 1`.
- setiap item wajib punya:
  - `barang_id`
  - `rack_src_id`
  - `qty_pakai > 0`
- barang valid.
- rack sumber valid dan milik gudang sumber.
- harga valid dan milik barang.
- pembagi pakai valid.

### Validasi submit
- status harus `draft`.
- tidak boleh ada item inactive.
- stok sumber cukup untuk seluruh item.
- quantity order hasil konversi valid.
- row terkait stok sumber di-lock.

### Validasi receive
- transfer harus `delivering` atau `partially_received`.
- surat jalan aktif.
- item receipt valid dan milik transfer.
- quantity terima pakai lebih dari `0`.
- quantity terima order tidak melebihi sisa.
- rack tujuan valid.

### Validasi cancel
- transfer harus `delivering`.
- belum ada receipt item aktif.
- belum ada quantity received.

### Concurrency & Transaction
- Semua operasi `submit`, `receive`, dan `cancel` wajib transactional.
- Row yang wajib `FOR UPDATE` saat submit:
  - transfer header
  - transfer items
  - stok ringkasan rack sumber
- Row yang wajib `FOR UPDATE` saat receive:
  - surat jalan
  - surat jalan items
  - receipt target rows
  - stok ringkasan rack tujuan
- Row yang wajib `FOR UPDATE` saat cancel:
  - transfer header
  - transfer items
  - shipping order
  - surat jalan
  - stok ringkasan rack sumber

### Logging & Audit
- Setiap event penting harus tercatat di `trx_transfer_persediaan_audits` atau mekanisme audit setara:
  - `created`
  - `updated`
  - `submitted`
  - `stock_source_deducted`
  - `waiting_delivery_created`
  - `shipping_order_created`
  - `surat_jalan_created`
  - `partially_received`
  - `received`
  - `cancelled`
  - `stock_source_reversed`
  - `shipping_inactivated`

### Reporting & Export
- List dan detail harus dapat menampilkan quantity dalam dua satuan.
- Export Excel tahap berikutnya direkomendasikan menampilkan:
  - `qty_pakai`
  - `satuan_pakai`
  - `qty_order`
  - `satuan_order`
  - `qty_received_pakai`
  - `qty_received_order`

### Test Scenario Minimum

### Create & submit
- Create draft dengan 1 item valid.
- Create draft dengan beberapa item valid.
- Submit transfer sukses.
- Submit transfer ditolak jika stok sumber tidak cukup.
- Submit transfer ditolak jika gudang sumber sama dengan tujuan.

### Konversi satuan
- `15 PCS / 10 = 1.5 BOX` tersimpan konsisten.
- Quantity pecahan tidak dipotong.
- UI dan API mengembalikan snapshot quantity pakai dan order.

### Shipping integration
- Submit otomatis membuat waiting delivery `tipe=transfer`.
- Submit otomatis membuat shipping order internal.
- Submit otomatis membuat surat jalan internal.
- Data shipping dan surat jalan terhubung ke transfer dan item transfer.

### Receive
- Partial receipt sukses.
- Full receipt sukses.
- Over-receipt ditolak.
- Receipt pada rack tujuan yang invalid ditolak.
- Receive input dalam satuan pakai tersimpan konsisten pada quantity order.

### Cancel
- Cancel sukses saat belum ada receipt.
- Cancel gagal saat sudah partial receipt.
- Cancel mengembalikan stok sumber.
- Cancel meng-inactive data shipping dan surat jalan.

### Non-functional Requirements
- Response list harus mendukung pagination server-side.
- Detail transfer harus bisa dimuat cepat meski item banyak.
- Quantity harus disimpan minimal `DECIMAL(18,6)` untuk menghindari kehilangan presisi.
- Error backend harus jelas dan dapat ditampilkan langsung di frontend.
- Semua operasi finansial dan stok harus idempotent terhadap retry yang aman.

### Rencana Implementasi Bertahap

### Phase 1
- Tambah kolom metadata pada `trx_transfer_persediaans` dan `trx_transfer_persediaan_items`.
- Buat model backend untuk tabel existing transfer.
- Implement API create draft, update draft, list, detail.

### Phase 2
- Implement submit transfer.
- Integrasikan waiting delivery, shipping order, dan surat jalan internal.
- Tambahkan audit dan mutasi stok sumber.

### Phase 3
- Tambahkan filter `tipe=transfer` pada endpoint SCM shipping dan goods receipt.
- Implement receive transfer dengan input satuan pakai.

### Phase 4
- Implement cancel transfer.
- Implement UI detail, receive, dan audit timeline.

### Risks
- Reuse tabel transfer existing tanpa penambahan metadata dapat membuat old-web dan new-web sulit dibedakan perilakunya.
- Reuse tabel existing SCM tanpa penambahan metadata `tipe` dapat membuat transfer internal bercampur dengan flow PO/pemasok.
- Jika quantity pakai dan quantity order tidak disimpan bersamaan, bug konversi lama berpotensi muncul kembali.
- Cancel yang dilakukan tanpa validasi receipt aktif dapat menyebabkan stok sumber kembali padahal stok tujuan sudah bertambah.
- Ketergantungan pada data master barang dan harga yang belum bersih dapat memicu error saat submit.

### Keputusan Final Yang Sudah Disepakati
- Prefix API utama memakai `/warehouse/transfers`.
- Persistence header dan item transfer tetap memakai `trx_transfer_persediaans` dan `trx_transfer_persediaan_items`.
- Transfer internal tidak memakai delivery order dan pickup order.
- Submit otomatis membuat shipping order dan surat jalan internal.
- Stok sumber berkurang saat submit.
- Stok tujuan bertambah saat receive.
- User menerima barang dalam satuan pakai.
- Status setelah submit langsung `delivering`.
- Cancel setelah `delivering` diperbolehkan selama belum ada receipt, dengan reversal stok sumber dan inactive data shipping.


<!-- DROP TABLE IF EXISTS trx_transfer_persediaan_audits;
CREATE TABLE trx_transfer_persediaan_audits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transfer_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_label VARCHAR(100) NOT NULL,
  payload_json JSON NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_transfer_audit_transfer (transfer_id),
  INDEX idx_transfer_audit_event (event_type)
);

ALTER TABLE trx_transfer_persediaans
  ADD COLUMN status ENUM('draft','delivering','partially_received','received','cancelled') NOT NULL DEFAULT 'delivering' AFTER narasi,
  ADD COLUMN submitted_at DATETIME NULL AFTER status,
  ADD COLUMN cancelled_at DATETIME NULL AFTER submitted_at,
  ADD COLUMN cancelled_by INT UNSIGNED NULL AFTER cancelled_at,
  ADD COLUMN shipping_order_id INT NULL AFTER cancelled_by,
  ADD COLUMN surat_jalan_id INT NULL AFTER shipping_order_id,
  ADD COLUMN source_app VARCHAR(30) NOT NULL DEFAULT 'old_web' AFTER surat_jalan_id,
  ADD INDEX idx_trx_transfer_status (status),
  ADD INDEX idx_trx_transfer_shipping (shipping_order_id),
  ADD INDEX idx_trx_transfer_sj (surat_jalan_id);


ALTER TABLE trx_transfer_persediaan_items
  ADD COLUMN satuan_pakai VARCHAR(30) NULL AFTER satuan,
  ADD COLUMN satuan_order VARCHAR(30) NULL AFTER satuan_pakai,
  ADD COLUMN pembagi_pakai DECIMAL(18,6) NULL AFTER satuan_order,
  ADD COLUMN qty_pakai DECIMAL(18,6) NULL AFTER pembagi_pakai,
  ADD COLUMN qty_order DECIMAL(18,6) NULL AFTER qty_pakai,
  ADD COLUMN qty_received_pakai DECIMAL(18,6) NOT NULL DEFAULT 0 AFTER qty_order,
  ADD COLUMN qty_received_order DECIMAL(18,6) NOT NULL DEFAULT 0 AFTER qty_received_pakai,
  ADD COLUMN harga_pakai DECIMAL(18,6) NULL AFTER qty_received_order,
  ADD COLUMN harga_order DECIMAL(18,6) NULL AFTER harga_pakai,
  ADD COLUMN total_order DECIMAL(18,6) NULL AFTER harga_order,
  ADD COLUMN shipping_item_id INT NULL AFTER total_order,
  ADD COLUMN surat_jalan_item_id INT NULL AFTER shipping_item_id,
  ADD INDEX idx_trx_transfer_item_ship (shipping_item_id),
  ADD INDEX idx_trx_transfer_item_sj (surat_jalan_item_id);

ALTER TABLE log_wait_delivery
  ADD COLUMN tipe VARCHAR(30) NULL AFTER metode,
  ADD INDEX idx_wait_delivery_tipe (tipe),
  ADD INDEX idx_wait_delivery_transfer (transfer_id),
  ADD INDEX idx_wait_delivery_trfitem (trfitem_id);

ALTER TABLE log_shipping_order
  ADD COLUMN transfer_id BIGINT UNSIGNED NULL AFTER tipe,
  ADD INDEX idx_shipping_tipe (tipe),
  ADD INDEX idx_shipping_transfer (transfer_id);

ALTER TABLE log_shipping_order_items
  ADD COLUMN transferitem_id BIGINT UNSIGNED NULL AFTER wait_id,
  ADD INDEX idx_shipping_item_transferitem (transferitem_id);

ALTER TABLE log_surat_jalan
  ADD COLUMN tipe VARCHAR(30) NULL AFTER kode_sj,
  ADD COLUMN transfer_id BIGINT UNSIGNED NULL AFTER tipe,
  ADD INDEX idx_sj_tipe (tipe),
  ADD INDEX idx_sj_transfer (transfer_id);

ALTER TABLE log_surat_jalan_item
  ADD COLUMN qty_pakai DECIMAL(18,6) NULL AFTER qty,
  ADD COLUMN uom_pakai VARCHAR(30) NULL AFTER uom,
  ADD INDEX idx_sj_item_transfer (transfer_id),
  ADD INDEX idx_sj_item_transferitem (transferitem_id);

ALTER TABLE trx_terima_barang_items
  ADD COLUMN qty_pakai DECIMAL(18,6) NULL AFTER qty,
  ADD COLUMN uom_pakai VARCHAR(30) NULL AFTER uom,
  ADD COLUMN transferitem_id BIGINT UNSIGNED NULL AFTER sjitem_id,
  ADD INDEX idx_receipt_item_transferitem (transferitem_id); -->