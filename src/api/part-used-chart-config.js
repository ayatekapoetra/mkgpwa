export const endpoints = {
  topFrequencyHe: '/maintenance/signages/part-used/top-frequency-he',
  topFrequencyDt: '/maintenance/signages/part-used/top-frequency-dt',
  topFrequencyMd: '/maintenance/signages/part-used/top-frequency-md',
  topFrequencyAd: '/maintenance/signages/part-used/top-frequency-ad',
  topValueHe: '/maintenance/signages/part-used/top-value-he',
  topValueDt: '/maintenance/signages/part-used/top-value-dt',
  topValueMd: '/maintenance/signages/part-used/top-value-md',
  topValueAd: '/maintenance/signages/part-used/top-value-ad',
  dailyTrend: '/maintenance/signages/part-used/daily-trend',
  byUnit: '/maintenance/signages/part-used/by-unit',
  byCategory: '/maintenance/signages/part-used/by-category',
  gudangTopValue: '/maintenance/signages/part-used/gudang-top-value',
  gudangTopFrequency: '/maintenance/signages/part-used/gudang-top-frequency',
  gudangDailyTrend: '/maintenance/signages/part-used/gudang-daily-trend',
  gudangHeatmapCategory: '/maintenance/signages/part-used/gudang-heatmap-category',
  gudangTopSparepart: '/maintenance/signages/part-used/gudang-top-sparepart',
  cabangBubbleAll: '/maintenance/signages/part-used/cabang-bubble-all',
  cabangBubbleByUnit: '/maintenance/signages/part-used/cabang-bubble-by-unit',
  cabangBubbleByCtgUnit: '/maintenance/signages/part-used/cabang-bubble-by-ctgunit',
  cabangDtBar: '/maintenance/signages/part-used/cabang-dt-bar',
  cabangHeBar: '/maintenance/signages/part-used/cabang-he-bar',
  cabangMdBar: '/maintenance/signages/part-used/cabang-md-bar',
  cabangAdBar: '/maintenance/signages/part-used/cabang-ad-bar',
  gudangRadarNullKdunit: '/maintenance/signages/part-used/gudang-radar-null-kdunit'
};

export const EQUIPMENT_CATEGORIES = [
  { code: 'HE', color: 'rgba(5,150,105,0.85)' },
  { code: 'DT', color: 'rgba(37,99,235,0.85)' },
  { code: 'MD', color: 'rgba(217,119,6,0.85)' },
  { code: 'AD', color: 'rgba(124,58,237,0.85)' }
];

export const buildPartUsedChartUrl = (endpoint, params) => params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;

export function buildCategoryRequests(code, params, unitcabang = '') {
  if (!EQUIPMENT_CATEGORIES.some(category => category.code === code)) throw new Error(`Kategori equipment tidak valid: ${code}`);
  const suffix = code[0] + code[1].toLowerCase();
  const categoryParams = { ...params, ctgunit: code };
  const branchParams = unitcabang ? { ...params, unitcabang, ctgunit: code } : categoryParams;
  const request = (endpoint, values = params) => ({ endpoint, params: values, url: buildPartUsedChartUrl(endpoint, values) });
  return {
    topFrequency: request(endpoints[`topFrequency${suffix}`]),
    topValue: request(endpoints[`topValue${suffix}`]),
    byUnit: request(endpoints.byUnit, categoryParams),
    byCategory: request(endpoints.byCategory, categoryParams),
    cabang: request(endpoints[`cabang${suffix}Bar`]),
    equipmentByCabang: request(endpoints.byUnit, branchParams)
  };
}

export function getCategorySlideDefinitions({ code, requests }) {
  const slug = code.toLowerCase();
  return [
    { key: `top-frequency-${slug}`, field: 'topFrequency', title: `Top 20 Frekuensi (${code})` },
    { key: `top-value-${slug}`, field: 'topValue', title: `Top 20 Nilai Pemakaian (${code})` },
    { key: `by-unit-${slug}`, field: 'byUnit', title: `Pemakaian per Unit Kategori ${code}` },
    { key: `by-category-${slug}`, field: 'byCategory', title: `Pemakaian per Kategori Barang ${code}` },
    { key: `cabang-${slug}-bar`, field: 'cabang', title: `Pemakaian Unit ${code} per Cabang` }
  ].map(slide => ({ ...slide, url: requests[slide.field].url }));
}
