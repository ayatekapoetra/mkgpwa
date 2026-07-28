## PRD Terima Barang

### Ringkasan
- Fitur `Terima Barang` adalah migrasi penuh dari modul legacy `mrt-v3 /logistik/barang-masuk` ke `./nextjs + ./be`.
- Fitur ini digunakan untuk menerima barang yang sebelumnya dikirim melalui `Shipping Order` dan direpresentasikan oleh `log_surat_jalan` serta `log_surat_jalan_item`.
- Fitur harus terintegrasi penuh dengan shipping order baru, stok rack, inventory movement, dan status penerimaan.

### Tujuan
- Menyediakan alur penerimaan barang modern di Next.js yang menggantikan UI legacy `mrt-v3`.
- Memastikan penerimaan hanya bisa dilakukan terhadap shipment aktif yang valid.
- Menjamin integritas kuantitas kirim vs terima melalui validasi backend dan row locking.
- Menggunakan rack aktual sebagai lokasi penyimpanan barang dengan auto-select rack terakhir yang sudah berisi barang tersebut.
- Mengubah status shipping order menjadi `received` saat seluruh barang telah diterima.

### Latar Belakang
- Shipping order baru sudah dibuat di `./nextjs + ./be` dan menghasilkan:
  - `log_shipping_order`
  - `log_shipping_order_items`
  - `log_surat_jalan`
  - `log_surat_jalan_item`
- Fitur barang masuk lama di `mrt-v3` masih memakai Edge + jQuery dan memiliki beberapa kelemahan:
  - validasi penerimaan belum kuat
  - status shipping order tidak ikut diupdate menjadi `received`
  - transaksi tidak sepenuhnya atomik
  - bergantung pada perilaku legacy inventory movement
- Karena itu, fitur penerimaan harus dipindahkan ke backend baru agar konsisten dengan shipping order baru.

### Lokasi & Akses
- Frontend URL utama: `/terima-barang` atau `/barang-masuk`
- Rekomendasi URL final: `/terima-barang`
- Halaman detail: `/terima-barang/[id]/show`
- Halaman create: `/terima-barang/create`
- Menu diletakkan pada area SCM / Logistik yang berdekatan dengan Shipping Order.

### Scope

### In Scope
- List transaksi terima barang.
- Filter dan pencarian transaksi terima barang.
- Create transaksi terima barang dari shipment yang dikirim oleh shipping order.
- Menampilkan daftar surat jalan siap diterima.
- Menampilkan item surat jalan yang masih memiliki sisa penerimaan.
- Auto-select rack berdasarkan lokasi aktual barang di `log_barang_rack`.
- Validasi wajib lokasi rack per barang.
- Mendukung penerimaan parsial.
- Menyimpan header + item penerimaan.
- Update `log_surat_jalan_item.terima`.
- Update stok per rack.
- Update inventory movement.
- Update monitoring status.
- Update status `log_surat_jalan` dan `log_shipping_order`.
- Halaman detail transaksi terima barang.

### Out of Scope
- Edit transaksi terima barang yang sudah tersimpan.
- Auto-create rack master baru saat lokasi tidak ada.
- Capacity planning rack.
- Cross-warehouse receipt untuk shipment yang sama.
- Bulk import via Excel pada fase awal.

### Entitas Terkait
- `log_shipping_order`
- `log_shipping_order_items`
- `log_surat_jalan`
- `log_surat_jalan_item`
- `trx_terima_barangs`
- `trx_terima_barang_items`
- `log_barang_rack`
- `mas_barang_rack`
- `barang_lokasi`
- `mon_request_part`
- `log_wait_delivery`
- `log_delivery_order_form_items`

### Definisi Status

### Status `log_surat_jalan`
- `delivering`: barang sedang dalam proses pengiriman / belum selesai diterima.
- `received`: seluruh kuantitas pada surat jalan telah diterima penuh.

### Status `log_shipping_order`
- `pending`: shipping order sudah dibuat tetapi belum diterima penuh.
- `received`: seluruh item shipping order sudah diterima penuh.

### Aturan status
- Saat shipping order dibuat:
  - `log_surat_jalan.status = delivering`
  - `log_shipping_order.status = pending`
- Saat penerimaan parsial:
  - `log_surat_jalan.status = delivering`
  - `log_shipping_order.status = pending`
- Saat penerimaan penuh:
  - `log_surat_jalan.status = received`
  - `log_shipping_order.status = received`

