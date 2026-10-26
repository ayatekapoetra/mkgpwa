import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PURCHASE_ORDER_PRIORITIES,
  PURCHASE_ORDER_TOP_TYPES,
  PURCHASE_ORDER_METODE_OPTIONS,
  normalizePaymentTerms,
  buildPurchaseOrderHeaderPayload,
} from "../headerPayload.js";

test("PURCHASE_ORDER_METODE_OPTIONS contains tunai and kredit", () => {
  assert.equal(PURCHASE_ORDER_METODE_OPTIONS.length, 2);
  assert.equal(PURCHASE_ORDER_METODE_OPTIONS[0].value, "tunai");
  assert.equal(PURCHASE_ORDER_METODE_OPTIONS[1].value, "kredit");
});

test("normalizePaymentTerms validates CASH correctly and syncs metode to tunai", () => {
  const result = normalizePaymentTerms({ top_type: "CASH" });
  assert.deepEqual(result, { top_type: "CASH", top_days: 0, dp_percent: 0, metode: "tunai" });
});

test("normalizePaymentTerms validates CREDIT correctly and syncs metode to kredit by default", () => {
  const result = normalizePaymentTerms({ top_type: "CREDIT", top_days: 30 });
  assert.deepEqual(result, { top_type: "CREDIT", top_days: 30, dp_percent: 0, metode: "kredit" });

  assert.throws(
    () => normalizePaymentTerms({ top_type: "CREDIT", top_days: 0 }),
    /Masa kredit .* angka positif/
  );
  assert.throws(
    () => normalizePaymentTerms({ top_type: "CREDIT", top_days: -5 }),
    /Masa kredit .* angka positif/
  );
});

test("normalizePaymentTerms validates INSTALLMENT correctly and sets metode to kredit", () => {
  const result = normalizePaymentTerms({
    top_type: "INSTALLMENT",
    top_days: 14,
    dp_percent: 30,
  });
  assert.deepEqual(result, {
    top_type: "INSTALLMENT",
    top_days: 14,
    dp_percent: 30,
    metode: "kredit",
  });

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
  assert.throws(
    () =>
      normalizePaymentTerms({
        top_type: "INSTALLMENT",
        top_days: 0,
        dp_percent: 20,
      }),
    /Masa kredit pelunasan/
  );
});

test("buildPurchaseOrderHeaderPayload includes TOP and metode fields in all mode", () => {
  const payload = buildPurchaseOrderHeaderPayload({
    initialMode: "all",
    prioritas: "P1",
    narasi: "Catatan pengiriman",
    top_type: "CREDIT",
    top_days: 45,
    dp_percent: 0,
    metode: "kredit",
    modeRekening: "new",
    nmBank: "BCA",
    noRekening: "1234567890",
    an: "PT Vendor",
  });

  assert.deepEqual(payload, {
    narasi: "Catatan pengiriman",
    prioritas: "P1",
    top_type: "CREDIT",
    top_days: 45,
    dp_percent: 0,
    metode: "kredit",
    nm_bank: "BCA",
    no_rekening: "1234567890",
    an: "PT Vendor",
  });
});

test("buildPurchaseOrderHeaderPayload works in top mode with metode", () => {
  const payloadCash = buildPurchaseOrderHeaderPayload({
    initialMode: "top",
    top_type: "CASH",
  });
  assert.deepEqual(payloadCash, {
    top_type: "CASH",
    top_days: 0,
    dp_percent: 0,
    metode: "tunai",
  });

  const payloadCredit = buildPurchaseOrderHeaderPayload({
    initialMode: "top",
    top_type: "CREDIT",
    top_days: 30,
    metode: "kredit",
  });
  assert.deepEqual(payloadCredit, {
    top_type: "CREDIT",
    top_days: 30,
    dp_percent: 0,
    metode: "kredit",
  });
});
