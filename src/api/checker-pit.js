import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'utils/axios';

const endpoints = {
  list: '/ritase/pit'
};

const toDateKey = (value) => {
  if (!value) return '';
  const str = String(value);
  return str.length >= 10 ? str.slice(0, 10) : str;
};

const normalizeId = (value) => {
  if (value === undefined || value === null || value === '') return '';
  return String(value);
};

const asArrayRows = (payload) => {
  if (Array.isArray(payload?.rows?.data)) return payload.rows.data;
  if (Array.isArray(payload?.data?.rows?.data)) return payload.data.rows.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const pickFirst = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
};

const normalizePitRow = (item = {}) => {
  return {
    ritase_pit_id: String(pickFirst(item.ritase_pit_id, item.id, '') || ''),
    date_ops: toDateKey(pickFirst(item.date_ops, item.starttime, item.created_at, '')),
    shift_id: normalizeId(pickFirst(item.shift_id, item.shift?.id)),
    excavator_id: normalizeId(pickFirst(item.excavator_id, item.excavator?.id)),
    excavator_kode: String(
      pickFirst(item.excavator_kode, item.excavator?.abbr, item.excavator?.kode, item.excavator?.nama, '-') || '-'
    ),
    dumptruck_id: normalizeId(pickFirst(item.dumptruck_id, item.dumptruck?.id)),
    dumptruck_kode: String(
      pickFirst(item.dumptruck_kode, item.dumptruck?.kode, item.dumptruck?.abbr, item.dumptruck?.nama, '-') || '-'
    ),
    material_id: normalizeId(pickFirst(item.material_id, item.material?.id)),
    material_nama: String(pickFirst(item.material_nama, item.material?.abbr, item.material?.nama, '-') || '-'),
    startpit_id: normalizeId(pickFirst(item.startpit_id, item.pit_id, item.startPit?.id, item.pit?.id)),
    pit_nama: String(
      pickFirst(item.pit_nama, item.startPit?.abbr, item.startPit?.nama, item.pit?.abbr, item.pit?.nama, '-') || '-'
    ),
    endstockpile_id: normalizeId(pickFirst(item.endstockpile_id, item.stockpile_id, item.endStockpile?.id, item.stockpile?.id)),
    stockpile_nama: String(
      pickFirst(item.stockpile_nama, item.endStockpile?.abbr, item.endStockpile?.nama, item.stockpile?.abbr, item.stockpile?.nama, '-') || '-'
    ),
    starttime: pickFirst(item.starttime, item.created_at, null),
    finishtime: pickFirst(item.finishtime, null),
    driver_nama: String(
      pickFirst(item.driver_nama, item.enddriver_nama, item.startdriver_nama, item.endDriver?.nama, item.startDriver?.nama, '-') || '-'
    ),
    sync_status: String(pickFirst(item.sync_status, 'SYNCED') || 'SYNCED').toUpperCase(),
    status: String(pickFirst(item.status, 'PRODUKSI') || 'PRODUKSI').toUpperCase(),
    conflict: String(pickFirst(item.conflict, 'N') || 'N').toUpperCase()
  };
};

const getMeta = (payload) => {
  const src = payload?.rows || payload?.data?.rows || payload?.data;
  return {
    total: src?.total || src?.meta?.total || 0,
    page: src?.page || src?.current_page || src?.meta?.current_page || 1,
    perPage: src?.perPage || src?.per_page || src?.meta?.per_page || 25,
    lastPage: src?.lastPage || src?.last_page || src?.meta?.last_page || 1
  };
};

const groupPitRows = (rows) => {
  const map = new Map();

  rows.forEach((item) => {
    const dateOps = toDateKey(item?.date_ops);
    const shiftId = normalizeId(item?.shift_id);
    const excavatorId = normalizeId(item?.excavator_id);
    const startpitId = normalizeId(item?.startpit_id);
    const materialId = normalizeId(item?.material_id);
    const key = [dateOps, shiftId, excavatorId, startpitId, materialId].join('|');

    if (!map.has(key)) {
      map.set(key, {
        key,
        date_ops: dateOps,
        shift_id: shiftId,
        excavator_id: excavatorId,
        excavator_kode: item?.excavator_kode || '-',
        startpit_id: startpitId,
        pit_nama: item?.pit_nama || '-',
        material_id: materialId,
        material_nama: item?.material_nama || '-',
        total_ritase: 0,
        pending: 0,
        synced: 0,
        conflict: 0,
        session_status: 'OPEN'
      });
    }

    const grouped = map.get(key);
    grouped.total_ritase += 1;

    const sync = String(item?.sync_status || '').toUpperCase();
    if (sync === 'PENDING') grouped.pending += 1;
    else if (sync === 'CONFLICT') grouped.conflict += 1;
    else grouped.synced += 1;
  });

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      session_status: item.pending === 0 ? 'CLOSED' : 'OPEN'
    }))
    .sort((a, b) => {
      const dateA = new Date(a.date_ops || 0).getTime();
      const dateB = new Date(b.date_ops || 0).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return Number(b.shift_id || 0) - Number(a.shift_id || 0);
    });
};

export const useCheckerPitGroups = (params = {}) => {
  const limitValue = params.limit === 0 ? 0 : params.limit || 500;
  const query = new URLSearchParams({
    aktif: 'Y',
    limit: String(limitValue),
    ...(params.date_ops ? { date_ops: params.date_ops } : {}),
    ...(params.shift_id ? { shift_id: params.shift_id } : {}),
    ...(params.cabang_id ? { cabang_id: params.cabang_id } : {})
  }).toString();

  const url = `${endpoints.list}?${query}`;
  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });

  const memoizedValue = useMemo(() => {
    const rows = asArrayRows(data).map(normalizePitRow);
    const grouped = groupPitRows(rows);
    const meta = getMeta(data);

    return {
      rows,
      grouped,
      meta,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && grouped.length === 0,
      mutate
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
};

export const useCheckerPitDetailScope = (params = {}) => {
  const query = new URLSearchParams({
    aktif: 'Y',
    limit: String(params.limit || 1000),
    ...(params.date_ops ? { date_ops: params.date_ops } : {}),
    ...(params.shift_id ? { shift_id: params.shift_id } : {}),
    ...(params.cabang_id ? { cabang_id: params.cabang_id } : {})
  }).toString();

  const url = `${endpoints.list}?${query}`;
  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });

  const memoizedValue = useMemo(() => {
    const rows = asArrayRows(data).map(normalizePitRow);
    const scopeRows = rows.filter((item) => {
      const matchExcavator = !params.excavator_id || item.excavator_id === String(params.excavator_id);
      const matchStartPit = !params.startpit_id || item.startpit_id === String(params.startpit_id);
      const matchMaterial = !params.material_id || item.material_id === String(params.material_id);
      return matchExcavator && matchStartPit && matchMaterial;
    });

    const pending = scopeRows.filter((item) => item.sync_status === 'PENDING').length;
    const synced = scopeRows.filter((item) => item.sync_status === 'SYNCED').length;
    const conflict = scopeRows.filter((item) => item.sync_status === 'CONFLICT' || item.conflict === 'Y').length;

    return {
      rows: scopeRows.sort((a, b) => {
        const aTime = new Date(a.starttime || 0).getTime();
        const bTime = new Date(b.starttime || 0).getTime();
        return bTime - aTime;
      }),
      stats: {
        total: scopeRows.length,
        pending,
        synced,
        conflict
      },
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    };
  }, [data, error, isLoading, isValidating, mutate, params.excavator_id, params.startpit_id, params.material_id]);

  return memoizedValue;
};