### User Flow

### 1. List transaksi terima barang
- User membuka halaman `Terima Barang`.
- Sistem menampilkan daftar transaksi penerimaan.
- User dapat filter berdasarkan:
  - tanggal penerimaan
  - kode receipt
  - kode surat jalan
  - gudang tujuan
  - narasi
  - status receipt

### 2. Membuat transaksi terima barang
- User membuka halaman create.
- Sistem memuat daftar shipment yang siap diterima.
- User memilih satu shipment / surat jalan.
- Sistem memuat item shipment yang masih memiliki sisa penerimaan.
- Untuk setiap item, sistem mencari lokasi rack aktual pada gudang tujuan.
- Jika ditemukan lokasi rack untuk `barang_id` tersebut:
  - sistem auto-select rack yang paling relevan
  - user tetap boleh mengganti ke rack lain yang aktif pada gudang yang sama
- Jika tidak ditemukan lokasi rack untuk `barang_id` tersebut:
  - item ditandai invalid
  - submit diblok
  - user mendapat pesan bahwa barang belum memiliki lokasi rack pada gudang tujuan
- User mengisi tanggal terima, narasi, qty terima, dan memastikan rack.
- Submit akan menyimpan transaksi penerimaan jika seluruh validasi lolos.

### 3. Detail transaksi terima barang
- User dapat melihat detail header dan seluruh item penerimaan.
- Menampilkan:
  - kode receipt
  - kode surat jalan
  - tanggal terima
  - gudang
  - narasi
  - daftar item, qty, harga, rack, pemasok
  - status penerimaan terkait surat jalan dan shipping order

### Sumber Data Penerimaan
- Penerimaan hanya dapat dilakukan dari `log_surat_jalan` yang:
  - `aktif = 'Y'`
  - `status = 'delivering'`
  - memiliki relasi ke shipping order aktif
- Item penerimaan diambil dari `log_surat_jalan_item` yang:
  - `aktif = 'Y'`
  - `qty - terima > 0`

### Aturan Rack

### Prinsip utama
- Setiap item dengan `barang_id` wajib memiliki referensi lokasi rack yang sudah pernah dipakai pada gudang tujuan.
- Referensi lokasi diambil dari `log_barang_rack` untuk kombinasi:
  - `barang_id`
  - `gudang_id`

### Auto-select rack
- Sistem mencari seluruh record `log_barang_rack` untuk barang dan gudang terkait.
- Hanya lokasi dengan qty aktual positif yang diprioritaskan sebagai rekomendasi utama.
- Urutan rekomendasi:
  1. `qty > 0`
  2. `updated_at` terbaru
  3. fallback ke `created_at` terbaru atau `id` terbesar bila perlu
- Rack default yang dipilih otomatis adalah rack rekomendasi utama.

### Pilihan rack
- User tetap boleh mengganti ke rack aktif lain pada gudang yang sama.
- Opsi rack harus menampilkan informasi aktual per rack, minimal:
  - kode rack
  - nama rack
  - stok aktual barang pada rack tersebut
  - label `Direkomendasikan` jika itu rack default

### Constraint penting
- Saat ini tidak ada field kapasitas maksimum rack.
- Sistem tidak boleh menampilkan klaim bahwa rack penuh secara kapasitas.
- Informasi yang ditampilkan hanya stok aktual barang di rack.
- Penilaian kapasitas fisik tetap dilakukan user di lapangan.

### Validasi wajib lokasi rack
- Jika `barang_id` tidak memiliki lokasi pada `log_barang_rack` di gudang tujuan:
  - item diberi flag error saat load data item
  - field rack tidak dapat dianggap valid
  - tombol submit dinonaktifkan
  - backend tetap menolak submit untuk menjamin integritas
- Pesan error yang disarankan:
  - `Barang <kode/nama> belum memiliki lokasi rack pada gudang tujuan. Hubungi admin gudang atau lakukan penempatan rack terlebih dahulu.`

### UX Create Page

### Header form
- Kode surat jalan: readonly, dipilih dari modal / dialog picker.
- Tanggal terima: default hari ini, editable.
- Gudang tujuan: readonly mengikuti `log_surat_jalan.gudang_id`.
- Narasi: textarea.

### Shipment picker
- Menampilkan list surat jalan siap diterima.
- Informasi minimal:
  - kode surat jalan
  - tanggal kirim
  - shipping order code
  - gudang tujuan
  - narasi
  - jumlah item
  - status sisa penerimaan
