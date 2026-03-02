'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { mutate } from 'swr';

// MATERIAL - UI
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// API HOOKS
import {
  endpoints,
  useGetPurchaseTrend,
  useGetTopBarang,
  useGetPrioritasDistribution,
  useGetApprovalDuration,
  useGetQtyComparison,
  useGetSpendingPerCabang,
  useGetTopPemasok,
  useGetEquipmentSpending,
  useGetApprovalRate,
  useGetMetodeDistribution,
  useGetStatusDistribution,
  useGetTopPrCreators,
  useGetPrCheckedTrend,
  useGetUsiaBerkas
} from 'api/purchasing-charts';
import { PresentionChart } from 'iconsax-react';

// DATE UTILS
import moment from 'moment';

// CHART COMPONENTS
import PrioritasDistributionChart from './PrioritasDistributionChart';
import PurchaseTrendChart from './PurchaseTrendChart';
import TopBarangChart from './TopBarangChart';
import ApprovalDurationChart from './ApprovalDurationChart';
import QtyComparisonChart from './QtyComparisonChart';
import SpendingPerCabangChart from './SpendingPerCabangChart';
import TopPemasokChart from './TopPemasokChart';
import EquipmentSpendingChart from './EquipmentSpendingChart';
// import ApprovalRateCard from './ApprovalRateCard';
import MetodeDistributionChart from './MetodeDistributionChart';
import StatusDistributionChart from './StatusDistributionChart';
import Top10CreatorsChart from './Top10CreatorsChart';
import PrCheckedTrendChart from './PrCheckedTrendChart';
import UsiaBerikasChart from './UsiaBerikasChart';

// Helper function untuk safe number formatting
const safeToFixed = (value, decimals = 1) => {
  if (value === null || value === undefined || value === '') return '0.0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '0.0' : num.toFixed(decimals);
};

const safeFormatCurrency = (value, inMillions = true) => {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  if (inMillions) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  return num.toLocaleString();
};

