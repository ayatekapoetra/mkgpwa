# 09 — Security & Audit

## 1. Ancaman & Mitigasi

### 1.1 IDOR (Insecure Direct Object Reference)

**Ancaman:** User mengakses/mengubah PR atau item milik bisnis/cabang/user lain dengan menebak ID.

**Mitigasi:**
- Semua endpoint parent-scoped: `/api/scm/purchase-requests/:prId/...`.
- Setiap query PR/item wajib filter `bisnis_id` dalam scope user.
- Detail: `WHERE id = :prId AND bisnis_id IN (user_bisnis_grants)`.
- Item: `WHERE id = :itemId AND ro_id = :prId` (verifikasi parent).
- Tidak ada endpoint mutator global yang hanya menerima item ID.
- Admin/developer override tetap dicatat dalam audit.

**Implementasi:**
```js
// Service
async findOwned(prId, user, trx) {
  const query = PurchaseRequest.query().transacting(trx).where('id', prId).forUpdate()
  if (!isOverride(user)) {
    query.whereIn('bisnis_id', await userBisnisGrants(user.id))
  }
  return query.first()
}
```

### 1.2 Item Lintas PR

**Ancaman:** Mutation payload berisi item dari PR berbeda, menyebabkan PO dibuat dengan header PR yang salah.

**Mitigasi:**
- Setiap item dalam payload divalidasi `item.ro_id === prId`.
- Jika ada item dari PR lain → `422 ITEM_NOT_OWNED_BY_PR`.
- Tidak ada pengecualian, bahkan untuk admin.

```js
for (const item of payload.items) {
  const found = await PurchaseRequestItem.query()
    .transacting(trx)
    .where('id', item.id)
    .where('ro_id', prId)
    .where('aktif', 'Y')
    .first()
  if (!found) {
    throw new ValidationError('ITEM_NOT_OWNED_BY_PR', `Item ${item.id} tidak milik PR ${prId}`)
  }
}
```

### 1.3 Multi-Business Data Leak

**Ancaman:** User membaca data PR dari bisnis lain. Endpoint signage public.

**Mitigasi:**
- List default ke `user.bisnis_id` jika client tidak mengirim filter.
- Admin dapat melihat semua bisnis (untuk rekonsiliasi) tetapi dicatat.
- Endpoint signage: tambahkan token/signature atau pindahkan ke protected group.
- Master options (barang, supplier, equipment) difilter berdasarkan bisnis/cabang user.

### 1.4 Role Bypass via Direct POST

**Ancaman:** User dengan privilege `update` generik langsung POST ke endpoint validate/approve tanpa permission `validate`/`approve`.

**Mitigasi:**
- Backend memvalidasi permission spesifik (`validate`/`approve`) pada setiap POST, bukan hanya `update`.
- Tidak bergantung pada UI untuk menyembunyikan tombol.

```js
// Validate endpoint
const access = await PurchaseRequestPermissionService.resolve(user)
if (!access.permissions.validate) {
  return response.status(403).json({ /* PERMISSION_DENIED */ })
}
```

### 1.5 Concurrency — Duplicate PO

**Ancaman:** Dua request approval paralel untuk PR yang sama, keduanya lolos pengecekan dan membuat PO ganda.

**Mitigasi:**
- `SELECT ... FOR UPDATE` pada header PR dan semua item sebelum mutation.
- Unique constraint `pr_item_active_key` pada PO item.
- Idempotency key wajib untuk approve.
- Jika unique constraint violation → `409` dan rollback transaksi.

```js
BEGIN
  -- Lock PR header
  SELECT * FROM trx_request_orders WHERE id = :prId FOR UPDATE
  -- Lock items
  SELECT * FROM trx_request_orders_items WHERE ro_id = :prId AND aktif = 'Y' FOR UPDATE
  -- Check idempotency
  SELECT * FROM pr_idempotency WHERE key = :key FOR UPDATE
  -- Process...
  -- Insert PO items (unique constraint will prevent duplicates)
COMMIT
```

### 1.6 Generator Kode Race Condition

**Ancaman:** Dua create paralel membaca last kode, increment, dan menghasilkan kode sama.

**Mitigasi:**
- Gunakan `SELECT ... FOR UPDATE` pada counter/last record.
- Atau gunakan sequence table: `UPDATE seq SET next = next + 1 WHERE name = 'pr'`.
- Atau unique constraint + retry dengan backoff.
- Jangan pernah: read last tanpa lock lalu increment.

