'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function ByCategoryChart({ data, loading }) {
  if (loading) return <p>Loading...</p>;
  if (!data?.length) return <p>No data available</p>;

  const labels = data.map((r) => r.ctgbarang || 'UNASSIGNED');
  const values = data.map((r) => Number(r.total_value || 0) / 1000000);

  return (
    <Bar
      data={{
        labels,
        datasets: [{ label: 'Nilai (Juta)', data: values, backgroundColor: 'rgba(245, 158, 11, 0.8)' }]
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }}
    />
  );
}
