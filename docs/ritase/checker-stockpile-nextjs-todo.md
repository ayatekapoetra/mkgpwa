# TODO Checker Stockpile (Next.js)

## Target Route & Struktur
- [ ] Buat route `src/app/(dashboard)/(mining)/daily-checker-stockpile/page.js` untuk URL `/daily-checker-stockpile`.
- [ ] Buat view root `src/views/operational/mining/daily-checker-stockpile/index.js`.
- [ ] Terapkan shell layout standar: `Breadcrumbs` + `MainCard` + action header.
- [ ] Buat komponen `filter.js` berbasis `SwipeableDrawer` sesuai pattern existing.
- [ ] Siapkan komponen list/detail/hitung/create/edit/unmatched di folder view yang sama.

## Phase 1 - Contract & Architecture
- [ ] Finalkan type model `RitaseStockpile`, `UnmatchedPit`, `Dom`.
- [ ] Finalkan schema key group final stockpile.
- [ ] Finalkan API client stockpile + unmatched + dom.
- [ ] Finalkan standar error message operasional (network, validation, 5xx).

## Phase 2 - Local Store & Sync Orchestrator
- [ ] Implement persistence offline (IndexedDB) untuk ritase stockpile.
- [ ] Simpan metadata `sync_status`, `conflict`, `synced_at`, `matched_ritase_pit_id`.
- [ ] Implement `saveWithConnectivity`, `updateWithConnectivity`, `deleteWithConnectivity`.
- [ ] Implement queue `bulkSyncPending` untuk ritase stockpile.
- [ ] Implement guard merge agar `syncFromServer` tidak overwrite entry `PENDING` lokal.

## Phase 3 - Group Key & Scope Seed
- [ ] Buat util `buildStockpileGroupKey(date_ops, shift_id, material_id, stockpile_id, dom_id)`.
- [ ] Implement storage seed dumptruck per scope group.
- [ ] Pastikan seeded group tetap muncul di list walau belum ada ritase.
- [ ] Tambah test untuk builder key dan merge seeded group + grouped history.

## Phase 4 - UI List & Detail
- [ ] Bangun halaman list Checker Stockpile dengan filter tanggal/shift/status.
- [ ] Tampilkan badge `pending/synced/conflict` per group.
- [ ] Bangun halaman detail group dengan statistik total/pending/synced.
- [ ] Tambah action `Sync from Server` dan `Sync Pending`.

## Phase 5 - UI Create (Setup Scope)
- [ ] Bangun form create scope: `date_ops`, `shift`, `stockpile`, `material`, `dom`, `dumptruck`, `driver`, `truck_type`.
- [ ] Submit create menyimpan seed dumptruck, bukan membuat ritase.
- [ ] Tampilkan modal pasca submit:
- [ ] Opsi `Tambah Dumptruck Lagi` tetap di create.
- [ ] Opsi `Selesai` navigasi ke hitung-rit dengan param scope final.

## Phase 6 - UI Hitung Rit
- [ ] Bangun halaman hitung-rit berbasis scope final.
- [ ] Tampilkan dumptruck hasil merge: ritase existing + seed dumptruck.
- [ ] Implement increment create ritase via orchestrator.
- [ ] Implement decrement hapus ritase terbaru via `ritase_stockpile_id`.
- [ ] Tambah ringkasan scope aktif (tanggal, shift, material, stockpile, DOM).

## Phase 7 - UI Edit
- [ ] Bangun halaman edit ritase stockpile.
- [ ] Pastikan edit menandai local entry sebagai `PENDING`.
- [ ] Pastikan perubahan `dom_id/truck_type` tetap valid terhadap business rule.

## Phase 8 - Unmatched Flow
- [ ] Bangun halaman unmatch list dari endpoint ritase unmatched.
- [ ] Bangun modal accept unmatched dengan field: stockpile, dumptruck, driver (opsional), DOM.
- [ ] Integrasikan `POST /ritase/stockpile/accept-unmatched`.
- [ ] Implement delete/cancel unmatched online-first.
- [ ] Implement fallback offline pending cancel + retry saat sync.

