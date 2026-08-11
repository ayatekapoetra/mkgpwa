# 03 — API Contract

## 1. Konvensi Umum

### Base URL

```text
/api/scm/purchase-requests
```

Compatibility alias (untuk mobile lama selama transisi):

```text
/api/scm/purchase-request        (singular, legacy)
/api/purchasing-request          (legacy mobile)
/api/approval-order              (legacy mobile, deprecated)
```

### Response Envelope

```json
{
  "diagnostic": {
    "ver": "3.1",
    "error": false,
    "message": "OK"
  },
  "data": {},
  "meta": {}
}
```

### Error Response

```json
{
  "diagnostic": {
    "ver": "3.1",
    "error": true,
    "code": "INVALID_STATE_TRANSITION",
    "message": "Purchase request harus berstatus approved"
  },
  "errors": [
    {
      "field": "items[0].qty_acc",
      "code": "MIN_VALUE",
      "message": "Qty harus lebih besar dari 0"
    }
  ]
}
```

#### Aturan Pesan Error

- `diagnostic.error` selalu boolean (`true` untuk gagal, `false` untuk sukses).
- `diagnostic.code` adalah kode stabil untuk logika frontend dan observability.
- `diagnostic.message` adalah pesan publik berbahasa Indonesia yang dapat ditampilkan langsung pada toast tanpa modifikasi.
- `diagnostic.request_id` adalah correlation ID untuk pencarian log backend.
- `errors` berisi detail validasi field-level dan bernilai `null` jika tidak relevan.
- Error `500` tidak boleh mengirim SQL, stack trace, nama tabel, atau pesan driver database.
- Frontend memprioritaskan `diagnostic.message`, lalu mendukung legacy string `diagnostic.error` selama masa transisi.

Contoh toast frontend:

```text
Title   : Validasi gagal
Message : Hanya user procurement yang dapat melakukan validasi Purchasing Request.
```

### HTTP Status Codes

| Code | Penggunaan |
|---|---|
| 200 | GET, PATCH, POST non-create |
| 201 | POST create (resource baru) |
| 204 | DELETE (no content) |
| 400 | Malformed request body |
| 401 | Token/sesi tidak valid |
| 403 | Permission tidak cukup |
| 404 | Resource tidak ditemukan dalam scope user |
| 409 | Invalid state transition, concurrency conflict, idempotency conflict |
| 422 | Field/domain validation error |
| 500 | Internal error (tanpa SQL/stack) |

### Pagination

```text
GET /api/scm/purchase-requests?page=1&per_page=25
```

Response:

```json
{
  "diagnostic": { "ver": "3.1", "error": false },
  "data": [],
  "meta": {
    "page": 1,
    "per_page": 25,
    "last_page": 4,
    "total": 83
  }
}
```

Aturan:

- `page` ≥ 1 (default 1)
- `per_page` 1–100 (default 25)
- Sort whitelist: `kode`, `date_ro`, `prioritas`, `status`, `total_ro`, `created_at`
- Sort order: `asc` atau `desc` (default `desc` by `date_ro`)

### Idempotency

Mutation status wajib mengirim header:

```text
Idempotency-Key: pr-123-approve-batch-001
```

Aturan:

- Key unik per user per command.
- Jika key sudah pernah diproses dengan sukses, return response asli (replay).
- Jika key sudah pernah diproses dengan gagal, return error asli.
- Jika key sedang diproses, return `409 Conflict`.
- TTL default 24 jam.
- Response disimpan untuk replay.

## 2. Endpoint List

### 2.1 List

```text
GET /api/scm/purchase-requests
```

Query params:

| Param | Tipe | Keterangan |
|---|---|---|
| `page` | int | Halaman |
| `per_page` | int | Items per halaman |
| `sort` | string | Field sort |
| `order` | string | `asc`/`desc` |
| `bisnis_id` | int | Filter bisnis |
| `cabang_id` | int | Filter cabang |
| `gudang_id` | int | Filter gudang |
| `createdby` | int | Filter requester |
| `status` | enum | `draft`,`active`,`approved`,`finish` |
| `prioritas` | enum | `P1`,`P2`,`P3` |
| `kode` | string | Pencarian kode (LIKE) |
| `description` | string | Pencarian deskripsi (LIKE) |
| `date_start` | date | Filter tanggal mulai |
| `date_end` | date | Filter tanggal akhir |
| `search` | string | Global search (kode OR description) |

Response `data[]`:

