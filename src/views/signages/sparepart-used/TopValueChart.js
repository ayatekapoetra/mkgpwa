'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function TopValueChart({ data, loading }) {
  if (loading) return <p>Loading...</p>;
  if (!data?.length) return <p>No data available</p>;

  const rows = data.slice(0, 20);
  const labels = rows.map((r) => r.nmbarang || r.kdbarang || `ID ${r.idbarang}`);
  const values = rows.map((r) => Number(r.total_value || 0) / 1000000);

  return (
    <Bar
      data={{
        labels,
        datasets: [{ label: 'Nilai (Juta)', data: values, backgroundColor: 'rgba(14, 165, 233, 0.8)' }]
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
