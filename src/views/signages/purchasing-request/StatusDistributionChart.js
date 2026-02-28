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
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Helper function to format currency
const formatCurrency = (value) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}M`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}Jt`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}Rb`;
  }
  return value.toFixed(0);
};

// Plugin for data labels on top of stacked bars
const statusDistributionLabelsPlugin = {
  id: 'statusDistributionLabelsPlugin',
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

export default function StatusDistributionChart({ data, loading }) {


  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <p>Loading Status Distribution...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <p style={{ color: '#ef4444' }}>No status distribution data available</p>
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

  // Sort data by period
  const sortedData = [...data].sort((a, b) => {
    const dateA = parseDateValue(a.period);
    const dateB = parseDateValue(b.period);
    if (!dateA || !dateB) return 0;
    return dateA.valueOf() - dateB.valueOf();
  });

  // Extract labels and data
  const labels = sortedData.map(item => {
    const parsed = parseDateValue(item.period);
    return parsed ? parsed.format('DD MMM') : item.period;
  });

  // Backend returns nested structure: { baru: { count, value }, approved: { count, value }, finish: { count, value } }
  // We'll use the 'count' field for the chart (jumlah berkas)
  const baruData = sortedData.map(item => {
    const count = item.baru?.count || 0;
    return Number(count);
  });
  const approvedData = sortedData.map(item => {
    const count = item.approved?.count || 0;
    return Number(count);
  });
  const finishData = sortedData.map(item => {
    const count = item.finish?.count || 0;
    return Number(count);
  });



  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Baru',
        data: baruData,
        backgroundColor: '#ef4444', // Red
        borderColor: '#dc2626',
        borderWidth: 1,
        stack: 'stack0'
      },
      {
        label: 'Approved',
        data: approvedData,
        backgroundColor: '#3b82f6', // Blue
        borderColor: '#2563eb',
        borderWidth: 1,
        stack: 'stack0'
      },
      {
        label: 'Finish',
        data: finishData,
        backgroundColor: '#10b981', // Green
        borderColor: '#059669',
        borderWidth: 1,
        stack: 'stack0'
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
            size: 10,
            weight: 'bold'
          },
          padding: 10,
          boxWidth: 12,
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
            const count = context.raw || 0;
            return `${label}: ${count} berkas`;
          },
          afterBody: function (context) {
            const dataIndex = context[0]?.dataIndex;
            if (dataIndex !== undefined && sortedData[dataIndex]) {
              const item = sortedData[dataIndex];
              const totalCount = item.total?.count || 0;
              const totalValue = item.total?.value || 0;
              return [
                `Total: ${totalCount} berkas`,
                `Nilai: ${formatCurrency(totalValue)}`
              ];
            }
            return '';
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
          callback: function (value) {
            return value; // Display count as-is
          },
          stepSize: 1 // Integer steps for count
        },
        title: {
          display: true,
          text: 'Jumlah Berkas',
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
      <Bar data={chartData} options={options} plugins={[statusDistributionLabelsPlugin]} />
    </div>
  );
}
