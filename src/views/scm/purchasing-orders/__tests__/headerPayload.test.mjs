import test from "node:test";
import assert from "node:assert/strict";
import {
  PURCHASE_ORDER_TOP_TYPES,
  normalizePaymentTerms,
  buildPurchaseOrderHeaderPayload,
} from "../headerPayload.js";

test("normalizePaymentTerms validates CASH correctly", () => {
  const result = normalizePaymentTerms({ top_type: "CASH" });
  assert.deepEqual(result, { top_type: "CASH", top_days: 0, dp_percent: 0 });
});

test("normalizePaymentTerms validates CREDIT correctly", () => {
  const result = normalizePaymentTerms({ top_type: "CREDIT", top_days: 30 });
  assert.deepEqual(result, { top_type: "CREDIT", top_days: 30, dp_percent: 0 });

  assert.throws(
    () => normalizePaymentTerms({ top_type: "CREDIT", top_days: 0 }),
    /Masa kredit/
  );
  assert.throws(
    () => normalizePaymentTerms({ top_type: "CREDIT", top_days: -5 }),
    /Masa kredit/
  );
});

test("normalizePaymentTerms validates INSTALLMENT correctly", () => {
  const result = normalizePaymentTerms({
    top_type: "INSTALLMENT",
    top_days: 14,
    dp_percent: 30,
  });
  assert.deepEqual(result, {
    top_type: "INSTALLMENT",
    top_days: 14,
    dp_percent: 30,
  });

  // Invalid dp_percent
  assert.throws(
    () =>
      normalizePaymentTerms({
        top_type: "INSTALLMENT",
        top_days: 14,
        dp_percent: 0,
      }),
    /Persentase uang muka/
  );
  assert.throws(
    () =>
      normalizePaymentTerms({
        top_type: "INSTALLMENT",
        top_days: 14,
        dp_percent: 100,
      }),
    /Persentase uang muka/
  );

  // Invalid top_days
  assert.throws(
    () =>
      normalizePaymentTerms({
        top_type: "INSTALLMENT",
        top_days: 0,
        dp_percent: 50,
      }),
    /Masa kredit pelunasan/
  );
});

test("buildPurchaseOrderHeaderPayload includes TOP fields in all mode", () => {
  const payload = buildPurchaseOrderHeaderPayload({
    initialMode: "all",
    narasi: "Catatan pengiriman",
    prioritas: "P2",
    top_type: "INSTALLMENT",
    top_days: 21,
    dp_percent: 25,
  });

  assert.equal(payload.narasi, "Catatan pengiriman");
  assert.equal(payload.prioritas, "P2");
  assert.equal(payload.top_type, "INSTALLMENT");
  assert.equal(payload.top_days, 21);
  assert.equal(payload.dp_percent, 25);
});

test("buildPurchaseOrderHeaderPayload works in top mode", () => {
  const payload = buildPurchaseOrderHeaderPayload({
    initialMode: "top",
    top_type: "CREDIT",
    top_days: 45,
  });

  assert.deepEqual(payload, {
    top_type: "CREDIT",
    top_days: 45,
    dp_percent: 0,
  });
});
