'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, PointElement, LineElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, PointElement, LineElement);

const STATUS_COLORS = {
  effective: 'rgba(22,163,74,0.85)',
  ineffective: 'rgba(220,38,38,0.85)',
  insufficient_data: 'rgba(148,163,184,0.85)'
};

export default function FleetPerformanceChart({ dumptrucks = [], averageFleetCircleTime = 0 }) {
  if (!dumptrucks.length) {
    return <p style={{ margin: 0 }}>Belum ada data dumptruck untuk fleet ini.</p>;
  }

  const labels = dumptrucks.map((item) => item.dumptruck_kode || `DT ${item.dumptruck_id}`);
  const ritaseValues = dumptrucks.map((item) => Number(item.ritase_count || 0));
  const averageCircleTimeValues = dumptrucks.map((item) => Number(item.avg_circle_time_minutes || 0));
  const colors = dumptrucks.map((item) => STATUS_COLORS[item.effectiveness_status] || STATUS_COLORS.insufficient_data);

  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Ritase',
            data: ritaseValues,
            backgroundColor: colors,
            borderRadius: 8,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'Avg CT Dumptruck',
            data: averageCircleTimeValues,
            borderColor: '#2563eb',
            backgroundColor: '#2563eb',
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 5,
            yAxisID: 'y1'
          },
          {
            type: 'line',
            label: 'Avg CT Fleet',
            data: labels.map(() => Number(averageFleetCircleTime || 0)),
            borderColor: '#f59e0b',
            borderDash: [6, 6],
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0,
            yAxisID: 'y1'
          }
        ]
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 16, usePointStyle: true } },
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const idx = items?.[0]?.dataIndex;
                const row = dumptrucks[idx];
                if (!row) return [];
                return [
                  `Trip valid: ${row.valid_trip_count || 0}`,
                  `Status: ${row.effectiveness_status || '-'}`,
                  `Delta vs fleet: ${Number(row.delta_vs_fleet_minutes || 0)} menit`
                ];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Ritase' }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Menit' }
          }
        }
      }}
    />
  );
}
