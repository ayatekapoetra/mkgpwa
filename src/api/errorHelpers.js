/**
 * Standard error extraction and response normalization helpers for API responses.
 * Compatible with Axios envelopes, diagnostic payloads, and native errors.
 */

export const getPurchasingRequestError = (
  error,
  fallback = "Proses Purchasing Request gagal",
) => {
  const rawPayload = error?.response?.data || error?.data || error || {};
  const payload =
    typeof rawPayload === "object" && rawPayload !== null ? rawPayload : {};
  const diagnostic = payload?.diagnostic || {};
  const legacyMessage =
    typeof diagnostic.error === "string" ? diagnostic.error : "";
  const fieldMessage = Array.isArray(payload?.errors)
    ? payload.errors.find((item) => item?.message)?.message
    : "";

  const code =
    diagnostic.code ||
    payload.code ||
    error?.code ||
    null;

  const status =
    error?.response?.status ||
    payload.status ||
    payload.statusCode ||
    error?.status ||
    error?.statusCode ||
    diagnostic.status ||
    null;

  return {
    message:
      diagnostic.message ||
      legacyMessage ||
      payload.message ||
      fieldMessage ||
      (typeof rawPayload === "string" ? rawPayload : "") ||
      error?.message ||
      fallback,
    code,
    status,
    requestId: diagnostic.request_id || payload.request_id || null,
    errors: Array.isArray(payload?.errors) ? payload.errors : [],
  };
};

export const normalizeDetail = (payload) => {
  if (Array.isArray(payload)) return payload[0] || null;
  const row = payload?.rows ?? payload?.data?.rows ?? payload?.data ?? null;
  if (Array.isArray(row)) return row[0] || null;
  return row;
};

export function getGoodsIssueError(error, fallback = "Proses Goods Issue gagal") {
  const rawPayload = error?.response?.data || error?.data || error || {};
  const payload =
    typeof rawPayload === "object" && rawPayload !== null ? rawPayload : {};
  const diagnostic = payload?.diagnostic || {};

  const code =
    diagnostic.code ||
    payload.code ||
    error?.code ||
    null;

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
    (typeof rawPayload === "string" ? rawPayload : "") ||
    error?.message ||
    fallback;

  return {
    message,
    code,
    status,
    errors: Array.isArray(payload?.errors) ? payload.errors : [],
  };
}
