'use client';
import React from 'react';
import { Bar } from 'react-chartjs-2';
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

export default function TopBarangChart({ data, loading }) {
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

  // Take top 10 items
  const topItems = data.slice(0, 10);

  // Extract labels and data
  const labels = topItems.map(item => {
    const name = item.barang_nama || 'N/A';
    const code = item.barang_kode || '';
    return code ? `${name} (${code})` : name;
  });

  const values = topItems.map(item => {
    const value = item.total_value || 0;
    return value / 1000000; // Convert to millions
  });

  // Generate gradient-like colors
  const backgroundColors = topItems.map((_, index) => {
    const intensity = 1 - (index * 0.08); // Gradually lighter
    return `rgba(59, 130, 246, ${intensity})`; // Blue shades
  });

  const borderColors = topItems.map((_, index) => {
    const intensity = 1 - (index * 0.08);
    return `rgba(37, 99, 235, ${intensity})`; // Darker blue borders
  });

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Total Value (Juta)',
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1
      }
    ]
  };

  const options = {
    indexAxis: 'y', // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
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
            const originalValue = topItems[context.dataIndex]?.total_value || 0;
            const formattedValue = new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0
            }).format(originalValue);
            return `Total: ${formattedValue}`;
          }
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 10
          },
          callback: function (value) {
            return value.toFixed(1) + 'M';
          }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 0,
          minRotation: 0
        }
      }
    }
  };

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
