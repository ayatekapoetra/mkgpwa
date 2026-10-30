import test from "node:test";
import assert from "node:assert/strict";
import {
  canShowVoidButton,
  canShowReviseButton,
  formatGoodsIssueActionError,
} from "../goodsIssueGuard.js";

test("canShowVoidButton - requires can_void permission and valid status", () => {
  assert.equal(
    canShowVoidButton({ header: { status: "DRAFT" }, permissions: { can_void: true } }),
    true,
  );
  assert.equal(
    canShowVoidButton({ header: { status: "POSTED" }, permissions: { can_void: true } }),
    true,
  );
  assert.equal(
    canShowVoidButton({ header: { status: "VOIDED" }, permissions: { can_void: true } }),
    false,
  );
  assert.equal(
    canShowVoidButton({ header: { status: "POSTED" }, permissions: { can_void: false } }),
    false,
  );
  assert.equal(
    canShowVoidButton({ header: { status: "POSTED" }, permissions: {} }),
    false,
  );
});

test("canShowReviseButton - AC-06: MUST NOT show revise if void is not permitted", () => {
  // can_revise is true but can_void is false -> MUST be false!
  assert.equal(
    canShowReviseButton({
      header: { status: "POSTED" },
      permissions: { can_revise: true, can_void: false },
    }),
    false,
  );

  // Both true and status is POSTED -> true
  assert.equal(
    canShowReviseButton({
      header: { status: "POSTED" },
      permissions: { can_revise: true, can_void: true },
    }),
    true,
  );

  // DRAFT status -> false (revise is only for posted documents)
  assert.equal(
    canShowReviseButton({
      header: { status: "DRAFT" },
      permissions: { can_revise: true, can_void: true },
    }),
    false,
  );

  // Header explicitly disallows void -> false
  assert.equal(
    canShowReviseButton({
      header: { status: "POSTED", can_void: false },
      permissions: { can_revise: true, can_void: true },
    }),
    false,
  );

  // Work order closed -> false
  assert.equal(
    canShowReviseButton({
      header: { status: "POSTED", wo_status: "CLOSED" },
      permissions: { can_revise: true, can_void: true },
    }),
    false,
  );
  assert.equal(
    canShowReviseButton({
      header: { status: "POSTED", is_wo_closed: true },
      permissions: { can_revise: true, can_void: true },
    }),
    false,
  );
});

test("formatGoodsIssueActionError - formats 409 conflict and 422 WO_CLOSED properly", () => {
  const conflictErr = {
    status: 409,
    data: {
      code: "GI_DEPENDENCY_CONFLICT",
      message: "Terdapat pergerakan stok lanjutan",
    },
  };
  const conflictResult = formatGoodsIssueActionError(conflictErr);
  assert.equal(conflictResult.title, "Konflik Dependensi (409)");
  assert.equal(conflictResult.isConflict, true);
  assert.equal(conflictResult.message, "Terdapat pergerakan stok lanjutan");

  const woClosedErr = {
    response: {
      status: 422,
      data: {
        code: "WO_CLOSED",
        message: "Work order telah ditutup",
      },
    },
  };
  const woResult = formatGoodsIssueActionError(woClosedErr);
  assert.equal(woResult.title, "Work Order Ditutup (422)");
  assert.equal(woResult.isConflict, true);
});
