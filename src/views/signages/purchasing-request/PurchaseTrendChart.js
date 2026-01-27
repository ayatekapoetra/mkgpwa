'use client';
import React, { useEffect } from 'react';
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

// Inline plugin for data labels - Red for Nilai Pembelian, Grey for Jumlah RO
const purchaseTrendLabelsPlugin = {
  id: 'purchaseTrendLabelsPlugin',
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((point, index) => {
        const value = dataset.data[index];
        if (value === undefined || value === null) return;

        const { x, y } = point;
        ctx.save();
        ctx.font = '600 10px Poppins, sans-serif';
        ctx.textAlign = 'center';

        if (datasetIndex === 0) {
          // Nilai Pembelian (Juta) - Red color, format XX.XJt
          ctx.fillStyle = '#ef4444'; // Red
          ctx.textBaseline = 'bottom';
          const formatted = `${value.toFixed(1)}Jt`;
          ctx.fillText(formatted, x, y - 8);
        } else {
          // Jumlah RO - Grey color, no format
          ctx.fillStyle = '#6b7280'; // Grey
          ctx.textBaseline = 'top';
          const formatted = `${Math.round(value)}`;
          ctx.fillText(formatted, x, y + 8);
        }

        ctx.restore();
      });
    });
  }
};

export default function PurchaseTrendChart({ data, loading, refreshKey }) {
  // Debug logging
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('🔍 PurchaseTrendChart - Data received:', data);
      if (data && data.length > 0) {
        console.log('📅 Sample date format:', data[0].date);
        console.log('✅ Parsed labels:', data.map(item => {
          const parsed = moment(item.date);
          return parsed.isValid() ? parsed.format('DD MMM') : 'INVALID';
        }));
      }
    }
  }, [data]);

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

  // Extract and format data using moment.js for robust date parsing
  const parseDateValue = (value) => {
    if (!value) return null;
    let parsed = moment(value, moment.ISO_8601, true);
    if (!parsed.isValid()) {
      parsed = moment(value);
    }
    return parsed.isValid() ? parsed : null;
  };

  const aggregatedByDate = data.reduce((acc, item) => {
    const dateStr = item.date_ro || item.date;
    const parsedDate = parseDateValue(dateStr);
    if (!parsedDate) return acc;

    const key = parsedDate.format('YYYY-MM-DD');
    if (!acc[key]) {
      acc[key] = {
        parsedDate,
        total_value: 0,
        count: 0
      };
    }

    acc[key].total_value += Number(item.total_value || 0);
    acc[key].count += Number(item.count || 0);
    return acc;
  }, {});

  const sortedEntries = Object.values(aggregatedByDate).sort((a, b) => a.parsedDate.valueOf() - b.parsedDate.valueOf());

  if (sortedEntries.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <p style={{ color: 'error.main' }}>No valid trend data available</p>
      </div>
    );
  }

  const labels = sortedEntries.map(item => item.parsedDate.format('DD MMM'));
  const counts = sortedEntries.map(item => item.count);
  const totalValues = sortedEntries.map(item => item.total_value / 1000000);
  const dataPoints = sortedEntries.map(item => ({
    key: item.parsedDate.format('YYYY-MM-DD'),
    count: item.count,
    totalValue: item.total_value
  }));

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Nilai Pembelian (Juta)',
        data: totalValues,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y'
      },
      {
        label: 'Jumlah RO',
        data: counts,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y1'
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
            size: 12,
            weight: 'bold'
          },
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            const value = context.raw || 0;

            if (context.datasetIndex === 0) {
              // Nilai Pembelian
              label += `Rp ${value.toFixed(2)} Juta`;
            } else {
              // Jumlah RO
              label += `${value} RO`;
            }
            return label;
          },
          afterBody: function (context) {
            const dataIndex = context[0]?.dataIndex;
            if (dataIndex !== undefined && dataPoints[dataIndex]) {
              const originalValue = dataPoints[dataIndex].totalValue;
              const formattedValue = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
              }).format(originalValue);
              return `Total: ${formattedValue}`;
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
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Nilai (Juta)',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          },
          callback: function (value) {
            return value.toFixed(1) + 'M';
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Jumlah RO',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          drawOnChartArea: false, // only show the grid for the left axis
        },
        ticks: {
          font: {
            size: 11
          },
          stepSize: 1,
          precision: 0
        }
      }
    }
  };

  return (
    <div key={`purchase-trend-${refreshKey ?? 'initial'}`} style={{ height: '100%', position: 'relative' }}>
      <Line data={chartData} options={options} plugins={[purchaseTrendLabelsPlugin]} />
    </div>
  );
}
