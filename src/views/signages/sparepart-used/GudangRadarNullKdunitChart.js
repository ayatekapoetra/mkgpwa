'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const pointLabelPlugin = {
  id: 'pointLabelPlugin',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save();
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.hidden) return;
      meta.data.forEach((point, index) => {
        const rawVal = Number(dataset.data[index] || 0);
        const label = datasetIndex === 0 ? rawVal.toFixed(1) : rawVal.toString();
        ctx.fillStyle = datasetIndex === 0 ? '#b91c1c' : '#1d4ed8';
        ctx.fillText(label, point.x, point.y - 8);
      });
    });

    ctx.restore();
  }
};

export default function GudangRadarNullKdunitChart({ data, average, loading }) {
  if (loading) return <p>Loading...</p>;
  if (!data?.length) return <p>No data kdunit null</p>;

  const rows = data.slice(0, 12);
  const labels = rows.map((r) => r.kdgudang || 'UNASSIGNED');
  const values = rows.map((r) => Number(r.total_value || 0) / 1000000);
  const frequencyItems = rows.map((r) => Number(r.frequency || 0));
  const avgValue = Number(average?.total_value || 0) / 1000000;
  const avgFreq = Number(average?.frequency || 0);

  return (
    <Line
      plugins={[pointLabelPlugin]}
      data={{
        labels,
        datasets: [
          {
            label: 'Nilai (Juta) - kdunit null',
            data: values,
            backgroundColor: 'rgba(239,68,68,0.2)',
            borderColor: 'rgba(239,68,68,0.9)',
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0.25,
            yAxisID: 'y'
          },
          {
            label: 'Frekuensi Barang Keluar',
            data: frequencyItems,
            borderColor: 'rgba(37,99,235,0.95)',
            backgroundColor: 'rgba(37,99,235,0.25)',
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0.25,
            yAxisID: 'y1'
          },
          ...(avgValue > 0 ? [{ label: 'Avg Nilai', data: labels.map(() => avgValue), borderColor: '#991b1b', borderDash: [6, 6], borderWidth: 2, pointRadius: 0, pointHoverRadius: 0, fill: false, tension: 0, yAxisID: 'y' }] : []),
          ...(avgFreq > 0 ? [{ label: 'Avg Frekuensi', data: labels.map(() => avgFreq), borderColor: '#4338ca', borderDash: [6, 6], borderWidth: 2, pointRadius: 0, pointHoverRadius: 0, fill: false, tension: 0, yAxisID: 'y1' }] : [])
        ]
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true } },
        scales: {
          y: { type: 'linear', position: 'left', title: { display: true, text: 'Nilai (Juta)' } },
          y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Frekuensi Keluar' } }
        }
      }}
    />
  );
}
