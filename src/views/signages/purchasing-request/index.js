'use client';
import React, { useEffect, useState } from 'react';

// MATERIAL - UI
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// API HOOKS
import {
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
  useGetPrApprovalTrend,
  useGetUsiaBerkas
} from 'api/purchasing-charts';

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
import PrApprovalTrendChart from './PrApprovalTrendChart';
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

  const { data: approvalTrendData, loading: approvalTrendLoading } = useGetPrApprovalTrend({
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

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = () => {
    // Trigger refetch by updating dateRange
    console.log('Apply filter:', dateRange);
  };

  const handleResetFilter = () => {
    setDateRange({
      start: moment().subtract(31, 'days').format('YYYY-MM-DD'),
      end: moment().format('YYYY-MM-DD')
    });
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
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Purchasing Request Dashboard</h2>
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
            onClick={handleResetFilter}
            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
          >
            Reset
          </button>
        </Stack>
      </Stack>

      {/* Main Content */}
      <Paper
        sx={{
          flex: 1,
          m: 2,
          overflow: 'auto',
          backgroundColor: 'background.default'
        }}
      >

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
          <Grid item xs={12}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>Purchase Trend</h3>
                <div style={{ height: '290px' }}>
                <PurchaseTrendChart data={trendData} loading={trendLoading} refreshKey={trendVersion} />
              </div>
            </Paper>
          </Grid>

          {/* Row 3: Status Distribution & Usia Berkas */}
          <Grid item xs={8}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>Status Distribution (Baru, Approved, Finish)</h3>
              <div style={{ height: '290px' }}>
                <StatusDistributionChart data={statusDistributionData} loading={statusDistributionLoading} />
              </div>
            </Paper>
          </Grid>

          <Grid item xs={4}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>Usia Berkas</h3>
              <div style={{ height: '290px' }}>
                <UsiaBerikasChart data={usiaBerkasData} meta={usiaBerkasMeta} loading={usiaBerkasLoading} />
              </div>
            </Paper>
          </Grid>

          {/* Row 3b: Top 10 PR Creators & PR Approval Trend */}
          <Grid item xs={6}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>Top 10 PR Creators</h3>
              <div style={{ height: '290px' }}>
                <Top10CreatorsChart data={topCreatorsData} users={topCreatorsUsers} loading={topCreatorsLoading} />
              </div>
            </Paper>
          </Grid>

          <Grid item xs={6}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>PR Approval Trend</h3>
              <div style={{ height: '290px' }}>
                <PrApprovalTrendChart data={approvalTrendData} loading={approvalTrendLoading} />
              </div>
            </Paper>
          </Grid>

          {/* Row 4: Spending per Cabang */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, height: '300px' }}>
              <h3>Spending per Cabang</h3>
              <div style={{ height: '240px' }}>
                <SpendingPerCabangChart data={spendingCabangData} loading={spendingCabangLoading} />
              </div>
            </Paper>
          </Grid>

          {/* Row 5: Qty Comparison & Approval Duration */}
          <Grid item xs={6}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>Qty Request vs Approved</h3>
              <div style={{ height: '290px' }}>
                <QtyComparisonChart data={qtyComparisonData} loading={qtyComparisonLoading} />
              </div>
            </Paper>
          </Grid>

          <Grid item xs={6}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>Approval Duration (Days)</h3>
              <div style={{ height: '290px' }}>
                <ApprovalDurationChart data={approvalDurationData} loading={approvalDurationLoading} />
              </div>
            </Paper>
          </Grid>

          {/* Row 6: Equipment Spending (Full Width) */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, height: '300px' }}>
              <h3>Equipment Spending</h3>
              <div style={{ height: '240px' }}>
                <EquipmentSpendingChart data={equipmentSpendingData} loading={equipmentSpendingLoading} />
              </div>
            </Paper>
          </Grid>

          {/* Row 3: Top Barang & Top Pemasok */}
          <Grid item xs={6}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>Top 10 Barang</h3>
              <div style={{ height: '290px' }}>
                <TopBarangChart data={topBarangData} loading={topBarangLoading} />
              </div>
            </Paper>
          </Grid>

          <Grid item xs={6}>
            <Paper sx={{ p: 2, height: '350px' }}>
              <h3>Top 10 Pemasok</h3>
              <div style={{ height: '290px' }}>
                <TopPemasokChart data={topPemasokData} loading={topPemasokLoading} />
              </div>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Stack>
  );
}
