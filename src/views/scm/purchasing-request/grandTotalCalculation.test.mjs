import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateDocumentTotals,
  calculateItemStats,
  calculateItemTotals,
  formatCurrency,
} from "./utils.js";

test("formatCurrency formats numeric values into Indonesian Rupiah string", () => {
  assert.equal(formatCurrency(0), "Rp 0");
  assert.equal(formatCurrency(150000), "Rp 150.000");
  assert.equal(formatCurrency(12500000), "Rp 12.500.000");
  assert.equal(formatCurrency("2500000"), "Rp 2.500.000");
  assert.equal(formatCurrency(null), "Rp 0");
  assert.equal(formatCurrency(undefined), "Rp 0");
});

test("calculateItemTotals computes gross, tax, and subtotal accurately", () => {
  const item = {
    qty_acc: 10,
    harga: 50000,
    currency: "IDR",
    potongan: 50000,
    ppn: 11,
  };
  const result = calculateItemTotals(item);
  assert.equal(result.tot_harga, 500000);
  assert.equal(result.ppn_rp, 49500);
  assert.equal(result.subtotal, 499500);
});

test("calculateDocumentTotals returns zeros and hasValidatedPrice false for empty or unvalidated PR", () => {
  const emptyResult = calculateDocumentTotals({ row: { items: [], total_ro: 0 } });
  assert.equal(emptyResult.itemCount, 0);
  assert.equal(emptyResult.totalGross, 0);
  assert.equal(emptyResult.totalDiscount, 0);
  assert.equal(emptyResult.totalPpn, 0);
  assert.equal(emptyResult.grandTotal, 0);
  assert.equal(emptyResult.hasValidatedPrice, false);

  const draftRow = {
    total_ro: 0,
    items: [
      { id: 1, aktif: "Y", qty: 5, harga: 0, subtotal: 0, user_validated: null },
      { id: 2, aktif: "Y", qty: 2, harga: 0, subtotal: 0, user_validated: null },
    ],
  };
  const draftResult = calculateDocumentTotals({ row: draftRow });
  assert.equal(draftResult.itemCount, 2);
  assert.equal(draftResult.totalGross, 0);
  assert.equal(draftResult.totalDiscount, 0);
  assert.equal(draftResult.totalPpn, 0);
  assert.equal(draftResult.grandTotal, 0);
  assert.equal(draftResult.hasValidatedPrice, false);
});

test("calculateDocumentTotals computes correct totals for validated PR items", () => {
  const row = {
    total_ro: 0,
    items: [
      {
        id: 1,
        aktif: "Y",
        qty_acc: 4,
        harga: 100000,
        currency: "IDR",
        potongan: 20000,
        ppn: 11,
        user_validated: 12,
        date_validated: "2026-03-01 10:00:00",
      },
      {
        id: 2,
        aktif: "Y",
        qty_acc: 2,
        harga: 500000,
        currency: "IDR",
        potongan: 0,
        ppn: 0,
        user_validated: 12,
        date_validated: "2026-03-01 10:00:00",
      },
    ],
  };

  const totals = calculateDocumentTotals({ row });
  assert.equal(totals.itemCount, 2);
  assert.equal(totals.totalGross, 1400000);
  assert.equal(totals.totalDiscount, 20000);
  assert.equal(totals.totalPpn, 41800);
  assert.equal(totals.grandTotal, 1421800);
  assert.equal(totals.hasValidatedPrice, true);
});

test("calculateDocumentTotals respects precomputed fields from backend", () => {
  const row = {
    total_ro: 1720500,
    items: [
      {
        id: 1,
        aktif: "Y",
        qty_acc: 3,
        harga: 500000,
        tot_harga: 1500000,
        potongan: 50000,
        ppn_rp: 159500,
        subtotal: 1609500,
        user_validated: 5,
      },
      {
        id: 2,
        aktif: "Y",
        qty_acc: 1,
        harga: 100000,
        tot_harga: 100000,
        potongan: 0,
        ppn_rp: 11000,
        subtotal: 111000,
        user_validated: 5,
      },
    ],
  };

  const totals = calculateDocumentTotals({ row });
  assert.equal(totals.itemCount, 2);
  assert.equal(totals.totalGross, 1600000);
  assert.equal(totals.totalDiscount, 50000);
  assert.equal(totals.totalPpn, 170500);
  assert.equal(totals.grandTotal, 1720500);
  assert.equal(totals.hasValidatedPrice, true);
});

