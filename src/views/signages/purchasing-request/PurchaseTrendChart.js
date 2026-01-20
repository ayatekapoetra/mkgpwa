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

export default function PurchaseTrendChart({ data, loading }) {
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
  const processedData = data
    .map(item => {
      // Backend returns 'date_ro' not 'date'!
      const dateStr = item.date_ro;
      if (!dateStr) {
        console.warn('Missing date_ro field:', item);
        return null;
      }

      try {
        const momentDate = moment(dateStr);
        if (!momentDate.isValid()) {
          console.warn('Invalid date:', dateStr, 'Original item:', item);
          return null;
        }

        return {
          ...item,
          parsedDate: momentDate,
          label: momentDate.format('DD MMM'),
          originalDate: dateStr
        };
      } catch (error) {
        console.error('Error parsing date:', dateStr, error, 'Item:', item);
        return null;
      }
    })
    .filter(item => item !== null); // Remove invalid entries

  // If all dates are invalid, show error
  if (processedData.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 1 }}>
        <p style={{ color: 'error.main', fontWeight: 'bold' }}>Invalid date format</p>
        {data.length > 0 && (
          <p style={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            Original format: "{data[0]?.date_ro}"
          </p>
        )}
        <p style={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          Check console for details
        </p>
      </div>
    );
  }

  const labels = processedData.map(item => item.label);
  const counts = processedData.map(item => item.count || 0);
  const totalValues = processedData.map(item => {
    const value = item.total_value || 0;
    // Convert to millions
    return value / 1000000;
  });

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
            if (dataIndex !== undefined && processedData[dataIndex]) {
              const originalValue = processedData[dataIndex].total_value || 0;
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
    <div style={{ height: '100%', position: 'relative' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
