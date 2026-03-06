'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Chart as ChartJS } from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

const palette = [
  '#2563EB',
  '#F97316',
  '#10B981',
  '#E11D48',
  '#8B5CF6',
  '#14B8A6',
  '#F59E0B',
  '#6366F1',
  '#EF4444',
  '#22C55E',
  '#0EA5E9'
];

export default function ActiveDurationStackChart({ data, loading, title = 'BREAKDOWN TERKINI', subheader = 'Durasi ongoing per area dan equipment (hari)', areaFilter, showTitle = true }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const theme = useTheme();
  const textSecondary = theme?.palette?.text?.secondary || '#6b7280';
  const textPrimary = theme?.palette?.text?.primary || '#1f2937';

  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data.labels)) return null;

    // If areaFilter is set, slice to that area only
    let labels = data.labels;
    let datasets = data.datasets || [];

    if (areaFilter) {
      const areaIndex = labels.indexOf(areaFilter);
      if (areaIndex === -1) return null;
      labels = [areaFilter];
      datasets = datasets
        .map(ds => ({
          ...ds,
          data: [ds.data?.[areaIndex] || 0]
        }))
        .filter(ds => Array.isArray(ds.data) && ds.data.length);
      // allow empty bars (all zero) to render empty chart for null/empty area
    }

    // Flatten to single dataset to show equipment labels on x-axis
    const flatLabels = [];
    const flatData = [];
    const colors = [];

    for (const ds of datasets) {
      ds.data.forEach((val, idx) => {
        const numericVal = val || 0;
        if (numericVal <= 0) return; // skip zero/empty
        flatLabels.push(ds.label);
        flatData.push(numericVal);
        colors.push(palette.flatMap((c, i) => i === 0 ? [] : [])[0]);
      });
    }

    // Fallback colors if not mapped correctly
    const finalColors = flatLabels.map((_, i) => palette[i % palette.length]);

    if (!flatLabels.length) return { labels: [], datasets: [] };

    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      // Debug log to inspect chart data
      console.log('[ActiveDurationStackChart] areaFilter:', areaFilter);
      console.log('[ActiveDurationStackChart] raw data:', data);
      console.log('[ActiveDurationStackChart] computed labels:', flatLabels);
      console.log('[ActiveDurationStackChart] computed data:', flatData);
    }

    return {
      labels: flatLabels,
      datasets: [
        {
          label: 'Durasi (hari)',
          data: flatData,
          backgroundColor: finalColors,
          borderWidth: 0
        }
      ]
    };
  }, [data, areaFilter]);

  useEffect(() => {
    if (!canvasRef.current || !chartData) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    ChartJS.register(ChartDataLabels);

    chartRef.current = new ChartJS(canvasRef.current, {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              color: textPrimary
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'end',
            formatter: (val) => (val > 0 ? val : ''),
            color: textSecondary,
            font: { size: 10, weight: '600' },
            clamp: true,
            clip: true
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed.y || 0;
                return `${ctx.dataset.label}: ${val} hari`;
              }
            }
          },
          title: {
            display: false
          }
        },
        scales: {
          x: {
            stacked: false,
            ticks: {
              autoSkip: false,
              maxRotation: 45,
              minRotation: 0,
              color: textSecondary
            },
            barPercentage: 0.9,
            categoryPercentage: 0.9,
            title: {
              display: true,
              text: 'Equipment',
              color: textSecondary
            }
          },
          y: {
            stacked: false,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Hari (ongoing)',
              color: textSecondary
            },
            ticks: { color: textSecondary },
            grid: {
              color: (ctx) => (ctx.tick.value === 0 ? '#9ca3af' : '#e5e7eb')
            }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartData]);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {showTitle && <CardHeader title={title} subheader={subheader} />}
      <CardContent sx={{ flex: 1, minHeight: 520, position: 'relative', pb: 4, pt: showTitle ? undefined : 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">Memuat data...</Typography>
          </Box>
        ) : chartData && chartData.labels.length ? (
          <Box sx={{ position: 'relative', height: '100%' }}>
            <canvas ref={canvasRef} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">Tidak ada breakdown aktif</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
