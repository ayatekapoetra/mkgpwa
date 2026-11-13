import useSWR from 'swr';
import { fetcher } from 'utils/axios';

export const endpoints = {
  harianPelanggan: '/ritase/laporan/harian-pelanggan'
};

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      q.set(k, String(v));
    }
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function useGetLaporanHarianPelanggan(params = {}, enabled = true) {
  const isEnabled = enabled && Boolean(params.bisnis_id && params.penyewa_id && params.start_date && params.end_date);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    isEnabled ? `${endpoints.harianPelanggan}${buildQuery(params)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const payload = data?.rows ?? data?.data ?? data ?? {};
  const rows = Array.isArray(payload?.rows)
    ? payload.rows
    : Array.isArray(payload)
      ? payload
      : [];
  const total = payload?.total || null;

  return {
    rows,
    total,
    bisnisInitial: payload?.bisnis_initial || '',
    penyewaAbbr: payload?.penyewa_abbr || '',
    loading: isLoading,
    validating: isValidating,
    error,
    refresh: mutate
  };
}
