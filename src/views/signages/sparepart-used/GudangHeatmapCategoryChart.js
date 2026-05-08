'use client';

import React from 'react';

const color = (v, max) => {
  if (!max) return 'transparent';
  const alpha = Math.min(0.9, Math.max(0.1, v / max));
  return `rgba(14, 116, 144, ${alpha})`;
};

export default function GudangHeatmapCategoryChart({ data, loading }) {
  if (loading) return <p>Loading...</p>;
  if (!data?.length) return <p>No data available</p>;

  const gudangs = [...new Set(data.map((r) => r.kdgudang || 'UNASSIGNED'))].slice(0, 8);
  const categories = [...new Set(data.map((r) => r.ctgbarang || 'UNASSIGNED'))].slice(0, 8);
  const max = Math.max(...data.map((r) => Number(r.total_value || 0)));
  const map = {};
  data.forEach((r) => {
    map[`${r.kdgudang || 'UNASSIGNED'}__${r.ctgbarang || 'UNASSIGNED'}`] = Number(r.total_value || 0);
  });

  return (
    <div style={{ overflow: 'auto', height: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 6 }}>Gudang</th>
            {categories.map((c) => (
              <th key={c} style={{ textAlign: 'center', padding: 6 }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {gudangs.map((g) => (
            <tr key={g}>
              <td style={{ padding: 6, borderTop: '1px solid #eee' }}>{g}</td>
              {categories.map((c) => {
                const val = map[`${g}__${c}`] || 0;
                return (
                  <td key={`${g}-${c}`} style={{ padding: 6, textAlign: 'center', borderTop: '1px solid #eee', background: color(val, max), color: val > max * 0.55 ? 'white' : '#0f172a' }}>
                    {(val / 1000000).toFixed(1)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
