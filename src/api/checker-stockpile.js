import useSWR from 'swr';
import { useEffect, useMemo } from 'react';

import { fetcher } from 'utils/axios';

const endpoints = {
  list: '/ritase/stockpile',
  unmatched: '/ritase/unmatched'
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

const normalizeDomToken = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

const normalizeStockpileRow = (item = {}) => {
  // console.log('normalizeStockpileRow---', item);
  
  const domId = normalizeId(pickFirst(item.dom_id, item.dom?.id));
  const domCode = String(pickFirst(item.dom_code, item.dom_number, item.no_dom, item.dom?.no_dom, item.dom?.nama, domId, '-') || '-');

  return {
    ritase_stockpile_id: String(pickFirst(item.ritase_stockpile_id, item.id, '') || ''),
    date_ops: toDateKey(pickFirst(item.date_ops, item.finishtime, item.created_at, '')),
    shift_id: normalizeId(pickFirst(item.shift_id, item.shift?.id)),
    material_id: normalizeId(pickFirst(item.material_id, item.material?.id)),
    material_nama: String(pickFirst(item.material_nama, item.material?.abbr, item.material?.nama, '-') || '-'),
    stockpile_id: normalizeId(pickFirst(item.stockpile_id, item.stockpile?.id)),
    stockpile_nama: String(pickFirst(item.stockpile_nama, item.stockpile?.abbr, item.stockpile?.nama, '-') || '-'),
    dumptruck_id: normalizeId(pickFirst(item.dumptruck_id, item.dumptruck?.id)),
    dumptruck_kode: String(pickFirst(item.dumptruck_kode, item.dumptruck?.kode, item.dumptruck?.abbr, item.dumptruck?.nama, '-') || '-'),
    enddriver_id: normalizeId(pickFirst(item.enddriver_id, item.endDriver?.id)),
    driver_nama: String(pickFirst(item.enddriver_nama, item.driver_nama, item.endDriver?.nama, '-') || '-'),
    dom_id: domId,
    dom_code: domCode,
    dom_token: normalizeDomToken(domCode || domId),
    finishtime: pickFirst(item.finishtime, item.created_at, null),
    sync_status: String(pickFirst(item.sync_status, 'SYNCED') || 'SYNCED').toUpperCase(),
    status: String(pickFirst(item.status, 'PRODUKSI') || 'PRODUKSI').toUpperCase(),
    conflict: String(pickFirst(item.conflict, 'N') || 'N').toUpperCase(),
    truck_type: String(pickFirst(item.truck_type, '-') || '-'),
    kondisi_material: String(pickFirst(item.kondisi_material, '-') || '-')
  };
};

const groupStockpileRows = (rows) => {
  const map = new Map();

  rows.forEach((item) => {
    const dateOps = toDateKey(item?.date_ops);
    const shiftId = normalizeId(item?.shift_id);
    const materialId = normalizeId(item?.material_id);
    const stockpileId = normalizeId(item?.stockpile_id);
    const domId = normalizeId(item?.dom_id);
    const key = [dateOps, shiftId, materialId, stockpileId, domId].join('|');

    if (!map.has(key)) {
      map.set(key, {
        key,
        date_ops: dateOps,
        shift_id: shiftId,
        material_id: materialId,
        material_nama: item?.material_nama || '-',
        kondisi_material: item?.kondisi_material || '-',
        stockpile_id: stockpileId,
        stockpile_nama: item?.stockpile_nama || '-',
        dom_id: domId,
        dom_code: item?.dom_code || domId || '-',
        dom_token: item?.dom_token || normalizeDomToken(item?.dom_code || domId),
        total_ritase: 0,
        total_dumptruck: 0,
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
      total_dumptruck: 0,
      session_status: item.pending === 0 ? 'CLOSED' : 'OPEN'
    }))
    .sort((a, b) => {
      const dateA = new Date(a.date_ops || 0).getTime();
      const dateB = new Date(b.date_ops || 0).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return Number(b.shift_id || 0) - Number(a.shift_id || 0);
    });
};

const countUniqueDumptruckPerGroup = (rows, groupedRows) => {
  const dumptruckSets = new Map();
  rows.forEach((item) => {
    const key = [
      toDateKey(item?.date_ops),
      normalizeId(item?.shift_id),
      normalizeId(item?.material_id),
      normalizeId(item?.stockpile_id),
      normalizeId(item?.dom_id)
    ].join('|');

    if (!dumptruckSets.has(key)) dumptruckSets.set(key, new Set());
    const dumptruckId = normalizeId(item?.dumptruck_id);
    if (dumptruckId) dumptruckSets.get(key).add(dumptruckId);
  });

  return groupedRows.map((item) => ({
    ...item,
    total_dumptruck: dumptruckSets.get(item.key)?.size || 0
  }));
};

export const useCheckerStockpileGroups = (params = {}) => {
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

  useEffect(() => {
    if (!data) return;

    const rows = asArrayRows(data).map(normalizeStockpileRow);
    const groupedBase = groupStockpileRows(rows);
    const grouped = countUniqueDumptruckPerGroup(rows, groupedBase);


  }, [data]);

  const memoizedValue = useMemo(() => {
    const rows = asArrayRows(data).map(normalizeStockpileRow);
    const groupedBase = groupStockpileRows(rows);
    const grouped = countUniqueDumptruckPerGroup(rows, groupedBase);

    return {
      rows,
      grouped,
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && grouped.length === 0,
      mutate
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
};

export const useCheckerStockpileDetailScope = (params = {}) => {
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
    const rows = asArrayRows(data).map(normalizeStockpileRow);
    const wantedDom = normalizeDomToken(params.dom_id);

    const scopeRows = rows.filter((item) => {
      const matchMaterial = !params.material_id || item.material_id === String(params.material_id);
      const matchStockpile = !params.stockpile_id || item.stockpile_id === String(params.stockpile_id);
      const matchDom =
        !params.dom_id ||
        item.dom_id === String(params.dom_id) ||
        item.dom_token === wantedDom ||
        normalizeDomToken(item.dom_id) === wantedDom;

      return matchMaterial && matchStockpile && matchDom;
    });

    const pending = scopeRows.filter((item) => item.sync_status === 'PENDING').length;
    const synced = scopeRows.filter((item) => item.sync_status === 'SYNCED').length;
    const conflict = scopeRows.filter((item) => item.sync_status === 'CONFLICT' || item.conflict === 'Y').length;

    return {
      rows: scopeRows.sort((a, b) => {
        const aTime = new Date(a.finishtime || 0).getTime();
        const bTime = new Date(b.finishtime || 0).getTime();
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
  }, [data, error, isLoading, isValidating, mutate, params.dom_id, params.material_id, params.stockpile_id]);

  return memoizedValue;
};

export const useCheckerStockpileUnmatchedCount = (params = {}) => {
  const query = new URLSearchParams({
    per_page: '1',
    ...(params.cabang_id ? { cabang_id: params.cabang_id } : {})
  }).toString();
  const url = `${endpoints.unmatched}?${query}`;

  const { data, isLoading, error } = useSWR(url, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });

  const value = useMemo(() => {
    const total =
      data?.data?.meta?.total ||
      data?.rows?.total ||
      data?.total ||
      (Array.isArray(data?.data?.data) ? data.data.data.length : 0);

    return {
      total: Number(total || 0),
      loading: isLoading,
      error
    };
  }, [data, isLoading, error]);

  return value;
};
