export const STATUS_PRESENTATION = {
  FAILED: { label: 'Retry otomatis', color: 'warning' },
  BLOCKED_MAPPING: { label: 'Perlu mapping', color: 'warning' },
  DEAD_LETTER: { label: 'Pengiriman dihentikan', color: 'error' }
};

export const SEVERITY_PRESENTATION = {
  WARNING: { label: 'Dipantau sistem', color: 'warning' },
  ACTION_REQUIRED: { label: 'Perlu tindakan', color: 'warning' },
  CRITICAL: { label: 'Kritis', color: 'error' }
};

export function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export function getErrorMessage(error, fallback = 'Gagal memuat Integration Issues') {
  return error?.response?.data?.diagnostic?.message || error?.diagnostic?.message || error?.message || fallback;
}
