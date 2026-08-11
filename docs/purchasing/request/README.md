# Purchasing Request (PR) — Product Requirements Document

**Modul:** Purchasing Request / Purchase Requisition  
**Frontend target:** `./nextjs` (URL `/purchasing-request`)  
**Backend target:** `./be` (resource `/api/scm/purchase-requests`)  
**Sumber legacy:** `./mrt-v3` (URL `/acc/pr`)  
**Strategi data:** Shared production database (canonical store)  
**Cakupan migrasi:** End-to-end penuh  
**Versi PRD:** 1.0  
**Status:** Draft — menunggu review tim produk & engineering

---

## Daftar Dokumen

| # | Dokumen | Deskripsi |
|---|---|---|
| 00 | [Overview](./00-overview.md) | Latar belakang, tujuan, terminologi status, persona |
| 01 | [Roles & Permissions](./01-roles-permissions.md) | Model `sys_accesspermission`, matriks hak akses, deny-by-default |
| 02 | [Data Model](./02-data-model.md) | Schema, field mapping, state machine, nilai finansial |
| 03 | [API Contract](./03-api-contract.md) | Endpoint, request/response, error, pagination, idempotency |
| 04 | [Workflow](./04-workflow.md) | Draft, submit, validate, approve, rollback, delete, attachment |
| 05 | [Frontend Architecture](./05-frontend-architecture.md) | Routing, view, API client, state, struktur file |
| 06 | [UI/UX Spec](./06-ui-ux-spec.md) | List, form, detail, print, export, responsive, optimasi |
| 07 | [Integrations](./07-integrations.md) | PO, monitoring, MRO, backlog, notification, file storage |
| 08 | [Migration & Backfill](./08-migration-backfill.md) | Schema hardening, data reconciliation, coexistence, cutover |
| 09 | [Security & Audit](./09-security-audit.md) | Multi-business scoping, concurrency, audit trail, info disclosure |
| 10 | [Rollout Strategy](./10-rollout-strategy.md) | Fase, canary, feature flag, kill switch, decommission |
| 11 | [Test Matrix](./11-test-matrix.md) | Unit, integration, E2E, concurrency, rollback, security |
| 12 | [Acceptance Criteria](./12-acceptance-criteria.md) | Checklist rilis, gating, metrik keberhasilan |

---

## Ringkasan Eksekutif

Purchasing Request adalah modul untuk meminta pembelian persediaan sparepart kebutuhan operasional. Alur utama:

```text
draft → active → approved → finish
```

- **draft**: dokumen masih disusun, belum masuk antrean purchasing.
- **active**: dokumen diajukan, menunggu validasi purchasing (pemilihan supplier, harga, PPN).
- **approved**: seluruh item aktif sudah divalidasi, menunggu approval final.
- **finish**: seluruh item aktif sudah disetujui, Purchase Order otomatis dibuat.

Implementasi legacy (`mrt-v3`) sudah mendukung seluruh siklus tetapi memiliki risiko keamanan, integritas data, konkurensi, dan ketergantungan pada nilai browser. Target (`nextjs` + `be`) saat ini baru mencakup signage/analitik dan port parsial backend (list, detail, validasi, approval, rollback belum aman).

PRD ini memandu migrasi end-to-end dengan prioritas: backend menjadi sumber kebenaran, perhitungan finansial server-side, satu PR item hanya menghasilkan satu PO item, audit trail menyeluruh, dan rollout bertahap tanpa menghentikan legacy.

## Keputusan Produk

1. **Cakupan:** End-to-end penuh (draft → finish → PO → rollback).
2. **Database:** `mrt-v3` dan `be` berbagi database produksi yang sama; tidak ada copy tabel utama.
3. **Hak akses:** Menggunakan tabel `sys_accesspermission` dengan submenu canonical `/purchasing-request`.
4. **Approval final:** Otomatis membuat PO berdasarkan grouping supplier + PPN + currency + payment method.
5. **Rollback:** Administrator selalu dapat rollback dengan alasan wajib; kompensasi PO/downstream atomik.
6. **Release pertama mencakup:** Attachment, Print PDF, Export Excel, Integrasi MRO/backlog, Notifikasi & badge.

## Referensi Kode Kunci

| Area | Path |
|---|---|
| Legacy routes | `mrt-v3/start/routes.js:263-294` |
| Legacy controller | `mrt-v3/app/Controllers/Http/akunting/PrController.js` |
| Legacy business logic | `mrt-v3/app/Helpers/TrxOrderBeli.js` |
| Legacy model header | `mrt-v3/app/Models/transaksi/TrxOrderBeli.js` |
| Legacy model item | `mrt-v3/app/Models/transaksi/TrxOrderBeliItem.js` |
| Legacy PO helper | `mrt-v3/app/Helpers/TrxPurchaseOrder.js` |
| Legacy monitoring hook | `mrt-v3/app/Models/Hooks/MonitoringRequestPartHook.js` |
| Target routes | `be/start/routes.js:514-520` |
| Target controller | `be/app/Controllers/Http/material-supply-chain/PurchaseRequestController.js` |
| Target model header | `be/app/Models/MSC/PurchaseRequest.js` |
| Target model item | `be/app/Models/MSC/PurchaseRequestItem.js` |
| Permission service pattern | `be/app/Services/PengajuanDanaPermissionService.js` |
| Permission model | `be/app/Models/Setting/SysAccessPermission.js` |
| Frontend signage (existing) | `nextjs/src/views/signages/purchasing-request/index.js` |
| Frontend charts API | `nextjs/src/api/purchasing-charts.js` |
| Frontend pattern reference | `nextjs/src/views/accounting/pengajuan-dana/` |
| Frontend API pattern | `nextjs/src/api/pengajuan-dana.js` |

## Glosarium

| Istilah | Definisi |
|---|---|
| PR | Purchasing Request / Purchase Requisition |
| PO | Purchase Order (`trx_procurement`) |
| MRO | Material Request Order |
| Requester | User pembuat PR |
| Validator | User purchasing yang melakukan check/validasi item |
| Approver | User manager/koordinator yang melakukan approval final |
| Active item | Item PR dengan `aktif='Y'` |
| Monitoring part | `mon_request_part`, tracking lifecycle NPR→CPR→VPR→NPO |
| Idempotency key | Header `Idempotency-Key` untuk mencegah duplikasi mutation |
| Source system | Penanda `source_system` pada record: `legacy`, `next`, `mro`, `backlog` |
