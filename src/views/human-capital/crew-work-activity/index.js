'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import MainCard from 'components/MainCard';
import Paginate from 'components/Paginate';
import { Button, Card, CardContent, Stack, Chip, IconButton, Typography, Grid, Box } from '@mui/material';
import { Filter, ClipboardText, TickCircle, CloseCircle, Timer1, TaskSquare } from 'iconsax-react';

import { useCrewWorkActivity, useCrewWorkActivityStats } from 'api/crew-work-activity';
import CrewWorkActivityTable from './table';
import FilterCrewWorkActivity from './filter';

const defaultParams = () => ({
  startdate: moment().startOf('month').format('YYYY-MM-DD'),
  enddate: moment().endOf('month').format('YYYY-MM-DD'),
  status: '',
  crew_id: '',
  spv_id: '',
  cabang_id: '',
  keterangan: '',
  page: 1,
  perPages: 25
});

const statusSummary = [
  { key: 'total', label: 'Total Data', icon: ClipboardText, color: 'primary' },
  { key: 'pending', label: 'Pending', icon: Timer1, color: 'warning' },
  { key: 'approved', label: 'Approved', icon: TickCircle, color: 'success' },
  { key: 'validated', label: 'Validated', icon: TaskSquare, color: 'info' },
  { key: 'rejected', label: 'Rejected', icon: CloseCircle, color: 'error' }
];

const REVIEW_STORAGE_KEY = 'crewWorkActivityValidateSelection';
const FILTER_STORAGE_KEY = 'crew_work_activity_filter_params';

const getStoredParams = () => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading crew work activity filter from localStorage:', error);
    return null;
  }
};

const saveParamsToStorage = (params) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(params));
  } catch (error) {
    console.error('Error saving crew work activity filter to localStorage:', error);
  }
};

const CrewWorkActivityScreen = () => {
  const router = useRouter();
  const [openFilter, setOpenFilter] = useState(false);
  const [selectedRowsById, setSelectedRowsById] = useState({});
  const [params, setParams] = useState(() => getStoredParams() || defaultParams());
  const { rows, loading, error, total, page, perPage, lastPage } = useCrewWorkActivity(params);
  const { stats, statsLoading, statsError } = useCrewWorkActivityStats(params);

  const summary = {
    total: Number(stats.total || 0),
    pending: Number(stats.pending || 0),
    approved: Number(stats.approved || 0),
    validated: Number(stats.validated || stats.validated_count || 0),
    rejected: Number(stats.rejected || 0),
    productiveHours: Number(stats.total_productive_hours || 0),
    overtimeHours: Number(stats.total_overtime || 0)
  };

  useEffect(() => {
    saveParamsToStorage(params);
  }, [params]);

  const selectedRows = useMemo(() => Object.values(selectedRowsById), [selectedRowsById]);
  const selectedIds = useMemo(() => selectedRows.map((row) => row.id), [selectedRows]);

  const toggleFilterHandle = () => setOpenFilter((prev) => !prev);

  const toggleRowSelection = (row) => {
    if (!row || row.status !== 'A' || row.aktif === 'N') return;

    setSelectedRowsById((prev) => {
      const next = { ...prev };
      if (next[row.id]) {
        delete next[row.id];
      } else {
        next[row.id] = row;
      }
      return next;
    });
  };

  const toggleAllSelection = (eligibleRows = []) => {
    setSelectedRowsById((prev) => {
      const next = { ...prev };
      const allSelected = eligibleRows.length > 0 && eligibleRows.every((row) => next[row.id]);

      eligibleRows.forEach((row) => {
        if (allSelected) {
          delete next[row.id];
        } else if (row.status === 'A' && row.aktif !== 'N') {
          next[row.id] = row;
        }
      });

      return next;
    });
  };

  const openValidateReview = () => {
    const uniqueRows = Object.values(selectedRowsById).filter((row, index, array) => row?.id && array.findIndex((item) => item.id === row.id) === index && row.status === 'A' && row.aktif !== 'N');
    sessionStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(uniqueRows));
    router.push('/crew-work-activity/validate-review');
  };

  return (
    <MainCard
      title={
        <Stack spacing={0.25}>
          <Typography variant="h5">Crew Work Activity</Typography>
          <Typography variant="caption" color="text.secondary">
            Monitoring aktivitas kerja crew dari empapps
          </Typography>
        </Stack>
      }
      secondary={
        <Stack direction="row" spacing={1} alignItems="center">
          {loading || statsLoading ? <Chip label="Loading..." size="small" color="info" /> : null}
          {error || statsError ? <Chip label="Error memuat data" size="small" color="error" /> : null}
          <IconButton aria-label="filter" variant="dashed" color="primary" onClick={toggleFilterHandle}>
            <Filter />
          </IconButton>
        </Stack>
      }
      content={false}
    >
      <Card elevation={0} sx={{ borderRadius: 0 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Grid container spacing={2}>
                {statusSummary.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Grid item xs={12} sm={6} md={statusSummary.length > 4 ? 2.4 : 3} key={item.key}>
                      <Card variant="outlined">
                        <Box sx={{ p: 2 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack spacing={0.5}>
                              <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                              <Typography variant="h4">{summary[item.key]}</Typography>
                            </Stack>
                            <Box color={`${item.color}.main`}>
                              <Icon size={30} />
                            </Box>
                          </Stack>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <Box sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">Total Jam Produktif</Typography>
                      <Typography variant="h4">{summary.productiveHours.toFixed(2)} jam</Typography>
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <Box sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">Total Jam Lembur</Typography>
                      <Typography variant="h4">{summary.overtimeHours.toFixed(2)} jam</Typography>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip label={`${params.startdate || '-'} s/d ${params.enddate || '-'}`} size="small" variant="outlined" />
                {params.status ? <Chip label={`Status: ${params.status}`} size="small" variant="outlined" /> : null}
                {selectedRows.length > 0 ? <Chip label={`${selectedRows.length} data dipilih`} size="small" color="info" variant="light" /> : null}
              </Stack>
              {selectedRows.length > 0 ? (
                <Button variant="contained" color="primary" startIcon={<TaskSquare size={18} />} onClick={openValidateReview}>
                  Review Validate
                </Button>
              ) : null}
            </Stack>

            <CrewWorkActivityTable
              rows={rows}
              loading={loading}
              error={error}
              selectedIds={selectedIds}
              onToggleRow={toggleRowSelection}
              onToggleAll={toggleAllSelection}
            />

            <Paginate
              page={page || params.page || 1}
              total={total || 0}
              lastPage={lastPage || Math.max(1, Math.ceil((total || 0) / (perPage || params.perPages || 25)))}
              perPage={perPage || params.perPages || 25}
              onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
            />
          </Stack>
        </CardContent>
      </Card>

      <FilterCrewWorkActivity data={params} setData={setParams} open={openFilter} count={total} onClose={toggleFilterHandle} />
    </MainCard>
  );
};

export default CrewWorkActivityScreen;
