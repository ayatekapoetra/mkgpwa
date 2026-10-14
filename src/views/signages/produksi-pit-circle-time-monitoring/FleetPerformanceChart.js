'use client';

import React from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, PointElement, LineElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, PointElement, LineElement);

export default function FleetPerformanceChart({ dumptrucks = [], targetCircleTime = 0 }) {
  const { palette } = useTheme();
  if (!dumptrucks.length) {
    return <p style={{ margin: 0 }}>Belum ada data dumptruck untuk fleet ini.</p>;
  }

  const labels = dumptrucks.map((item) => item.dumptruck_kode || `DT ${item.dumptruck_id}`);
  const ritaseValues = dumptrucks.map((item) => Number(item.ritase_count || 0));
  const averageCircleTimeValues = dumptrucks.map((item) => Number(item.avg_circle_time_minutes || 0));
  const statusColors = {
    effective: alpha(palette.success.main, 0.85),
    ineffective: alpha(palette.error.main, 0.85),
    insufficient_data: alpha(palette.secondary.main, 0.85)
  };
  const colors = dumptrucks.map((item) => statusColors[item.effectiveness_status] || statusColors.insufficient_data);

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
            borderColor: palette.primary.main,
            backgroundColor: palette.primary.main,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 5,
            yAxisID: 'y1'
          },
          {
            type: 'line',
            label: 'CT Target',
            data: labels.map(() => Number(targetCircleTime || 0)),
            borderColor: palette.warning.main,
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
          legend: { position: 'top', labels: { boxWidth: 16, usePointStyle: true, color: palette.text.primary } },
          tooltip: {
            backgroundColor: palette.background.paper,
            titleColor: palette.text.primary,
            bodyColor: palette.text.primary,
            borderColor: palette.divider,
            borderWidth: 1,
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
          x: { ticks: { color: palette.text.secondary }, grid: { color: palette.divider } },
          y: {
            beginAtZero: true,
            ticks: { color: palette.text.secondary },
            grid: { color: palette.divider },
            title: { display: true, text: 'Ritase', color: palette.text.primary }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: palette.text.secondary },
            title: { display: true, text: 'Menit', color: palette.text.primary }
          }
        }
      }}
    />
  );
}
