'use client';
import React from 'react';
import { Bar } from 'react-chartjs-2';
import moment from 'moment';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Predefined colors for different users
const USER_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1'  // indigo
];

// Plugin for data labels on top of stacked bars
const top10CreatorsLabelsPlugin = {
  id: 'top10CreatorsLabelsPlugin',
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    
    // Calculate total for each x position
    const totals = {};
    chart.data.datasets.forEach((dataset) => {
      dataset.data.forEach((value, index) => {
        if (!totals[index]) totals[index] = 0;
        totals[index] += value;
      });
    });

    // Draw total label on top of each stacked bar
    const meta = chart.getDatasetMeta(chart.data.datasets.length - 1); // Last dataset (top of stack)
    meta.data.forEach((bar, index) => {
      const total = totals[index];
      if (total === 0) return; // Skip if no data

      const { x, y } = bar;
      ctx.save();
      ctx.font = '600 10px Poppins, sans-serif';
      ctx.fillStyle = '#374151'; // Dark gray
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(total.toString(), x, y - 5);
      ctx.restore();
    });
  }
};

export default function Top10CreatorsChart({ data, users, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0 || !users || users.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <p style={{ color: '#ef4444' }}>No data available</p>
      </div>
    );
  }

  // Parse and format dates
  const parseDateValue = (value) => {
    if (!value) return null;
    let parsed = moment(value, moment.ISO_8601, true);
    if (!parsed.isValid()) {
      parsed = moment(value);
    }
    return parsed.isValid() ? parsed : null;
  };

  // Sort data by date
  const sortedData = [...data].sort((a, b) => {
    const dateA = parseDateValue(a.date || a.date_ro);
    const dateB = parseDateValue(b.date || b.date_ro);
    if (!dateA || !dateB) return 0;
    return dateA.valueOf() - dateB.valueOf();
  });

  // Extract labels
  const labels = sortedData.map(item => {
    const parsed = parseDateValue(item.date || item.date_ro);
    return parsed ? parsed.format('DD MMM') : item.date_ro;
  });

  // Create datasets for each user (stacked bar)
  const datasets = users.map((user, index) => {
    const userKey = `user_${user.user_id}`;
    const userData = sortedData.map(item => item[userKey] || 0);
    
    return {
      label: user.name,
      data: userData,
      backgroundColor: USER_COLORS[index % USER_COLORS.length],
      borderColor: USER_COLORS[index % USER_COLORS.length],
      borderWidth: 1,
      stack: 'stack0'
    };
  });

  const chartData = {
    labels: labels,
    datasets: datasets
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 9,
            weight: 'bold'
          },
          padding: 8,
          boxWidth: 10,
          usePointStyle: true
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
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value} PR`;
          }
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 9
          },
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 9
          },
          stepSize: 1,
          precision: 0
        },
        title: {
          display: true,
          text: 'Jumlah PR',
          font: {
            size: 11,
            weight: 'bold'
          }
        }
      }
    }
  };

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <Bar data={chartData} options={options} plugins={[top10CreatorsLabelsPlugin]} />
    </div>
  );
}
