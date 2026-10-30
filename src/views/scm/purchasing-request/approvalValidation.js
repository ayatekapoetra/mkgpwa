/**
 * Helper and validation functions for Purchasing Request approvals.
 * Aligns with AC-01, AC-04, AC-07 (PRD-SCM-002 / SCM-003).
 */

/**
 * Filters item list to only those eligible for approval.
 * AC-01: Inactive items (aktif === 'N') must not be eligible.
 * AC-01 / AC-07: Items already approved (date_approved, user_approved, po_sts === 'Y')
 * or not yet validated are not eligible.
 */
export function filterEligibleApprovalItems(items = []) {
  return (items || []).filter(
    (item) =>
      item &&
      item.aktif !== "N" &&
      (item.user_validated || item.date_validated) &&
      !item.user_approved &&
      !item.date_approved &&
      item.po_sts !== "Y",
  );
}

/**
 * Validates selected approval IDs against fresh server state.
 * Returns valid payload items matching preview or conflict/invalid report.
 */
export function validateApprovalPayload(
  selectedIds = [],
  currentItems = [],
  overrides = {},
) {
  if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
    return {
      valid: false,
      invalidIds: [],
      payloadItems: [],
      errorReason: "Tidak ada item yang dipilih untuk disetujui.",
    };
  }

  const eligibleItems = filterEligibleApprovalItems(currentItems);
  const eligibleMap = new Map(eligibleItems.map((item) => [item.id, item]));

  const invalidIds = [];
  const payloadItems = [];

  for (const id of selectedIds) {
    const item = eligibleMap.get(id);
    if (!item) {
      invalidIds.push(id);
    } else {
      const overrideMetode = overrides[id];
      const metode =
        overrideMetode !== undefined ? overrideMetode : item.metode || "kredit";
      payloadItems.push({ id, metode });
    }
  }

  if (invalidIds.length > 0) {
    return {
      valid: false,
      invalidIds,
      payloadItems: [],
      errorReason:
        "Beberapa item yang dipilih sudah tidak aktif atau statusnya telah berubah. Silakan muat ulang dan pilih kembali item yang valid.",
    };
  }

  return {
    valid: true,
    invalidIds: [],
    payloadItems,
    errorReason: null,
  };
}

/**
 * Checks whether an error is a 409 conflict or known PR conflict code.
 * Used to avoid automatic mutation replay and ensure clean stale selection clearing.
 */
export function isApprovalConflict(error) {
  if (!error) return false;
  const conflictCodes = [
    "PR_ITEM_INACTIVE",
    "PR_BATCH_PARENT_CONFLICT",
    "PR_STATE_CONFLICT",
    "PR_ITEM_ALREADY_APPROVED",
    "PR_ITEM_NOT_VALIDATED",
    "CONFLICT",
  ];

  const status =
    error.status ||
    error.statusCode ||
    error.response?.status ||
    error.diagnostic?.status;

  const code =
    error.code ||
    error.diagnostic?.code ||
    error.data?.code;

  if (Number(status) === 409) return true;
  if (code && conflictCodes.includes(code)) return true;
  return false;
}
