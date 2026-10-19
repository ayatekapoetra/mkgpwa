import moment from 'moment';

const query = (params) => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)).toString();

export function buildHomeDashboardRequests(filters = {}) {
  const date = moment(filters.date_ops || undefined);
  const end = date.format('YYYY-MM-DD');
  const start = date.clone().startOf('month').format('YYYY-MM-DD');
  const cabang = filters.cabang_id ? { cabang_id: filters.cabang_id } : {};
  const range = { start_date: start, end_date: end };
  const partRange = { ...range, ...(filters.cabang_id && filters.unitcabang ? { unitcabang: filters.unitcabang } : {}), limit: 8, mode: 'raw' };
  const url = (endpoint, params) => `${endpoint}?${query(params)}`;

  return {
    ritase: url('/public/ritase/signage/summary', { date_ops: end, ...cabang }),
    polar: url('/maintenance/signages/breakdown/chart-polar', { ...cabang, startdate: date.clone().subtract(3, 'months').format('YYYY-MM-DD'), enddate: end }),
    trendMonthly: url('/maintenance/signages/breakdown/breakdown-trend-monthly', { ...cabang, startdate: date.clone().subtract(5, 'months').startOf('month').format('YYYY-MM-DD'), enddate: end }),
    prAging: url('/monitoring/signages/purchasing/usia-berkas', { ...cabang, enddate: end, as_of_date: end }),
    payments: url('/scm/order-payments/summary', { ...cabang, date_end: end, sts_code: 0 }),
    partTopHe: url('/maintenance/signages/part-used/top-value-he', partRange),
    partTopDt: url('/maintenance/signages/part-used/top-value-dt', partRange),
    partTopMd: url('/maintenance/signages/part-used/top-value-md', partRange),
    partTopAd: url('/maintenance/signages/part-used/top-value-ad', partRange)
  };
}
