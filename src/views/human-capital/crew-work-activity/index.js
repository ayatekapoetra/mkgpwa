'use client';

import { useState } from 'react';
import moment from 'moment';
import MainCard from 'components/MainCard';
import Paginate from 'components/Paginate';
import { Card, CardContent, Stack, Chip, IconButton, Typography, Grid, Box } from '@mui/material';
import { Filter, ClipboardText, TickCircle, CloseCircle, Timer1 } from 'iconsax-react';

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
  { key: 'rejected', label: 'Rejected', icon: CloseCircle, color: 'error' }
];

const CrewWorkActivityScreen = () => {
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState(defaultParams);
  const { rows, loading, error, total, page, perPage, lastPage } = useCrewWorkActivity(params);
  const { stats, statsLoading, statsError } = useCrewWorkActivityStats(params);

  const summary = {
    total: Number(stats.total || 0),
    pending: Number(stats.pending || 0),
    approved: Number(stats.approved || 0),
    rejected: Number(stats.rejected || 0),
    productiveHours: Number(stats.total_productive_hours || 0),
    overtimeHours: Number(stats.total_overtime || 0)
  };

  const toggleFilterHandle = () => setOpenFilter((prev) => !prev);

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
                    <Grid item xs={12} sm={6} md={3} key={item.key}>
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

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip label={`${params.startdate || '-'} s/d ${params.enddate || '-'}`} size="small" variant="outlined" />
              {params.status ? <Chip label={`Status: ${params.status}`} size="small" variant="outlined" /> : null}
            </Stack>

            <CrewWorkActivityTable rows={rows} loading={loading} error={error} />

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
