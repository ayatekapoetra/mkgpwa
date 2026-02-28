'use client';
import React from 'react';
import { Line } from 'react-chartjs-2';
import moment from 'moment';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Plugin for data labels on line chart points
const approvalTrendLabelsPlugin = {
  id: 'approvalTrendLabelsPlugin',
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    const dataset = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);
    
    meta.data.forEach((point, index) => {
      const value = dataset.data[index];
      if (value === 0) return; // Skip if no data

      const { x, y } = point;
      ctx.save();
      ctx.font = '600 10px Poppins, sans-serif';
      ctx.fillStyle = '#059669'; // Green (matching line color)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(value.toString(), x, y - 8);
      ctx.restore();
    });
  }
};

export default function PrApprovalTrendChart({ data, loading }) {
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
    const dateA = parseDateValue(a.date || a.date_validated);
    const dateB = parseDateValue(b.date || b.date_validated);
    if (!dateA || !dateB) return 0;
    return dateA.valueOf() - dateB.valueOf();
  });

  // Extract labels and counts
  const labels = sortedData.map(item => {
    const parsed = parseDateValue(item.date || item.date_validated);
    return parsed ? parsed.format('DD MMM') : item.date_validated;
  });

  const approvedCounts = sortedData.map(item => item.approved_count || 0);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'PR Approved',
        data: approvedCounts,
        borderColor: '#10b981', // Green
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
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
            size: 11,
            weight: 'bold'
          },
          padding: 12,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: function (context) {
            const value = context.raw || 0;
            return `Approved: ${value} berkas`;
          }
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 10
          },
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 10
          },
          stepSize: 1,
          precision: 0
        },
        title: {
          display: true,
          text: 'Jumlah PR Approved',
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
      <Line data={chartData} options={options} plugins={[approvalTrendLabelsPlugin]} />
    </div>
  );
}
