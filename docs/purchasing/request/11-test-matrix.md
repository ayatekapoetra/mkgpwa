# 11 — Test Matrix

## 1. Test Runner & Setup

### Backend (`be`)

- Framework: Vow + Chai + Sinon (sudah ada di `package.json`)
- Pattern: `test/{unit,functional,integration}/*.spec.js`
- Database: test database terpisah atau transactional rollback
- Command: `npm test` atau `node ace test`

### Frontend (`nextjs`)

- Framework: Vitest (unit) + Playwright (E2E) — **perlu ditambahkan**
- Pattern: `src/**/*.test.js` (colocated) atau `tests/`
- Command: `npm test` (perlu script test di `package.json`)

### CI

- GitHub Actions: jalankan lint + test sebelum deploy.
- Branch protection: PR wajib lulus test sebelum merge.

## 2. Unit Tests

### 2.1 State Machine

| Test | Input | Expected |
|---|---|---|
| Draft → Active | submit draft | status='active' |
| Active → Approved | validate all items | status='approved' |
| Approved → Finish | approve all items | status='finish' |
| Partial validate | validate 2 of 5 items | status='active' |
| Partial approve | approve 2 of 5 items | status='approved' |
| Rollback validation | rollback approved → active | status='active', validation cleared |
| Rollback approval | rollback finish → approved | status='approved', approval cleared, PO cancelled |
| Rollback to active | rollback finish → active | status='active', all cleared |
| Invalid transition | submit finish | 409 INVALID_STATE_TRANSITION |
| Invalid transition | validate finish | 409 |
| Invalid transition | approve draft | 409 |
| No active items | all items deleted | status='draft' |

### 2.2 Financial Calculation

| Test | Input | Expected |
|---|---|---|
| IDR basic | qty=2, price=500000, no discount, tax=11 | subtotal=1110000 |
| IDR with discount | qty=2, price=500000, discount=25000, tax=11 | subtotal=1039500 |
| USD basic | qty=1, price=100 USD, kurs=16000, tax=11 | subtotal=1776000 |
| USD with discount | qty=1, price=100, kurs=16000, discount=100000, tax=11 | subtotal=1666500 |
| Zero tax | qty=2, price=500000, tax=0 | subtotal=1000000 |
| Discount equals gross | qty=1, price=100000, discount=100000, tax=11 | subtotal=0 |
| Discount exceeds gross | discount > gross | 422 validation error |
| Negative qty | qty=-1 | 422 |
| Zero price | price=0 | 422 |
| Missing kurs USD | currency=USD, kurs=null | 422 |
| Rounding | qty=1.005, price=1000 | subtotal=1118 (round half up) |

### 2.3 PO Grouping

| Test | Input | Expected |
|---|---|---|
| Single supplier, single PPN | 3 items same supplier+PPN | 1 PO |
| Multiple suppliers | 3 items, 2 suppliers | 2 POs |
| Multiple PPN | 3 items same supplier, 2 PPN rates | 2 POs |
| Multiple currency | 2 items same supplier, IDR+USD | 2 POs |
| Multiple method | 2 items same supplier, tunai+kredit | 2 POs |
| Mixed all | 4 items, 2 suppliers, 2 PPN, 2 methods | 4 POs |
| Empty items | no items approved | 0 POs |

### 2.4 Permission Service

| Test | Input | Expected |
|---|---|---|
| Override admin | usertype=administrator | all true |
| Override developer | usertype=developer | all true |
| Access row found | sys_accesspermission with read=Y | read=true |
| Access row missing | no record | all false (missing_access) |
| Access row inactive | aktif=N | skip, continue searching |
| Normalize Y | 'Y' | true |
| Normalize N | 'N' | false |
| Normalize null | null | false |
| Normalize 1 | 1 | true |
| Normalize 0 | 0 | false |

### 2.5 Code Generator

| Test | Input | Expected |
|---|---|---|
| Sequential | last=PR-001 | next=PR-002 |
| Concurrent (mock) | two parallel calls | two unique codes |
| Retry on conflict | unique constraint violation | retry with new code |