### 1.7 Client-Side Financial Manipulation

**Ancaman:** User mengirim `subtotal`, `ppn_rp`, `tot_harga` yang dimanipulasi via DevTools.

**Mitigasi:**
- Backend hanya menerima input dasar: `qty_acc`, `unit_price`, `kurs`, `discount`, `tax_rate`, `payment_method`.
- Backend menghitung semua nilai turunan.
- Field `subtotal`, `ppn_rp`, `tot_harga` diabaikan dari request.
- Response mengembalikan nilai server-computed.

### 1.8 Information Disclosure

**Ancaman:** Error response mengekspos SQL, stack trace, atau internal detail.

**Mitigasi:**
- Error response hanya berisi: `code`, `message` (user-friendly).
- SQL/stack dilog di server, tidak dikirim ke client.
- Gunakan structured logger (Winston), bukan `console.log`.
- Strip `error.sql`, `error.stack` dari response.

```js
// BAD
return response.status(500).json({
  diagnostic: { error: error.sqlMessage || error.message }
})

// GOOD
Logger.error('PR approve failed', { prId, error: error.message, stack: error.stack })
return response.status(500).json({
  diagnostic: {
    ver: '3.1',
    error: true,
    code: 'INTERNAL_ERROR',
    message: 'Terjadi kesalahan, silakan coba lagi'
  }
})
```

### 1.9 CSRF

**Status legacy:** CSRF dinonaktifkan (`mrt-v3/config/shield.js`).

**Mitigasi target:**
- Backend menggunakan JWT Bearer token, bukan cookie-based auth.
- CORS dibatasi ke origin yang diizinkan.
- Tidak ada cookie session yang dapat di-exploit CSRF.
- Jika cookie digunakan untuk SSR, pastikan `SameSite=Strict` dan CSRF token.

### 1.10 File Upload Security

**Ancaman:** Upload file berbahaya (executable, script, oversized).

**Mitigasi:**
- MIME whitelist (bukan extension check).
- File size limit (10 MB per file, 50 MB total per PR).
- File count limit (10 per PR).
- Generate random filename untuk storage.
- Simpan di path di luar web root atau gunakan S3 dengan private access.
- Scan dengan antivirus jika tersedia (fase lanjutan).

### 1.11 Cron Endpoint Unauthenticated

**Ancaman:** Cron endpoint dapat diakses tanpa auth, memodifikasi prioritas PR.

**Mitigasi:**
- Tambahkan secret token/header untuk cron endpoint.
- Atau batasi ke localhost/internal network.
- Log semua cron trigger.

## 2. Audit Trail

### 2.1 Event yang Wajib Diaudit

| Event | Data yang Dicatat |
|---|---|
| `create` | PR ID, kode, items, actor, source_system |
| `submit` | PR ID, before status, after status, actor |
| `validate` | PR ID, item IDs, financial values (before/after), validator |
| `approve` | PR ID, item IDs, PO IDs created, approver |
| `rollback` | PR ID, target status, reason, cancelled PO IDs, reset item IDs, admin |
| `delete` | PR ID, deleted_by, items affected |
| `attach` | PR ID, file ID, filename, uploader |
| `delete_attachment` | PR ID, file ID, deleter |
| `print` | PR ID, user |
| `export` | filter params, user, row count |
| `login` (optional) | User, module accessed |

### 2.2 Audit Record Structure

```json
{
  "id": 1,
  "pr_id": 123,
  "pr_item_ids": [1001, 1002],
  "command": "validate",
  "actor": { "id": 10, "name": "Purchasing User" },
  "actor_role": "procurement",
  "before_state": {
    "status": "active",
    "items": [
      { "id": 1001, "pemasok_id": null, "qty_acc": null, "subtotal": "0" }
    ]
  },
  "after_state": {
    "status": "approved",
    "items": [
      { "id": 1001, "pemasok_id": 300, "qty_acc": "2.00", "subtotal": "1039500.00" }
    ]
  },
  "reason": null,
  "idempotency_key": "pr-123-validate-batch-001",
  "po_ids": [],
  "source_system": "next",
  "request_id": "req-abc-123",
  "created_at": "2026-08-09T15:00:00.000Z"
}
```

### 2.3 Audit Access

