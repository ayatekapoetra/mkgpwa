'use client';
import React from 'react';
import { PolarArea } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend, Title);

export default function UsiaBerikasChart({ data, loading, meta }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <p>Loading Usia Berkas...</p>
      </div>
    );
  }

  const hasData = Array.isArray(data) && data.length > 0 && data.some((item) => (item?.count || 0) > 0);

  if (!hasData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <p style={{ color: '#ef4444' }}>No usia berkas data available</p>
      </div>
    );
  }

  const labels = data.map((item) => item.label);
  const counts = data.map((item) => Number(item.count) || 0);
  const percentages = data.map((item) => Number(item.percentage) || 0);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Usia Berkas',
        data: counts,
        backgroundColor: colors.slice(0, counts.length),
        borderColor: '#ffffff',
        borderWidth: 1
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
            size: 10,
            weight: 'bold'
          },
          boxWidth: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 12,
          weight: 'bold'
        },
        bodyFont: {
          size: 11
        },
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const count = context.raw || 0;
            const percentage = percentages[context.dataIndex] ?? 0;
            return `${label}: ${count} berkas (${percentage}% )`;
          },
          footer: () => {
            if (!meta?.total_berkas) return '';
            return `Total: ${meta.total_berkas} berkas`;
          }
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      r: {
        ticks: {
          backdropColor: 'rgba(255,255,255,0.8)',
          font: {
            size: 10
          },
          precision: 0
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <PolarArea data={chartData} options={options} />
    </div>
  );
}
