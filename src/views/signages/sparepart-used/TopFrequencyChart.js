'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, PointElement, LineElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, PointElement, LineElement);

export default function TopFrequencyChart({ data, average, loading }) {
  if (loading) return <p>Loading...</p>;
  if (!data?.length) return <p>No data available</p>;

  const rows = data.slice(0, 20);
  const labels = rows.map((r) => r.nmbarang || r.kdbarang || `ID ${r.idbarang}`);
  const values = rows.map((r) => Number(r.frequency || 0));
  const averageValue = Number(average?.frequency || 0);

  return (
    <Bar
      data={{
        labels,
        datasets: [
          { label: 'Frekuensi', data: values, backgroundColor: 'rgba(37, 99, 235, 0.8)' },
          ...(averageValue > 0 ? [{ type: 'line', label: 'Avg', data: labels.map(() => averageValue), borderColor: '#ef4444', borderDash: [6, 6], borderWidth: 2, pointRadius: 0, pointHoverRadius: 0 }] : [])
        ]
      }}
      options={{
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }}
    />
  );
}
