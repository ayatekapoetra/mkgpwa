/**
 * SCM-005 (PRD-SCM-005 v1.0) helpers for the direct "Ajukan Verifikasi"
 * action: one atomic action runs the full verification + finalization effect
 * (status close "Diproses" + faktur beli + rencana pembayaran).
 *
 * Pure functions only (no JSX / no MUI) so they can be unit tested with
 * `node --test` like `headerPayload.test.mjs`.
 */

import { calculateItemTotals } from "./utils.js";

/** Q-06 B: the new action accepts `open` AND legacy `verify` documents. */
export const DIRECT_SUBMIT_ALLOWED_STATUSES = ["open", "verify"];

/**
 * Q-03 B: button visibility follows the current update/insert permission
 * PLUS validate — mirroring the existing finalize button behaviour.
 * Q-05: status `accept` (and any other status) stays out of scope.
 */
export const canDirectSubmitVerification = ({
  status = "",
  canUpdate = false,
  canInsert = false,
  canValidate = false,
} = {}) =>
  Boolean(canUpdate || canInsert) &&
  Boolean(canValidate) &&
  DIRECT_SUBMIT_ALLOWED_STATUSES.includes(
    String(status || "").toLowerCase(),
  );

/**
 * Q-06 B: the legacy "Verifikasi & Finalisasi" action is only available for
 * documents in `verify` status (as the second path alongside direct submit).
 * For `open` documents, the legacy action is hidden (only direct submit is shown).
 */
export const canShowLegacyVerifyAction = ({
  status = "",
  canVerify = false,
} = {}) =>
  Boolean(canVerify) && String(status || "").toLowerCase() === "verify";

/** Groups active items by payment method (mirrors backend grouping). */
export const groupItemsByMetode = (items = []) => {
  const active = (items || []).filter((item) => item.aktif !== "N");
  const groups = new Map();

  active.forEach((item) => {
    const metode = String(item.metode || "").toLowerCase();
    const totals = calculateItemTotals(item);
    const current =
      groups.get(metode) || {
        metode,
        item_count: 0,
        gross: 0,
        discount: 0,
        tax_amount: 0,
        grand_total: 0,
      };

    groups.set(metode, {
      metode,
      item_count: current.item_count + 1,
      gross: current.gross + totals.gross,
      discount: current.discount + Number(item.potongan || 0),
      tax_amount: current.tax_amount + totals.tax_amount,
      grand_total: current.grand_total + totals.grand_total,
    });
  });

  return Array.from(groups.values());
};

/** Human description of the payment plan documents produced per method. */
export const describePaymentPlan = (metode, paymentTerms = {}) => {
  const safeTerms = paymentTerms || {};
  const { top_type = "", top_days = 0, dp_percent = 0 } = safeTerms;
  const key = String(metode || "").toLowerCase();
  const type = String(top_type || "").toUpperCase();

  if (key === "tunai") {
    return "Rencana pembayaran tunai (kode pembayaran, dieksekusi kasir)";
  }
  if (key === "kredit") {
    const days = Number(top_days || 0);
    if (type === "INSTALLMENT") {
      const dp = Number(dp_percent || 0);
      return `Termin INSTALLMENT: DP ${dp}% + sisa, jangka ${days} hari`;
    }
    return `Termin kredit: jatuh tempo ${days} hari`;
  }
  return "Rencana pembayaran sesuai metode item";
};

/**
 * Builds the Q-04 A confirmation summary shown before executing the action:
 * rencana pembayaran (tunai/kredit/termin) + nilai total.
 */
export const buildDirectSubmitSummary = ({ row = {}, items = [] } = {}) => {
  const safeRow = row || {};
  const groups = groupItemsByMetode(items);

  return {
    groups: groups.map((group) => ({
      ...group,
      documents: [describePaymentPlan(group.metode, safeRow)],
    })),
    grandTotal: groups.reduce((acc, group) => acc + group.grand_total, 0),
    itemCount: groups.reduce((acc, group) => acc + group.item_count, 0),
    topType: String(safeRow.top_type || "").toUpperCase(),
    topDays: Number(safeRow.top_days || 0),
    dpPercent: Number(safeRow.dp_percent || 0),
  };
};

/**
 * Owner revision (Kensie, 2026-11-02): one-line permission info shown above
 * the summary card in the confirmation dialog. Uses the same feature access
 * that gates the direct submit button (canUpdate || canInsert + canValidate).
 * When the logged-in user name is unavailable in the FE session context, it
 * falls back to listing the granting access without a name.
 */
export const buildDirectSubmitPermissionSummary = ({ userName = "" } = {}) => {
  const name = String(userName || "").trim();
  if (name) {
    return `Diajukan oleh: ${name} — aksi ini hanya dapat dilakukan oleh user dengan akses validasi & finalisasi PO.`;
  }
  return "Aksi ini hanya dapat dilakukan oleh user dengan akses validasi & finalisasi PO (hak akses: update/insert + validate).";
};
