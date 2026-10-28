import { test } from "node:test";
import assert from "node:assert/strict";
import { hasPrBecomePo, isPrDeletable } from "../deletePrHelper.js";

test("hasPrBecomePo returns false for null/undefined/non-object", () => {
  assert.equal(hasPrBecomePo(null), false);
  assert.equal(hasPrBecomePo(undefined), false);
  assert.equal(hasPrBecomePo(""), false);
  assert.equal(hasPrBecomePo(123), false);
});

test("hasPrBecomePo detects document status indicating PO or completed workflow", () => {
  assert.equal(hasPrBecomePo({ status: "draft" }), false);
  assert.equal(hasPrBecomePo({ status: "active" }), false);
  assert.equal(hasPrBecomePo({ status: "approved" }), true);
  assert.equal(hasPrBecomePo({ status: "finish" }), true);
  assert.equal(hasPrBecomePo({ status: "done" }), true);
  assert.equal(hasPrBecomePo({ status: "po" }), true);
  assert.equal(hasPrBecomePo({ status: "APPROVED" }), true);
  assert.equal(hasPrBecomePo({ status: "FINISH" }), true);
});

test("hasPrBecomePo detects row-level PO markers", () => {
  assert.equal(hasPrBecomePo({ status: "draft", po_sts: "Y" }), true);
  assert.equal(hasPrBecomePo({ status: "active", is_po: true }), true);
  assert.equal(hasPrBecomePo({ status: "draft", po_id: 101 }), true);
  assert.equal(hasPrBecomePo({ status: "draft", no_po: "PO-2026-001" }), true);
  assert.equal(hasPrBecomePo({ status: "draft", po_sts: "N" }), false);
});

test("hasPrBecomePo detects item-level PO markers", () => {
  assert.equal(
    hasPrBecomePo({
      status: "draft",
      items: [
        { id: 1, po_sts: "N" },
        { id: 2, po_sts: "Y" },
      ],
    }),
    true,
  );

  assert.equal(
    hasPrBecomePo({
      status: "active",
      items: [{ id: 1, po_id: 42 }],
    }),
    true,
  );

  assert.equal(
    hasPrBecomePo({
      status: "draft",
      items: [{ id: 1, no_po: "PO-001" }],
    }),
    true,
  );

  assert.equal(
    hasPrBecomePo({
      status: "draft",
      items: [
        { id: 1, po_sts: "N" },
        { id: 2, po_sts: null },
      ],
    }),
    false,
  );
});

test("isPrDeletable requires valid row and valid status (draft or active)", () => {
  const perm = { can_delete: true };

  assert.equal(isPrDeletable(null, perm), false);
  assert.equal(isPrDeletable(undefined, perm), false);
  assert.equal(isPrDeletable({}, perm), false);

  assert.equal(isPrDeletable({ status: "draft" }, perm), true);
  assert.equal(isPrDeletable({ status: "active" }, perm), true);
  assert.equal(isPrDeletable({ status: "DRAFT" }, perm), true);
  assert.equal(isPrDeletable({ status: "  active  " }, perm), true);

  assert.equal(isPrDeletable({ status: "approved" }, perm), false);
  assert.equal(isPrDeletable({ status: "finish" }, perm), false);
  assert.equal(isPrDeletable({ status: "rejected" }, perm), false);
  assert.equal(isPrDeletable({ status: "closed" }, perm), false);
});

test("isPrDeletable respects RBAC permissions", () => {
  const draftRow = { status: "draft" };

  // Explicit can_delete: false
  assert.equal(isPrDeletable(draftRow, { can_delete: false }), false);

  // can_remove fallback
  assert.equal(isPrDeletable(draftRow, { can_remove: true }), true);
  assert.equal(isPrDeletable(draftRow, { can_remove: false }), false);

  // Explicit can_delete: true
  assert.equal(isPrDeletable(draftRow, { can_delete: true }), true);

  // Fallback to row.can_delete if permissions object not passed
  assert.equal(isPrDeletable({ status: "draft", can_delete: true }), true);
  assert.equal(isPrDeletable({ status: "draft", can_delete: false }), false);
});

test("isPrDeletable hides delete button when PR already converted to PO", () => {
  const perm = { can_delete: true };

  // Row marked with PO
  assert.equal(
    isPrDeletable({ status: "draft", po_sts: "Y" }, perm),
    false,
  );

  // Row has item converted to PO
  assert.equal(
    isPrDeletable(
      {
        status: "active",
        items: [
          { id: 1, po_sts: "N" },
          { id: 2, po_sts: "Y" },
        ],
      },
      perm,
    ),
    false,
  );

  // Normal draft with no PO items
  assert.equal(
    isPrDeletable(
      {
        status: "draft",
        items: [{ id: 1, po_sts: "N" }],
      },
      perm,
    ),
    true,
  );
});
