import moment from 'moment';
import 'moment/locale/id';

moment.locale('id');

export const BREAKDOWN_STATUS = [
  { code: 0, label: 'Tunggu Teknisi', color: '#fbbf24', colorDark: '#92400e', bg: '#fef3c7', bgDark: '#451a03', muiColor: 'warning' },
  { code: 1, label: 'Tunggu Part', color: '#f472b6', colorDark: '#831843', bg: '#fef9c3', bgDark: '#78350f', muiColor: 'secondary' },
  { code: 8, label: 'Sedang Dikerjakan', color: '#60a5fa', colorDark: '#1e40af', bg: '#dbeafe', bgDark: '#1e3a8a', muiColor: 'info' },
  { code: 9, label: 'Selesai', color: '#34d399', colorDark: '#064e3b', bg: '#d1fae5', bgDark: '#064e3b', muiColor: 'success' }
];

export const KATEGORI = [
  { value: 'MECHANICAL', label: 'Mechanical' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'HYDRAULIC', label: 'Hydraulic' },
  { value: 'ENGINE', label: 'Engine' },
  { value: 'TIRE', label: 'Tire' },
  { value: 'OTHER', label: 'Other' }
];

export const ITEM_STATUS = [
  { code: 'WT', label: 'Wait Teknisi' },
  { code: 'WP', label: 'Wait Part' },
  { code: 'WS', label: 'Wait Services' },
  { code: 'DONE', label: 'Selesai' }
];

const ITEM_STATUS_BY_CODE = ITEM_STATUS.reduce((acc, item) => {
  acc[item.code] = item.label;
  return acc;
}, {});

export const getItemStatusLabel = (code) => ITEM_STATUS_BY_CODE[code] || code || '-';

export const WORK_ORDER_STATUS = [
  { code: 'WT', label: 'Wait Teknisi', color: '#fbbf24', bg: '#fef3c7', text: '#92400e', muiColor: 'warning' },
  { code: 'WS', label: 'Wait Services', color: '#f472b6', bg: '#fce7f3', text: '#9d174d', muiColor: 'secondary' },
  { code: 'WP', label: 'Wait Part', color: '#f59e0b', bg: '#fef9c3', text: '#854d0e', muiColor: 'warning' },
  { code: 'WV', label: 'Wait Vendor', color: '#c084fc', bg: '#f3e8ff', text: '#6d28d9', muiColor: 'secondary' },
  { code: 'WTT', label: 'Wait Transport', color: '#a78bfa', bg: '#ede9fe', text: '#5b21b6', muiColor: 'secondary' },
  { code: 'IP', label: 'In Progress', color: '#60a5fa', bg: '#dbeafe', text: '#1e40af', muiColor: 'info' },
  { code: 'DONE', label: 'Selesai', color: '#34d399', bg: '#d1fae5', text: '#065f46', muiColor: 'success' }
];

const WO_STATUS_BY_CODE = WORK_ORDER_STATUS.reduce((acc, item) => {
  acc[item.code] = item;
  return acc;
}, {});

export const getWorkOrderStatusInfo = (code) => {
  const found = WO_STATUS_BY_CODE[code];
  if (!found) return { label: code || '-', color: '#e5e7eb', bg: '#f3f4f6', text: '#374151', muiColor: 'default' };
  return { label: found.label, color: found.color, bg: found.bg, text: found.text, muiColor: found.muiColor };
};

const STATUS_BY_CODE = BREAKDOWN_STATUS.reduce((acc, item) => {
  acc[item.code] = item;
  return acc;
}, {});

export const getStatusInfo = (status) => {
  const found = STATUS_BY_CODE[Number(status)];
  if (!found) {
    return { label: 'Unknown', bg: '#f3f4f6', text: '#1f2937', bgDark: '#374151', textDark: '#f3f4f6', muiColor: 'default' };
  }
  return {
    label: found.label,
    bg: found.bg,
    text: found.colorDark,
    bgDark: found.bgDark,
    textDark: found.bg,
    muiColor: found.muiColor
  };
};

