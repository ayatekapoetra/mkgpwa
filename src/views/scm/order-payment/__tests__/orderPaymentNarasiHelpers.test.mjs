import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  normalizeNarasi,
  buildAllocationNarasi,
  joinHeaderNarasi,
  mergeAllocationsFromModal,
} from "../orderPaymentNarasiHelpers.js";

describe("orderPaymentNarasiHelpers test suite", () => {
  describe("normalizeNarasi & AC-03 (no null/undefined literals)", () => {
    it("returns empty string for null and undefined", () => {
      assert.equal(normalizeNarasi(null), "");
      assert.equal(normalizeNarasi(undefined), "");
    });

    it("returns empty string for literal 'null' and 'undefined'", () => {
      assert.equal(normalizeNarasi("null"), "");
      assert.equal(normalizeNarasi("undefined"), "");
      assert.equal(normalizeNarasi("  null  "), "");
      assert.equal(normalizeNarasi("  undefined  "), "");
    });

    it("trims whitespace correctly", () => {
      assert.equal(normalizeNarasi("  Pengadaan Semen  "), "Pengadaan Semen");
    });
  });

  describe("buildAllocationNarasi (AC-01 & AC-03)", () => {
    it("prefills from po_narasi when existingNarasi is empty", () => {
      const narasi = buildAllocationNarasi("", "Pembelian Besi Beton");
      assert.equal(narasi, "Pembelian Besi Beton");
    });

    it("trims po_narasi when prefilling", () => {
      const narasi = buildAllocationNarasi(undefined, "   Pembelian Pasir   ");
      assert.equal(narasi, "Pembelian Pasir");
    });

    it("preserves manual edit when existingNarasi is already present", () => {
      const narasi = buildAllocationNarasi("Sudah diedit manual", "Pembelian Besi Beton");
      assert.equal(narasi, "Sudah diedit manual");
    });

    it("returns empty string if neither existingNarasi nor po_narasi is present", () => {
      assert.equal(buildAllocationNarasi(null, null), "");
      assert.equal(buildAllocationNarasi("", undefined), "");
      assert.equal(buildAllocationNarasi("   ", ""), "");
    });

    it("handles null/undefined po_narasi without producing 'null' string", () => {
      assert.equal(buildAllocationNarasi("", "null"), "");
      assert.equal(buildAllocationNarasi("", null), "");
      assert.equal(buildAllocationNarasi("", undefined), "");
    });
  });

  describe("joinHeaderNarasi (AC-02)", () => {
    it("returns fallback when items list is empty or invalid", () => {
      assert.equal(joinHeaderNarasi([], "Fallback narasi"), "Fallback narasi");
      assert.equal(joinHeaderNarasi(null, "Fallback narasi"), "Fallback narasi");
    });

    it("returns fallback when all item narasi are empty", () => {
      const items = [{ narasi: "" }, { narasi: "   " }, { narasi: null }];
      assert.equal(joinHeaderNarasi(items, "Fallback narasi"), "Fallback narasi");
    });

    it("joins non-empty narasi with '; ' in stable order", () => {
      const items = [
        { narasi: "Pembelian Semen Tonasa" },
        { narasi: "Pengadaan Cat Tembok" },
      ];
      assert.equal(
        joinHeaderNarasi(items, "Fallback"),
        "Pembelian Semen Tonasa; Pengadaan Cat Tembok",
      );
    });

    it("deduplicates identical narasi while preserving first appearance order", () => {
      const items = [
        { narasi: "Besi Beton 10mm" },
        { narasi: "Semen Portland" },
        { narasi: "Besi Beton 10mm" },
        { narasi: "Batu Bata" },
        { narasi: "Semen Portland" },
      ];
      assert.equal(
        joinHeaderNarasi(items, "Fallback"),
        "Besi Beton 10mm; Semen Portland; Batu Bata",
      );
    });

    it("skips blank/null/undefined items during join", () => {
      const items = [
        { narasi: "Kayu Balok" },
        { narasi: "" },
        { narasi: null },
        { narasi: "Paku Seng" },
      ];
      assert.equal(joinHeaderNarasi(items, "Fallback"), "Kayu Balok; Paku Seng");
    });
  });

  describe("mergeAllocationsFromModal (AC-01, AC-03, AC-04)", () => {
    it("prefills narasi from row.po_narasi for new rows", () => {
      const prev = [];
      const selected = [
        { id: 101, sisa: 500000, po_narasi: "PO Semen Holcim" },
        { id: 102, sisa: 300000, po_narasi: "PO Besi Wiremesh" },
      ];
      const merged = mergeAllocationsFromModal(prev, selected);

      assert.equal(merged.length, 2);
      assert.equal(merged[0].id, 101);
      assert.equal(merged[0].amount, "500000");
      assert.equal(merged[0].narasi, "PO Semen Holcim");
      assert.equal(merged[1].id, 102);
      assert.equal(merged[1].narasi, "PO Besi Wiremesh");
    });

    it("does not overwrite manual edits on already added rows", () => {
      const prev = [
        { id: 101, amount: "400000", narasi: "Edit Manual Pembayaran Sebagian", po_narasi: "PO Lama" },
      ];
      const selected = [
        { id: 101, sisa: 500000, po_narasi: "PO Lama Diubah" },
        { id: 103, sisa: 250000, po_narasi: "PO Cat Primer" },
      ];
      const merged = mergeAllocationsFromModal(prev, selected);

      assert.equal(merged.length, 2);
      assert.equal(merged[0].id, 101);
      assert.equal(merged[0].amount, "400000");
      assert.equal(merged[0].narasi, "Edit Manual Pembayaran Sebagian"); // Preserved!
      assert.equal(merged[1].id, 103);
      assert.equal(merged[1].narasi, "PO Cat Primer");
    });

    it("sets empty string narasi when po_narasi is missing or null", () => {
      const prev = [];
      const selected = [
        { id: 201, sisa: 100000, po_narasi: null },
        { id: 202, sisa: 200000 },
      ];
      const merged = mergeAllocationsFromModal(prev, selected);

      assert.equal(merged[0].narasi, "");
      assert.equal(merged[1].narasi, "");
    });
  });
});