```json
{
  "id": 123,
  "kode": "PR-20260809143000-001",
  "date_ro": "2026-08-09",
  "bisnis": { "id": 1, "name": "Makkuragatama" },
  "cabang": { "id": 10, "name": "Cabang A" },
  "gudang": { "id": 20, "name": "Gudang Pusat" },
  "createdby": { "id": 5, "name": "Budi" },
  "prioritas": "P1",
  "description": "Spare part excavator",
  "status": "active",
  "status_label": "Menunggu Validasi",
  "total_ro": "1250000.00",
  "items_count": 5,
  "items_active_count": 5,
  "validated_count": 2,
  "approved_count": 0,
  "has_attachment": true,
  "attachments_count": 2,
  "source_system": "next",
  "can_validate": true,
  "can_approve": false,
  "can_rollback": false,
  "created_at": "2026-08-09T14:30:00.000Z",
  "updated_at": "2026-08-09T15:00:00.000Z"
}
```

### 2.2 Create

```text
POST /api/scm/purchase-requests
```

Request:

```json
{
  "bisnis_id": 1,
  "cabang_id": 10,
  "gudang_id": 20,
  "date_ro": "2026-08-09",
  "prioritas": "P1",
  "description": "Spare part excavator",
  "backlog_id": null,
  "status": "draft",
  "items": [
    {
      "barang_id": 100,
      "coa_id": null,
      "equipment_id": 200,
      "description": "Filter oli",
      "qty_req": "2.00",
      "stn": "PCS",
      "woid": null,
      "mro_id": null
    }
  ]
}
```

Response `201`:

```json
{
  "diagnostic": { "ver": "3.1", "error": false, "message": "Purchase request created" },
  "data": {
    "id": 124,
    "kode": "PR-20260809143000-002",
    "status": "draft",
    "version": 1
  }
}
```

### 2.3 Show

```text
GET /api/scm/purchase-requests/:prId
```

Response `data`:

```json
{
  "id": 123,
  "kode": "PR-20260809143000-001",
  "date_ro": "2026-08-09",
  "bisnis": { "id": 1, "name": "Makkuragatama" },
  "cabang": { "id": 10, "name": "Cabang A" },
  "gudang": { "id": 20, "name": "Gudang Pusat" },
  "createdby": { "id": 5, "name": "Budi" },
  "prioritas": "P1",
  "description": "Spare part excavator",
  "status": "active",
  "status_label": "Menunggu Validasi",
  "total_ro": "1250000.00",
  "backlog_id": null,
  "source_system": "next",
  "version": 3,
  "items": [
    {
      "id": 1001,
      "barang": { "id": 100, "kode": "BRG-001", "name": "Filter Oli", "satuan": "PCS" },
      "coa": null,
      "equipment": { "id": 200, "kode": "DT-01", "name": "Dump Truck 01" },
      "pemasok": null,
      "qty_req": "2.00",
      "qty_acc": null,
      "stn": "PCS",
      "currency": "IDR",
      "kurs": "1.000000",
      "harga": "0",
      "potongan": "0",
      "ppn": "0",
      "subtotal": "0",
      "metode": null,
      "description": "Filter oli",
      "user_validated": null,
      "date_validated": null,
      "user_approved": null,
      "date_approved": null,
      "po_sts": "N",
      "aktif": "Y",
      "woid": null,
      "mro_id": null
    }
  ],
  "attachments": [
    {
      "id": 501,
      "filename": "spec.pdf",
      "mime": "application/pdf",
      "size": 102400,
      "url": "/api/files/501"
    }
  ],
  "purchase_orders": [],
  "audit_trail": [],
  "permissions": {
    "can_read": true,
    "can_update": true,
    "can_remove": true,
    "can_validate": false,
    "can_approve": false,
    "can_rollback": false,
    "can_upload_attachment": true,
    "can_print": true,
    "can_export": true
  }
}
```

### 2.4 Update

```text
PATCH /api/scm/purchase-requests/:prId
```

Request (hanya field yang berubah):

```json
{
  "date_ro": "2026-08-10",
  "prioritas": "P2",
  "description": "Updated description",
  "version": 3
}
```

Response `200`:

```json
{
  "diagnostic": { "ver": "3.1", "error": false, "message": "Purchase request updated" },
  "data": {
    "id": 123,
    "version": 4
  }
}
```

### 2.5 Delete

```text
DELETE /api/scm/purchase-requests/:prId
```

Response `204`.

### 2.6 Submit

```text
POST /api/scm/purchase-requests/:prId/submit
Idempotency-Key: pr-123-submit-001
```

Response `200`:

```json
{
  "diagnostic": { "ver": "3.1", "error": false, "message": "Purchase request submitted" },
  "data": {
    "id": 123,
    "status": "active",
    "version": 5
  }
}
```

### 2.7 Items — Add

```text
POST /api/scm/purchase-requests/:prId/items
```

Request:

```json
{
  "barang_id": 101,
  "equipment_id": 201,
  "description": "Filter bahan bakar",
  "qty_req": "1.00",
  "stn": "PCS"
}
```

### 2.8 Items — Update

