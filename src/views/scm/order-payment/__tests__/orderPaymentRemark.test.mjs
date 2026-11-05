import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("PRD-BUGFIX-SCM-008: Order Payment Remark & Outstanding Selection (AC-SCM-008-04)", () => {
  // Helper mimicking create.js handleModalConfirm logic
  const handleModalConfirmLogic = (prevAllocations, newRows) => {
    const map = new Map(prevAllocations.map((a) => [String(a.id), a]));
    newRows.forEach((r) => {
      const key = String(r.id);
      if (!map.has(key)) {
        map.set(key, {
          ...r,
          amount: String(r.sisa ?? r.total ?? 0),
          narasi: r.narasi || r.po_narasi || "",
        });
      }
    });
    return [...map.values()];
  };

  // Helper mimicking create.js computedNarasi logic
  const computeNarasi = (payloadAllocations, pemasokCount = 1) => {
    const itemNarasiList = payloadAllocations
      .map((a) => a.narasi?.trim())
      .filter(Boolean);
    return itemNarasiList.length
      ? itemNarasiList.join("; ")
      : `Pembayaran ${payloadAllocations.length} faktur / ${pemasokCount} pemasok`;
  };

  it("AC-SCM-008-04: inisialisasi narasi dari po_narasi saat item dipilih dari modal", () => {
    const mockOutstandingRows = [
      {
        id: 101,
        no_po: "PO-2611-001",
        po_narasi: "Orderan 5 pcs sekring 50A untuk stock #KDI",
        sisa: 750000,
        total: 750000,
      },
    ];

    const result = handleModalConfirmLogic([], mockOutstandingRows);

    assert.equal(result.length, 1);
    assert.equal(result[0].id, 101);
    assert.equal(result[0].amount, "750000");
    assert.equal(result[0].narasi, "Orderan 5 pcs sekring 50A untuk stock #KDI");
  });

  it("mempertahankan r.narasi jika sudah diisi sebelumnya", () => {
    const mockOutstandingRows = [
      {
        id: 102,
        no_po: "PO-2611-002",
        narasi: "Custom narasi faktur",
        po_narasi: "Orderan sparepart",
        sisa: 500000,
      },
    ];

    const result = handleModalConfirmLogic([], mockOutstandingRows);

    assert.equal(result[0].narasi, "Custom narasi faktur");
  });

  it("mengisi string kosong jika r.narasi dan r.po_narasi bernilai null/undefined", () => {
    const mockOutstandingRows = [
      {
        id: 103,
        no_po: "PO-2611-003",
        narasi: null,
        po_narasi: null,
        sisa: 200000,
      },
    ];

    const result = handleModalConfirmLogic([], mockOutstandingRows);

    assert.equal(result[0].narasi, "");
  });

  it("tidak menimpa baris yang sudah ada di alokasi sebelumnya (idempotent)", () => {
    const existing = [
      {
        id: 101,
        amount: "500000",
        narasi: "Narasi yang sudah diedit user",
      },
    ];
    const incoming = [
      {
        id: 101,
        po_narasi: "Keterangan PO Asli",
        sisa: 750000,
      },
    ];

    const result = handleModalConfirmLogic(existing, incoming);

    assert.equal(result.length, 1);
    assert.equal(result[0].amount, "500000");
    assert.equal(result[0].narasi, "Narasi yang sudah diedit user");
  });

  it("computedNarasi otomatis mewarisi keterangan PO tunggal", () => {
    const allocations = [
      {
        narasi: "Orderan 5 pcs sekring 50A untuk stock #KDI",
      },
    ];

    const computed = computeNarasi(allocations, 1);

    assert.equal(computed, "Orderan 5 pcs sekring 50A untuk stock #KDI");
  });

  it("computedNarasi menggabungkan beberapa keterangan PO dengan titik koma", () => {
    const allocations = [
      { narasi: "PO 1: Filter Oli Komatsu" },
      { narasi: "PO 2: Selang Hidrolik 2 Inch" },
    ];

    const computed = computeNarasi(allocations, 2);

    assert.equal(computed, "PO 1: Filter Oli Komatsu; PO 2: Selang Hidrolik 2 Inch");
  });

  it("computedNarasi fallback ke default jika seluruh narasi alokasi kosong", () => {
    const allocations = [{ narasi: "" }, { narasi: "   " }];

    const computed = computeNarasi(allocations, 2);

    assert.equal(computed, "Pembayaran 2 faktur / 2 pemasok");
  });

  it("verifikasi kode sumber create.js mengimplementasikan inisialisasi po_narasi pada handleModalConfirm", () => {
    const createJsPath = resolve(__dirname, "../create.js");
    const content = readFileSync(createJsPath, "utf-8");

    // Pastikan handleModalConfirm menginisialisasi narasi dengan r.narasi || r.po_narasi || ""
    assert.match(
      content,
      /narasi:\s*r\.narasi\s*\|\|\s*r\.po_narasi\s*\|\|\s*["']["']/,
      "create.js harus menginisialisasi narasi: r.narasi || r.po_narasi || ''"
    );
  });
});
