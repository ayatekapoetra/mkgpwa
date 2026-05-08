'use client';

import React from 'react';

export default function GudangTopSparepartChart({ data, loading }) {
  if (loading) return <p>Loading...</p>;
  if (!data?.length) return <p>No data available</p>;

  const rows = data.slice(0, 6);

  return (
    <div style={{ overflow: 'auto', height: '100%' }}>
      {rows.map((g) => (
        <div key={g.kdgudang} style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{g.kdgudang}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 4 }}>Part</th>
                <th style={{ textAlign: 'right', padding: 4 }}>Freq</th>
              </tr>
            </thead>
            <tbody>
              {(g.items || []).slice(0, 5).map((it) => (
                <tr key={`${g.kdgudang}-${it.idbarang}`}>
                  <td style={{ padding: 4, borderTop: '1px solid #eee' }}>{it.nmbarang || it.kdbarang}</td>
                  <td style={{ padding: 4, borderTop: '1px solid #eee', textAlign: 'right' }}>{it.frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
