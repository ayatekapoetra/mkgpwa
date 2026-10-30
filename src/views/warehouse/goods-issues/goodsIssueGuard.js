/**
 * Guards and error formatting for Goods Issue void and revise actions.
 * Enforces AC-06: REVISE must NOT be displayed as an alternative to void when guard rejects void.
 */

/**
 * Pure guard to determine whether the Void button should be rendered.
 */
export function canShowVoidButton({ header, permissions } = {}) {
  const canVoid = permissions?.can_void ?? false;
  if (!canVoid) return false;
  const status = header?.status;
  return status === 'DRAFT' || status === 'POSTED';
}

/**
 * Pure guard to determine whether the Revise button should be rendered.
 * AC-06: REVISE must NOT be displayed as an alternative to void when guard rejects void.
 */
export function canShowReviseButton({ header, permissions } = {}) {
  const canRevise = permissions?.can_revise ?? false;
  if (!canRevise) return false;

  // Revise involves voiding the posted document, so void MUST be permitted
  const voidAllowed = canShowVoidButton({ header, permissions });
  if (!voidAllowed) return false;

  if (header?.status !== 'POSTED') return false;
  if (header?.can_void === false) return false;
  if (header?.is_wo_closed || header?.wo_status === 'CLOSED') return false;

  return true;
}

/**
 * Formats error responses from GI void or revise actions.
 * Handles 409 GI_DEPENDENCY_CONFLICT and 422 WO_CLOSED informatively.
 */
export function formatGoodsIssueActionError(error, defaultFallback = 'Aksi gagal') {
  const rawPayload = error?.response?.data || error?.data || error || {};
  const payload = typeof rawPayload === 'object' && rawPayload !== null ? rawPayload : {};
  const diagnostic = payload?.diagnostic || {};

  const code = diagnostic.code || payload.code || error?.code || null;
  const status =
    error?.response?.status ||
    payload.status ||
    payload.statusCode ||
    error?.status ||
    error?.statusCode ||
    diagnostic.status ||
    null;

  const message =
    diagnostic.message ||
    payload.message ||
    (typeof rawPayload === 'string' ? rawPayload : '') ||
    error?.message ||
    defaultFallback;

  let title = 'Gagal';
  let formattedMessage = message;

  if (code === 'GI_DEPENDENCY_CONFLICT' || Number(status) === 409) {
    title = 'Konflik Dependensi (409)';
    formattedMessage =
      message ||
      'Dokumen Goods Issue tidak dapat dibatalkan karena dependensi (WO telah ditutup, terdapat GI lain, atau keterkaitan dokumen downstream).';
  } else if (code === 'WO_CLOSED' || Number(status) === 422) {
    title = 'Work Order Ditutup (422)';
    formattedMessage =
      message || 'Work Order terkait telah ditutup (CLOSED). Dokumen GI tidak dapat diproses.';
  } else if (code === 'INVALID_STATE' || code === 'GI_ALREADY_VOIDED') {
    title = 'Status Dokumen Tidak Valid';
  }

  return {
    code,
    status,
    title,
    message: formattedMessage,
    isConflict:
      Number(status) === 409 ||
      Number(status) === 422 ||
      ['GI_DEPENDENCY_CONFLICT', 'WO_CLOSED', 'INVALID_STATE'].includes(code)
  };
}
