## TODO Migrasi Transfer Antar Gudang

### 1. Database & schema backend
- Reuse tabel existing `trx_transfer_persediaans` sebagai header transfer.
- Reuse tabel existing `trx_transfer_persediaan_items` sebagai item transfer.
- Buat migration audit hanya jika dibutuhkan, misalnya `trx_transfer_persediaan_audits`.
- Tambahkan field dan index yang dibutuhkan pada tabel existing:
  - `trx_transfer_persediaans`
  - `trx_transfer_persediaan_items`
  - `log_wait_delivery`
  - `log_shipping_order`
  - `log_shipping_order_items`
  - `log_surat_jalan`
  - `log_surat_jalan_item`
  - `trx_terima_barang_items`
- Pastikan quantity memakai `DECIMAL(18,6)`.
- Review field existing SCM agar migration tidak menambah kolom yang sudah ada dengan nama berbeda.
- Khusus schema aktual yang sudah terverifikasi:
  - `log_wait_delivery` sudah punya `tipe`, `transfer_id`, `trfitem_id`
  - `log_shipping_order` sudah punya `tipe`, `transfer_id`
  - `log_shipping_order_items` sudah punya `transferitem_id`
  - `log_surat_jalan` belum punya `tipe`, `transfer_id`
  - `log_surat_jalan_item` belum punya `qty_pakai`, `uom_pakai`
  - `trx_terima_barang_items` belum punya `qty_pakai`, `uom_pakai`, `transferitem_id`

### 2. Model backend
- Tambah model backend untuk `trx_transfer_persediaans` bila belum ada di `#ops-be`.
- Tambah model backend untuk `trx_transfer_persediaan_items` bila belum ada di `#ops-be`.
- Tambah model audit bila audit table baru dibuat.
- Tambah relasi dari transfer ke gudang sumber, gudang tujuan, shipping order, surat jalan, items, audit.
- Tambah relasi dari item ke barang, rack sumber, shipping item, surat jalan item.

### 3. Service backend transfer
- Buat service `WarehouseTransferServices`.
- Implement method:
  - `LIST`
  - `SHOW`
  - `CREATE_DRAFT`
  - `UPDATE_DRAFT`
  - `SUBMIT`
  - `CANCEL`
  - `AUDIT`
- Tambahkan helper internal untuk:
  - generate kode transfer
  - konversi `qty_pakai -> qty_order`
  - hitung summary header
  - validasi stok sumber
  - build snapshot item
  - build audit event

### 4. Validasi backend transfer
- Tambahkan validation schema create/update draft.
- Validasi header:
  - `trx_date`
  - `gudang_src`
  - `gudang_target`
  - `gudang_src != gudang_target`
  - `narasi` optional atau required sesuai keputusan final implementasi
- Validasi item:
  - `barang_id`
  - `rack_src_id`
  - `hargabeli_id`
  - `qty_pakai > 0`
- Validasi rack sumber milik gudang sumber.
- Validasi harga sesuai barang.
- Validasi `pembagi_pakai > 0`.

### 5. API backend transfer
- Tambah route `GET /warehouse/transfers`.
- Tambah route `GET /warehouse/transfers/:id`.
- Tambah route `POST /warehouse/transfers`.
- Tambah route `PUT /warehouse/transfers/:id`.
- Tambah route `POST /warehouse/transfers/:id/submit`.
- Tambah route `POST /warehouse/transfers/:id/cancel`.
- Tambah route `GET /warehouse/transfers/:id/audit`.
- Tambah route options:
  - `/warehouse/transfers/options/barang`
  - `/warehouse/transfers/options/prices`
  - `/warehouse/transfers/options/source-racks`
  - `/warehouse/transfers/options/target-racks`

### 6. Submit flow backend
- Lock transfer header dan item saat submit.
- Lock stok summary rack sumber.
- Validasi status masih `draft`.
- Validasi stok sumber cukup.
- Kurangi stok sumber dengan `qty_order`.
- Simpan movement sumber ke `barang_lokasi`.
- Buat audit `submitted`.
- Buat `log_wait_delivery` dengan `tipe=transfer`.
- Buat `log_shipping_order` otomatis.
- Buat `log_shipping_order_items` otomatis.
- Buat `log_surat_jalan` otomatis.
- Buat `log_surat_jalan_item` otomatis.
- Simpan relasi shipping dan surat jalan ke transfer.
- Update `trx_transfer_persediaans.shipping_order_id` dan `surat_jalan_id`.
- Update `trx_transfer_persediaan_items.shipping_item_id` dan `surat_jalan_item_id`.
- Set status transfer ke `delivering`.

### 7. Integrasi shipping order existing
- Review `ShippingOrderServices` agar aman dengan `tipe=transfer`.
- Tambahkan filter `GET /scm/shipping-order/ready-ship?tipe=transfer`.
- Pastikan data transfer internal tidak tercampur dengan flow pemasok saat filter aktif.
- Pastikan shipping order transfer tidak membutuhkan delivery order atau pickup order.

### 8. Integrasi goods receipt existing
- Review `GoodsReceiptController` dan `GoodsReceiptServices`.
- Tambahkan dukungan filter `GET /scm/terima-barang/available-shipments?tipe=transfer`.
- Pastikan shipment transfer internal bisa muncul terpisah dari shipment pemasok.
- Tambahkan endpoint domain transfer:
  - `POST /warehouse/transfers/:id/receive`
