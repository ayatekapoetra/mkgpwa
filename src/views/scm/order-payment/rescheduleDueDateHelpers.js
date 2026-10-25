/**
 * rescheduleDueDateHelpers.js
 * Helper functions for Reschedule Due Date feature on SCM Order Payment / Faktur Beli.
 *
 * Implements strict permission checking (approval === 'Y' / can_reschedule_due_date),
 * input validations (reason >= 10 chars, date format & bounds), and payload preparation.
 */

const isOn = (v) => {
  if (v === true || v === 1) return true;
  if (v === false || v === 0 || v === null || v === undefined) return false;
  return ["Y", "1", "TRUE"].includes(String(v).trim().toUpperCase());
};

/**
 * Checks if the user has approval permissions to reschedule due date.
 * Strict check: requires approval === 'Y' / approve === true / can_reschedule_due_date === true.
 *
 * @param {object|null} permissions
 * @returns {boolean}
 */
export function canRescheduleDueDate(permissions) {
  if (!permissions || typeof permissions !== "object") return false;

  const p = permissions.permissions && typeof permissions.permissions === "object"
    ? permissions.permissions
    : permissions;

  // Explicit reschedule flag from backend featurePermissions
  if (p.can_reschedule_due_date === true || isOn(p.can_reschedule_due_date)) {
    return true;
  }

  // Strict approval right: must have approval/approve flag
  if (isOn(p.approval) || isOn(p.approve)) {
    return true;
  }

  return false;
}

/**
 * Normalizes date to YYYY-MM-DD string.
 *
 * @param {string|Date|null} date
 * @returns {string|null}
 */
export function normalizeDateString(date) {
  if (!date) return null;
  if (typeof date === "string") {
    const trimmed = date.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return null;
  }
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }
  return null;
}

/**
 * Validates reschedule input fields.
 *
 * Rules:
 * 1. new_due_date: required, format YYYY-MM-DD.
 * 2. new_due_date cannot be earlier than invoice_date (if invoice_date provided).
 * 3. reason: required, minimum 10 characters (trimmed).
 *
 * @param {object} params
 * @param {string} params.new_due_date
 * @param {string|Date} [params.invoice_date]
 * @param {string} params.reason
 * @returns {{ isValid: boolean, errors: { new_due_date?: string, reason?: string } }}
 */
export function validateRescheduleInput({ new_due_date, invoice_date, reason } = {}) {
  const errors = {};

  const normalizedDueDate = normalizeDateString(new_due_date);
  if (!new_due_date || !String(new_due_date).trim()) {
    errors.new_due_date = "Tanggal jatuh tempo baru wajib dipilih.";
  } else if (!normalizedDueDate) {
    errors.new_due_date = "Format tanggal jatuh tempo harus YYYY-MM-DD.";
  } else if (invoice_date) {
    const normalizedInvoiceDate = normalizeDateString(invoice_date);
    if (normalizedInvoiceDate && normalizedDueDate < normalizedInvoiceDate) {
      errors.new_due_date = "Tanggal jatuh tempo baru tidak boleh sebelum tanggal faktur.";
    }
  }

  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (!trimmedReason) {
    errors.reason = "Alasan perubahan wajib diisi minimal 10 karakter.";
  } else if (trimmedReason.length < 10) {
    errors.reason = `Alasan perubahan minimal 10 karakter (saat ini ${trimmedReason.length} karakter).`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Determines whether the "Simpan Perubahan" button should be disabled.
 * Disabled if reason < 10 chars, date not chosen, or actively submitting.
 *
 * @param {object} params
 * @returns {boolean}
 */
export function shouldDisableSubmit({ new_due_date, invoice_date, reason, isSubmitting = false } = {}) {
  if (isSubmitting) return true;
  if (!new_due_date || !String(new_due_date).trim()) return true;
  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (trimmedReason.length < 10) return true;

  const validation = validateRescheduleInput({ new_due_date, invoice_date, reason });
  return !validation.isValid;
}

/**
 * Builds the payload for POST /api/faktur-beli/:id/reschedule-due-date.
 *
 * @param {object} params
 * @param {string} params.new_due_date
 * @param {string} params.reason
 * @param {number|string|null} [params.termin_id]
 * @returns {{ new_due_date: string, reason: string, termin_id: number|string|null }}
 */
export function buildReschedulePayload({ new_due_date, reason, termin_id = null } = {}) {
  const normalizedDueDate = normalizeDateString(new_due_date) || String(new_due_date || "").trim();
  return {
    new_due_date: normalizedDueDate,
    reason: typeof reason === "string" ? reason.trim() : "",
    termin_id: termin_id !== undefined && termin_id !== "" && termin_id !== null ? termin_id : null,
  };
}

/**
 * Returns rendering state for the "Ubah Jatuh Tempo" button based on permissions.
 *
 * @param {object|null} permissions
 * @returns {{ canRender: boolean, disabled: boolean }}
 */
export function getRescheduleButtonState(permissions) {
  const allowed = canRescheduleDueDate(permissions);
  return {
    canRender: allowed,
    disabled: !allowed,
    visible: allowed,
  };
}

/**
 * Convenience helper to determine if the "Ubah Jatuh Tempo" button should be rendered.
 *
 * @param {object|null} permissions
 * @returns {boolean}
 */
export function shouldRenderRescheduleButton(permissions) {
  return canRescheduleDueDate(permissions);
}
