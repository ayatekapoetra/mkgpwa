export const ASSET_TYPES = ['VEHICLE', 'HEAVY_EQUIPMENT', 'PROPERTY', 'OTHER'];
export const FINANCING_TYPES = ['CASH', 'VENDOR_CREDIT', 'BANK_LOAN', 'MULTIFINANCE', 'FINANCE_LEASE', 'OPERATING_LEASE', 'OTHER'];
export const OWNERSHIP_SCHEMES = ['COMPANY_OWNED', 'SGU'];
export const ASSET_CONDITIONS = ['NEW', 'USED'];

export const labels = {
  VEHICLE: 'Kendaraan', HEAVY_EQUIPMENT: 'Alat berat', PROPERTY: 'Properti', OTHER: 'Lainnya', NEW: 'Baru', USED: 'Bekas',
  CASH: 'Tunai', VENDOR_CREDIT: 'Kredit vendor', BANK_LOAN: 'Pinjaman bank', MULTIFINANCE: 'Multifinance',
  FINANCE_LEASE: 'Finance lease', OPERATING_LEASE: 'Operating lease', COMPANY_OWNED: 'Milik perusahaan', SGU: 'Sewa guna usaha'
};

export const statusColor = (status = '') => {
  if (['ACTIVE', 'APPROVED', 'ACCEPTED', 'COMPLETED', 'EXECUTED', 'VERIFIED', 'POSTED', 'PAID', 'CLEARED'].includes(status)) return 'success';
  if (['REJECTED', 'FAILED', 'VOIDED', 'CANCELLED', 'DEFAULTED', 'BOUNCED', 'OVERDUE'].includes(status)) return 'error';
  if (['DRAFT', 'RETURNED', 'SCHEDULED'].includes(status)) return 'default';
  if (['DP_PENDING', 'PAYMENT_IN_PROCESS', 'PARTIALLY_PAID', 'INSPECTION_PENDING'].includes(status)) return 'warning';
  return 'info';
};

export const humanize = (value) => labels[value] || String(value || '-').replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
export const money = (value, currency = 'IDR') => new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value || 0));
export const date = (value) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value)) : '-';
export const rowValue = (row, ...keys) => keys.map((key) => row?.[key]).find((value) => value !== undefined && value !== null && value !== '') ?? '-';
