'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const pointLabelPlugin = {
  id: 'cabangPointLabelPlugin',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '11px sans-serif';

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.hidden) return;

      meta.data.forEach((point, index) => {
        const raw = Number(dataset.data[index] || 0);
        const text = dataset.yAxisID === 'y' ? raw.toFixed(1) : Math.round(raw).toString();
        ctx.fillStyle = dataset.yAxisID === 'y' ? '#0369a1' : '#c2410c';
        ctx.fillText(text, point.x, point.y - 8);
      });
    });

    ctx.restore();
  }
};

export default function CabangBubbleAllChart({ data, average, loading }) {
  if (loading) return <p>Loading...</p>;
  if (!data?.length) return <p>No data available</p>;

  const cabangLabels = [...new Set(data.map((r) => r.unitcabang || r.kdcabang || 'UNASSIGNED'))];
  const avgValue = Number(average?.total_value || 0) / 1000000;
  const avgFreq = Number(average?.frequency || 0);

  const valueMap = {};
  const freqMap = {};
  data.forEach((r) => {
    const xLabel = r.unitcabang || r.kdcabang || 'UNASSIGNED';
    valueMap[xLabel] = (valueMap[xLabel] || 0) + Number(r.total_value || 0) / 1000000;
    freqMap[xLabel] = (freqMap[xLabel] || 0) + Number(r.frequency || 0);
  });

  const datasets = [
    {
      label: 'Nilai Pemakaian (Juta)',
      data: cabangLabels.map((x) => valueMap[x] || 0),
      borderColor: '#0ea5e9',
      backgroundColor: '#0ea5e9',
      tension: 0.25,
      pointRadius: 0,
      pointHoverRadius: 0,
      yAxisID: 'y'
    },
    {
      label: 'Frekuensi',
      data: cabangLabels.map((x) => freqMap[x] || 0),
      borderColor: '#f97316',
      backgroundColor: 'rgba(249,115,22,0.24)',
      tension: 0.25,
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: true,
      yAxisID: 'y1'
    },
    ...(avgValue > 0 ? [{ label: 'Avg Nilai', data: cabangLabels.map(() => avgValue), borderColor: '#ef4444', borderDash: [6, 6], borderWidth: 2, pointRadius: 0, pointHoverRadius: 0, fill: false, tension: 0, yAxisID: 'y' }] : []),
    ...(avgFreq > 0 ? [{ label: 'Avg Frekuensi', data: cabangLabels.map(() => avgFreq), borderColor: '#7c3aed', borderDash: [6, 6], borderWidth: 2, pointRadius: 0, pointHoverRadius: 0, fill: false, tension: 0, yAxisID: 'y1' }] : [])
  ];

  return (
    <Line
      plugins={[pointLabelPlugin]}
      data={{ labels: cabangLabels, datasets }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true } },
        scales: {
          x: { title: { display: true, text: 'Unit Cabang' } },
          y: { type: 'linear', position: 'left', title: { display: true, text: 'Total Nilai (Juta)' } },
          y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Frekuensi' } }
        }
      }}
    />
  );
}
