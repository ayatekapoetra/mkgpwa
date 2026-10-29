# REG-PR-FILTER-001 implementation handoff

Base: 87fbe794c50d331073014ba8c4b3ddb03193979a; historical merge lineage: fb07fff47d39c357d7b5173308d207341f3e96af.
Contract: approved PRD-MKG-001 v1 AC-01..08 plus authentic owner amendment 29 Oct 2026 12:51:59 WITA (task comments). SessionStorage replaces localStorage. Breakdown retains BD-001 pagination; all other filters omit page/offset and restore default page1.
Legacy local filter values are ignored, not read or migrated. No new local filter keys. Auth/token/preference/selection/draft storage is unchanged.

## Coverage and limits
AC-01: hook SSR/corrupt storage/failure/factory tests; build SSR compile.
AC-02: 48 official components + 3 existing standardizations (timesheet, order-payment, crew-work-activity) = 51 components; 52 distinct keys because daily activity plan/realized share one component. Full inventory: filter-inventory.json.
AC-03..07: shared hook unit tests and actual PR page source executed with deterministic React adapter and synthetic request/list boundary. Remounts simulate navigation, not browser routing. 22 tests pass. Browser actual DOM/navigation/network and live API results NOT RUN by FE; independent QA required, including multi-module representative samples, BU debounce, BD pagination/race and PR business list regressions.
AC-08: yarn build exit0, isolated API loopback 127.0.0.1:9, 178 static pages. NOT final staging configuration/build/deployment. Build includes type validity check; standalone typecheck NOT RUN (no new script). Existing nonfatal lint warnings in build retained; yarn lint --quiet exit0.
Logs contain cwd/command/start/end/exit. tests.log, inventory.log, lint.log, build.log. pr-red.log records prior regression reproduction; not browser E2E.

## Preservation and cross-application impact
No backend/HRIS/API schema, identifier, permissions, timezone conversion, synchronization or DB changes. Existing API parameter shapes and source of truth retained; only tab-scoped UI persistence changes. No production service, DB, notification, push or deploy.
Asset form unchanged from base; read-only release comparison previously showed only currency_code fallback IDR (already retained in base). Known AYA-211 duplicate offers PUT identifier defect remains outside this task, not fixed or QA-approved.
PR grouping/delete/narration/grand-total and mutate preserved; BU debounce preserved; Breakdown only one-line pagination option change.

## Per-file delta rationale (relative to pinned base)
- src/hooks/useFilterStorage.js: Reconcile candidate session default with owner amendment: session only, no legacy fallback; omit page/offset except explicit BD option; no-op sync does not recreate reset key; factory defaults and custom reset retained.
- src/views/accounting/pengajuan-dana/index.js: Keep candidate selection/poll/business logic; replace only filter state and reset.
- src/views/asset-purchases/list.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/human-capital/absensi-karyawan/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/human-capital/absensi-karyawan/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/human-capital/crew-work-activity/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/human-capital/crew-work-activity/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/integration-issues/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/laporan/event-history/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/laporan/event-history/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/laporan/monitoring-order-part/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/laporan/monitoring-sparepart-stock/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/laporan/monitoring-stock-sparepart/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/laporan/operating-history/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/laporan/operating-history/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/laporan/part-used-history/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/laporan/pemakaian-barang/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/laporan/pemakaian-barang/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/laporan/productivity/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/laporan/stokopname/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/laporan/summary-breakdown/filter.js: Keep candidate equipment normalization/race guards; add reset callback retaining standalone fallback.
- src/views/laporan/summary-breakdown/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/maintenance/breakdown/index.js: Keep candidate BD-001 implementation intact; only opt into preservePagination. Retain existing session key for backward compatibility.
- src/views/maintenance/work-order/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/master/barang/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/master/barang/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/master/cabang/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/master/cabang/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/master/dom/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/master/dom/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/master/equipment/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/master/equipment/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/master/harga-beli/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/master/harga-beli/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/master/kegiatan-kerja/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/master/kegiatan-kerja/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/master/lokasi-kerja/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/master/lokasi-kerja/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/master/material/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/master/material/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/master/pemasok/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/master/pemasok/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/master/penyewa/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/master/penyewa/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/master/unit-bisnis/filter.js: Keep BU-001 controlled local input and debounce logic; add onReset path, retaining standalone fallback.
- src/views/master/unit-bisnis/index.js: Keep BU API/pagination/loading; replace only state with shared storage and pass reset.
- src/views/operational/daily-activity/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/operational/equipment-mobilization/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/operational/equipment-mobilization/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/operational/mining/daily-checker-pit/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/operational/mining/daily-checker-pit/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/operational/mining/daily-checker-stockpile/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/operational/mining/daily-checker-stockpile/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/operational/mining/fleet-assignment/FleetAssignmentWorkspace.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/operational/mining/fleet-assignment/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/operational/mining/mining-production-plan/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/operational/mining/mining-production-plan/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/operational/rental-contract/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/operational/rental-contract/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/operational/timesheet/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/operational/timesheet/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/other/penugasan-kerja/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/other/penugasan-kerja/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/scm/delivery-order/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/scm/delivery-order/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/scm/goods-receipt/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/scm/goods-receipt/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/scm/order-payment/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/scm/pickup-order/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/scm/pickup-order/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/scm/purchasing-orders/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/scm/purchasing-request/index.js: Keep candidate access/mutate/grouped list path; persist applied params and clear key through reset.
- src/views/scm/shipping-order/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/scm/shipping-order/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/setting/kegiatan-tag/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/setting/kegiatan-tag/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/setting/timesheet-tag/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/setting/timesheet-tag/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/setting/user-access/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/setting/user-access/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/setting/wa-config-breakdown/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/setting/wa-config-breakdown/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/warehouse/goods-issues/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/warehouse/goods-issues/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/warehouse/stokopname/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/warehouse/stokopname/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- src/views/warehouse/transfers/filter.js: Wire optional reset callback and synchronize visible filter state with restored params; retain business options/validation.
- src/views/warehouse/transfers/index.js: Adopt shared session filter hook, isolated module key and explicit reset; retain candidate API/list/business behavior.
- test/use-filter-storage.test.cjs: Regression/coverage tests; synthetic adapters explicitly labeled.

## Reproduce
yarn install --frozen-lockfile --ignore-scripts (already performed, no lock changes)
node test/run-filter-verification.cjs tests
node test/run-filter-verification.cjs inventory
node test/run-filter-verification.cjs lint
node test/run-filter-verification.cjs build (serialize heavy builds; isolated loopback only)

Independent QA child t_21950441 must pin final commit/tree from board handoff, use its own workspace and verify actual UI/request flows. Release/deploy remains DevOps-gated. FE handoff is NOT QA PASS or Awaiting User Review.
