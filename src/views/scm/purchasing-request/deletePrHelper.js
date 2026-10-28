/**
 * Helper logic for Purchasing Request deletion (PRD-FEAT-SCM-003).
 */

/**
 * Checks whether a Purchasing Request has already been converted to a Purchase Order (PO).
 *
 * @param {Object} row - The PR document or row object.
 * @returns {boolean} True if PR or any of its items has become a PO.
 */
export function hasPrBecomePo(row) {
  if (!row || typeof row !== "object") return false;

  const status = String(row.status || "").toLowerCase().trim();
  // Statuses indicating PR is completed, approved, or converted
  if (["approved", "finish", "done", "po"].includes(status)) {
    return true;
  }

  // Row-level PO markers
  if (
    row.po_sts === "Y" ||
    row.is_po === true ||
    Boolean(row.po_id) ||
    Boolean(row.no_po)
  ) {
    return true;
  }

  // Item-level PO markers
  const items = Array.isArray(row.items) ? row.items : [];
  if (
    items.some(
      (item) =>
        item &&
        (item.po_sts === "Y" || Boolean(item.po_id) || Boolean(item.no_po)),
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Checks whether a Purchasing Request is deletable according to RBAC permissions,
 * document status (draft or active), and PO status (not yet converted to PO).
 *
 * @param {Object} row - The PR document or row object.
 * @param {Object|null|undefined} permissions - Permissions object (e.g. from usePurchasingRequestAccess or usePurchasingRequestPermissions).
 * @returns {boolean} True if the PR can be deleted.
 */
export function isPrDeletable(row, permissions) {
  if (!row || typeof row !== "object") return false;

  // 1. RBAC permission check:
  // If permissions object is provided, check can_delete / can_remove.
  // If not provided, fallback to row.can_delete if present, else default to true for unit-level checks.
  const hasPermission =
    permissions !== undefined && permissions !== null
      ? Boolean(permissions.can_delete ?? permissions.can_remove)
      : row.can_delete !== undefined
        ? Boolean(row.can_delete)
        : true;

  if (!hasPermission) return false;

  // 2. Status check: Only 'draft' and 'active' PRs can be deleted (PRD Section 3.1 & AC-PR-DEL-06)
  const status = String(row.status || "").toLowerCase().trim();
  if (status !== "draft" && status !== "active") {
    return false;
  }

  // 3. PO conversion check: Sembunyikan tombol bila status PR sudah menjadi PO (PRD Requirement 3)
  if (hasPrBecomePo(row)) {
    return false;
  }

  return true;
}
