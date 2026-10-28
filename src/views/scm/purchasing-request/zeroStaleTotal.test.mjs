import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateDocumentTotals, calculateItemStats } from "./utils.js";

for (const qty_acc of [0, "0"]) {
  for (const stored of [{}, { tot_harga: 0, ppn_rp: 0, subtotal: 0 }]) {
    test(`D01: accepted ${JSON.stringify(qty_acc)} does not fall back to requested quantity (${JSON.stringify(stored)})`, () => {
      const row = { total_ro: 555, items: [{ id: 1, aktif: "Y", qty_req: 5, qty_acc, harga: 100, ppn: 11, user_validated: 1, ...stored }] };
      const totals = calculateDocumentTotals({ row });
      assert.equal(totals.totalGross, 0);
      assert.equal(totals.totalPpn, 0);
      assert.equal(totals.itemsSubtotal, 0);
      assert.equal(totals.grandTotal, 0);
      assert.equal(calculateItemStats(row).grandTotal, 0);
      assert.equal(totals.hasValidatedPrice, true);
    });
  }
}
for (const quantities of [{ qty_acc: null, qty_req: 5 }, { qty_req: 5 }, { qty_acc: null, qty_req: null, qty: 5 }]) {
  test(`quantity absence retains fallback: ${JSON.stringify(quantities)}`, () => {
    const totals = calculateDocumentTotals({ items: [{ aktif: "Y", harga: 100, ppn: 11, ...quantities }] });
    assert.equal(totals.totalGross, 500);
    assert.equal(totals.totalPpn, 55);
    assert.equal(totals.grandTotal, 555);
  });
}
test("D01: live zero draft does not restore saved positive totals", () => {
  const totals = calculateDocumentTotals({ row: { total_ro: 555 }, items: [{ id: 1, aktif: "Y", qty_acc: 5, harga: 100, subtotal: 555 }], drafts: { 1: { qty_acc: 0, tot_harga: 0, ppn_rp: 0, subtotal: 0 } } });
  assert.equal(totals.totalGross, 0);
  assert.equal(totals.totalPpn, 0);
  assert.equal(totals.grandTotal, 0);
});
for (const items of [[], [{ aktif: "N", subtotal: 100 }]]) {
  test(`D02: available ${JSON.stringify(items)} overrides stale header`, () => {
    const row = { total_ro: 100, items };
    assert.equal(calculateDocumentTotals({ row }).grandTotal, 0);
    assert.equal(calculateItemStats(row).grandTotal, 0);
    assert.equal(calculateDocumentTotals({ row, items }).grandTotal, 0);
  });
}
test("D02: explicit empty items override old row items", () => {
  assert.equal(calculateDocumentTotals({ row: { total_ro: 100, items: [{ aktif: "Y", subtotal: 100 }] }, items: [] }).grandTotal, 0);
});
for (const items of [undefined, null]) {
  test(`unavailable items ${items} allow header fallback`, () => {
    const row = { total_ro: 100, items };
    assert.equal(calculateDocumentTotals({ row }).grandTotal, 100);
    assert.equal(calculateItemStats(row).grandTotal, 100);
  });
}
