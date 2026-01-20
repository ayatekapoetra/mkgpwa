'use client';
import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

export default function MetodeDistributionChart({ data, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <p style={{ color: 'error.main' }}>No data available</p>
      </div>
    );
  }

  // Extract labels and data
  const labels = data.map(item => item.metode || 'N/A');
  const counts = data.map(item => item.count || 0);

  // Generate colors - different scheme from Prioritas
  const colors = [
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#10b981', // green
    '#f97316', // orange
    '#6366f1', // indigo
    '#ef4444', // red
    '#14b8a6', // teal
    '#84cc16'  // lime
  ];

  const backgroundColors = data.map((_, index) => colors[index % colors.length]);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Jumlah',
        data: counts,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color),
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 11
          },
          padding: 12,
          boxWidth: 10,
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const item = data[i];
                const percentage = item?.percentage || 0;
                return {
                  text: `${label}: ${value} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const dataIndex = context.dataIndex;
            const percentage = data[dataIndex]?.percentage || 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      title: {
        display: false
      }
    },
    layout: {
      padding: {
        right: 10,
        left: 10,
        top: 5,
        bottom: 5
      }
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}