```text
PATCH /api/scm/purchase-requests/:prId/items/:itemId
```

### 2.9 Items — Delete

```text
DELETE /api/scm/purchase-requests/:prId/items/:itemId
```

### 2.10 Validate (Check)

```text
POST /api/scm/purchase-requests/:prId/validate
Idempotency-Key: pr-123-validate-batch-001
```

Request:

```json
{
  "items": [
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
      "description": "Validated item"
    }
  ]
}
```

Response `200`:

```json
{
  "diagnostic": { "ver": "3.1", "error": false, "message": "2 items validated" },
  "data": {
    "pr_id": 123,
    "status": "approved",
    "version": 6,
    "items": [
      { "id": 1001, "subtotal": "1039500.00", "user_validated": 10 }
    ],
    "total_ro": "1039500.00"
  }
}
```

### 2.11 Approve

```text
POST /api/scm/purchase-requests/:prId/approve
Idempotency-Key: pr-123-approve-batch-001
```

Request:

```json
{
  "item_ids": [1001, 1002],
  "note": "Disetujui"
}
```

Response `200`:

```json
{
  "diagnostic": { "ver": "3.1", "error": false, "message": "Purchase request approved" },
  "data": {
    "pr_id": 123,
    "status": "finish",
    "version": 8,
    "items": [
      { "id": 1001, "user_approved": 15, "po_item_id": 2001 }
    ],
    "purchase_orders": [
      {
        "id": 501,
        "kode": "CBMTK-2608123",
        "pemasok_id": 300,
        "tax_rate": "11.00",
        "grand_total": "1082250.00",
        "items_count": 2
      }
    ]
  }
}
```

### 2.12 Rollback

```text
POST /api/scm/purchase-requests/:prId/rollback
Idempotency-Key: pr-123-rollback-001
```

Request:

```json
{
  "target_status": "active",
  "item_ids": [1001],
  "reason": "Supplier salah, perlu revalidasi"
}
```

Response `200`:

```json
{
  "diagnostic": { "ver": "3.1", "error": false, "message": "Rollback completed" },
  "data": {
    "pr_id": 123,
    "status": "active",
    "version": 9,
    "cancelled_pos": [
      { "id": 501, "kode": "CBMTK-2608123", "cancelled": true }
    ],
    "reset_items": [
      { "id": 1001, "user_validated": null, "user_approved": null }
    ]
  }
}
```

Jika PO sudah memiliki downstream (faktur/payment/delivery):

```json
{
  "diagnostic": {
    "ver": "3.1",
    "error": true,
    "code": "DOWNSTREAM_DEPENDENCY",
    "message": "PO sudah memiliki faktur pembelian, kompensasi diperlukan"
  },
  "data": {
    "blocking_downstream": [
      { "type": "faktur", "id": 301, "kode": "FB-2608-001" }
    ],
    "requires_compensation": true
  }
}
```

### 2.13 Attachments — Upload

```text
POST /api/scm/purchase-requests/:prId/attachments
Content-Type: multipart/form-data
```

Request: `FormData` dengan field `files[]`.

Response `201`:

```json
{
  "diagnostic": { "ver": "3.1", "error": false },
  "data": [
    { "id": 502, "filename": "spec.pdf", "mime": "application/pdf", "size": 102400 }
  ]
}
```

### 2.14 Attachments — Delete

```text
DELETE /api/scm/purchase-requests/:prId/attachments/:attachmentId
```

### 2.15 Permissions

```text
GET /api/scm/purchase-requests/permissions
GET /api/scm/purchase-requests/:prId/permissions
```

### 2.16 Audit Trail

```text
GET /api/scm/purchase-requests/:prId/audit-trail
```

Response `data[]`:

```json
{
  "id": 1,
  "command": "validate",
  "actor": { "id": 10, "name": "Purchasing User" },
  "actor_role": "procurement",
  "before": { "status": "active" },
  "after": { "status": "approved" },
  "reason": null,
  "idempotency_key": "pr-123-validate-batch-001",
  "po_ids": [],
  "created_at": "2026-08-09T15:00:00.000Z"
}
```

### 2.17 Purchase Orders

```text
GET /api/scm/purchase-requests/:prId/purchase-orders
```

### 2.18 Print

```text
GET /api/scm/purchase-requests/:prId/print?format=pdf
```

Response: `application/pdf` blob.

### 2.19 Export

```text
GET /api/scm/purchase-requests/export?format=xlsx&status=active&date_start=2026-01-01
```