- Implement receive berbasis `qty_terima_pakai`.
- Konversi ke `qty_terima_order` di backend.
- Update:
  - `trx_terima_barangs`
  - `trx_terima_barang_items`
  - `log_surat_jalan_item.terima`
  - `log_barang_rack` gudang tujuan
  - `barang_lokasi` tujuan
  - `trx_transfer_persediaan_items.qty_received_*`
  - `trx_transfer_persediaans.status`

### 9. Status & audit backend
- Implement status `draft`.
- Implement status `delivering`.
- Implement status `partially_received`.
- Implement status `received`.
- Implement status `cancelled`.
- Tulis audit event minimal:
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

### 10. Cancel flow backend
- Validasi cancel hanya untuk status `delivering`.
- Validasi belum ada receipt aktif.
- Validasi seluruh `qty_received_order = 0`.
- Reverse stok sumber dengan `qty_order`.
- Simpan movement reversal pada `barang_lokasi`.
- Inactive:
  - `log_wait_delivery`
  - `log_shipping_order`
  - `log_shipping_order_items`
  - `log_surat_jalan`
  - `log_surat_jalan_item`
- Update status transfer menjadi `cancelled`.
- Tulis audit cancel.

### 11. Option/master data backend
- Implement option barang dengan stok sumber dalam dua satuan.
- Implement option harga dengan label satuan pakai dan order.
- Implement option rack sumber dengan stok aktual.
- Implement option rack tujuan dengan rekomendasi rack berdasarkan histori/stok.

### 12. Frontend Next.js routing
- Tambah halaman `/warehouse/transfers`.
- Tambah halaman `/warehouse/transfers/create`.
- Tambah halaman `/warehouse/transfers/[id]`.
- Tambah halaman `/warehouse/transfers/[id]/receive`.
- Tambah menu sidebar untuk transfer antar gudang.

### 13. Frontend list page
- Buat table list transfer dengan server-side query.
- Tambahkan filter:
  - tanggal
  - kode
  - gudang sumber
  - gudang tujuan
  - status
  - narasi
- Tampilkan badge status.
- Tampilkan progress receipt.
- Tampilkan total qty pakai dan qty order.

### 14. Frontend create/edit draft page
- Buat form header transfer.
- Buat item grid dinamis.
- Integrasikan option barang.
- Integrasikan option harga.
- Integrasikan option rack sumber.
- Tampilkan stok sumber dalam dua satuan.
- Tampilkan konversi realtime `qty_pakai -> qty_order`.
- Tambah aksi:
  - `Simpan Draft`
  - `Submit Transfer`
- Pastikan payload hanya kirim data mentah yang dibutuhkan backend.

### 15. Frontend detail page
- Tampilkan header transfer.
- Tampilkan item transfer.
- Tampilkan shipping order dan surat jalan terkait.
- Tampilkan progress penerimaan.
- Tampilkan audit timeline.
- Tampilkan tombol `Cancel Transfer` bila eligible.
- Tampilkan tombol `Terima Barang` bila eligible.

### 16. Frontend receive page
- Muat shipment transfer dari endpoint transfer detail atau shipment transfer available.
- Tampilkan sisa quantity dalam dua satuan.
- User input `qty_terima_pakai`.
- Tampilkan preview `qty_terima_order`.
- Integrasikan option rack tujuan.
- Disable submit bila quantity invalid.
- Submit ke `POST /warehouse/transfers/:id/receive`.

### 17. Shared frontend utilities
- Buat formatter quantity dua satuan.
- Buat helper konversi quantity untuk tampilan.
- Buat badge mapper status transfer.
- Buat service API/fetcher warehouse transfer.
- Tambahkan typings/interface bila project menggunakan type annotations parsial.

### 18. Error handling & UX
- Tampilkan error validasi per field di form create/edit.
- Tampilkan business error stok tidak cukup.
- Tampilkan loading/skeleton pada list dan detail.
- Tampilkan confirm dialog untuk submit dan cancel.
- Disable button saat request berjalan.
- Pastikan idempotency terhadap double click submit/receive bila memungkinkan.

### 19. Testing backend
- Unit test konversi quantity.
- Unit test builder snapshot item.
- Integration test create draft.
- Integration test update draft.
- Integration test submit sukses.
- Integration test submit gagal karena stok kurang.
- Integration test submit gagal karena gudang sama.
- Integration test partial receive.
- Integration test full receive.
- Integration test over-receive gagal.
- Integration test cancel sukses sebelum receipt.
- Integration test cancel gagal setelah partial receipt.

### 20. Testing frontend
- Test list transfer render.
- Test create draft submit payload.
- Test konversi realtime quantity.
- Test detail page status action.
- Test receive form validation.
- Test error response handling.

### 21. Dokumentasi
- Pastikan PRD tetap sinkron dengan implementasi final.
- Gunakan `docs/warehouse/contract-api-transfer-antar-gudang.md` sebagai source of truth contract API.
- Update changelog atau catatan release bila fitur mulai diimplementasikan.
- Pastikan semua dokumen menyebut `trx_transfer_persediaans` dan `trx_transfer_persediaan_items` sebagai source of truth.

### 22. Review sebelum coding penuh
- Review ulang schema existing `SCM` di `#ops-be` agar penamaan kolom tidak bentrok.
- Review apakah `GoodsReceiptServices` existing perlu di-extend atau dibuat service khusus transfer.
- Putuskan apakah response warehouse transfer mengikuti format `{ success, message, data }` atau format diagnostic standar `ops-be`, lalu seragamkan sebelum coding luas.
- Review backward compatibility old-web agar field legacy `qty` dan `satuan` tetap terisi dengan nilai satuan pakai.