## 3. Integration / API Tests

### 3.1 CRUD

| Test | Method | Expected |
|---|---|---|
| Create draft | POST | 201, kode generated, status=draft |
| Create with items | POST | 201, items created, monitoring created |
| Show | GET | 200, all fields, items, attachments, permissions |
| Update header | PATCH | 200, version incremented |
| Delete draft | DELETE | 204, soft-deleted |
| Delete active (no validation) | DELETE | 204 |
| Delete active (with validation) | DELETE | 409 |
| Delete finish | DELETE | 409 |

### 3.2 Submit

| Test | Expected |
|---|---|
| Submit draft | 200, status=active |
| Submit active | 409 |
| Submit finish | 409 |
| Submit with no items | 422 |
| Submit by non-owner | 403 |

### 3.3 Validate

| Test | Expected |
|---|---|
| Validate single item | 200, item validated, status recomputed |
| Validate all items | 200, status=approved |
| Validate partial | 200, status=active |
| Validate non-existent item | 422 ITEM_NOT_OWNED_BY_PR |
| Validate item from other PR | 422 ITEM_NOT_OWNED_BY_PR |
| Validate already validated | 409 |
| Validate without permission | 403 |
| Validate with negative qty | 422 |
| Validate with zero price | 422 |
| Validate USD without kurs | 422 |
| Validate discount > gross | 422 |
| Subtotal from client ignored | server recalculates |

### 3.4 Approve

| Test | Expected |
|---|---|
| Approve single item | 200, PO created, status=approved |
| Approve all items | 200, status=finish, PO(s) created |
| Approve with multiple suppliers | 200, multiple POs |
| Approve with multiple PPN | 200, multiple POs |
| Approve non-validated item | 409 |
| Approve already approved | 409 |
| Approve item from other PR | 422 |
| Approve without permission | 403 |
| Approve mixed PR items | 422 |

### 3.5 Rollback

| Test | Expected |
|---|---|
| Rollback validation (no PO) | 200, validation cleared, status=active |
| Rollback approval (PO exists, no downstream) | 200, PO cancelled, status=approved |
| Rollback to active (PO exists, no downstream) | 200, PO cancelled, all cleared |
| Rollback with downstream faktur | 409 DOWNSTREAM_DEPENDENCY |
| Rollback with downstream payment | 409 |
| Rollback admin force with compensation | 200, downstream cancelled |
| Rollback by non-admin | 403 |
| Rollback without reason | 422 |
| Rollback draft | 409 |

### 3.6 Attachment

| Test | Expected |
|---|---|
| Upload valid PDF | 201, file record created |
| Upload valid JPG | 201 |
| Upload oversized (>10MB) | 422 |
| Upload invalid type (exe) | 422 |
| Upload 11th file (max 10) | 422 |
| Delete own attachment | 204 |
| Delete other user's attachment | 403 |
| View attachment with permission | 200, blob |
| View attachment without permission | 403 |

### 3.7 Idempotency

| Test | Expected |
|---|---|
| Same key, same request | 200, same response (cached) |
| Same key, different request | 409 |
| Retry after timeout | 200, same PO IDs |
| No key provided | 400 |

## 4. Concurrency Tests

| Test | Scenario | Expected |
|---|---|---|
| Parallel approve | 2 concurrent approve on same PR | only 1 succeeds, other 409 |
| Parallel validate | 2 concurrent validate different items | both succeed (different items) |
| Parallel validate same item | 2 concurrent validate same item | 1 succeeds, other 409 |
| Parallel create | 2 concurrent create | 2 unique kode |
| Parallel rollback | 2 concurrent rollback | 1 succeeds, other 409 |
| Optimistic lock | update with stale version | 409 |
| Timeout retry | approve times out, retry | same PO IDs returned |

## 5. Security Tests