Response: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` blob.

### 2.20 Master Options

```text
GET /api/scm/purchase-requests/options/barang?bisnis_id=1&search=filter
GET /api/scm/purchase-requests/options/pemasok?bisnis_id=1&search=filter
GET /api/scm/purchase-requests/options/equipment?cabang_id=10&search=filter
GET /api/scm/purchase-requests/options/gudang?cabang_id=10
GET /api/scm/purchase-requests/options/cabang?bisnis_id=1
```

Response:

```json
{
  "diagnostic": { "ver": "3.1", "error": false },
  "data": [
    { "id": 100, "kode": "BRG-001", "name": "Filter Oli", "satuan": "PCS", "stock": "50.00" }
  ],
  "meta": { "page": 1, "per_page": 25, "total": 1 }
}
```

### 2.21 Approval Count (Badge)

```text
GET /api/scm/purchase-requests/pending-count
```

Response:

```json
{
  "diagnostic": { "ver": "3.1", "error": false },
  "data": {
    "pending_validation": 5,
    "pending_approval": 3
  }
}
```

## 3. Error Codes

| Code | HTTP | Keterangan |
|---|---|---|
| `INVALID_STATE_TRANSITION` | 409 | Status PR tidak mengizinkan aksi |
| `ITEM_NOT_OWNED_BY_PR` | 422 | Item tidak milik PR pada URL |
| `DUPLICATE_IDEMPOTENCY_KEY` | 409 | Key sudah digunakan untuk command berbeda |
| `OPTIMISTIC_LOCK_CONFLICT` | 409 | Version mismatch |
| `DOWNSTREAM_DEPENDENCY` | 409 | PO sudah punya faktur/payment/delivery |
| `PERMISSION_DENIED` | 403 | User tidak punya permission |
| `OUT_OF_SCOPE` | 403 | Resource di luar bisnis/cabang/gudang user |
| `MAX_ATTACHMENT_SIZE` | 422 | File melebihi batas ukuran |
| `INVALID_FILE_TYPE` | 422 | Tipe file tidak diizinkan |
| `CODE_GENERATION_CONFLICT` | 409 | Race condition kode PR/PO |
| `MONITORING_SYNC_FAILED` | 500 | Gagal sinkronisasi monitoring (rollback transaksi) |

### Katalog Error Backend Aktual

| Code | HTTP | Message |
|---|---:|---|
| `PR_LIST_FAILED` | 500 | Data Purchasing Request gagal dimuat. Silakan coba kembali. |
| `PR_NOT_FOUND` | 404 | Purchasing Request tidak ditemukan atau sudah tidak aktif. |
| `PR_DETAIL_FAILED` | 500 | Detail Purchasing Request gagal dimuat. Silakan coba kembali. |
| `PR_VALIDATE_FORBIDDEN` | 403 | Hanya user procurement yang dapat melakukan validasi Purchasing Request. |
| `PR_ITEMS_REQUIRED` | 422 | Pilih minimal satu item sesuai aksi yang dijalankan. |
| `PR_ITEM_NOT_FOUND` | 404 | Item Purchasing Request dengan ID terkait tidak ditemukan. |
| `PR_VALIDATE_FAILED` | 500 | Validasi Purchasing Request gagal diproses. Silakan coba kembali. |
| `PR_UPDATE_ITEM_FORBIDDEN` | 403 | Anda tidak memiliki hak akses untuk mengubah item Purchasing Request. |
| `PR_UPDATE_ITEM_FAILED` | 500 | Perubahan item Purchasing Request gagal disimpan. Silakan coba kembali. |
| `PR_APPROVE_FORBIDDEN` | 403 | Anda tidak memiliki hak akses untuk melakukan approval Purchasing Request. |
| `PR_ITEMS_NOT_FOUND` | 404 | Satu atau beberapa item Purchasing Request tidak ditemukan. |
| `PR_ITEM_NOT_VALIDATED` | 409 | Item belum divalidasi dan belum dapat di-approve. |
| `PR_ITEM_ALREADY_APPROVED` | 409 | Item sudah pernah di-approve. Muat ulang dokumen sebelum melanjutkan. |
| `PR_APPROVE_FAILED` | 500 | Approval Purchasing Request dan pembuatan Purchase Order gagal diproses. Silakan coba kembali. |
| `PR_ROLLBACK_TYPE_INVALID` | 422 | Tipe rollback harus berupa validation atau approval. |
| `PR_ROLLBACK_FORBIDDEN` | 403 | Anda tidak memiliki hak akses untuk melakukan rollback Purchasing Request. |
| `PR_ROLLBACK_APPROVAL_FORBIDDEN` | 403 | Role Anda tidak diizinkan melakukan rollback approval Purchasing Request. |
| `PR_ROLLBACK_FAILED` | 500 | Rollback Purchasing Request gagal diproses. Silakan coba kembali. |

## 4. Rate Limiting

- List/detail: 60 req/min per user
- Mutation: 30 req/min per user
- Export: 5 req/min per user (potential background job)
- Master options: 120 req/min per user
