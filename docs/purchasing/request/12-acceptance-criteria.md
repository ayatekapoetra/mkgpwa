# 12 — Acceptance Criteria

Checklist ini menjadi gating untuk setiap fase rollout. Setiap kriteria wajib terpenuhi sebelum lanjut ke fase berikutnya.

## 1. Functional Parity

- [ ] Lifecycle `draft → active → approved → finish` tersedia di Next.js.
- [ ] Create draft berfungsi dengan kode PR generated.
- [ ] Submit draft → active berfungsi.
- [ ] Edit draft/active (sebelum validasi) berfungsi.
- [ ] Tambah/hapus item draft berfungsi.
- [ ] Validasi/check item berfungsi (partial dan full).
- [ ] Approval final + auto-create PO berfungsi.
- [ ] Mode validasi dimulai tanpa selection dan mendukung pilih satu/beberapa/semua item.
- [ ] Mode approval dimulai tanpa selection dan mendukung pilih satu/beberapa/semua item.
- [ ] Item yang tidak dipilih tidak mengalami perubahan data/status.
- [ ] PO hanya terbentuk dari item approval yang dipilih.
- [ ] Rollback validation berfungsi.
- [ ] Rollback approval + cancel PO berfungsi.
- [ ] Rollback dengan downstream (admin force + kompensasi) berfungsi.
- [ ] Delete draft/active berfungsi.
- [ ] Delete approved/finish diblokir.
- [ ] Attachment upload/delete/view berfungsi.
- [ ] Attachment legacy tetap dapat diakses.
- [ ] Print PDF berfungsi (dengan/without price column).
- [ ] Export Excel berfungsi (dengan filter).
- [ ] Integrasi MRO create PR berfungsi.
- [ ] Integrasi MRO append PR berfungsi.
- [ ] Integrasi backlog create PR berfungsi.
- [ ] Update barang saat validate → MRO ter-update.
- [ ] Notifikasi submit → purchasing berfungsi.
- [ ] Notifikasi validated → approver berfungsi.
- [ ] Notifikasi approved → requester berfungsi.
- [ ] Notifikasi rollback berfungsi.
- [ ] Badge pending count di menu dan home berfungsi.

## 2. Permission & Authorization

- [ ] Semua endpoint mutation memvalidasi `sys_accesspermission`.
- [ ] User tanpa `read` tidak dapat melihat list/detail.
- [ ] User tanpa `insert` tidak dapat create.
- [ ] User tanpa `validate` tidak dapat validate (403).
- [ ] User tanpa `approve` tidak dapat approve (403).
- [ ] User non-admin tidak dapat rollback (403).
- [ ] Administrator/developer mendapat override.
- [ ] Rollback hanya untuk administrator.
- [ ] Document permission mempertimbangkan status, ownership, scope.
- [ ] Non-owner tidak dapat mengubah PR orang lain (kecuali validate/approve).
- [ ] Frontend menyembunyikan tombol berdasarkan permission.
- [ ] Backend tetap memvalidasi permission meski frontend menyembunyikan.

## 3. Multi-Business Scoping

- [ ] List default ke bisnis user.
- [ ] User tidak dapat melihat PR dari bisnis lain.
- [ ] User tidak dapat melihat PR dari cabang lain.
- [ ] Master barang dibatasi berdasarkan bisnis.
- [ ] Master supplier dibatasi berdasarkan bisnis.
- [ ] Master equipment dibatasi berdasarkan cabang.
- [ ] Master gudang dibatasi berdasarkan cabang.
- [ ] Admin dapat melihat semua bisnis (untuk rekonsiliasi).

## 4. Data Integrity

- [ ] Semua nilai finansial dihitung server-side.
- [ ] `subtotal`, `ppn_rp`, `tot_harga` dari client diabaikan.
- [ ] `total_ro` dihitung ulang setelah mutation.
- [ ] Status header dihitung dari item aktif saja.
- [ ] Item inactive (`aktif='N'`) tidak dihitung dalam status.
- [ ] Generator kode PR concurrency-safe (no duplicate).
- [ ] Generator kode PO concurrency-safe (no duplicate).
- [ ] Satu PR item hanya menghasilkan satu PO item aktif (unique constraint).
- [ ] Monitoring `barang_id` (bukan `barangid`).
- [ ] Monitoring di-link berdasarkan `roitem`, bukan `barang_id` matching.

## 5. Concurrency & Idempotency

- [ ] Dua approval paralel hanya menghasilkan satu set PO.
- [ ] Retry dengan idempotency key sama mengembalikan PO yang sama.
- [ ] `SELECT ... FOR UPDATE` digunakan pada semua mutation status.
- [ ] Optimistic locking (`version`) berfungsi.
- [ ] Stale version → 409.
- [ ] Idempotency key wajib untuk submit, validate, approve, rollback.
- [ ] Idempotency key sama dengan command berbeda → 409.

## 6. Security

- [ ] Item dari PR lain dalam payload → 422 ITEM_NOT_OWNED_BY_PR.
- [ ] Error response tidak mengekspos SQL/stack.
- [ ] `console.*` diganti dengan structured logger.
- [ ] File upload: MIME whitelist, size limit, count limit.
- [ ] File upload: random filename, outside web root.
- [ ] Cron endpoint memerlukan token/internal access.
- [ ] Signage endpoint ditambahkan auth atau token.
- [ ] Rate limiting aktif.
- [ ] CORS dibatasi.

## 7. Audit Trail