## Phase 9 - QA Scenario
- [ ] Skenario create setup scope + tambah dumptruck berulang.
- [ ] Skenario create setup scope + selesai ke hitung-rit.
- [ ] Skenario seeded dumptruck tampil dengan counter 0.
- [ ] Skenario increment/decrement online.
- [ ] Skenario increment/decrement offline lalu sync.
- [ ] Skenario accept unmatched dengan driver dipilih.
- [ ] Skenario accept unmatched tanpa driver.
- [ ] Skenario delete unmatched online dan offline.
- [ ] Skenario conflict saat bulk sync.
- [ ] Skenario grouping konsisten di list/detail/hitung-rit.

## Phase 10 - Release Readiness
- [ ] Lint, typecheck, build Next.js tanpa error.
- [ ] Smoke test end-to-end checker-stockpile web.
- [ ] Verifikasi tidak ada regresi pada checker-pit web.
- [ ] Update changelog internal ritase web.

## Breakdown Eksekusi (Sprint)

### Sprint 1 - Data Layer, Scope Seed, dan Contract
- [ ] Setup module `features/ritase/stockpile` (types, api, repository, hooks).
- [ ] Implement type `RitaseStockpile`, `UnmatchedPit`, `Dom`.
- [ ] Implement helper `normalizeDateOps`, `normalizeId`, `buildStockpileGroupKey`.
- [ ] Implement storage lokal ritase stockpile + metadata sync.
- [ ] Implement storage seed dumptruck per scope group.
- [ ] Implement API client stockpile (`list/create/update/delete/bulk-sync`).
- [ ] Implement API client unmatched (`list/accept/cancel-delete`).
- [ ] Implement API client DOM open.
- [ ] Implement orchestrator `save/update/deleteWithConnectivity`.

Output Sprint 1:
- Data foundation stockpile siap, termasuk key grouping final dan seed scope.

### Sprint 2 - UI Core (List, Create Scope, Hitung Rit)
- [ ] Bangun halaman list group stockpile + merge seeded group (reuse pola filter dan table/list existing).
- [ ] Tampilkan badge pending/synced/conflict per group.
- [ ] Bangun halaman create sebagai setup scope (bukan create ritase).
- [ ] Implement modal pasca submit: `Tambah Dumptruck Lagi` / `Selesai`.
- [ ] Bangun halaman hitung-rit berbasis scope final.
- [ ] Tampilkan dumptruck merge (seed + existing ritase).
- [ ] Implement increment ritase via orchestrator.
- [ ] Implement decrement ritase terbaru via `ritase_stockpile_id`.
- [ ] Tambah summary scope aktif di header hitung-rit.

Output Sprint 2:
- Operasional utama stockpile sudah bisa dipakai di web sesuai flow mobile terbaru.

### Sprint 3 - Detail, Edit, Unmatched, Sync & Stabilization
- [ ] Bangun halaman detail group + statistik total/pending/synced.
- [ ] Bangun halaman edit ritase stockpile.
- [ ] Bangun halaman unmatch list dengan status kritikal (aging).
- [ ] Bangun modal accept unmatched (driver opsional).
- [ ] Integrasikan accept unmatched ke endpoint backend.
- [ ] Integrasikan delete/cancel unmatched online-first + offline pending.
- [ ] Implement `syncFromServer` dengan merge rule aman.
- [ ] Implement `bulkSyncPending` + handling conflict/partial success.
- [ ] QA end-to-end semua skenario stockpile.
- [ ] Regression test checker-pit web.

Output Sprint 3:
- Checker stockpile web siap release dengan unmatched lifecycle dan sync stabil.

## Prioritas Task (Urutan Implementasi)
1. Group key final + local store + orchestrator connectivity.
2. Create setup scope + seed dumptruck.
3. Hitung-rit increment/decrement berbasis UUID ritase.
4. Detail/edit + sync controls.
5. Unmatched accept/delete lifecycle + QA hardening.
