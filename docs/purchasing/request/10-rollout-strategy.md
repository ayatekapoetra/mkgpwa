# 10 — Rollout Strategy

## 1. Prinsip

- **Zero downtime:** Legacy tetap berjalan sampai target siap penuh.
- **Single writer per PR:** Tidak ada dual-write untuk aksi yang sama pada PR yang sama.
- **Canary per bisnis/cabang:** Mulai kecil, perluas bertahap.
- **Feature flag + kill switch:** Setiap mutation dapat dimatikan tanpa restart.
- **Reconciliation continuous:** Job harian membandingkan data.
- **Rollback ready:** Cutover dapat di-rollback kapan saja.

## 2. Fase Rollout

### Fase 0 — Audit & Hardening (1 sprint)

**Tujuan:** Pastikan schema dan data siap untuk dual-system.

| Tugas | Output |
|---|---|
| Verifikasi schema produksi vs dokumen ini | Daftar kolom/tipe/constraint |
| Inventarisasi data tidak konsisten | Report anomali (status, total, monitoring) |
| Nonaktifkan mutation target yang belum aman | Feature flag `false` |
| Definisikan permission submenu `/purchasing-request` | Record `sys_submenupermission` + `sys_accesspermission` |
| Setup structured logger | Winston config, hapus `console.*` |
| Setup test runner | Vitest/Playwright, CI pipeline |

**Gate:** Schema migration lulus di staging. Data quality audit tidak menemukan P0 anomali.

### Fase 1 — Read-Only Shadow (1 sprint)

**Tujuan:** Target menampilkan data yang sama dengan legacy, tanpa mutation.

| Tugas | Output |
|---|---|
| Implementasi backend list/detail/permissions | Endpoint GET, response envelope |
| Implementasi frontend list/detail page | Views, SWR, filter |
| Implementasi attachment view, print, export | GET endpoints, PDF/Excel generator |
| Bandingkan response target vs legacy | Reconciliation report |
| Aktifkan badge pending count | Menu badge |

**Feature flag:**
```text
PURCHASE_REQUEST_NEXT_READ_ENABLED=true
PURCHASE_REQUEST_NEXT_*_ENABLED=false  (semua mutation)
```

**Gate:**
- Reconciliation report: 100% match untuk header, item aktif, status, total, PO linkage.
- UI berfungsi desktop/mobile/Electron.
- Error rate < 1%.

### Fase 2 — Draft & Submit Canary (2 sprint)

**Tujuan:** User membuat PR baru via target, bukan legacy.

| Tugas | Output |
|---|---|
| Implementasi backend create/draft/submit | POST endpoints, generator kode |
| Implementasi frontend create/edit form | Formik, FieldArray, accordion |
| Implementasi attachment upload | multipart, validation |
| Implementasi MRO/backlog integration | Field `mro_id`, `woid`, `backlog_id` |
| Canary per bisnis | 1 bisnis (bisnis_id=1) |

**Feature flag:**
```text
PURCHASE_REQUEST_NEXT_READ_ENABLED=true
PURCHASE_REQUEST_NEXT_CREATE_ENABLED=true  (bisnis whitelist: 1)
PURCHASE_REQUEST_LEGACY_READ_ONLY=true    (untuk PR source_system='next')
```

**Routing:**
- PR `source_system='next'` hanya bisa diedit di target.
- PR `source_system='legacy'` tetap di legacy.

**Gate:**
- 50 PR dibuat via target tanpa error.
- Nomor PR tidak konflik dengan legacy.
- Integrasi MRO/backlog berfungsi.
- Reconciliation job bersih.

### Fase 3 — Validate Canary (2 sprint)

**Tujuan:** Purchasing memvalidasi PR via target.

| Tugas | Output |
|---|---|
| Implementasi backend validate | POST /validate, server-side financial calc |
| Implementasi frontend validate mode | CheckItemForm, bulk apply, preview |
| Implementasi monitoring update | mon_request_part sync |
| Canary per bisnis | 1 bisnis (bisnis_id=1) |

**Feature flag:**
```text
PURCHASE_REQUEST_NEXT_VALIDATE_ENABLED=true  (bisnis whitelist: 1)
```

**Gate:**
- 20 PR tervalidasi via target.
- Financial calculation match legacy (sampling 10%).
- Monitoring status correct.
- Error rate < 0.5%.

### Fase 4 — Approve & PO Canary (2 sprint)

**Tujuan:** Approver menyetujui PR via target, PO dibuat otomatis.

