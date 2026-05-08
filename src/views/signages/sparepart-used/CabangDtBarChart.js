'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function CabangDtBarChart({ data, loading }) {
  if (loading) return <p>Loading...</p>;
  if (!data?.length) return <p>No data available</p>;

  const rows = data.slice(0, 15);
  return (
    <Bar
      data={{
        labels: rows.map((r) => r.unitcabang || r.kdcabang),
        datasets: [{ label: 'Nilai DT (Juta)', data: rows.map((r) => Number(r.total_value || 0) / 1000000), backgroundColor: 'rgba(37,99,235,0.8)' }]
      }}
      options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
    />
  );
}