test("AC-SCM-005-05: soft-deleted items (aktif: 'N') are completely excluded and do not double count", () => {
  const row = {
    total_ro: 0,
    items: [
      {
        id: 1,
        aktif: "Y",
        qty_acc: 2,
        harga: 200000,
        potongan: 0,
        ppn: 0,
        tot_harga: 400000,
        subtotal: 400000,
        user_validated: 1,
      },
      {
        id: 2,
        aktif: "N",
        qty_acc: 5,
        harga: 1000000,
        potongan: 0,
        ppn: 0,
        tot_harga: 5000000,
        subtotal: 5000000,
        user_validated: 1,
      },
    ],
  };

  const totals = calculateDocumentTotals({ row });
  assert.equal(totals.itemCount, 1);
  assert.equal(totals.totalGross, 400000);
  assert.equal(totals.totalDiscount, 0);
  assert.equal(totals.totalPpn, 0);
  assert.equal(totals.grandTotal, 400000);
  assert.equal(totals.hasValidatedPrice, true);
});

test("calculateDocumentTotals applies live draft overrides when editing in validate mode", () => {
  const items = [
    {
      id: 101,
      aktif: "Y",
      qty_acc: 2,
      harga: 100000,
      potongan: 0,
      ppn: 0,
      subtotal: 200000,
    },
  ];

  const drafts = {
    101: {
      id: 101,
      aktif: "Y",
      qty_acc: 2,
      harga: 300000,
      tot_harga: 600000,
      potongan: 50000,
      ppn: 11,
      ppn_rp: 60500,
      subtotal: 610500,
    },
  };

  const totals = calculateDocumentTotals({ items, drafts });
  assert.equal(totals.itemCount, 1);
  assert.equal(totals.totalGross, 600000);
  assert.equal(totals.totalDiscount, 50000);
  assert.equal(totals.totalPpn, 60500);
  assert.equal(totals.grandTotal, 610500);
});

test("calculateDocumentTotals supports USD currency with kurs conversion", () => {
  const items = [
    {
      id: 201,
      aktif: "Y",
      qty_acc: 2,
      harga: 100,
      currency: "USD",
      kurs: 16000,
      potongan: 0,
      ppn: 0,
      user_validated: 1,
    },
  ];

  const totals = calculateDocumentTotals({ items });
  assert.equal(totals.totalGross, 3200000);
  assert.equal(totals.grandTotal, 3200000);
});

test("calculateItemStats computes row statistics for list view", () => {
  // Case A: Draft PR with no prices
  const draftRow = {
    id: 10,
    total_ro: 0,
    items: [
      { id: 1, aktif: "Y", qty: 3, harga: 0, subtotal: 0, user_validated: null },
      { id: 2, aktif: "N", qty: 1, harga: 0, subtotal: 0, user_validated: null },
    ],
  };
  const draftStats = calculateItemStats(draftRow);
  assert.equal(draftStats.total, 1); // 1 active item
  assert.equal(draftStats.validated, 0);
  assert.equal(draftStats.approved, 0);
  assert.equal(draftStats.grandTotal, 0);
  assert.equal(draftStats.hasValidatedPrice, false);

  // Case B: Validated PR with items and discounts
  const validatedRow = {
    id: 20,
    total_ro: 0, // Fallback calculation test
    items: [
      {
        id: 1,
        aktif: "Y",
        qty_acc: 2,
        harga: 500000,
        tot_harga: 1000000,
        potongan: 100000,
        ppn_rp: 99000,
        subtotal: 999000,
        user_validated: 1,
      },
      {
        id: 2,
        aktif: "N", // Soft-deleted item must not count!
        qty_acc: 10,
        harga: 1000000,
        tot_harga: 10000000,
        subtotal: 10000000,
        user_validated: 1,
      },
    ],
  };
  const valStats = calculateItemStats(validatedRow);
  assert.equal(valStats.total, 1);
  assert.equal(valStats.validated, 1);
  assert.equal(valStats.totalDiscount, 100000);
  assert.equal(valStats.totalPpn, 99000);
  assert.equal(valStats.grandTotal, 999000);
  assert.equal(valStats.hasValidatedPrice, true);
});
