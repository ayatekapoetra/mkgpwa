'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function GudangDailyTrendChart({ data, loading }) {
  if (loading) return <p>Loading...</p>;
  if (!data?.length) return <p>No data available</p>;

  const dates = [...new Set(data.map((r) => r.date))].sort();
  const gudangs = [...new Set(data.map((r) => r.kdgudang || 'UNASSIGNED'))].slice(0, 5);

  const datasets = gudangs.map((g, idx) => {
    const map = {};
    data.forEach((r) => {
      if ((r.kdgudang || 'UNASSIGNED') === g) map[r.date] = Number(r.total_value || 0) / 1000000;
    });
    const palette = ['#1d4ed8', '#0ea5e9', '#059669', '#d97706', '#be123c'];
    return {
      label: g,
      data: dates.map((d) => map[d] || 0),
      borderColor: palette[idx % palette.length],
      backgroundColor: palette[idx % palette.length],
      tension: 0.25
    };
  });

  return <Line data={{ labels: dates, datasets }} options={{ responsive: true, maintainAspectRatio: false }} />;
}
