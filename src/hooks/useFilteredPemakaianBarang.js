import { useMemo, useCallback } from 'react';

export const useFilteredPemakaianBarang = (data, params) => {
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    if (!params.itemName) return data;
    return data.filter(
      (item) =>
        item && typeof item === 'object' && item.nama_barang && item.nama_barang.toLowerCase().includes(params.itemName.toLowerCase())
    );
  }, [data, params.itemName]);

  const calculateTotal = useCallback((row) => {
    if (row.Total) return row.Total;
    let total = 0;
    Object.values(row).forEach((value) => {
      if (typeof value === 'number') total += value;
    });
    return total;
  }, []);

  return { filteredData, calculateTotal };
};
