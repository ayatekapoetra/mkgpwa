export const statusColor = (status) => ({
  beroperasi: 'success', WORKING: 'success', ACTIVE: 'success', COMPLETED: 'success',
  standby: 'warning', STANDBY: 'warning', DRAFT: 'warning', PLANNED: 'warning',
  breakdown: 'error', BREAKDOWN: 'error', UNAVAILABLE: 'error', CANCELLED: 'error',
  UNKNOWN: 'default', RELEASED: 'default', REPLACED: 'info',
  CREATED: 'info', UPDATED: 'primary', STATUS_CHANGED: 'warning', OVERLAP_ADJUSTED: 'info', DELETED: 'error'
}[status] || 'default');

export const statusLabel = (status) => ({
  beroperasi: 'Beroperasi', standby: 'Standby', breakdown: 'Breakdown',
  WORKING: 'Working', STANDBY: 'Standby', BREAKDOWN: 'Breakdown',
  CREATED: 'Created', UPDATED: 'Updated', STATUS_CHANGED: 'Status Changed',
  OVERLAP_ADJUSTED: 'Overlap Adjusted', DELETED: 'Deleted',
}[String(status || '').toLowerCase()] || status || 'Unknown');

export const statusGradient = (status) => ({
  beroperasi: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
  standby: 'linear-gradient(135deg, #e65100 0%, #fb8c00 100%)',
  breakdown: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
  WORKING: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
  STANDBY: 'linear-gradient(135deg, #e65100 0%, #fb8c00 100%)',
  BREAKDOWN: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
}[String(status || '').toLowerCase()] || 'linear-gradient(135deg, #455a64 0%, #607d8b 100%)');

export const statusGlow = (status) => ({
  beroperasi: '0 4px 14px 0 rgba(46,125,50,0.35)',
  standby: '0 4px 14px 0 rgba(230,81,0,0.35)',
  breakdown: '0 4px 14px 0 rgba(183,28,28,0.35)',
  WORKING: '0 4px 14px 0 rgba(46,125,50,0.35)',
  STANDBY: '0 4px 14px 0 rgba(230,81,0,0.35)',
  BREAKDOWN: '0 4px 14px 0 rgba(183,28,28,0.35)',
}[String(status || '').toLowerCase()] || '0 4px 14px 0 rgba(69,90,100,0.25)');

export const optionId = (option) => option?.id ?? option?.value ?? option?.uuid;
export const optionLabel = (option) => option?.nama ?? option?.name ?? option?.label ?? option?.kode ?? option?.code ?? String(optionId(option) || '');

export const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '-';

export const formatTime = (value) => value
  ? new Intl.DateTimeFormat('id-ID', { timeStyle: 'short' }).format(new Date(value))
  : '-';

export const localDate = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const errorStatus = (error) => error?.status || error?.response?.status || error?.diagnostic?.status;

export const countActiveFilters = (scope) => {
  if (!scope) return 0;
  const keys = ['shift_id', 'area', 'lokasi_site_id', 'ctgunit', 'status', 'search'];
  return keys.reduce((acc, key) => acc + (scope[key] && String(scope[key]).trim() !== '' ? 1 : 0), 0);
};