| Test | Expected |
|---|---|
| Access PR other bisnis | 403 OUT_OF_SCOPE |
| Access PR other cabang | 403 |
| Item from other PR in payload | 422 ITEM_NOT_OWNED_BY_PR |
| Validate without permission | 403 |
| Approve without permission | 403 |
| Rollback by non-admin | 403 |
| XSS in description | stored safely, escaped on render |
| SQL injection in kode | parameterized, no injection |
| File upload executable | 422 |
| File upload MIME spoof | 422 (check actual content) |
| Rate limit exceeded | 429 |
| Public signage without token | 401 (after migration) |
| Error response no SQL | no sql/stack in response |

## 6. Multi-Business Isolation Tests

| Test | Setup | Expected |
|---|---|---|
| User bisnis A list | bisnis=A, PR exists in B | only A's PRs |
| User bisnis A detail | PR id from B | 403/404 |
| User bisnis A validate | item from PR in B | 422 |
| User bisnis A approve | PR in B | 403 |
| Admin list all | admin user | all bisnis PRs |
| Master barang bisnis A | search | only A's barang |
| Master supplier bisnis A | search | only A's suppliers |
| Master equipment cabang A | search | only A's equipment |

## 7. Monitoring Tests

| Test | Expected |
|---|---|
| Create item | mon_request_part status=1 |
| Validate item | mon_request_part status=2 |
| Approve item | mon_request_part status=3 then 4 |
| Rollback validation | mon_request_part status=1 |
| Rollback approval | mon_request_part status=2 or 1 |
| Delete item | mon_request_part soft-deleted |
| Monitoring barang_id | uses barang_id, not barangid |
| Monitoring poitem | correct po_item_id, not matched by barang_id |

## 8. MRO/Backlog Integration Tests

| Test | Expected |
|---|---|
| MRO creates PR | PR with mro_id, woid linked |
| MRO appends to draft | items added with mro_id |
| MRO appends to active (no validation) | items added |
| MRO appends to active (validated) | rejected |
| Backlog creates PR | PR with backlog_id |
| Delete PR from backlog | backlog status reverted |
| Validate changes barang_id | MRO item barang_id updated |

## 9. Export & Print Tests

| Test | Expected |
|---|---|
| Export all status | all PRs in filter |
| Export filtered | only matching filter |
| Export with permission | has price columns |
| Export without permission | no price columns |
| Export large (>10000) | background job or streaming |
| Print PDF | PDF generated, correct layout |
| Print without validate permission | no price columns in PDF |

## 10. Frontend E2E Tests (Playwright)

| Test | Flow |
|---|---|
| List page loads | navigate, verify table |
| Filter works | apply filter, verify rows |
| Create draft | fill form, save draft, verify redirect |
| Submit | fill form, submit, verify status active |
| Detail view | navigate, verify sections |
| Validate mode | toggle, fill, save, verify progress |
| Approve mode | toggle, select, preview PO, confirm |
| Rollback dialog | open, fill reason, confirm |
| Attachment upload | drag file, verify preview |
| Responsive mobile | resize, verify card layout |
| Permission error | user without read, verify message |
| Double submit prevention | click twice, verify one request |

## 11. Electron Tests

| Test | Expected |
|---|---|
| List loads in Electron | window, table rendered |
| Create form in Electron | form, file picker works |
| Print in Electron | PDF opens |
| Attachment download | file saves to disk |

## 12. Cron Tests

| Test | Expected |
|---|---|
| P2 > 3 days → P1 | priority upgraded |
| P3 > 6 days → P2 | priority upgraded, timer reset |
| Day 23 reminder | WA sent, flag set |
| Day 30 expiry | PR/items deactivated |
| Day 23 reminder retry | if send failed, retry next day |
| Concurrent cron + workflow | no conflict |
| Cron dry run | no mutation, report only |
| Cron disabled via flag | no execution |

## 13. Test Priority

| Priority | Category | Coverage Target |
|---|---|---|
| P0 | State machine, concurrency, idempotency, security | 100% |
| P0 | Financial calculation | 100% |
| P1 | CRUD, workflow, monitoring, MRO | 90% |
| P1 | Multi-business isolation | 100% |
| P2 | Export, print, UI E2E | 80% |
| P2 | Electron, cron | 70% |
| P3 | Notification, badge | 60% |