- [ ] Setiap mutation menghasilkan `pr_command_audit` record.
- [ ] Audit berisi: actor, role, timestamp, command, before/after.
- [ ] Audit rollback berisi reason.
- [ ] Audit approve berisi PO IDs.
- [ ] Audit trail dapat dilihat via API.
- [ ] Audit trail append-only (tidak dapat dihapus/diedit).
- [ ] Reconciliation job: PR yang berubah tanpa audit → alert.

## 8. UX

- [ ] List berfungsi desktop (table) dan mobile (card).
- [ ] Form berfungsi desktop (2-column + sidebar) dan mobile (single column + sticky bottom).
- [ ] Detail page menampilkan semua section (header, progress, items, attachment, PO, audit).
- [ ] Validate mode: item belum tervalidasi → form, sudah → read-only.
- [ ] Approve mode: PO preview sebelum confirm.
- [ ] Rollback dialog: target status, item select, reason wajib, PO preview.
- [ ] Double-submit prevention (loading + disabled).
- [ ] Loading skeleton (bukan spinner penuh).
- [ ] Empty state (no data, no permission).
- [ ] Error state (network, server, permission).
- [ ] Responsive pada viewport mobile.
- [ ] Berfungsi pada Electron.
- [ ] StatusChip dengan label yang jelas (Draft, Menunggu Validasi, Menunggu Approval, Selesai).
- [ ] Progress bar validated x/y dan approved x/y.

## 9. Performance

- [ ] API list p95 ≤ 700ms.
- [ ] API detail p95 ≤ 800ms.
- [ ] Master autocomplete p95 ≤ 500ms.
- [ ] Create/update draft p95 ≤ 1s.
- [ ] Validate 100 items ≤ 2s.
- [ ] Approve 100 items ≤ 5s.
- [ ] First usable view ≤ 3s.
- [ ] No N+1 queries on list/detail.
- [ ] Export besar: background job atau streaming.

## 10. Migration & Coexistence

- [ ] Schema migration idempotent (safe re-run).
- [ ] Data backfill dry-run lulus di staging.
- [ ] Data quality audit: 0 P0 anomali.
- [ ] `source_system` diset untuk semua existing data.
- [ ] `version` diset untuk semua existing data.
- [ ] `pr_item_id` mapping di-backfill.
- [ ] Monitoring `barang_id` diperbaiki.
- [ ] Status header di-recompute.
- [ ] `total_ro` di-recompute.
- [ ] Permission submenu `/purchasing-request` dikonfigurasi.
- [ ] Feature flag dapat dimatikan tanpa restart (file-based).
- [ ] Reconciliation job harian berjalan.
- [ ] Reconciliation: 0 mismatch setelah canary.

## 11. Test Coverage

- [ ] Unit test: state machine 100%.
- [ ] Unit test: financial calculation 100%.
- [ ] Unit test: PO grouping 100%.
- [ ] Unit test: permission service 100%.
- [ ] Integration test: CRUD 90%.
- [ ] Integration test: workflow 90%.
- [ ] Concurrency test: lulus.
- [ ] Security test: lulus.
- [ ] Multi-business isolation test: 100%.
- [ ] Monitoring test: lulus.
- [ ] MRO/backlog test: lulus.
- [ ] Export/print test: lulus.
- [ ] E2E test (Playwright): lulus.
- [ ] Electron test: lulus.
- [ ] Cron test: lulus.

## 12. Rollout Gates

### Fase 1 (Read-Only) Gate
- [ ] Reconciliation report: 100% match legacy.
- [ ] UI berfungsi desktop/mobile/Electron.
- [ ] Error rate < 1%.

### Fase 2 (Create) Gate
- [ ] 50 PR dibuat via target tanpa error.
- [ ] Nomor PR tidak konflik dengan legacy.
- [ ] MRO/backlog integration berfungsi.

### Fase 3 (Validate) Gate
- [ ] 20 PR tervalidasi via target.
- [ ] Financial calculation match legacy (sampling 10%).
- [ ] Monitoring status correct.
- [ ] Error rate < 0.5%.

### Fase 4 (Approve) Gate
- [ ] 10 PR di-approve via target.
- [ ] PO grouping correct.
- [ ] Tidak ada PO duplikat (concurrency test).
- [ ] Monitoring status=4 correct.
- [ ] Notifikasi terkirim.
- [ ] Idempotency lulus.

### Fase 5 (Rollback) Gate
- [ ] 5 rollback sukses (sebelum downstream).
- [ ] 2 rollback diblokir (dengan downstream).
- [ ] 1 admin force rollback dengan kompensasi.
- [ ] Audit trail lengkap.

### Fase 7 (Full Cutover) Gate
- [ ] Semua bisnis menggunakan target.
- [ ] Legacy mutation disabled.
- [ ] Error rate < 0.1%.
- [ ] Latency p95 dalam target.
- [ ] Support ticket rate normal.
- [ ] Reconciliation 0 mismatch.

### Fase 8 (Decommission) Gate
- [ ] 2 minggu tanpa P0 issue.
- [ ] Reconciliation 0 mismatch.
- [ ] Semua downstream (PO, faktur, payment, delivery) berfungsi.
- [ ] Legacy PR routes disabled.

## 13. Metrik Keberhasilan

| Metrik | Target | Pengukuran |
|---|---|---|
| User adoption | 100% user PR menggunakan target | User activity log |
| Error rate | < 0.1% | API error monitoring |
| Latency p95 list | < 700ms | APM |
| Latency p95 detail | < 800ms | APM |
| Duplicate PO | 0 | Reconciliation job |
| Reconciliation mismatch | 0 | Daily job |
| Audit trail coverage | 100% mutation | Reconciliation job |
| Test coverage | P0 100%, P1 90% | CI report |
| Support ticket | < baseline + 10% | Helpdesk |
