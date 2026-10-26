import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeMetode,
  getDefaultTopForMetode,
  groupApprovalItems,
} from "../approvalGrouping.js";

test("normalizeMetode handles various inputs", () => {
  assert.equal(normalizeMetode("tunai"), "tunai");
  assert.equal(normalizeMetode("TUNAI"), "tunai");
  assert.equal(normalizeMetode("  tunai  "), "tunai");
  assert.equal(normalizeMetode("kredit"), "kredit");
  assert.equal(normalizeMetode("KREDIT"), "kredit");
  assert.equal(normalizeMetode(""), "kredit");
  assert.equal(normalizeMetode(null), "kredit");
  assert.equal(normalizeMetode(undefined), "kredit");
  assert.equal(normalizeMetode("other"), "kredit");
});

test("getDefaultTopForMetode maps tunai to CASH (0 days) and kredit to CREDIT (30 days)", () => {
  const cashTop = getDefaultTopForMetode("tunai");
  assert.equal(cashTop.top_type, "CASH");
  assert.equal(cashTop.top_days, 0);

  const creditTop = getDefaultTopForMetode("kredit");
  assert.equal(creditTop.top_type, "CREDIT");
  assert.equal(creditTop.top_days, 30);
});

test("groupApprovalItems returns empty array for empty items", () => {
  assert.deepEqual(groupApprovalItems([]), []);
  assert.deepEqual(groupApprovalItems(null), []);
});

test("groupApprovalItems groups items with same vendor, same PPN, same metode into 1 PO", () => {
  const items = [
    {
      id: 1,
      pemasok_id: 10,
      pemasok: { id: 10, nama_pemasok: "PT Baja Makmur" },
      ppn: 11,
      metode: "kredit",
      qty_acc: 5,
      harga: 100000,
      subtotal: 500000,
    },
    {
      id: 2,
      pemasok_id: 10,
      pemasok: { id: 10, nama_pemasok: "PT Baja Makmur" },
      ppn: 11,
      metode: "kredit",
      qty_acc: 2,
      harga: 250000,
      subtotal: 500000,
    },
  ];

  const groups = groupApprovalItems(items);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].pemasok_name, "PT Baja Makmur");
  assert.equal(groups[0].ppn_rate, 11);
  assert.equal(groups[0].metode, "kredit");
  assert.equal(groups[0].default_top.top_type, "CREDIT");
  assert.equal(groups[0].items.length, 2);
  assert.equal(groups[0].subtotal, 1000000);
  assert.equal(groups[0].ppn_rp, 110000);
  assert.equal(groups[0].grandtotal, 1110000);
});

test("groupApprovalItems splits items by 3 dimensions: vendor, PPN, and metode", () => {
  const items = [
    // Vendor A, Non-PPN, Tunai
    {
      id: 1,
      pemasok_id: 1,
      pemasok: { nama_pemasok: "Vendor A" },
      ppn: 0,
      metode: "tunai",
      subtotal: 100000,
      qty_acc: 1,
    },
    // Vendor A, PPN 11%, Tunai
    {
      id: 2,
      pemasok_id: 1,
      pemasok: { nama_pemasok: "Vendor A" },
      ppn: 11,
      metode: "tunai",
      subtotal: 200000,
      qty_acc: 1,
    },
    // Vendor A, Non-PPN, Kredit
    {
      id: 3,
      pemasok_id: 1,
      pemasok: { nama_pemasok: "Vendor A" },
      ppn: 0,
      metode: "kredit",
      subtotal: 300000,
      qty_acc: 1,
    },
    // Vendor B, Non-PPN, Kredit
    {
      id: 4,
      pemasok_id: 2,
      pemasok: { nama_pemasok: "Vendor B" },
      ppn: 0,
      metode: "kredit",
      subtotal: 400000,
      qty_acc: 1,
    },
  ];

  const groups = groupApprovalItems(items);
  assert.equal(groups.length, 4, "Should create 4 distinct PO groups");

  // Verify group properties
  const g1 = groups.find((g) => g.pemasok_id === 1 && g.ppn_rate === 0 && g.metode === "tunai");
  assert.ok(g1, "Vendor A, Non-PPN, Tunai group exists");
  assert.equal(g1.default_top.top_type, "CASH");

  const g2 = groups.find((g) => g.pemasok_id === 1 && g.ppn_rate === 11 && g.metode === "tunai");
  assert.ok(g2, "Vendor A, PPN 11%, Tunai group exists");
  assert.equal(g2.default_top.top_type, "CASH");

  const g3 = groups.find((g) => g.pemasok_id === 1 && g.ppn_rate === 0 && g.metode === "kredit");
  assert.ok(g3, "Vendor A, Non-PPN, Kredit group exists");
  assert.equal(g3.default_top.top_type, "CREDIT");

  const g4 = groups.find((g) => g.pemasok_id === 2 && g.ppn_rate === 0 && g.metode === "kredit");
  assert.ok(g4, "Vendor B, Non-PPN, Kredit group exists");
  assert.equal(g4.default_top.top_type, "CREDIT");
});

test("groupApprovalItems respects metodeOverrides from approval modal", () => {
  const items = [
    {
      id: 101,
      pemasok_id: 5,
      pemasok: { nama_pemasok: "Supplier Multi" },
      ppn: 11,
      metode: "kredit", // originally kredit
      subtotal: 500000,
      qty_acc: 2,
    },
    {
      id: 102,
      pemasok_id: 5,
      pemasok: { nama_pemasok: "Supplier Multi" },
      ppn: 11,
      metode: "kredit",
      subtotal: 500000,
      qty_acc: 2,
    },
  ];

  // Override item 101 to tunai
  const overrides = { 101: "tunai" };
  const groups = groupApprovalItems(items, overrides);

  // Should now be split into 2 POs because item 101 is tunai and 102 is kredit
  assert.equal(groups.length, 2);

  const tunaiGroup = groups.find((g) => g.metode === "tunai");
  assert.ok(tunaiGroup);
  assert.equal(tunaiGroup.items.length, 1);
  assert.equal(tunaiGroup.items[0].id, 101);
  assert.equal(tunaiGroup.default_top.top_type, "CASH");

  const kreditGroup = groups.find((g) => g.metode === "kredit");
  assert.ok(kreditGroup);
  assert.equal(kreditGroup.items.length, 1);
  assert.equal(kreditGroup.items[0].id, 102);
  assert.equal(kreditGroup.default_top.top_type, "CREDIT");
});
