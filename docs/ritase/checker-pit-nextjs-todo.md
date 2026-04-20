# TODO Checker PIT (Next.js)

## Target Route & Struktur
- [ ] Buat route `src/app/(dashboard)/(mining)/daily-checker-pit/page.js` untuk URL `/daily-checker-pit`.
- [ ] Buat view root `src/views/operational/mining/daily-checker-pit/index.js`.
- [ ] Terapkan shell layout standar: `Breadcrumbs` + `MainCard` + action header.
- [ ] Buat komponen `filter.js` pola `SwipeableDrawer` mengikuti pattern existing.
- [ ] Siapkan komponen list/detail/hitung/create/edit di folder view yang sama.

## Phase 1 - Foundation & Contract
- [ ] Finalkan schema frontend `RitasePit` (typed model) termasuk `seq`.
- [ ] Finalkan helper normalisasi `date_ops` (`YYYY-MM-DD`) dan ID string.
- [ ] Buat API client module untuk endpoint PIT (`list/create/update/delete/bulk-sync`).
- [ ] Tetapkan mapping error backend ke pesan UI operasional.

## Phase 2 - Local Persistence & Sync Engine
- [ ] Pilih storage offline (IndexedDB via Dexie/localforage) untuk cache ritase.
- [ ] Implement tabel/collection lokal dengan field `sync_status`, `conflict`, `synced_at`.
- [ ] Implement `saveWithConnectivity`, `updateWithConnectivity`, `deleteWithConnectivity`.
- [ ] Implement queue `bulkSyncPending` + retry policy (manual trigger + periodic).
- [ ] Implement `syncFromServer` yang tidak menimpa entry `PENDING` tanpa merge rule.

## Phase 3 - Grouping & Query Layer
- [ ] Buat util `buildPitGroupKey(date_ops, shift_id, excavator_id, startpit_id, material_id)`.
- [ ] Integrasikan util key ke list, detail, hitung-rit, dan query cache key.
- [ ] Pastikan filter scope hanya mengambil data dalam group aktif.
- [ ] Tambah unit test untuk key builder dan normalisasi filter.

## Phase 4 - UI List & Detail
- [ ] Bangun halaman list group Checker PIT.
- [ ] Tambah filter tanggal, shift, status sync.
- [ ] Bangun halaman detail group dengan statistik `total/pending/synced`.
- [ ] Tambah aksi `Sync from Server` dan `Sync Pending` di detail.
- [ ] Tambah indikator konflik jika ada data `CONFLICT`.

## Phase 5 - UI Create & Edit
- [ ] Bangun form create dengan validasi field wajib termasuk `seq`.
- [ ] Tambah date picker dan waktu `starttime` default now.
- [ ] Bangun halaman edit ritase dan persist ke local-first.
- [ ] Pastikan edit selalu menandai data sebagai `PENDING`.

## Phase 6 - UI Hitung Rit
- [ ] Bangun halaman hitung-rit per group aktif.
- [ ] Implement increment dari template ritase terbaru dumptruck.
- [ ] Implement decrement ritase terbaru dengan guard minimum PIT.
- [ ] Tampilkan summary scope aktif (tanggal/shift/excavator/pit/material).
- [ ] Tampilkan feedback status setelah aksi increment/decrement.

## Phase 7 - QA & Hardening
- [ ] Test scenario online create/update/delete -> status `SYNCED`.
- [ ] Test scenario offline create/update/delete -> status `PENDING`.
- [ ] Test bulk sync: sukses penuh, sukses parsial, conflict.
- [ ] Test konsistensi list/detail/hitung-rit pada key final.
- [ ] Test validasi `seq` tersimpan dan tampil pada detail/edit.
- [ ] Smoke test lint/build dan regression checker-stockpile.

## Definition of Done
- [ ] Semua flow PIT (list/create/hitung/detail/edit/sync) tersedia di web.
- [ ] Offline-first berjalan stabil dan tidak kehilangan data.
- [ ] Dokumentasi API mapping + known limitations diperbarui.

## Breakdown Eksekusi (Sprint)

### Sprint 1 - Data Layer & Grouping Foundation
- [ ] Setup module `features/ritase/pit` (types, api, repository, hooks).
- [ ] Implement type `RitasePit` + mapper server -> local.
- [ ] Implement storage lokal (IndexedDB) + migrasi schema awal.
- [ ] Implement helper `normalizeDateOps` dan `normalizeId`.
- [ ] Implement `buildPitGroupKey` + unit test.
- [ ] Implement query grouped list dari local store.
- [ ] Implement API client: `GET/POST/PUT/DELETE /ritase/pit`.
- [ ] Implement orchestrator `saveWithConnectivity`.
- [ ] Implement orchestrator `updateWithConnectivity`.
- [ ] Implement orchestrator `deleteWithConnectivity`.

Output Sprint 1:
- Local store PIT siap pakai.
- Flow CRUD online-first + fallback pending tersedia di service layer.

### Sprint 2 - UI Core (List, Create, Hitung Rit)
- [ ] Bangun halaman list group PIT + filter dasar (reuse pola komponen filter existing).
- [ ] Tampilkan indikator status sync per group.
- [ ] Bangun halaman create (validasi mandatory + field `seq`).
- [ ] Integrasikan create ke orchestrator.
- [ ] Bangun halaman hitung-rit dengan scope dari route params.
- [ ] Implement increment ritase per dumptruck.
- [ ] Implement decrement ritase terakhir + guard minimum.
- [ ] Tambah summary scope aktif di hitung-rit.
- [ ] Tambah feedback toast/modal untuk hasil aksi.

Output Sprint 2:
- User sudah bisa operasional dasar PIT di web (create + hitung rit).

### Sprint 3 - Detail, Edit, Sync, Stabilization
- [ ] Bangun halaman detail group + statistik total/pending/synced.
- [ ] Bangun halaman edit ritase + update pending sync.
- [ ] Implement `syncFromServer` dengan safe merge rule.
- [ ] Implement `bulkSyncPending` + hasil sukses/konflik parsial.
- [ ] Tambah action manual `Sync Pending` dan `Sync from Server`.
- [ ] Tangani state `CONFLICT` di UI (badge + pesan tindak lanjut).
- [ ] QA end-to-end semua flow PIT.
- [ ] Regression test ke flow Stockpile web.

Output Sprint 3:
- PIT web siap release dengan parity flow utama mobile.

## Prioritas Task (Urutan Implementasi)
1. Group key + normalisasi payload/date/id.
2. Local store + orchestrator CRUD online-first.
3. UI list + create + hitung-rit.
4. UI detail + edit.
5. Sync engine, conflict handling, QA, hardening.