- User dengan permission `read` dapat melihat audit trail PR yang dapat diaksesnya.
- Admin dapat melihat semua audit trail.
- Audit trail tidak dapat dihapus/diedit (append-only).
- Retention: minimum 2 tahun (configurable).

### 2.4 Audit via API

```text
GET /api/scm/purchase-requests/:prId/audit-trail
```

Response `data[]` berisi semua event untuk PR tersebut, sorted by `created_at` desc.

### 2.5 Reconciliation Audit

Job harian membandingkan:

```text
pr_command_audit COUNT
  vs
trx_request_orders updated_at > yesterday
```

Jika ada PR yang berubah tanpa audit record → alert admin.

## 3. Idempotency

### 3.1 Aturan

- Semua mutation status (submit, validate, approve, rollback, delete) wajib `Idempotency-Key` header.
- Key unik per user per command.
- TTL 24 jam.

### 3.2 Flow

```text
1. Client sends POST /approve dengan Idempotency-Key
2. Server:
   a. SELECT FROM pr_idempotency WHERE key = :key FOR UPDATE
   b. Jika found dan status='success' → return cached response
   c. Jika found dan status='pending' → return 409
   d. Jika found dan status='failed' → return cached error
   e. Jika not found → INSERT pr_idempotency (status='pending')
3. Process command dalam transaction
4. UPDATE pr_idempotency SET status='success' or 'failed', response_body=...
5. Return response
```

### 3.3 Client Behavior

- Frontend generate key: `pr-{id}-{command}-{timestamp}-{random}`.
- Simpan key di form state.
- Jika timeout/network error, retry dengan key yang sama.
- Setelah sukses, key tidak digunakan lagi untuk command baru.

## 4. Optimistic Locking

### 4.1 Version Column

Setiap update mengirim `version` dan server mengecek:

```sql
UPDATE trx_request_orders
SET ..., version = version + 1
WHERE id = :prId AND version = :expectedVersion
```

Jika affected rows = 0 → `409 OPTIMISTIC_LOCK_CONFLICT`.

### 4.2 Frontend

- Form menyimpan `version` dari response detail.
- Submit mengirim `version` di body.
- Jika conflict, tampilkan: "Dokumen telah diubah oleh user lain. Refresh dan coba lagi."

## 5. Logging

### 5.1 Structured Logger

Gunakan `App/Utils/logger` (Winston) untuk semua log:

```js
const Logger = use('App/Utils/logger')

Logger.info('PR created', { prId, userId, kode })
Logger.warn('PR validation failed', { prId, error: error.message })
Logger.error('PR approve failed', { prId, error: error.message, stack: error.stack })
```

### 5.2 Log Levels

| Level | Penggunaan |
|---|---|
| `info` | Successful mutations, cron runs |
| `warn` | Business validation failures, permission denied |
| `error` | Unexpected errors, DB failures, storage failures |

### 5.3 Log Content

Setiap log wajib berisi:
- `timestamp`
- `module: 'purchasing-request'`
- `pr_id` (jika relevan)
- `user_id`
- `command`
- `request_id` (correlation)
- `error` (jika ada)

### 5.4 Tidak Boleh Di-Log

- Password, token, session ID.
- Full financial values (log ID dan summary saja).
- PII user (cukup ID).

### 5.5 Hapus `console.*`

Backend target saat ini banyak menggunakan `console.log` dan `console.error`. Semua wajib diganti dengan structured logger.

## 6. Rate Limiting

| Endpoint | Limit |
|---|---|
| List/detail | 60 req/min per user |
| Mutation | 30 req/min per user |
| Export | 5 req/min per user |
| Master options | 120 req/min per user |

Implementasi via middleware atau API gateway.

## 7. Security Testing

### 7.1 Automated

- SAST (Static Application Security Testing) scan.
- Dependency vulnerability scan (`npm audit`).
- SQL injection test (parameterized queries sudah aman, tapi verifikasi).

### 7.2 Manual

- IDOR test: akses PR bisnis lain dengan ID arbitrary.
- Role bypass test: POST validate tanpa permission `validate`.
- Concurrency test: dua approval paralel.
- XSS test: input `<script>` di deskripsi/nama.
- File upload test: upload executable dengan MIME spoof.
- Rate limit test: flood request.

### 7.3 Penetration Test

Sebelum full cutover, lakukan penetration test pada endpoint PR target.