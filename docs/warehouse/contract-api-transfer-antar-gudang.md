## Contract API Transfer Antar Gudang

### Ringkasan
- Dokumen ini adalah contract API untuk migrasi fitur `Transfer Antar Gudang`.
- Target implementasi:
  - Backend: `./be`
  - Frontend: `./nextjs`
- Prefix endpoint utama:
  - `/warehouse/transfers`
- Persistence layer memakai tabel existing:
  - `trx_transfer_persediaans`
  - `trx_transfer_persediaan_items`
- Integrasi SCM yang direuse:
  - `GET /scm/shipping-order/ready-ship?tipe=transfer`
  - `GET /scm/terima-barang/available-shipments?tipe=transfer`

### Prinsip Contract
- Frontend selalu input quantity dalam `satuan pakai`.
- Backend menghitung dan menyimpan quantity stok dalam `satuan order`.
- Frontend tidak mengirim `qty_order`, `satuan_order`, `pembagi_pakai`, atau nilai harga turunan yang bisa dihitung server.
- Semua mutation endpoint wajib transactional.
- Untuk kompatibilitas old-web, backend tetap menulis `qty` dan `satuan` legacy pada item transfer, sambil menambah snapshot eksplisit baru.

### Mapping Persistence
```text
Header transfer  -> trx_transfer_persediaans
Item transfer    -> trx_transfer_persediaan_items
Audit transfer   -> trx_transfer_persediaan_audits atau tabel audit setara
```

Catatan schema aktual:
- `trx_transfer_persediaans` dan `trx_transfer_persediaan_items` sudah ada dan berisi data existing.
- `log_wait_delivery` sudah memiliki `tipe`, `transfer_id`, dan `trfitem_id`.
- `log_shipping_order` sudah memiliki `tipe` dan `transfer_id`.
- `log_shipping_order_items` sudah memiliki `transferitem_id`.
- `log_surat_jalan` belum memiliki `tipe` dan `transfer_id`, sehingga migration add column masih diperlukan.
- `log_surat_jalan_item` sudah memiliki `transfer_id` dan `transferitem_id`, tetapi belum memiliki snapshot `qty_pakai` dan `uom_pakai`.
- `trx_terima_barang_items` belum memiliki `qty_pakai`, `uom_pakai`, dan `transferitem_id`.

### Mapping Field Legacy vs Baru
```text
trx_transfer_persediaan_items.qty         = qty_pakai untuk kompatibilitas old-web
trx_transfer_persediaan_items.satuan      = satuan_pakai untuk kompatibilitas old-web
trx_transfer_persediaan_items.qty_pakai   = canonical input user baru
trx_transfer_persediaan_items.qty_order   = canonical quantity stok/shipping/receipt
trx_transfer_persediaan_items.satuan_pakai
trx_transfer_persediaan_items.satuan_order
trx_transfer_persediaan_items.pembagi_pakai
```