export default function PurchasingRequestScreen() {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));
  const [clock, setClock] = useState(moment().format('HH:mm:ss'));
  const [tanggal, setTanggal] = useState(moment().format('dddd, DD MMMM YYYY'));
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(30);

  // Date Range Filter State
  const [dateRange, setDateRange] = useState({
    start: moment().subtract(31, 'days').format('YYYY-MM-DD'),
    end: moment().format('YYYY-MM-DD')
  });
  const [trendVersion, setTrendVersion] = useState(0);

  // API Hooks
  const { data: trendData, loading: trendLoading } = useGetPurchaseTrend({
    startdate: dateRange.start,
    enddate: dateRange.end
  });

  const { data: topBarangData, loading: topBarangLoading } = useGetTopBarang({
    startdate: dateRange.start,
    enddate: dateRange.end,
    limit: 10
  });

  const { data: prioritasData, loading: prioritasLoading } = useGetPrioritasDistribution({
    startdate: dateRange.start,
    enddate: dateRange.end
  });

  const { data: approvalDurationData, loading: approvalDurationLoading } = useGetApprovalDuration({
    startdate: dateRange.start,
    enddate: dateRange.end,
    group_by: 'cabang'
  });

  const { data: qtyComparisonData, loading: qtyComparisonLoading } = useGetQtyComparison({
    startdate: dateRange.start,
    enddate: dateRange.end,
    group_by: 'barang'
  });

  const { data: spendingCabangData, loading: spendingCabangLoading } = useGetSpendingPerCabang({
    startdate: dateRange.start,
    enddate: dateRange.end
  });

  const { data: topPemasokData, loading: topPemasokLoading } = useGetTopPemasok({
    startdate: dateRange.start,
    enddate: dateRange.end,
    limit: 10
  });

  const { data: equipmentSpendingData, loading: equipmentSpendingLoading } = useGetEquipmentSpending({
    startdate: dateRange.start,
    enddate: dateRange.end
  });

  const { data: approvalRateData, loading: approvalRateLoading } = useGetApprovalRate({
    startdate: dateRange.start,
    enddate: dateRange.end
  });

  const { data: metodeData, loading: metodeLoading } = useGetMetodeDistribution({
    startdate: dateRange.start,
    enddate: dateRange.end
  });

  const { data: statusDistributionData, loading: statusDistributionLoading } = useGetStatusDistribution({
    startdate: dateRange.start,
    enddate: dateRange.end,
    group_by: 'daily'
  });

  const { data: usiaBerkasData, meta: usiaBerkasMeta, loading: usiaBerkasLoading } = useGetUsiaBerkas({
    startdate: dateRange.start,
    enddate: dateRange.end
  });

  const { data: topCreatorsData, users: topCreatorsUsers, loading: topCreatorsLoading } = useGetTopPrCreators({
    startdate: dateRange.start,
    enddate: dateRange.end
  });

  const { data: checkTrendData, loading: checkTrendLoading } = useGetPrCheckedTrend({
    startdate: dateRange.start,
    enddate: dateRange.end
  });

  // Clock update
  useEffect(() => {
    const timeout = setTimeout(() => {
      setClock(moment().format('HH:mm:ss'));
      setTanggal(moment().format('dddd, DD MMMM YYYY'));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [clock]);

  useEffect(() => {
    if (trendData) {
      setTrendVersion(prev => prev + 1);
    }
  }, [trendData]);

  // Slides definition (order matters for slideshow)
  const slides = useMemo(() => [
    {
      key: 'purchase-trend',
      title: 'Purchase Trend',
      content: <PurchaseTrendChart data={trendData} loading={trendLoading} refreshKey={trendVersion} />
    },
    {
      key: 'status-distribution',
      title: 'Status Distribution (Baru, Approved, Finish)',
      content: <StatusDistributionChart data={statusDistributionData} loading={statusDistributionLoading} />
    },
    {
      key: 'usia-berkas',
      title: 'Usia Berkas',
      content: <UsiaBerikasChart data={usiaBerkasData} meta={usiaBerkasMeta} loading={usiaBerkasLoading} />
    },
    {
      key: 'top-creators',
      title: 'Top 10 PR Creators',
      content: <Top10CreatorsChart data={topCreatorsData} users={topCreatorsUsers} loading={topCreatorsLoading} />
    },
    {
      key: 'checked-trend',
      title: 'PR Checked Trend',
      content: <PrCheckedTrendChart data={checkTrendData} loading={checkTrendLoading} />
    },
    {
      key: 'spending-cabang',
      title: 'Spending per Cabang',
      content: <SpendingPerCabangChart data={spendingCabangData} loading={spendingCabangLoading} />
    },
    {
      key: 'qty-comparison',
      title: 'Qty Request vs Approved',
      content: <QtyComparisonChart data={qtyComparisonData} loading={qtyComparisonLoading} />
    },
    {
      key: 'approval-duration',
      title: 'Approval Duration (Days)',
      content: <ApprovalDurationChart data={approvalDurationData} loading={approvalDurationLoading} />
    },
    {
      key: 'equipment-spending',
      title: 'Equipment Spending',
      content: <EquipmentSpendingChart data={equipmentSpendingData} loading={equipmentSpendingLoading} />
    },
    {
      key: 'top-barang',
      title: 'Top 10 Barang',
      content: <TopBarangChart data={topBarangData} loading={topBarangLoading} />
    },
    {
      key: 'top-pemasok',
      title: 'Top 10 Pemasok',
      content: <TopPemasokChart data={topPemasokData} loading={topPemasokLoading} />
    },
    {
      key: 'prioritas-distribution',
      title: 'Prioritas Distribution',
      content: <PrioritasDistributionChart data={prioritasData} loading={prioritasLoading} />
    },
    {
      key: 'metode-distribution',
      title: 'Metode Distribution',
      content: <MetodeDistributionChart data={metodeData} loading={metodeLoading} />
    }
  ], [trendData, trendLoading, trendVersion, statusDistributionData, statusDistributionLoading, usiaBerkasData, usiaBerkasMeta, usiaBerkasLoading, topCreatorsData, topCreatorsUsers, topCreatorsLoading, checkTrendData, checkTrendLoading, spendingCabangData, spendingCabangLoading, qtyComparisonData, qtyComparisonLoading, approvalDurationData, approvalDurationLoading, equipmentSpendingData, equipmentSpendingLoading, topBarangData, topBarangLoading, topPemasokData, topPemasokLoading, prioritasData, prioritasLoading, metodeData, metodeLoading]);

  // Countdown + slide rotation when slideshow is active
  useEffect(() => {
    if (!isSlideshow) return undefined;

    setRemainingSeconds(30);

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          const nextIndex = (currentSlideIndex + 1) % slides.length;
          refreshSlideData(slides[nextIndex]?.key);
          setCurrentSlideIndex(nextIndex);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSlideshow, slides, currentSlideIndex]);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = () => {
    // Trigger refetch by updating dateRange
    console.log('Apply filter:', dateRange);
  };

  const handleToggleSlideshow = () => {
    setIsSlideshow(prev => !prev);
    setCurrentSlideIndex(0);
    setRemainingSeconds(30);
  };

  // Build SWR keys for refetch
  const buildUrl = (endpoint, params) => {
    if (!params) return endpoint;
    return `${endpoint}?${new URLSearchParams(params).toString()}`;
  };

  const refreshSlideData = (slideKey) => {
    switch (slideKey) {
      case 'purchase-trend':
        mutate(buildUrl(endpoints.trend, { startdate: dateRange.start, enddate: dateRange.end }));
        break;
      case 'status-distribution':
        mutate(buildUrl(endpoints.statusDistribution, { startdate: dateRange.start, enddate: dateRange.end, group_by: 'daily' }));
        break;
      case 'usia-berkas':
        mutate(buildUrl(endpoints.usiaBerkas, { startdate: dateRange.start, enddate: dateRange.end }));
        break;
      case 'top-creators':
        mutate(buildUrl(endpoints.topPrCreators, { startdate: dateRange.start, enddate: dateRange.end }));
        break;
      case 'checked-trend':
        mutate(buildUrl(endpoints.prApprovalTrend, { startdate: dateRange.start, enddate: dateRange.end }));
        break;
      case 'spending-cabang':
        mutate(buildUrl(endpoints.spendingPerCabang, { startdate: dateRange.start, enddate: dateRange.end }));
        break;
      case 'qty-comparison':
        mutate(buildUrl(endpoints.qtyComparison, { startdate: dateRange.start, enddate: dateRange.end, group_by: 'barang' }));
        break;
      case 'approval-duration':
        mutate(buildUrl(endpoints.approvalDuration, { startdate: dateRange.start, enddate: dateRange.end, group_by: 'cabang' }));
        break;
      case 'equipment-spending':
        mutate(buildUrl(endpoints.equipmentSpending, { startdate: dateRange.start, enddate: dateRange.end }));
        break;
      case 'top-barang':
        mutate(buildUrl(endpoints.topBarang, { startdate: dateRange.start, enddate: dateRange.end, limit: 10 }));
        break;
      case 'top-pemasok':
        mutate(buildUrl(endpoints.topPemasok, { startdate: dateRange.start, enddate: dateRange.end, limit: 10 }));
        break;
      case 'prioritas-distribution':
        mutate(buildUrl(endpoints.prioritasDistribution, { startdate: dateRange.start, enddate: dateRange.end }));
        break;
      case 'metode-distribution':
        mutate(buildUrl(endpoints.metodeDistribution, { startdate: dateRange.start, enddate: dateRange.end }));
        break;
      default:
        break;
    }
  };

  return (
    <Stack sx={{ height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Stack>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Purchasing Request</h2>
          <Stack direction="row" spacing={2} sx={{ mt: 0.5, fontSize: '0.875rem', color: 'text.secondary' }}>
            <span>{tanggal}</span>
            <span>|</span>
            <span>{clock}</span>
          </Stack>
        </Stack>

        {/* Date Filter */}
        <Stack direction="row" spacing={1} alignItems="center">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => handleDateChange('start', e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => handleDateChange('end', e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button
            onClick={handleApplyFilter}
            style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#1976d2', color: 'white', cursor: 'pointer' }}
          >
            Apply
          </button>
          <button
            onClick={handleToggleSlideshow}
            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: isSlideshow ? '#ef4444' : 'white', color: isSlideshow ? 'white' : 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            aria-label={isSlideshow ? 'Stop slideshow' : 'Start slideshow'}
            title={isSlideshow ? 'Stop slideshow' : 'Start slideshow'}
          >
            <PresentionChart size={18} variant="Bold" />
            {isSlideshow ? 'Stop' : 'Start'}
          </button>
        </Stack>
      </Stack>

      {/* Main Content */}
      <Paper
        sx={{
          flex: 1,
          p: 1,
          overflow: 'auto',
          backgroundColor: 'background.default'
        }}
      >

        {!isSlideshow ? (
        <Grid container spacing={2}>
          {/* Row 1: Summary Cards - 3 Panel Berdampingan */}
          <Grid item xs={2}>
            <Paper sx={{ p: 2, height: '200px' }}>
              <h3>Approval Rate</h3>
              {approvalRateLoading ? (
                <p>Loading...</p>
              ) : approvalRateData ? (
                <Stack>
                  <h1 style={{ fontSize: '2.5rem', margin: 0 }}>{safeToFixed(approvalRateData.approval_rate_percentage, 0)}%</h1>
                  <p style={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    {approvalRateData.approved_items} / {approvalRateData.total_items} items approved
                  </p>
                </Stack>
              ) : (
                <p style={{ color: 'error.main', fontSize: '0.875rem' }}>No data - Check API response</p>
              )}
            </Paper>
          </Grid>

          <Grid item xs={5}>
            <Paper sx={{ p: 2, height: '200px' }}>
              <h3>Prioritas Distribution</h3>
              <div style={{ height: '140px' }}>
                <PrioritasDistributionChart data={prioritasData} loading={prioritasLoading} />
              </div>
            </Paper>
          </Grid>

          <Grid item xs={5}>
            <Paper sx={{ p: 2, height: '200px' }}>
              <h3>Metode Distribution</h3>
              <div style={{ height: '140px' }}>
                <MetodeDistributionChart data={metodeData} loading={metodeLoading} />
              </div>
            </Paper>
          </Grid>

          {/* Row 2: Purchase Trend */}
          <Grid item md={12} xs={12}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>Purchase Trend</h3>
                <div style={{ height: '290px' }}>
                <PurchaseTrendChart data={trendData} loading={trendLoading} refreshKey={trendVersion} />
              </div>
            </Paper>
          </Grid>

          {/* Row 3: Status Distribution & Usia Berkas */}
          <Grid item md={8} xs={12}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>Status Distribution (Baru, Approved, Finish)</h3>
              <div style={{ height: '290px' }}>
                <StatusDistributionChart data={statusDistributionData} loading={statusDistributionLoading} />
              </div>
            </Paper>
          </Grid>

          <Grid item md={4} xs={12}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>Usia Berkas</h3>
              <div style={{ height: '290px' }}>
                <UsiaBerikasChart data={usiaBerkasData} meta={usiaBerkasMeta} loading={usiaBerkasLoading} />
              </div>
            </Paper>
          </Grid>

          {/* Row 3b: Top 10 PR Creators & PR Checked Trend */}
          <Grid item md={6} xs={12}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>Top 10 PR Creators</h3>
              <div style={{ height: '290px' }}>
                <Top10CreatorsChart data={topCreatorsData} users={topCreatorsUsers} loading={topCreatorsLoading} />
              </div>
            </Paper>
          </Grid>

          <Grid item md={6} xs={12}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>PR Checked Trend</h3>
              <div style={{ height: '290px' }}>
                <PrCheckedTrendChart data={checkTrendData} loading={checkTrendLoading} />
              </div>
            </Paper>
          </Grid>

          {/* Row 4: Spending per Cabang */}
          <Grid item md={12} xs={12}>
            <Paper sx={{ p: 2, height: '300px' }}>
              <h3>Spending per Cabang</h3>
              <div style={{ height: '240px' }}>
                <SpendingPerCabangChart data={spendingCabangData} loading={spendingCabangLoading} />
              </div>
            </Paper>
          </Grid>

          {/* Row 5: Qty Comparison & Approval Duration */}
          <Grid item md={6} xs={12}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>Qty Request vs Approved</h3>
              <div style={{ height: '290px' }}>
                <QtyComparisonChart data={qtyComparisonData} loading={qtyComparisonLoading} />
              </div>
            </Paper>
          </Grid>

          <Grid item md={6} xs={12}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>Approval Duration (Days)</h3>
              <div style={{ height: '290px' }}>
                <ApprovalDurationChart data={approvalDurationData} loading={approvalDurationLoading} />
              </div>
            </Paper>
          </Grid>

          {/* Row 6: Equipment Spending (Full Width) */}
          <Grid item md={12} xs={12}>
            <Paper sx={{ p: 2, height: '300px' }}>
              <h3>Equipment Spending</h3>
              <div style={{ height: '240px' }}>
                <EquipmentSpendingChart data={equipmentSpendingData} loading={equipmentSpendingLoading} />
              </div>
            </Paper>
          </Grid>

          {/* Row 3: Top Barang & Top Pemasok */}
          <Grid item md={6} xs={12}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>Top 10 Barang</h3>
              <div style={{ height: '290px' }}>
                <TopBarangChart data={topBarangData} loading={topBarangLoading} />
              </div>
            </Paper>
          </Grid>

          <Grid item md={6} xs={12}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>Top 10 Pemasok</h3>
              <div style={{ height: '290px' }}>
                <TopPemasokChart data={topPemasokData} loading={topPemasokLoading} />
              </div>
            </Paper>
          </Grid>
        </Grid>
        ) : (
          <div style={{ padding: '16px', height: '100%', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <h3 style={{ margin: 0 }}>{slides[currentSlideIndex]?.title || 'Slideshow'}</h3>
              <Stack direction="row" spacing={1} alignItems="center">
                <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Next in</span>
                <span style={{ fontWeight: 600 }}>{formatCountdown(remainingSeconds)}</span>
              </Stack>
            </Stack>
            <div style={{ flex: 1, minHeight: '60vh' }}>
              {slides[currentSlideIndex]?.content}
            </div>
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
              {slides.map((slide, idx) => (
                <button
                  key={slide.key}
                  onClick={() => { refreshSlideData(slide.key); setCurrentSlideIndex(idx); setRemainingSeconds(30); }}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: 'none',
                    margin: 4,
                    background: idx === currentSlideIndex ? '#3b82f6' : '#d1d5db',
                    cursor: 'pointer'
                  }}
                  aria-label={`Go to slide ${slide.title}`}
                />
              ))}
            </Stack>
          </div>
        )}
      </Paper>
    </Stack>
  );
}
