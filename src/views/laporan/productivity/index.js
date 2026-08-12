'use client';

import { useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import FilterListIcon from '@mui/icons-material/FilterList';

import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import { useGetProductivityBase, useGetProductivityHmkm, useGetProductivityStandby, useGetProductivityOpportunity, useGetProductivityOperating, useGetProductivityPa, useGetProductivityMa } from 'api/productivity';
import FilterProductivity from './filter';
import ListProductivity from './list';

const getDefaultDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return { startdate: `${year}-${month}-01`, enddate: `${year}-${month}-${day}` };
};

const errorMessage = (error) => error?.diagnostic?.message || error?.message || 'Gagal memuat laporan Productivity.';

export default function ProductivityScreen() {
  const defaultDates = useMemo(() => getDefaultDates(), []);
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState({
    page: 1,
    perPage: 25,
    startdate: defaultDates.startdate,
    enddate: defaultDates.enddate,
    penyewa_ids: [],
    equipment_ids: [],
    shift_ids: []
  });

  const result = useGetProductivityBase(params);
  const hmkmResult = useGetProductivityHmkm(params);
  const standbyResult = useGetProductivityStandby(params);
  const opportunityResult = useGetProductivityOpportunity(params);
  const operatingResult = useGetProductivityOperating(params);
  const paResult = useGetProductivityPa(params);
  const maResult = useGetProductivityMa(params);

  const hmkmMap = useMemo(() => {
    const map = new Map();
    (hmkmResult.data || []).forEach((row) => {
      if (row.row_key) map.set(row.row_key, row.hmkm ?? 0);
    });
    return map;
  }, [hmkmResult.data]);

  const standbyMap = useMemo(() => {
    const map = new Map();
    (standbyResult.data || []).forEach((row) => {
      if (row.row_key) map.set(row.row_key, row.standby ?? 0);
    });
    return map;
  }, [standbyResult.data]);

  const opportunityMap = useMemo(() => {
    const map = new Map();
    (opportunityResult.data || []).forEach((row) => {
      if (row.row_key) map.set(row.row_key, row.opportunity ?? 0);
    });
    return map;
  }, [opportunityResult.data]);

  const operatingMap = useMemo(() => {
    const map = new Map();
    (operatingResult.data || []).forEach((row) => {
      if (row.row_key) map.set(row.row_key, row.operating ?? 0);
    });
    return map;
  }, [operatingResult.data]);

  const paMap = useMemo(() => {
    const map = new Map();
    (paResult.data || []).forEach((row) => {
      if (row.row_key) map.set(row.row_key, row.PA ?? 0);
    });
    return map;
  }, [paResult.data]);

  const maMap = useMemo(() => {
    const map = new Map();
    (maResult.data || []).forEach((row) => {
      if (row.row_key) map.set(row.row_key, row.MA ?? 0);
    });
    return map;
  }, [maResult.data]);

  const mergedData = useMemo(
    () => (result.data || []).map((row) => ({
      ...row,
      hmkm: hmkmMap.get(row.row_key) ?? 0,
      standby: standbyMap.get(row.row_key) ?? 0,
      opportunity: opportunityMap.get(row.row_key) ?? 0,
      operating: operatingMap.get(row.row_key) ?? 0,
      PA: paMap.get(row.row_key) ?? 0,
      MA: maMap.get(row.row_key) ?? 0
    })),
    [result.data, hmkmMap, standbyMap, opportunityMap, operatingMap, paMap, maMap]
  );

  return (
    <MainCard
      title="Laporan Productivity"
      secondary={
        <Stack direction="row" gap={1}>
          <Tooltip title="Filter">
            <IconButton aria-label="filter" variant="dashed" color="primary" onClick={() => setOpenFilter((open) => !open)}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      }
      content={false}
    >
      <Stack spacing={2} sx={{ px: 1, pb: 2 }}>
        {result.dataError ? <Alert severity="error">{errorMessage(result.dataError)}</Alert> : null}
        {result.dataLoading && !result.data.length ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
            <CircularProgress />
          </Box>
        ) : null}
        <FilterProductivity
          open={openFilter}
          count={result.total}
          params={params}
          setParams={setParams}
          onClose={() => setOpenFilter(false)}
        />
        <ListProductivity
          data={mergedData}
          total={result.total}
          page={result.page}
          perPage={result.perPage}
          loading={result.dataLoading}
          onPageChange={(page) => setParams((previous) => ({ ...previous, page }))}
          onRowsPerPageChange={(perPage) => setParams((previous) => ({ ...previous, perPage, page: 1 }))}
        />
      </Stack>
    </MainCard>
  );
}