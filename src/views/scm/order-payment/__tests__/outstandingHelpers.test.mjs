import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  formatDate,
  getDueDateMeta,
  getDeliveryMeta,
  getTerminLabel,
  isRowPayable,
  getUnpayableReason,
} from "../outstandingHelpers.js";

describe("outstandingHelpers test suite", () => {
  const refDate = new Date("2026-10-26T10:00:00Z");

  describe("formatDate", () => {
    it("handles null / undefined / empty string", () => {
      assert.equal(formatDate(null), "—");
      assert.equal(formatDate(""), "—");
      assert.equal(formatDate(undefined), "—");
    });

    it("formats ISO date string to DD-MM-YYYY", () => {
      assert.equal(formatDate("2026-10-26T00:00:00.000Z"), "26-10-2026");
      assert.equal(formatDate("2026-11-05"), "05-11-2026");
    });
  });

  describe("getDueDateMeta", () => {
    it("returns status none when no due date is present", () => {
      const meta = getDueDateMeta({});
      assert.equal(meta.status, "none");
      assert.equal(meta.color, "default");
      assert.equal(meta.dateFormatted, "—");
    });

    it("identifies overdue item via aging_days", () => {
      const row = {
        due_date: "2026-10-20",
        aging_days: 6,
      };
      const meta = getDueDateMeta(row, refDate);
      assert.equal(meta.status, "overdue");
      assert.equal(meta.color, "error");
      assert.match(meta.label, /Lewat 6 hari/);
    });

    it("identifies overdue item via past due date", () => {
      const row = {
        due_date: "2026-10-24",
      };
      const meta = getDueDateMeta(row, refDate);
      assert.equal(meta.status, "overdue");
      assert.equal(meta.color, "error");
      assert.match(meta.label, /Lewat 2 hari/);
    });

    it("identifies due today", () => {
      const row = {
        due_date: "2026-10-26",
      };
      const meta = getDueDateMeta(row, refDate);
      assert.equal(meta.status, "due_soon");
      assert.equal(meta.color, "warning");
      assert.equal(meta.label, "Jatuh tempo hari ini");
    });

    it("identifies due soon (<= 3 days)", () => {
      const row = {
        next_due_date: "2026-10-28",
      };
      const meta = getDueDateMeta(row, refDate);
      assert.equal(meta.status, "due_soon");
      assert.equal(meta.color, "warning");
      assert.equal(meta.label, "2 hari lagi");
    });

    it("identifies safe due date (> 3 days)", () => {
      const row = {
        next_due_date: "2026-11-10",
      };
      const meta = getDueDateMeta(row, refDate);
      assert.equal(meta.status, "safe");
      assert.equal(meta.color, "success");
      assert.match(meta.label, /Aman/);
    });
  });

  describe("getDeliveryMeta", () => {
    it("identifies pending goods delivery", () => {
      const row = {
        goods_received_at: null,
        status_pengiriman: "PENDING",
      };
      const meta = getDeliveryMeta(row);
      assert.equal(meta.isReceived, false);
      assert.equal(meta.label, "Menunggu Barang (GRN)");
      assert.equal(meta.color, "default");
    });

    it("identifies received goods", () => {
      const row = {
        goods_received_at: "2026-10-25T08:00:00Z",
        status_pengiriman: "RECEIVED",
      };
      const meta = getDeliveryMeta(row);
      assert.equal(meta.isReceived, true);
      assert.equal(meta.label, "Barang Diterima");
      assert.equal(meta.color, "success");
      assert.equal(meta.receivedAt, "25-10-2026");
    });
  });

  describe("getTerminLabel", () => {
    it("formats DP installment", () => {
      const row = {
        termin_no: 1,
        top_type: "INSTALLMENT",
      };
      assert.equal(getTerminLabel(row), "Termin 1 (DP)");
    });

    it("formats pelunasan installment", () => {
      const row = {
        termin_no: 2,
        top_type: "INSTALLMENT",
      };
      assert.equal(getTerminLabel(row), "Termin 2 (Pelunasan)");
    });

    it("returns null for standard non-installment items", () => {
      assert.equal(getTerminLabel({ top_type: "CASH" }), null);
      assert.equal(getTerminLabel({ top_type: "CREDIT" }), null);
    });
  });

  describe("isRowPayable and getUnpayableReason", () => {
    it("allows payable items", () => {
      const row = { id: 1, is_payable: true };
      assert.equal(isRowPayable(row), true);
      assert.equal(getUnpayableReason(row), "");
    });

    it("blocks unpayable items and provides informative reason", () => {
      const row = {
        id: 2,
        is_payable: false,
        reason_unpayable: "Barang belum diterima di gudang (GRN pending)",
      };
      assert.equal(isRowPayable(row), false);
      assert.equal(
        getUnpayableReason(row),
        "Barang belum diterima di gudang (GRN pending)"
      );
    });

    it("provides fallback reason when reason_unpayable is omitted", () => {
      const row = { id: 3, is_payable: false };
      assert.equal(isRowPayable(row), false);
      assert.match(getUnpayableReason(row), /GRN pending/);
    });

    it("blocks disabled items", () => {
      const row = { id: 4, disabled: true };
      assert.equal(isRowPayable(row), false);
    });
  });
});
