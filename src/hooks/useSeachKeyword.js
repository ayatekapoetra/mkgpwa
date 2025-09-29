'use client';

import { useMemo } from 'react';

/**
 * Cari item berdasarkan array key dan keyword dalam array of object
 * @param {Array} data - array data
 * @param {Array<string>} keys - array key yang ingin dicari
 * @param {string} keyword - kata kunci pencarian
 * @returns {Array} hasil pencarian yang cocok
 */
export function useSeachKeyword(data, keys = [], keyword = '') {
  const result = useMemo(() => {
    if (!Array.isArray(data) || !keyword || !keys.length) return data || [];

    const lowerKeyword = keyword.toLowerCase();

    return data.filter((item) =>
      keys.some((key) => {
        const value = item?.[key];
        return typeof value === 'string' && value.toLowerCase().includes(lowerKeyword);
      })
    );
  }, [data, keys, keyword]); // ✅ sekarang tidak ada warning

  return result;
}