- Fitur:
  - search server-side
  - pagination
  - filter gudang bila dibutuhkan

### Item list penerimaan
- Tabel item menampilkan:
  - dokumen asal
  - kode barang
  - nama barang
  - pemasok
  - qty kirim
  - qty sudah diterima
  - sisa terima
  - rack rekomendasi
  - pilihan rack
  - qty terima saat ini
  - harga satuan
  - status validasi item
- Untuk item invalid karena tidak punya lokasi rack:
  - row diberi highlight merah / warning
  - reason ditampilkan jelas

### Perilaku qty terima
- Default qty terima = sisa terima.
- User boleh mengubah qty menjadi lebih kecil untuk penerimaan parsial.
- User tidak boleh melebihi sisa terima.
- Qty harus lebih dari 0.

### Aksi tombol
- `Pilih Shipment`
- `Reset Shipment`
- `Submit Penerimaan`
- `Batal`

### Disable submit
- Submit disabled jika:
  - tidak ada shipment terpilih
  - ada item tanpa lokasi rack
  - ada item tanpa rack final
  - ada qty <= 0
  - ada qty > sisa terima
  - request sedang submit

### Frontend States
- Loading shipment list
- Loading shipment items
- Loading rack recommendation
- Empty state shipment
- Empty state item
- Validation warning per item
- Global error banner
- Success notification

### Backend API Proposal

### 1. List receipt
- `GET /scm/terima-barang/list`
- Query params:
  - `page`
  - `perPage`
  - `startDate`
  - `endDate`
  - `kodeReceipt`
  - `kodeSj`
  - `gudangId`
  - `narasi`
  - `status`

### 2. Available shipment list
- `GET /scm/terima-barang/available-shipments`
- Query params:
  - `page`
  - `perPage`
  - `search`
  - `gudangId`

### 3. Shipment items for receipt
- `GET /scm/terima-barang/surat-jalan/:id/items`
- Response per item minimal:
  - `sjitem_id`
  - `barang_id`
  - `barang.kode`
  - `barang.nama`
  - `barang.num_part`
  - `pemasok_id`
  - `pemasok.nama`
  - `qty_kirim`
  - `qty_terima`
  - `qty_sisa`
  - `uom`
  - `harga_stn`
  - `narasi`
  - `rackOptions[]`
  - `recommendedRack`
  - `hasRackLocation`
  - `rackValidationMessage`

### 4. Create receipt
- `POST /scm/terima-barang/create`
- Body:

```json
{
  "sj_id": 123,
  "received_at": "2026-07-27",
  "narasi": "Barang diterima di gudang utama",
  "items": [
    {
      "sjitem_id": 111,
      "barang_id": 222,
      "pemasok_id": 333,
      "rack_id": 444,
      "qty_terima": 10,
      "harga": 15000,
      "description": "Spare part ABC",
      "uom": "PCS"
    }
  ]
}
```

### 5. Show receipt detail
- `GET /scm/terima-barang/:id`

### 6. Optional soft delete
- `POST /scm/terima-barang/:id/destroy`
- Hanya jika bisnis membutuhkan rollback resmi.
- Jika diaktifkan, wajib rollback stok, receipt item, surat jalan item, monitoring, dan status shipping.

### Backend Validation Rules

### Header validation
- `sj_id` wajib ada.
- `received_at` wajib valid format tanggal.
- `narasi` wajib ada.
- Surat jalan harus aktif.
- Surat jalan harus berstatus `delivering`.

### Item validation
- `items` minimal 1.
- Setiap item harus milik `sj_id` yang dipilih.
- `barang_id` harus sesuai dengan `log_surat_jalan_item.barang_id` bila ada.
- `rack_id` wajib ada.
- Rack harus aktif.
- Rack harus milik gudang tujuan surat jalan.
- Qty harus numerik.
- Qty harus > 0.
- Qty tidak boleh melebihi `qty - terima` terkini.
- Setiap `barang_id` wajib memiliki lokasi pada `log_barang_rack` untuk gudang tujuan.

### Rack validation khusus
- Sebelum menyimpan item, backend harus mengecek bahwa untuk kombinasi `barang_id + gudang_id` terdapat minimal satu lokasi di `log_barang_rack`.
- Jika tidak ada, response 422.
- Backend tidak boleh hanya mengandalkan pilihan rack dari frontend.

