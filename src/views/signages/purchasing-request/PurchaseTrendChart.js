'use client';
import React, { useEffect, useRef } from 'react';
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

// Helper function to format currency with dynamic unit (Ribu, Juta, Milyar)
const formatCurrencyWithUnit = (value, options = {}) => {
  const { decimals = 1, shortFormat = false } = options;
  
  // Safety check
  if (value === undefined || value === null || isNaN(value)) {
    return {
      value: 0,
      unit: '',
      shortUnit: '',
      formatted: '0'
    };
  }
  
  const numValue = Number(value);
  
  if (numValue >= 1000000000) {
    // Milyar
    return {
      value: numValue / 1000000000,
      unit: 'Milyar',
      shortUnit: 'M',
      formatted: shortFormat 
        ? `${(numValue / 1000000000).toFixed(decimals)}M`
        : `${(numValue / 1000000000).toFixed(decimals)} Milyar`
    };
  } else if (numValue >= 1000000) {
    // Juta
    return {
      value: numValue / 1000000,
      unit: 'Juta',
      shortUnit: 'Jt',
      formatted: shortFormat 
        ? `${(numValue / 1000000).toFixed(decimals)}Jt`
        : `${(numValue / 1000000).toFixed(decimals)} Juta`
    };
  } else if (numValue >= 1000) {
    // Ribu
    return {
      value: numValue / 1000,
      unit: 'Ribu',
      shortUnit: 'Rb',
      formatted: shortFormat 
        ? `${(numValue / 1000).toFixed(decimals)}Rb`
        : `${(numValue / 1000).toFixed(decimals)} Ribu`
    };
  } else {
    return {
      value: numValue,
      unit: '',
      shortUnit: '',
      formatted: shortFormat 
        ? `${numValue.toFixed(decimals)}`
        : `${numValue.toFixed(decimals)}`
    };
  }
};

/**
 * Helper function untuk transformasi logarithmic-like
 * Membuat nilai kecil (<500Jt) lebih terlihat di chart
 * 
 * Konsep: 0-500Jt mengambil 50% tinggi chart, 500Jt-max mengambil 50% sisanya
 */
const transformValue = (value, maxValue) => {
  const FIVE_HUNDRED_MILLION = 500000000; // 500 Juta
  const ONE_BILLION = 1000000000;
  
  if (value <= 0) return 0;
  
  if (maxValue <= FIVE_HUNDRED_MILLION) {
    // Jika max <= 500Jt, gunakan linear biasa
    return value;
  }
  
  // Untuk data > 500Jt:
  // 0-500Jt = scale 0 to 50% (transformed value 0 to 500M)
  // 500Jt-max = scale 50% to 100% (transformed value 500M to 1M)
  
  if (value <= FIVE_HUNDRED_MILLION) {
    // Map 0-500Jt to 0-500Jt (first 50% of chart)
    return value;
  } else {
    // Map 500Jt-maxValue to 500Jt-1M (second 50% of chart)
    const ratio = (value - FIVE_HUNDRED_MILLION) / (maxValue - FIVE_HUNDRED_MILLION);
    return FIVE_HUNDRED_MILLION + (ratio * FIVE_HUNDRED_MILLION);
  }
};

/**
 * Inverse transform untuk mendapatkan nilai asli dari transformed value
 */
const inverseTransform = (transformedValue, maxValue) => {
  const FIVE_HUNDRED_MILLION = 500000000;
  
  if (maxValue <= FIVE_HUNDRED_MILLION) {
    return transformedValue;
  }
  
  if (transformedValue <= FIVE_HUNDRED_MILLION) {
    return transformedValue;
  } else {
    // Inverse: transformed 500M-1M back to 500M-maxValue
    const ratio = (transformedValue - FIVE_HUNDRED_MILLION) / FIVE_HUNDRED_MILLION;
    return FIVE_HUNDRED_MILLION + (ratio * (maxValue - FIVE_HUNDRED_MILLION));
  }
};

