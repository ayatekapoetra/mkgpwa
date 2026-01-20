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

export default function SpendingPerCabangChart({ data, loading }) {
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
  const labels = data.map(item => item.cabang_nama || 'N/A');

  const values = data.map(item => {
    const value = item.total_value || 0;
    return value / 1000000; // Convert to millions
  });

  // Generate gradient-like colors (purple shades)
  const backgroundColors = data.map((_, index) => {
    const intensity = 1 - (index * 0.06); // Gradually lighter
    return `rgba(139, 92, 246, ${intensity})`; // Purple shades
  });

  const borderColors = data.map((_, index) => {
    const intensity = 1 - (index * 0.06);
    return `rgba(124, 58, 237, ${intensity})`; // Darker purple borders
  });

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Total Spending (Juta)',
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
            return `Total: Rp ${value.toFixed(2)} Juta`;
          },
          afterLabel: function (context) {
            const dataIndex = context.dataIndex;
            const item = data[dataIndex];
            if (item) {
              return [
                `ROs: ${item.ro_count || 0}`,
                `Items: ${item.item_count || 0}`
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