### Transaction & Concurrency
- Create receipt wajib menggunakan satu database transaction.
- Header shipment (`log_surat_jalan`) harus di-lock.
- Semua `log_surat_jalan_item` terkait harus di-lock.
- Jika terkait ke shipping order, `log_shipping_order` juga di-lock.
- Semua perubahan berikut harus atomik:
  - create header receipt
  - create receipt items
  - update `log_surat_jalan_item.terima`
  - update summary stok rack
  - create inventory movement
  - update monitoring
  - update status surat jalan
  - update status shipping order

### Perubahan Data Saat Submit

### Header receipt
- Membuat record pada `trx_terima_barangs`.
- Field minimal:
  - `bisnis_id`
  - `reff_rcp`
  - `sj_id`
  - `kode_sj`
  - `received_at`
  - `gudang_id`
  - `narasi`
  - `receivedby`

### Item receipt
- Membuat record pada `trx_terima_barang_items`.
- Field minimal:
  - `trx_terima`
  - `sj_id`
  - `sjitem_id`
  - `barang_id`
  - `description`
  - `pemasok_id`
  - `rack_id`
  - `uom`
  - `qty`
  - `harga`

### Surat jalan item
- Tambahkan `terima += qty_terima`.
- Validasi tidak boleh melebihi qty kirim.

### Stok rack
- Update summary stok per rack menggunakan mekanisme yang setara dengan `SUMBARANGRACK`.
- Jika summary belum ada untuk kombinasi `barang_id + rack_id + gudang_id`, buat baru.
- Jika ada, increment `qty`.

### Inventory movement
- Sistem perlu membuat movement penerimaan yang eksplisit dan konsisten.
- Jangan bergantung pada keberadaan flow lama yang mungkin tidak dibuat oleh shipping order baru.
- Movement harus tetap tercatat walaupun shipping order baru tidak membuat `BarangLokasi` reservasi seperti legacy.

### Monitoring
- Update `mon_request_part` ke status receipt jika relasi source ditemukan.
- Status penerimaan akhir direkomendasikan `11` seperti legacy.

### Status surat jalan dan shipping order
- Hitung total qty kirim vs total qty terima per surat jalan.
- Jika masih ada sisa:
  - `log_surat_jalan.status = delivering`
  - `log_shipping_order.status = pending`
- Jika seluruh item sudah penuh diterima:
  - `log_surat_jalan.status = received`
  - `log_surat_jalan.received_at = received_at submit`
  - `log_shipping_order.status = received`

### Optimasi yang Wajib Diterapkan

### 1. Auto-select rack recommendation
- Backend kirim `rackOptions` dan `recommendedRack` per item.
- Frontend tidak perlu menghitung sendiri.

### 2. Gudang readonly
- Gudang tidak boleh diubah user saat shipment sudah dipilih.
- Gudang selalu mengikuti surat jalan.

### 3. Strong validation
- Validasi frontend untuk UX.
- Validasi backend untuk integritas final.

### 4. Partial receipt support
- User bisa menerima sebagian qty.
- Item yang sudah habis tidak tampil lagi pada create receipt berikutnya.

### 5. Duplicate submit prevention
- Tombol submit disabled saat request in-flight.
- Gunakan optimistic lock sederhana atau re-check sisa qty saat save.

### 6. Error yang informatif
- Error response harus jelas, misalnya:
  - item sudah diterima user lain
  - rack tidak valid
  - barang belum punya lokasi rack
  - qty melebihi sisa tersedia

### 7. Pagination dan search server-side
- Shipment picker dan list receipt harus server-side agar tetap ringan.

### 8. Sorting & filtering
- List receipt minimal mendukung sort by tanggal, kode receipt, kode surat jalan.

### 9. Audit trail
- Simpan user penerima dan waktu penerimaan.
- Tampilkan pada detail.

### 10. Accurate rack stock indicator
- Opsi rack harus menampilkan stok aktual barang per rack.
- Gunakan data summary yang paling ringan dan konsisten.

### 11. Fail fast bila lokasi rack belum tersedia
- Jangan biarkan user submit dan gagal setelah proses panjang.
- Flag masalah sejak item load.

### 12. Consistent date semantics
- `received_at` pada surat jalan hanya diisi saat receipt dibuat, bukan saat shipping dibuat.

### Integrasi dengan Shipping Order Baru

### Perubahan backend shipping order yang direkomendasikan
- Saat create shipping order, `log_surat_jalan.received_at` sebaiknya `null`, bukan tanggal kirim.
- Status awal `log_shipping_order.status` harus konsisten, minimal `pending`.