/**
 * Helper function to determine Y-axis configuration based on max value
 * Menggunakan compressed scale untuk data > 1M
 */
const getYAxisConfig = (maxValue) => {
  const TEN_MILLION = 10000000;
  const FIFTY_MILLION = 50000000;
  const HUNDRED_MILLION = 100000000;
  const FIVE_HUNDRED_MILLION = 500000000; // 500 Juta
  const ONE_BILLION = 1000000000;
  const TEN_BILLION = 10000000000;

  if (maxValue <= TEN_MILLION) {
    return {
      min: 0,
      max: TEN_MILLION,
      customTicks: [0, 10000000],
      unit: 'Juta',
      useTransform: false
    };
  } else if (maxValue <= FIFTY_MILLION) {
    return {
      min: 0,
      max: FIFTY_MILLION,
      customTicks: [0, 50000000],
      unit: 'Juta',
      useTransform: false
    };
  } else if (maxValue <= HUNDRED_MILLION) {
    return {
      min: 0,
      max: HUNDRED_MILLION,
      customTicks: [0, 50000000, 100000000],
      unit: 'Juta',
      useTransform: false
    };
  } else if (maxValue <= FIVE_HUNDRED_MILLION) {
    return {
      min: 0,
      max: FIVE_HUNDRED_MILLION,
      customTicks: [0, 100000000, 500000000], // 0, 100Jt, 500Jt
      unit: 'Juta',
      useTransform: false
    };
  } else if (maxValue <= TEN_BILLION) {
    // SPECIAL: Compressed scale - 0-500Jt takes 50% height, 500Jt-10M takes 50% height
    return {
      min: 0,
      max: ONE_BILLION, // Transformed max (500M + 500M = 1M represents up to 10M real)
      realMax: TEN_BILLION,
      customTicks: [0, FIVE_HUNDRED_MILLION, ONE_BILLION], // 0, 500Jt (50%), 10M (100%)
      customTickLabels: ['0', '500Jt', '10M'],
      unit: 'Mixed',
      useTransform: true
    };
  } else {
    const maxInBillions = Math.ceil(maxValue / TEN_BILLION) * 10;
    const realMax = maxInBillions * ONE_BILLION;
    
    return {
      min: 0,
      max: ONE_BILLION,
      realMax: realMax,
      customTicks: [0, FIVE_HUNDRED_MILLION, ONE_BILLION],
      customTickLabels: ['0', '500Jt', `${maxInBillions}M`],
      unit: 'Mixed',
      useTransform: true
    };
  }
};

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
          // Nilai Pembelian - Red color with dynamic unit
          ctx.fillStyle = '#ef4444'; // Red
          ctx.textBaseline = 'bottom';
          const formatted = formatCurrencyWithUnit(value, { decimals: 1, shortFormat: true }).formatted;
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
  const chartRef = useRef(null);

  // Cleanup chart on unmount or when refreshKey changes
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [refreshKey]);



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
  const totalValuesRaw = sortedEntries.map(item => item.total_value); // Original values
  const dataPoints = sortedEntries.map(item => ({
    key: item.parsedDate.format('YYYY-MM-DD'),
    count: item.count,
    totalValue: item.total_value
  }));

  // Determine the best unit based on max value
  const maxValue = Math.max(...totalValuesRaw);
  const minValue = Math.min(...totalValuesRaw);
  
  // Get Y-axis configuration based on breakpoints
  const yAxisConfig = getYAxisConfig(maxValue);
  
  // Transform data values if using compressed scale
  const totalValues = yAxisConfig.useTransform
    ? totalValuesRaw.map(val => transformValue(val, yAxisConfig.realMax))
    : totalValuesRaw;



  // Calculate dynamic Y1-axis range for Jumlah RO (unchanged)
  const maxCount = Math.max(...counts);
  const minCount = Math.min(...counts);
  const countRange = maxCount - minCount;
  const paddingPercentage = 0.15;
  
  const y1AxisMax = maxCount + Math.ceil(countRange * paddingPercentage);
  const y1AxisMin = Math.max(0, minCount - Math.ceil(countRange * paddingPercentage));
  
  const isSmallCountRange = countRange < (maxCount * 0.1);

  // Determine unit for display based on max value
  const displayUnit = formatCurrencyWithUnit(maxValue, { decimals: 1 }).unit;

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: `Nilai RO (${displayUnit})`,
        data: totalValues, // Raw values
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
        label: 'Qty RO',
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

            if (context.datasetIndex === 0) {
              // Get original value from dataPoints (not transformed value)
              const originalValue = dataPoints[context.dataIndex]?.totalValue || 0;
              const formatted = formatCurrencyWithUnit(originalValue, { decimals: 2, shortFormat: false });
              label += `Rp ${formatted.formatted}`;
            } else {
              // Jumlah RO
              const value = context.raw || 0;
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
          text: 'Nilai RO',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        // Fixed min/max based on breakpoint configuration (RAW VALUES)
        min: yAxisConfig.min,
        max: yAxisConfig.max,
        // Force exact tick configuration
        beginAtZero: true,
        bounds: 'ticks',
        ticks: {
          font: {
            size: 10,
            family: 'Arial, sans-serif'
          },
          padding: 8,
          autoSkip: false,
          autoSkipPadding: 0,
          maxTicksLimit: undefined,
          color: '#666',
          count: yAxisConfig.customTicks.length,
          callback: function (value, index, ticks) {
            // Return the label if already set in plugin
            if (ticks[index]?.label) {
              return ticks[index].label;
            }
            
            const numValue = typeof value === 'object' ? value?.value : value;
            if (numValue === 0 || numValue === undefined || numValue === null) {
              return '0';
            }
            
            const formatted = formatCurrencyWithUnit(numValue, { decimals: 0, shortFormat: true });
            return formatted.formatted;
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
        // Dynamic min/max for RO count axis
        min: isSmallCountRange ? undefined : y1AxisMin,
        max: isSmallCountRange ? undefined : y1AxisMax,
        suggestedMin: isSmallCountRange ? Math.max(0, Math.floor(minCount * 0.85)) : undefined,
        suggestedMax: isSmallCountRange ? Math.ceil(maxCount * 1.15) : undefined,
        ticks: {
          font: {
            size: 11
          },
          stepSize: 1,
          precision: 0,
          maxTicksLimit: 6,
          padding: 8
        }
      }
    }
  };

  // Custom plugin to force exact ticks WITH LABELS
  const customTicksPlugin = {
    id: 'customTicksPlugin',
    
    afterBuildTicks: function(chart, args, options) {
      const yScale = chart.scales?.y;
      if (yScale && yAxisConfig.customTicks) {
        // Force replace ticks WITH LABELS
        yScale.ticks = yAxisConfig.customTicks.map((value, index) => {
          // Use custom label if provided, otherwise format
          let label;
          if (yAxisConfig.customTickLabels) {
            label = yAxisConfig.customTickLabels[index];
          } else if (value === 0) {
            label = '0';
          } else {
            const formatted = formatCurrencyWithUnit(value, { decimals: 0, shortFormat: true });
            label = formatted.formatted;
          }
          
          return { 
            value,
            label,
            major: true
          };
        });
      }
    },
    
    afterDataLimits: function(chart, args, options) {
      const yScale = chart.scales?.y;
      if (yScale && yAxisConfig.customTicks) {
        yScale.min = yAxisConfig.min;
        yScale.max = yAxisConfig.max;
      }
    }
  };

  return (
    <div key={`purchase-trend-${refreshKey ?? 'initial'}`} style={{ height: '100%', position: 'relative' }}>
      <Line 
        ref={chartRef}
        data={chartData} 
        options={options} 
        plugins={[purchaseTrendLabelsPlugin, customTicksPlugin]} 
      />
    </div>
  );
}