### Format Response Standar
Rekomendasi contract response warehouse transfer:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Untuk error validasi:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "items.0.qty_pakai": ["Qty pakai harus lebih dari 0"]
  }
}
```

Untuk error bisnis:

```json
{
  "success": false,
  "message": "Stok sumber tidak cukup"
}
```

### Enumerasi Status Transfer
```text
draft
delivering
partially_received
received
cancelled
```

### Object Shape Umum

### Transfer Header
```json
{
  "id": 1001,
  "kode": "TRF260700001",
  "trx_date": "2026-07-29",
  "status": "delivering",
  "narasi": "Transfer sparepart pit A ke workshop",
  "gudang_src": {
    "id": 10,
    "kode": "GPTA",
    "nama": "Gudang Pit A"
  },
  "gudang_target": {
    "id": 20,
    "kode": "GWKS",
    "nama": "Gudang Workshop"
  },
  "shipping_order": {
    "id": 3001,
    "kode": "SHP260700012",
    "status": "pending"
  },
  "surat_jalan": {
    "id": 4001,
    "kode": "SJ260700045",
    "status": "delivering"
  },
  "summary": {
    "total_items": 2,
    "total_qty_pakai": 20,
    "total_qty_order": 2,
    "total_received_pakai": 5,
    "total_received_order": 0.5,
    "progress_percent": 25
  }
}
```

### Catatan Header Persistence
- `status`, `submitted_at`, `cancelled_at`, `shipping_order_id`, `surat_jalan_id`, dan `source_app` adalah field tambahan yang direkomendasikan pada `trx_transfer_persediaans`.

### Transfer Item
```json
{
  "id": 1,
  "barang_id": 123,
  "barang": {
    "kode": "BRG-001",
    "nama": "Bearing 6205"
  },
  "rack_src": {
    "id": 55,
    "kode": "R-A01",
    "nama": "Rack A01"
  },
  "qty_pakai": 15,
  "satuan_pakai": "PCS",
  "qty_order": 1.5,
  "satuan_order": "BOX",
  "pembagi_pakai": 10,
  "qty_received_pakai": 5,
  "qty_received_order": 0.5,
  "qty_remaining_pakai": 10,
  "qty_remaining_order": 1,
  "harga_pakai": 25000,
  "harga_order": 250000,
  "total_order": 375000
}
```

### Catatan Item Persistence
- Pada create/update via API baru:
  - `qty` legacy diisi sama dengan `qty_pakai`
  - `satuan` legacy diisi sama dengan `satuan_pakai`
- `qty_order` dipakai untuk mutasi stok dan shipping/receipt.

### 1. List Transfer

### Endpoint
```http
GET /warehouse/transfers
```

### Query Params
```text
page           optional number default 1
limit          optional number default 20
kode           optional string
status         optional string
gudang_src     optional number
gudang_target  optional number
start_date     optional YYYY-MM-DD
end_date       optional YYYY-MM-DD
narasi         optional string
```

### Response 200
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "last_page": 1
    },
    "items": [
      {
        "id": 1001,
        "kode": "TRF260700001",
        "trx_date": "2026-07-29",
        "status": "delivering",
        "gudang_src": { "id": 10, "kode": "GPTA", "nama": "Gudang Pit A" },
        "gudang_target": { "id": 20, "kode": "GWKS", "nama": "Gudang Workshop" },
        "summary": {
          "total_items": 2,
          "total_qty_pakai": 20,
          "total_qty_order": 2,
          "total_received_pakai": 5,
          "total_received_order": 0.5,
          "progress_percent": 25
        }
      }
    ]
  }
}
```

### 2. Detail Transfer

### Endpoint
```http
GET /warehouse/transfers/:id
```

