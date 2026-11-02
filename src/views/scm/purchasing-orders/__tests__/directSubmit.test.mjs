import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DIRECT_SUBMIT_ALLOWED_STATUSES,
  canDirectSubmitVerification,
  canShowLegacyVerifyAction,
  groupItemsByMetode,
  describePaymentPlan,
  buildDirectSubmitSummary,
} from "../directSubmit.js";

// ---------------------------------------------------------------------------
// Q-06 B: allowed statuses for the direct action
// ---------------------------------------------------------------------------
test("DIRECT_SUBMIT_ALLOWED_STATUSES contains open and verify (Q-06 B)", () => {
  assert.deepEqual(DIRECT_SUBMIT_ALLOWED_STATUSES, ["open", "verify"]);
});

// ---------------------------------------------------------------------------
// Q-03 B: permission gate = update/insert + validate, per status
// ---------------------------------------------------------------------------
test("canDirectSubmitVerification requires update/insert AND validate (Q-03 B)", () => {
  // allowed: update + validate, open
  assert.equal(
    canDirectSubmitVerification({ status: "open", canUpdate: true, canValidate: true }),
    true,
  );
  // insert + validate also allowed (Q-03 B says update/insert)
  assert.equal(
    canDirectSubmitVerification({ status: "open", canInsert: true, canValidate: true }),
    true,
  );
  // missing validate -> hidden
  assert.equal(
    canDirectSubmitVerification({ status: "open", canUpdate: true, canValidate: false }),
    false,
  );
  // missing update/insert -> hidden
  assert.equal(
    canDirectSubmitVerification({ status: "open", canUpdate: false, canInsert: false, canValidate: true }),
    false,
  );
});

test("canDirectSubmitVerification accepts legacy verify but no other status (Q-05/Q-06)", () => {
  assert.equal(
    canDirectSubmitVerification({ status: "verify", canUpdate: true, canValidate: true }),
    true,
  );
  assert.equal(
    canDirectSubmitVerification({ status: "VERIFY", canUpdate: true, canValidate: true }),
    true,
  );
  assert.equal(
    canDirectSubmitVerification({ status: "close", canUpdate: true, canValidate: true }),
    false,
  );
  assert.equal(
    canDirectSubmitVerification({ status: "accept", canUpdate: true, canValidate: true }),
    false,
  );
  assert.equal(
    canDirectSubmitVerification({ status: "reject", canUpdate: true, canValidate: true }),
    false,
  );
});

// ---------------------------------------------------------------------------
// Q-06 B / Scope 3: legacy verify action button gating
// ---------------------------------------------------------------------------
test("canShowLegacyVerifyAction hides legacy verify button for open documents (Scope 3 / AC-23)", () => {
  assert.equal(
    canShowLegacyVerifyAction({ status: "open", canVerify: true }),
    false,
  );
});

test("canShowLegacyVerifyAction shows legacy verify button only for verify documents with permission (Q-06 B)", () => {
  assert.equal(
    canShowLegacyVerifyAction({ status: "verify", canVerify: true }),
    true,
  );
  assert.equal(
    canShowLegacyVerifyAction({ status: "VERIFY", canVerify: true }),
    true,
  );
  assert.equal(
    canShowLegacyVerifyAction({ status: "verify", canVerify: false }),
    false,
  );
  assert.equal(
    canShowLegacyVerifyAction({ status: "close", canVerify: true }),
    false,
  );
  assert.equal(
    canShowLegacyVerifyAction({ status: "accept", canVerify: true }),
    false,
  );
});

// ---------------------------------------------------------------------------
// grouping mirrors backend per-metode grouping
// ---------------------------------------------------------------------------
test("groupItemsByMetode skips inactive items and groups by metode", () => {
  const items = [
    { id: 1, metode: "tunai", qty: 2, harga: 1000, aktif: "Y" },
    { id: 2, metode: "tunai", qty: 1, harga: 500, aktif: "N" }, // inactive -> skipped
    { id: 3, metode: "kredit", qty: 1, harga: 2000, ppn: 10 },
    { id: 4, metode: "", qty: 1, harga: 100 }, // no metode -> own group ""
  ];

  const groups = groupItemsByMetode(items);
  const tunai = groups.find((g) => g.metode === "tunai");
  const kredit = groups.find((g) => g.metode === "kredit");
  const empty = groups.find((g) => g.metode === "");

  assert.equal(tunai.item_count, 1);
  assert.equal(tunai.grand_total, 2000);
  assert.equal(kredit.item_count, 1);
  assert.equal(kredit.grand_total, 2200); // 2000 + 10% PPN
  assert.equal(empty.item_count, 1);
});

// ---------------------------------------------------------------------------
// payment plan description (tunai / kredit termin / installment)
// ---------------------------------------------------------------------------
test("describePaymentPlan describes tunai, kredit and installment plans", () => {
  assert.match(
    describePaymentPlan("tunai"),
    /tunai/i,
  );
  assert.match(
    describePaymentPlan("kredit", { top_type: "CREDIT", top_days: 30 }),
    /30 hari/,
  );
  assert.match(
    describePaymentPlan("kredit", { top_type: "INSTALLMENT", top_days: 90, dp_percent: 30 }),
    /DP 30%/,
  );
  assert.equal(
    describePaymentPlan(""),
    "Rencana pembayaran sesuai metode item",
  );
});

// ---------------------------------------------------------------------------
// Q-04 A: confirmation summary payload
// ---------------------------------------------------------------------------
test("buildDirectSubmitSummary aggregates documents and totals for dialog", () => {
  const summary = buildDirectSubmitSummary({
    row: { top_type: "CREDIT", top_days: 30, dp_percent: 0 },
    items: [
      { id: 1, metode: "tunai", qty: 1, harga: 10000 },
      { id: 2, metode: "kredit", qty: 1, harga: 5000, ppn: 11 },
    ],
  });

  assert.equal(summary.itemCount, 2);
  assert.equal(summary.grandTotal, 10000 + 5000 * 1.11);
  assert.equal(summary.topType, "CREDIT");
  assert.equal(summary.topDays, 30);

  const tunai = summary.groups.find((g) => g.metode === "tunai");
  assert.ok(tunai.documents.some((d) => /Faktur beli/.test(d)));
  assert.ok(tunai.documents.some((d) => /tunai/i.test(d)));

  const kredit = summary.groups.find((g) => g.metode === "kredit");
  assert.ok(kredit.documents.some((d) => /30 hari/.test(d)));
});

test("buildDirectSubmitSummary is empty-safe for no items", () => {
  const summary = buildDirectSubmitSummary({ row: {}, items: [] });
  assert.equal(summary.groups.length, 0);
  assert.equal(summary.grandTotal, 0);
  assert.equal(summary.itemCount, 0);
});