### Dependency utama penerimaan
- `log_shipping_order.sj_id`
- `log_surat_jalan.id`
- `log_surat_jalan_item.sj_id`
- `log_surat_jalan_item.terima`
- `log_shipping_order.status`

### UX Detail Halaman
- Header info:
  - kode receipt
  - kode surat jalan
  - shipping order code
  - tanggal terima
  - gudang
  - penerima
  - narasi
  - status shipping
  - status surat jalan
- Tabel item:
  - barang
  - pemasok
  - rack
  - qty terima
  - harga
  - subtotal

### Security & Access
- Endpoint harus memakai auth yang sama dengan modul SCM baru.
- Visibility shipment bisa dibatasi oleh workspace user jika aturan bisnis mengharuskan.
- User tidak boleh menerima shipment yang sudah `received`.

### Non-Functional Requirements
- Response create harus cepat dan atomik.
- UI harus responsif di desktop dan tablet.
- Semua list utama harus paginated.
- Semua operasi kritikal harus aman terhadap concurrent access.
- Query shipment item harus meminimalkan N+1.

### Acceptance Criteria

### A. Shipment picker
- Hanya shipment `delivering` yang tampil.
- Shipment `received` tidak boleh muncul.

### B. Item loading
- Hanya item dengan `qty_sisa > 0` yang tampil.
- Gudang tujuan tampil readonly.

### C. Rack recommendation
- Jika barang punya lokasi rack di gudang tujuan, satu rack otomatis dipilih.
- User dapat mengganti ke rack aktif lain.
- Opsi rack menampilkan stok aktual barang pada rack tersebut.

### D. Rack required validation
- Jika barang tidak punya lokasi pada `log_barang_rack` untuk gudang tujuan, submit tidak bisa dilakukan.
- Backend juga menolak submit dengan response 422.

### E. Qty validation
- Qty terima tidak boleh nol atau negatif.
- Qty terima tidak boleh melebihi sisa qty kirim.

### F. Persistence
- Submit sukses membuat header dan item receipt.
- `log_surat_jalan_item.terima` bertambah sesuai qty terima.
- Summary stok rack bertambah.

### G. Status update
- Penerimaan parsial mempertahankan:
  - `log_surat_jalan.status = delivering`
  - `log_shipping_order.status = pending`
- Penerimaan penuh mengubah:
  - `log_surat_jalan.status = received`
  - `log_shipping_order.status = received`

### H. Concurrency
- Jika dua user menerima item yang sama bersamaan, salah satu request gagal dengan pesan qty sudah berubah.

### I. Error handling
- Error tampil jelas pada UI dan tidak menyisakan data parsial di database.

### Testing Scenarios

### Positive cases
- Full receipt satu shipment satu kali submit.
- Partial receipt lalu lanjut receipt kedua hingga penuh.
- Barang punya lebih dari satu rack, user ganti ke rack lain.
- Banyak item dalam satu shipment dengan rack rekomendasi berbeda.

### Negative cases
- Shipment sudah `received` tapi masih dicoba submit.
- Qty melebihi sisa.
- Rack tidak berada di gudang tujuan.
- Barang tidak punya lokasi rack di gudang tujuan.
- `sjitem_id` tidak cocok dengan `sj_id`.
- Double submit.

### Migration Notes
- Logic lama pada `mrt-v3/app/Helpers/LogBarangMasuk.js` dijadikan referensi bisnis, bukan di-copy mentah.
- Backend baru harus merapikan kelemahan legacy:
  - validasi yang lebih kuat
  - transaksi penuh
  - status konsisten
  - inventory movement eksplisit
  - update shipping order status

### Deliverables Teknis
- Next.js:
  - page list `terima-barang`
  - page create `terima-barang/create`
  - page show `terima-barang/[id]/show`
  - API hooks SWR
  - komponen shipment picker
  - komponen receipt item table
- Backend `be`:
  - route list
  - route available shipments
  - route shipment items
  - route create
  - route show
  - service transaksi receipt
  - validator request
  - tests untuk full/partial/concurrent receipt

### Catatan Implementasi
- Disarankan backend mengirim field rekomendasi rack yang sudah siap render agar frontend tetap ringan.
- Disarankan memakai model / service baru yang terpisah dari helper legacy.
- Disarankan menambahkan test integrasi khusus untuk status shipping order setelah full receipt.