### Response 200
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "header": {
      "id": 1001,
      "kode": "TRF260700001",
      "trx_date": "2026-07-29",
      "status": "delivering",
      "narasi": "Transfer sparepart pit A ke workshop",
      "gudang_src": { "id": 10, "kode": "GPTA", "nama": "Gudang Pit A" },
      "gudang_target": { "id": 20, "kode": "GWKS", "nama": "Gudang Workshop" },
      "shipping_order": { "id": 3001, "kode": "SHP260700012", "status": "pending" },
      "surat_jalan": { "id": 4001, "kode": "SJ260700045", "status": "delivering" }
    },
    "items": [
      {
        "id": 1,
        "barang_id": 123,
        "barang": { "kode": "BRG-001", "nama": "Bearing 6205" },
        "rack_src": { "id": 55, "kode": "R-A01", "nama": "Rack A01" },
        "qty_pakai": 15,
        "satuan_pakai": "PCS",
        "qty_order": 1.5,
        "satuan_order": "BOX",
        "pembagi_pakai": 10,
        "qty_received_pakai": 5,
        "qty_received_order": 0.5,
        "qty_remaining_pakai": 10,
        "qty_remaining_order": 1,
        "harga_pakai": 25000,
        "harga_order": 250000,
        "total_order": 375000
      }
    ],
    "audit_summary": {
      "last_event": "surat_jalan_created",
      "can_edit": false,
      "can_submit": false,
      "can_cancel": true,
      "can_receive": true
    }
  }
}
```

### 3. Create Draft Transfer

### Endpoint
```http
POST /warehouse/transfers
```

### Request Body
```json
{
  "trx_date": "2026-07-29",
  "gudang_src": 10,
  "gudang_target": 20,
  "narasi": "Transfer sparepart pit A ke workshop",
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

### Validation Rules
- `trx_date` wajib valid.
- `gudang_src` wajib ada.
- `gudang_target` wajib ada.
- `gudang_src != gudang_target`.
- `items.length >= 1`.
- setiap item wajib punya `barang_id`, `rack_src_id`, dan `qty_pakai > 0`.

### Response 201
```json
{
  "success": true,
  "message": "Draft transfer berhasil dibuat",
  "data": {
    "id": 1001,
    "kode": "TRF260700001",
    "status": "draft"
  }
}
```

### 4. Update Draft Transfer

### Endpoint
```http
PUT /warehouse/transfers/:id
```

### Request Body
Sama dengan create draft.

### Rule
- hanya boleh jika status `draft`.

### Response 200
```json
{
  "success": true,
  "message": "Draft transfer berhasil diperbarui",
  "data": {
    "id": 1001,
    "kode": "TRF260700001",
    "status": "draft"
  }
}
```

### 5. Submit Transfer

### Endpoint
```http
POST /warehouse/transfers/:id/submit
```

### Request Body
```json
{
  "submitted_at": "2026-07-29T10:15:00+08:00"
}
```

### Behavior
- validasi status masih `draft`
- validasi stok sumber cukup
- kurangi stok sumber dalam `qty_order`
- buat waiting delivery `tipe=transfer`
- buat shipping order internal otomatis
- buat surat jalan internal otomatis
- status transfer langsung `delivering`

### Response 200
```json
{
  "success": true,
  "message": "Transfer berhasil disubmit dan masuk ke proses pengiriman internal",
  "data": {
    "id": 1001,
    "kode": "TRF260700001",
    "status": "delivering",
    "shipping_order": {
      "id": 3001,
      "kode": "SHP260700012",
      "status": "pending"
    },
    "surat_jalan": {
      "id": 4001,
      "kode": "SJ260700045",
      "status": "delivering"
    }
  }
}
```

### Error Bisnis Yang Mungkin
```json
{
  "success": false,
  "message": "Stok barang BRG-001 pada rack R-A01 tidak cukup"
}
```

### 6. Cancel Transfer

### Endpoint
```http
POST /warehouse/transfers/:id/cancel
```

### Request Body
```json
{
  "reason": "Transfer dibatalkan karena salah gudang tujuan"
}
```

### Rule
- hanya boleh jika status `delivering`
- belum ada receipt aktif
- qty received seluruh item masih `0`

### Behavior
- reverse stok sumber
- inactive waiting delivery
- inactive shipping order dan itemnya
- inactive surat jalan dan itemnya
- set status `cancelled`

### Response 200
```json
{
  "success": true,
  "message": "Transfer berhasil dibatalkan",
  "data": {
    "id": 1001,
    "kode": "TRF260700001",
    "status": "cancelled"
  }
}
```

### 7. Audit Transfer

### Endpoint
```http
GET /warehouse/transfers/:id/audit
```

### Response 200
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 1,
      "event_type": "created",
      "event_label": "Draft dibuat",
      "created_at": "2026-07-29T08:00:00+08:00",
      "created_by": {
        "id": 900,
        "nama": "Ayat Ekapoetra"
      },
      "payload": null
    },
    {
      "id": 2,
      "event_type": "submitted",
      "event_label": "Transfer disubmit",
      "created_at": "2026-07-29T10:15:00+08:00",
      "created_by": {
        "id": 900,
        "nama": "Ayat Ekapoetra"
      },
      "payload": {
        "shipping_order_id": 3001,
        "surat_jalan_id": 4001
      }
    }
  ]
}
```

### 8. Option Barang

### Endpoint
```http
GET /warehouse/transfers/options/barang
```

### Query Params
```text
keyword     optional string
gudang_id   optional number
page        optional number
limit       optional number
```

### Response 200
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "meta": { "page": 1, "limit": 20, "total": 1, "last_page": 1 },
    "items": [
      {
        "id": 123,
        "kode": "BRG-001",
        "nama": "Bearing 6205",
        "satuan_order": "BOX",
        "satuan_pakai": "PCS",
        "pembagi_pakai": 10,
        "stok_order": 4.5,
        "stok_pakai": 45
      }
    ]
  }
}
```

### 9. Option Prices

### Endpoint
```http
GET /warehouse/transfers/options/prices?barang_id=:id&gudang_id=:id
```

