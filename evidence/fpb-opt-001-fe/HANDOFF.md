FPB-OPT-001 FE implementation handoff

Task: t_858ae925, board mkg-team
Branch: feat/fpb-opt-001-fe
Base: b0811ca0f6db64316f7d7dc43d5e1ea01c8f164f

Scope: AC-FPB-01..05. List bulk checkbox/action removed; Detail links replace selection. Detail sticky actions implement single draft payment, edit only next_due_date/narasi, rollback reason dialog, and Request Void replacement/status. Mutations use existing axios client with timeout, no offline queue/retry, same-tick double-submit lock, and refresh requirement after errors. Server permissions remain authoritative; hidden buttons are not authorization.

Contract: PM approval on backend t_5f36aa90; D-FPB-05 leaves PO/PD close. Latest parent handoff D-FPB-06 says item table has no aktif column and only master is soft-deleted; UI deliberately says invoice deactivated, not items/source reopened. Request Void is administrative approval only, no journal reversal. Dates submitted as business YYYY-MM-DD without UTC conversion. No HRIS/shared identifiers, synchronization, or API contracts changed.

Verification:
- node scripts/test-fpb-opt-001.cjs: exit 0, component.log. Isolated hooks/component-tree and API tests with explicitly mocked dependencies/responses, NOT browser/E2E evidence.
- yarn run lint: exit 0, lint.log.
- git diff --check: exit 0.
- Production build: NOT RUN, expressly forbidden by task.
- Browser smoke, console/network, real API/DB integration: NOT RUN; pending backend integration and QA child t_9d0e0118. No verified isolated application/DB environment used.
- No package/lockfile changes. Local node_modules symlink reuses installed dependencies read-only from primary repo; not committed.

QA reproduction after backend integration in an approved test environment:
1. List: no selection/bulk footer; first-column Detail opens correct invoice.
2. Unplanned invoice with positive sisa: send creates exactly one draft; repeated click blocked. Planned/zero balance button disabled.
3. Edit: only due date/narasi enabled; refresh confirms persisted values/log.
4. Eligible unpaid invoice: rollback requires nonblank reason, deactivates invoice; PO/PD remain close.
5. Paid invoice: Request Void replaces Rollback; nonblank reason creates pending request, no invoice/source/journal change.
6. Test denied roles, timeout/network/409/422, explicit reload recovery, mobile footer, keyboard/dialog focus, console/network.

No push, restart, migration, deploy, or production build performed. Implementation completion releases existing QA dependency; it does not mean QA PASS or feature acceptance.