| Tugas | Output |
|---|---|
| Implementasi backend approve + PO creation | POST /approve, grouping, kode PO |
| Implementasi unique mapping pr_item_id → po_item_id | Constraint, migration |
| Implementasi idempotency | Idempotency-Key, pr_idempotency table |
| Implementasi frontend approve mode | POPreview, confirm dialog |
| Implementasi notification outbox | pr_notification_outbox, worker |
| Canary per bisnis | 1 bisnis (bisnis_id=1) |

**Feature flag:**
```text
PURCHASE_REQUEST_NEXT_APPROVE_ENABLED=true  (bisnis whitelist: 1)
```

**Gate:**
- 10 PR di-approve via target.
- PO grouping correct (vendor + PPN + currency + method).
- Tidak ada PO duplikat (concurrency test lulus).
- Monitoring status=4 (NPO) correct.
- Notifikasi terkirim.
- Idempotency: retry dengan key sama mengembalikan PO yang sama.

### Fase 5 — Rollback Canary (1 sprint)

**Tujuan:** Administrator dapat rollback via target.

| Tugas | Output |
|---|---|
| Implementasi backend rollback | POST /rollback, PO cancellation |
| Implementasi frontend rollback dialog | Target status, reason, preview |
| Implementasi downstream check | Faktur, payment, delivery blocker |
| Implementasi audit trail display | AuditTimeline component |
| Canary per bisnis | 1 bisnis (bisnis_id=1) |

**Feature flag:**
```text
PURCHASE_REQUEST_NEXT_ROLLBACK_ENABLED=true  (admin only)
```

**Gate:**
- 5 rollback sukses (sebelum downstream).
- 2 rollback diblokir (dengan downstream).
- 1 admin force rollback dengan kompensasi.
- PO dan monitoring ter-reset.
- Audit trail lengkap.

### Fase 6 — Delete Canary (0.5 sprint)

**Tujuan:** Soft-delete PR via target.

| Tugas | Output |
|---|---|
| Implementasi backend delete | DELETE endpoint, soft-delete |
| Implementasi frontend delete dialog | Confirm, destructive |
| Canary per bisnis | 1 bisnis (bisnis_id=1) |

**Gate:**
- 5 delete sukses (draft/active).
- Delete approved/finish diblokir.
- Monitoring dan attachment ter-handle.

### Fase 7 — Full Cutover (1 sprint)

**Tujuan:** Semua bisnis menggunakan target.

| Tugas | Output |
|---|---|
| Aktifkan semua feature flag untuk semua bisnis | Global `true` |
| Set legacy read-only global | `PURCHASE_REQUEST_LEGACY_READ_ONLY=true` |
| Redirect legacy URL `/acc/pr` ke `/purchasing-request` | Nginx/Apache redirect |
| Komunikasi ke user | Notifikasi, training, guide |
| Observasi 24 jam | Error rate, latency, support ticket |

**Gate:**
- Error rate < 0.1%.
- Latency p95 dalam target.
- Support ticket rate normal.
- Reconciliation job bersih.

### Fase 8 — Decommission (2 minggu observasi)

**Tujuan:** Legacy PR dinonaktifkan.

| Tugas | Output |
|---|---|
| Observasi 2 minggu | Daily reconciliation, error monitoring |
| Disable legacy PR routes | Comment/hapus route `mrt-v3/start/routes.js:263-294` |
| Disable legacy API PR routes | Comment/hapus `mrt-v3/start/routes.js:1180-1198` |
| Archive legacy views | `mrt-v3/resources/views/akunting/purchase-request/` |
| Update dokumentasi | Mark legacy as deprecated |

**Gate:**
- 2 minggu tanpa P0 issue.
- Reconciliation 0 mismatch.
- Semua downstream (PO, faktur, payment, delivery) berfungsi.

## 3. Feature Flag Configuration

### Environment Variables

```text
# Master switch
PURCHASE_REQUEST_NEXT_ENABLED=true

# Per-mutation
PURCHASE_REQUEST_NEXT_READ_ENABLED=true
PURCHASE_REQUEST_NEXT_CREATE_ENABLED=true
PURCHASE_REQUEST_NEXT_VALIDATE_ENABLED=true
PURCHASE_REQUEST_NEXT_APPROVE_ENABLED=true
PURCHASE_REQUEST_NEXT_ROLLBACK_ENABLED=true

# Legacy
PURCHASE_REQUEST_LEGACY_READ_ONLY=false

# Canary whitelist (comma-separated bisnis_id)
PURCHASE_REQUEST_NEXT_BISNIS_WHITELIST=1,2,3

# Cron
PURCHASE_REQUEST_CRON_ENABLED=true
PURCHASE_REQUEST_CRON_DRY_RUN=false

# Notification
PURCHASE_REQUEST_NOTIFICATION_ENABLED=true

# Export
PURCHASE_REQUEST_EXPORT_ASYNC_THRESHOLD=10000
```