### Response 200
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 99,
      "periode": "2026-07",
      "harga_order": 250000,
      "harga_pakai": 25000,
      "satuan_order": "BOX",
      "satuan_pakai": "PCS",
      "label": "Rp 25.000 / PCS | Rp 250.000 / BOX"
    }
  ]
}
```

### 10. Option Source Racks

### Endpoint
```http
GET /warehouse/transfers/options/source-racks?barang_id=:id&gudang_id=:id
```

### Response 200
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 55,
      "kode": "R-A01",
      "nama": "Rack A01",
      "stok_order": 4.5,
      "stok_pakai": 45,
      "is_recommended": true
    }
  ]
}
```

### 11. Option Target Racks

### Endpoint
```http
GET /warehouse/transfers/options/target-racks?barang_id=:id&gudang_id=:id
```

### Response 200
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 88,
      "kode": "R-B02",
      "nama": "Rack B02",
      "stok_order": 1,
      "stok_pakai": 10,
      "is_recommended": true
    }
  ]
}
```

### 12. SCM Ready Ship Filter Transfer

### Endpoint
```http
GET /scm/shipping-order/ready-ship?tipe=transfer
```

### Tujuan
- Monitoring sumber shipment internal transfer.
- Bukan endpoint create shipping manual.

### Response Minimum
```json
{
  "diagnostic": { "ver": 3.0, "error": false },
  "rows": [
    {
      "wait_id": 7001,
      "tipe": "transfer",
      "transfer_id": 1001,
      "transferitem_id": 1,
      "kode_transfer": "TRF260700001",
      "barang_id": 123,
      "qty_order": 1.5,
      "uom_order": "BOX"
    }
  ]
}
```

### 13. SCM Available Shipments Filter Transfer

### Endpoint
```http
GET /scm/terima-barang/available-shipments?tipe=transfer
```

### Response Minimum
```json
{
  "diagnostic": { "ver": 3.0, "error": false },
  "rows": [
    {
      "sj_id": 4001,
      "kode_sj": "SJ260700045",
      "tipe": "transfer",
      "transfer_id": 1001,
      "shipping_order_id": 3001,
      "gudang_id": 20,
      "status": "delivering",
      "items": [
        {
          "sjitem_id": 200,
          "transferitem_id": 1,
          "barang_id": 123,
          "qty_order": 1.5,
          "uom_order": "BOX",
          "qty_pakai": 15,
          "uom_pakai": "PCS",
          "qty_received_order": 0.5,
          "qty_received_pakai": 5,
          "qty_remaining_order": 1,
          "qty_remaining_pakai": 10
        }
      ]
    }
  ]
}
```

### 14. Goods Receipt Transfer Submit

### Endpoint rekomendasi domain transfer
```http
POST /warehouse/transfers/:id/receive
```

### Catatan
- Frontend warehouse transfer sebaiknya memakai endpoint domain transfer ini.
- Backend boleh internally memanggil service `GoodsReceiptServices` yang sudah ada atau service baru yang specialized.

### Request Body
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

### Response 201
```json
{
  "success": true,
  "message": "Penerimaan transfer berhasil dibuat",
  "data": {
    "receipt_id": 5001,
    "transfer_id": 1001,
    "status": "partially_received"
  }
}
```

### Error Cases Wajib Ditangani
- `404 Transfer tidak ditemukan`
- `409 Transfer tidak dalam status yang dapat diterima`
- `409 Qty terima melebihi sisa transfer`
- `422 Rack tujuan tidak valid untuk gudang tujuan`
- `422 Barang tidak sesuai dengan item transfer`
- `422 Format payload tidak valid`

### Catatan Implementasi Frontend
- Form create dan edit draft hanya mengirim `qty_pakai`.
- Halaman detail menampilkan kedua satuan.
- Halaman receive hanya menerima input `qty_terima_pakai`.
- Semua angka quantity disarankan dirender hingga maksimal 3 digit desimal bila hasil konversi tidak bulat.

### Catatan Implementasi Backend
- Model backend baru harus mengarah ke tabel existing `trx_transfer_persediaans` dan `trx_transfer_persediaan_items`.
- Jangan membuat tabel header/item transfer baru.
- Semua endpoint `/warehouse/transfers` adalah lapisan API baru di atas source of truth existing.
