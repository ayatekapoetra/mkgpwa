'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function DailyTrendChart({ data, average, loading }) {
  if (loading) return <p>Loading...</p>;
  if (!data?.length) return <p>No data available</p>;

  const rows = data;
  const labels = rows.map((r) => r.date);
  const qty = rows.map((r) => Number(r.total_qtyused || 0));
  const value = rows.map((r) => Number(r.total_value || 0) / 1000000);
  const avgQty = Number(average?.total_qtyused || 0);
  const avgValue = Number(average?.total_value || 0) / 1000000;

  return (
    <Line
      data={{
        labels,
        datasets: [
          { label: 'Qty Used', data: qty, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.2)', yAxisID: 'y' },
          { label: 'Nilai (Juta)', data: value, borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,0.2)', yAxisID: 'y1' },
          ...(avgQty > 0 ? [{ label: 'Avg Qty', data: labels.map(() => avgQty), borderColor: '#1d4ed8', borderDash: [6, 6], borderWidth: 2, pointRadius: 0, pointHoverRadius: 0, yAxisID: 'y' }] : []),
          ...(avgValue > 0 ? [{ label: 'Avg Nilai', data: labels.map(() => avgValue), borderColor: '#ef4444', borderDash: [6, 6], borderWidth: 2, pointRadius: 0, pointHoverRadius: 0, yAxisID: 'y1' }] : [])
        ]
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: { type: 'linear', position: 'left' },
          y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false } }
        }
      }}
    />
  );
}
