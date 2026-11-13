FPB-OPT-001 FE-INT handoff — konsumsi flag server + approval maker-checker

Task: t_07795796, board mkg-team
Branch: feat/fpb-opt-001-fe
Parent FE SHA: e9f0f3fe1368be2bbc02b06ceefc1cf0c480b91b
Worktree: /home/it_makkuragatama/mkg-team/workspaces/mkgapp-fe-fpb-opt-001-fe
Scope: HANYA frontend AC-FPB-05 integrasi. Tidak push, tidak build production, tidak restart/deploy.

Masalah yang diperbaiki
1. permissionDefaults belum memuat can_send_payment/can_request_void/can_approve_void/can_rollback → normalizePermissions membuang flag server sehingga tombol Request Void tidak pernah muncul.
2. Status void hanya disimpan di useState lokal DetailActions → hilang saat reload; tidak ada jalur checker Approve/Reject.
3. Belum ada GET history request-void dan POST decision di api client.

Perubahan
- src/api/faktur-pembelian.js
  - permissionDefaults + can_send_payment/can_request_void/can_approve_void/can_rollback (default false).
  - endpoints.voidRequest / voidDecision; fetchVoidRequests; useVoidRequests (SWR); decideVoidRequest.
  - useFakturPembelianDetail menormalisasi permissions DETAIL lewat permissionDefaults yang sama.
  - fakturError memetakan VOID_SCHEMA_MISSING → "fitur belum tersedia"; envelope diagnostic.code/error.
- src/views/scm/faktur-pembelian/DetailActions.js
  - Baca current/history dari GET .../request-void via SWR (bukan state lokal status).
  - Tampilkan status PENDING/APPROVED/REJECTED + riwayat singkat; label eksplisit approval administratif saja (tidak reverse jurnal).
  - Checker: can_approve_void + PENDING → Setujui/Tolak + dialog alasan wajib; refresh detail+history setelah keputusan.
  - Eligibility can_send_payment/can_request_void/can_rollback dari server; tidak disimpulkan dari sisa di klien.
  - VOID_SCHEMA_MISSING → "fitur belum tersedia" tanpa crash; loading/error menonaktifkan aksi void/decision.
- scripts/test-fpb-opt-001.cjs
  - Regresi RED→GREEN untuk permissionDefaults; checker approve/reject; history persist; diagnostics; DETAIL normalize.

Kontrak yang diikuti (PM comment pada t_07795796 / t_3efbf73e)
- GET DETAIL: header.has_payment + permissions.can_send_payment/can_request_void/can_approve_void/can_rollback.
- GET /request-void → rows:{current, history}; row snake_case.
- POST /request-void/:requestId/decision body {decision:'APPROVED'|'REJECTED', reason}.
- 500 VOID_SCHEMA_MISSING → "fitur belum tersedia".

Dependensi
- Backend integrasi t_3efbf73e masih running saat handoff FE (worktree BE kotor, HEAD induk void 56ada160). FE dikodekan terhadap kontrak tertulis PM; E2E nyata menunggu BE commit + environment uji.

Verifikasi (setelah implementasi, sebelum commit)
- node scripts/test-fpb-opt-001.cjs → exit 0 (6 kelompok PASS; mock eksplisit, BUKAN E2E).
- yarn run lint → exit 0 (No ESLint warnings or errors).
- git diff --check → exit 0.
- Browser smoke / console / network / real API/DB / production build: NOT RUN (dilarang kartu / backend belum siap).

Larangan yang dipatuhi
- Tidak ada UI yang menjanjikan pembatalan faktur / reverse jurnal.
- Tidak ubah package/lockfile, HRIS, push, restart, migrasi, deploy.
