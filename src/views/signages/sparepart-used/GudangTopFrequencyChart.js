'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function GudangTopFrequencyChart({ data, loading }) {
  if (loading) return <p>Loading...</p>;
  if (!data?.length) return <p>No data available</p>;

  const rows = data.slice(0, 10);
  const labels = rows.map((r) => r.kdgudang || 'UNASSIGNED');
  const values = rows.map((r) => Number(r.frequency || 0));

  return <Bar data={{ labels, datasets: [{ label: 'Frekuensi', data: values, backgroundColor: 'rgba(30,64,175,0.8)' }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true } } }} />;
}
