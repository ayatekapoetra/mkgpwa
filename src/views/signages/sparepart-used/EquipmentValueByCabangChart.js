'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, PointElement, LineElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, PointElement, LineElement);

export default function EquipmentValueByCabangChart({ data, average, loading, color = 'rgba(16,185,129,0.8)' }) {
  if (loading) return <p>Loading...</p>;
  if (!data?.length) return <p>No data available</p>;

  const rows = [...data].sort((a, b) => Number(b.total_value || 0) - Number(a.total_value || 0)).slice(0, 25);
  const labels = rows.map((r) => r.kdunit || 'UNASSIGNED');
  const values = rows.map((r) => Number(r.total_value || 0) / 1000000);
  const averageValue = Number(average?.total_value || 0) / 1000000;

  return (
    <Bar
      data={{ labels, datasets: [{ label: 'Nilai (Juta)', data: values, backgroundColor: color }, ...(averageValue > 0 ? [{ type: 'line', label: 'Avg', data: labels.map(() => averageValue), borderColor: '#ef4444', borderDash: [6, 6], borderWidth: 2, pointRadius: 0, pointHoverRadius: 0 }] : [])] }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Nilai: ${Number(ctx.raw || 0).toFixed(2)} Juta`
            }
          }
        }
      }}
    />
  );
}