### Implementasi

Backend membaca flag via `Env.get()`:

```js
const isMutationEnabled = (command) => {
  const flag = `PURCHASE_REQUEST_NEXT_${command.toUpperCase()}_ENABLED`
  if (!Env.get('PURCHASE_REQUEST_NEXT_ENABLED', false)) return false
  if (!Env.get(flag, false)) return false
  const whitelist = Env.get('PURCHASE_REQUEST_NEXT_BISNIS_WHITELIST', '')
  if (whitelist && command !== 'read') {
    const allowed = whitelist.split(',').map(Number)
    if (!allowed.includes(user.bisnis_id)) return false
  }
  return true
}
```

### Runtime Toggle

Untuk kill switch cepat tanpa redeploy:

```text
# File-based flag
storage/app/purchase_request_flags.json

{
  "create": true,
  "validate": true,
  "approve": true,
  "rollback": true,
  "delete": true,
  "legacy_read_only": false
}
```

Backend membaca file ini setiap request (cache 10 detik). Admin dapat mengubah via endpoint khusus.

## 4. Monitoring & Alerting

### Metrik yang Dipantau

| Metrik | Alert Threshold |
|---|---|
| API error rate | > 1% (P0), > 5% (P1) |
| API latency p95 | > 800ms list, > 1s detail |
| PO creation failure | > 0 (P0) |
| Duplicate PO | > 0 (P0) |
| Monitoring sync failure | > 0 (P1) |
| Reconciliation mismatch | > 0 (P1) |
| Idempotency conflict | > 1% (P2) |
| Notification outbox backlog | > 100 pending (P2) |
| Cron failure | > 0 (P1) |

### Dashboard

Grafana / internal dashboard:
- PR created/validated/approved/rolled back per hour.
- Status distribution.
- Error by endpoint.
- Latency by endpoint.
- PO created per hour.
- Reconciliation result.

## 5. Rollback Plan (Cutover Rollback)

Jika target bermasalah setelah cutover:

### Step 1: Immediate

```text
# Disable target mutation
Set PURCHASE_REQUEST_NEXT_*_ENABLED=false

# Re-enable legacy mutation
Set PURCHASE_REQUEST_LEGACY_READ_ONLY=false
```

### Step 2: Communication

- Notifikasi user: "Sistem PR sedang dalam pemeliharaan, sementara gunakan legacy."
- Redirect `/purchasing-request` ke legacy `/acc/pr`.

### Step 3: Data Fix

PR yang sudah `source_system='next'` tetap bisa diedit di legacy (schema compatible). Tidak ada data loss.

### Step 4: Investigasi

- Analisis error log.
- Reproduce di staging.
- Fix.
- Ulangi canary.

## 6. Komunikasi User

### Sebelum Canary

- Pengumuman: "Sistem PR akan ditingkatkan. Mulai {tanggal}, bisnis {X} akan menggunakan versi baru."
- Training video/guide singkat.
- FAQ.

### Saat Canary

- Notifikasi in-app: "Anda menggunakan versi baru PR. Laporkan masalah ke {contact}."
- Feedback button.

### Saat Full Cutover

- Pengumuman: "Semua bisnis sekarang menggunakan versi baru PR."
- Legacy URL di-redirect.
- Support hotline aktif 1 minggu.

### Saat Decommission

- Pengumuman: "Versi lama PR tidak lagi tersedia."

## 7. Timeline Estimasi

| Fase | Durasi | Kumulatif |
|---|---|---|
| 0 — Audit & Hardening | 1 sprint | 1 |
| 1 — Read-Only Shadow | 1 sprint | 2 |
| 2 — Draft & Submit Canary | 2 sprint | 4 |
| 3 — Validate Canary | 2 sprint | 6 |
| 4 — Approve & PO Canary | 2 sprint | 8 |
| 5 — Rollback Canary | 1 sprint | 9 |
| 6 — Delete Canary | 0.5 sprint | 9.5 |
| 7 — Full Cutover | 1 sprint | 10.5 |
| 8 — Decommission | 2 minggu | 12.5 |

**Total estimasi: 9–10 sprint-weeks** (backend + frontend paralel), plus 2 minggu observasi.