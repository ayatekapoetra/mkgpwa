import test from "node:test";
import assert from "node:assert/strict";
import {
  filterEligibleApprovalItems,
  validateApprovalPayload,
  isApprovalConflict,
} from "../approvalValidation.js";

test("filterEligibleApprovalItems - filters inactive, unvalidated, and already approved items", () => {
  const items = [
    {
      id: 1,
      barang_id: 101,
      aktif: "Y",
      user_validated: "user1",
      date_validated: "2026-10-30",
      user_approved: null,
      date_approved: null,
      po_sts: "N",
      metode: "kredit",
    },
    {
      // Inactive item (AC-01)
      id: 2,
      barang_id: 102,
      aktif: "N",
      user_validated: "user1",
      date_validated: "2026-10-30",
      user_approved: null,
      date_approved: null,
      po_sts: "N",
      metode: "kredit",
    },
    {
      // Not validated item
      id: 3,
      barang_id: 103,
      aktif: "Y",
      user_validated: null,
      date_validated: null,
      user_approved: null,
      date_approved: null,
      po_sts: "N",
      metode: "kredit",
    },
    {
      // Already approved item
      id: 4,
      barang_id: 104,
      aktif: "Y",
      user_validated: "user1",
      date_validated: "2026-10-30",
      user_approved: "approver1",
      date_approved: "2026-10-30",
      po_sts: "N",
      metode: "tunai",
    },
    {
      // Already in PO item
      id: 5,
      barang_id: 105,
      aktif: "Y",
      user_validated: "user1",
      date_validated: "2026-10-30",
      user_approved: null,
      date_approved: null,
      po_sts: "Y",
      metode: "kredit",
    },
  ];

  const eligible = filterEligibleApprovalItems(items);
  assert.equal(eligible.length, 1);
  assert.equal(eligible[0].id, 1);
});

test("validateApprovalPayload - returns error for empty selection", () => {
  const result = validateApprovalPayload([], [{ id: 1, aktif: "Y", user_validated: "u1" }]);
  assert.equal(result.valid, false);
  assert.equal(result.payloadItems.length, 0);
  assert.match(result.errorReason, /Tidak ada item/);
});

test("validateApprovalPayload - valid selection constructs payload matching preview and overrides", () => {
  const currentItems = [
    {
      id: 10,
      barang_id: 101,
      aktif: "Y",
      user_validated: "u1",
      metode: "kredit",
    },
    {
      id: 20,
      barang_id: 102,
      aktif: "Y",
      user_validated: "u1",
      metode: "kredit",
    },
  ];

  const result = validateApprovalPayload([10, 20], currentItems, { 20: "tunai" });
  assert.equal(result.valid, true);
  assert.equal(result.invalidIds.length, 0);
  assert.deepEqual(result.payloadItems, [
    { id: 10, metode: "kredit" },
    { id: 20, metode: "tunai" },
  ]);
});

test("validateApprovalPayload - rejects stale selection if an item became inactive or was removed", () => {
  const currentItems = [
    {
      id: 10,
      barang_id: 101,
      aktif: "Y",
      user_validated: "u1",
    },
    {
      // Concurrently marked inactive (AC-01, AC-07)
      id: 20,
      barang_id: 102,
      aktif: "N",
      user_validated: "u1",
    },
  ];

  const result = validateApprovalPayload([10, 20], currentItems);
  assert.equal(result.valid, false);
  assert.deepEqual(result.invalidIds, [20]);
  assert.equal(result.payloadItems.length, 0);
  assert.match(result.errorReason, /tidak aktif atau statusnya telah berubah/);
});

test("validateApprovalPayload - rejects selection if an item was already approved concurrently", () => {
  const currentItems = [
    {
      id: 10,
      barang_id: 101,
      aktif: "Y",
      user_validated: "u1",
      user_approved: "other_mgr",
      date_approved: "2026-10-30",
    },
  ];

  const result = validateApprovalPayload([10], currentItems);
  assert.equal(result.valid, false);
  assert.deepEqual(result.invalidIds, [10]);
  assert.equal(result.payloadItems.length, 0);
});

test("isApprovalConflict - detects 409 status and known conflict codes", () => {
  assert.equal(isApprovalConflict({ status: 409 }), true);
  assert.equal(isApprovalConflict({ response: { status: 409 } }), true);
  assert.equal(isApprovalConflict({ code: "PR_ITEM_INACTIVE" }), true);
  assert.equal(isApprovalConflict({ code: "PR_BATCH_PARENT_CONFLICT" }), true);
  assert.equal(isApprovalConflict({ code: "PR_STATE_CONFLICT" }), true);
  assert.equal(isApprovalConflict({ code: "PR_ITEM_ALREADY_APPROVED" }), true);
  assert.equal(isApprovalConflict({ code: "CONFLICT" }), true);

  // Non-conflicts
  assert.equal(isApprovalConflict({ status: 403, code: "FORBIDDEN" }), false);
  assert.equal(isApprovalConflict({ status: 404, code: "NOT_FOUND" }), false);
  assert.equal(isApprovalConflict({ status: 500, code: "INTERNAL_ERROR" }), false);
  assert.equal(isApprovalConflict(null), false);
});
