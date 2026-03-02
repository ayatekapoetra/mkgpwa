'use client';
import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import moment from 'moment';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Plugin for data labels on line chart points
const checkedTrendLabelsPlugin = {
  id: 'checkedTrendLabelsPlugin',
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    // Assume first dataset is line (total)
    const lineMeta = chart.getDatasetMeta(0);
    const lineDataset = chart.data.datasets[0];

    lineMeta.data.forEach((point, index) => {
      const value = lineDataset.data[index];
      if (value === 0) return;

      const { x, y } = point;
      ctx.save();
      ctx.font = '600 10px Poppins, sans-serif';
      ctx.fillStyle = '#059669';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(value.toString(), x, y - 8);
      ctx.restore();
    });
  }
};

export default function PrCheckedTrendChart({ data, users = [], loading }) {
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
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const dateA = parseDateValue(a.date || a.date_validated);
      const dateB = parseDateValue(b.date || b.date_validated);
      if (!dateA || !dateB) return 0;
      return dateA.valueOf() - dateB.valueOf();
    });
  }, [data]);

  // Extract labels and counts
  const labels = sortedData.map(item => {
    const parsed = parseDateValue(item.date || item.date_validated);
    return parsed ? parsed.format('DD MMM') : item.date_validated;
  });

  const approvedCounts = sortedData.map(item => item.approved_count || 0);

  // Colors palette for users + others
  const userColors = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#14b8a6'];

  // Build bar datasets per user (top users) and one for others
  const barDatasets = (users || []).map((u, idx) => {
    const color = userColors[idx % userColors.length];
    return {
      type: 'bar',
      label: u.name || `User ${u.user_id}`,
      data: sortedData.map(item => {
        const found = (item.users || []).find(x => x.user_id === u.user_id);
        return found ? found.count || 0 : 0;
      }),
      backgroundColor: color,
      borderColor: color,
      borderWidth: 1,
      stack: 'checked-users'
    };
  });

  // Others stack
  barDatasets.push({
    type: 'bar',
    label: 'Others',
    data: sortedData.map(item => item.others || 0),
    backgroundColor: '#9ca3af',
    borderColor: '#6b7280',
    borderWidth: 1,
    stack: 'checked-users'
  });

  const chartData = {
    labels: labels,
    datasets: [
      {
        type: 'line',
        label: 'PR Checked (Total)',
        data: approvedCounts,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y'
      },
      ...barDatasets
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
            const label = context.dataset.label || 'Value';
            return `${label}: ${value} berkas`;
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
            size: 10
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
            size: 10
          },
          stepSize: 1,
          precision: 0
        },
        title: {
          display: true,
          text: 'Jumlah PR Checked',
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
      <Line data={chartData} options={options} plugins={[checkedTrendLabelsPlugin]} />
    </div>
  );
}
