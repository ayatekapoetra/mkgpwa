export const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const formatNumber = (v, digits = 0) => {
  const n = toNumber(v);
  return n.toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
};

export const formatCurrency = (v) =>
  `Rp ${toNumber(v).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;

export const formatPercent = (v, digits = 1) => `${toNumber(v).toFixed(digits)}%`;

export const formatMinutes = (v) => {
  const n = toNumber(v);
  if (n <= 0) return '0 m';
  if (n < 60) return `${Math.round(n)} m`;
  const h = Math.floor(n / 60);
  const m = Math.round(n % 60);
  return m ? `${h}j ${m}m` : `${h}j`;
};

export const formatHours = (v) => `${toNumber(v).toFixed(1)} jam`;

export const pickArray = (...candidates) => {
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
};

export const STATUS_ATTENDANCE = {
  H: { label: 'Hadir', color: '#10b981' },
  L: { label: 'Terlambat', color: '#f59e0b' },
  C: { label: 'Cuti', color: '#3b82f6' },
  I: { label: 'Izin', color: '#a855f7' },
  S: { label: 'Sakit', color: '#ec4899' },
  A: { label: 'Alpha', color: '#ef4444' }
};

export const sumObjectValues = (obj = {}, keys = []) =>
  keys.reduce((acc, k) => acc + toNumber(obj?.[k]), 0);

export const calcAttendanceRate = (mix = {}) => {
  const hadir = toNumber(mix.H) + toNumber(mix.L);
  const total = sumObjectValues(mix, ['H', 'L', 'C', 'I', 'S', 'A']);
  if (!total) return 0;
  return (hadir / total) * 100;
};

export const normalizePolarBreakdown = (polarData) => {
  const list = Array.isArray(polarData)
    ? polarData
    : Array.isArray(polarData?.data)
      ? polarData.data
      : Array.isArray(polarData?.rows)
        ? polarData.rows
        : [];

  const statusKeys = ['WT', 'WP', 'WS', 'WV', 'WTT', 'IP'];
  let total = 0;
  const byCategory = list.map((item) => {
    const t = toNumber(item.total);
    total += t;
    return {
      name: item.ctgequipment || item.category || item.name || 'N/A',
      total: t,
      status_count: item.status_count || {}
    };
  });

  const statusTotals = statusKeys.reduce((acc, s) => {
    acc[s] = byCategory.reduce((sum, c) => sum + toNumber(c.status_count?.[s]), 0);
    return acc;
  }, {});

  // open-ish statuses: not closed. Use WS as closed-ish if present, rest open
  const closed = toNumber(statusTotals.WS);
  const open = Math.max(total - closed, 0);

  return { list: byCategory, total, statusTotals, open, closed };
};

export const normalizeApprovalRate = (data) => {
  const rows = pickArray(data);
  if (!rows.length) {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const rate = toNumber(data.rate ?? data.approval_rate ?? data.percentage);
      return { rate, approved: toNumber(data.approved), total: toNumber(data.total) };
    }
    return { rate: 0, approved: 0, total: 0 };
  }

  // common shapes: [{status, count}] or [{approved, total, rate}]
  if (rows[0]?.rate != null || rows[0]?.approval_rate != null) {
    const first = rows[0];
    return {
      rate: toNumber(first.rate ?? first.approval_rate),
      approved: toNumber(first.approved),
      total: toNumber(first.total)
    };
  }

  const approved = rows
    .filter((r) => String(r.status || r.name || '').toLowerCase().includes('approv') || r.approved)
    .reduce((s, r) => s + toNumber(r.count ?? r.total ?? r.value), 0);
  const total = rows.reduce((s, r) => s + toNumber(r.count ?? r.total ?? r.value), 0);
  return { rate: total ? (approved / total) * 100 : 0, approved, total };
};

export const normalizeAvgDuration = (data) => {
  const rows = pickArray(data);
  if (!rows.length) {
    if (data && typeof data === 'object') {
      return toNumber(data.avg ?? data.average ?? data.avg_hours ?? data.avg_duration);
    }
    return 0;
  }
  const vals = rows.map((r) => toNumber(r.avg ?? r.average ?? r.avg_hours ?? r.duration ?? r.hours ?? r.value));
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};