const DATE_FORMATS = ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm', 'DD-MM-YYYY HH:mm:ss', 'DD-MM-YYYY HH:mm', 'YYYY-MM-DD', 'DD-MM-YYYY', moment.ISO_8601];

export const parseApiDate = (value, fallbackFormat = 'DD-MM-YYYY HH:mm') => {
  if (!value) return null;
  const m = moment(value, [fallbackFormat, ...DATE_FORMATS], true);
  return m.isValid() ? m : null;
};

export const calculateDuration = (breakdownAt, readyAt = null) => {
  const start = parseApiDate(breakdownAt);
  const end = readyAt ? parseApiDate(readyAt) : moment();

  if (!start || !end || !start.isValid() || !end.isValid()) {
    return { days: 0, hours: 0, minutes: 0, text: '-' };
  }

  if (end.isBefore(start)) {
    return { days: 0, hours: 0, minutes: 0, text: '-' };
  }

  const duration = moment.duration(end.diff(start));
  const totalDays = duration.asDays();
  const totalHours = duration.asHours();

  const days = Math.floor(totalDays);
  const hoursRemainder = duration.hours();
  const minutes = duration.minutes();

  let text = '-';
  if (days >= 1) {
    text = `${days} hari`;
    if (hoursRemainder > 0) text += ` ${hoursRemainder} jam`;
  } else {
    const hoursWhole = Math.floor(totalHours);
    text = `${hoursWhole} jam`;
    if (minutes > 0) text += ` ${minutes} mnt`;
  }

  return { days, hours: hoursRemainder, minutes, text };
};

export const validateBreakdownForm = (data) => {
  const errors = {};

  if (!data.equipment_id) errors.equipment_id = 'Equipment wajib diisi';
  if (!data.lokasi_id) errors.lokasi_id = 'Lokasi wajib diisi';
  if (!data.breakdown_at) errors.breakdown_at = 'Waktu breakdown wajib diisi';
  if (!data.pengawas_id) errors.pengawas_id = 'Pengawas wajib diisi';
  if (!data.kategori) errors.kategori = 'Kategori wajib diisi';
  if (!data.penyewa_id) errors.penyewa_id = 'Penyewa wajib diisi';

  if (!data.items || data.items.length === 0) {
    errors.items = 'Minimal satu issue wajib diisi';
  } else {
    const itemErrors = [];
    data.items.forEach((item, index) => {
      if (!item.problem_issue || item.problem_issue.trim() === '') {
        itemErrors.push(`Issue ${index + 1}: deskripsi problem wajib diisi`);
      }
    });
    if (itemErrors.length > 0) errors.items = itemErrors.join(', ');
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

export const formatBreakdownAt = (value) => {
  if (!value) return '-';
  const m = parseApiDate(value);
  return m ? m.format('ddd, HH:mm') : '-';
};

export const formatDateIssue = (value) => {
  if (!value) return '-';
  const m = parseApiDate(value, 'YYYY-MM-DD');
  return m ? m.format('DD MMM YYYY') : '-';
};

export const defaultFilters = {
  page: 1,
  perPage: 25,
  status: [],
  cabang_id: '',
  equipment_id: '',
  lokasi_id: '',
  startdate: '',
  enddate: ''
};

export const hasActiveFilters = (filters) => {
  const hasStatus = Array.isArray(filters.status) && filters.status.length > 0;
  return hasStatus || !!filters.cabang_id || !!filters.equipment_id || !!filters.lokasi_id || !!filters.startdate || !!filters.enddate;
};

export const buildCompactParams = (filters) => {
  const params = { page: filters.page, perPage: filters.perPage };
  if (Array.isArray(filters.status) && filters.status.length > 0) {
    params.status = filters.status.join(',');
  }
  if (filters.cabang_id) params.cabang_id = filters.cabang_id;
  if (filters.equipment_id) params.equipment_id = filters.equipment_id;
  if (filters.lokasi_id) params.lokasi_id = filters.lokasi_id;
  if (filters.startdate) params.startdate = filters.startdate;
  if (filters.enddate) params.enddate = filters.enddate;
  return params;
};