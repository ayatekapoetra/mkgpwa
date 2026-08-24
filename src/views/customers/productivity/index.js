'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';

import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import CircularLoader from 'components/CircularLoader';
import {
  useGetCustomersProductivityBase,
  useGetCustomersProductivityHmkm,
  useGetCustomersProductivityStandby,
  useGetCustomersProductivityOpportunity,
  useGetCustomersProductivityOperating,
  useGetCustomersProductivityPa,
  useGetCustomersProductivityMa,
  useGetCustomersProductivityUa,
  useGetCustomersProductivityEu,
  useGetCustomersProductivityMttfs,
  useGetCustomersProductivityMttr,
  useGetCustomersProductivityMtbs,
  downloadCustomersProductivity
} from 'api/customers-productivity';
import FilterCustomersProductivity from './filter';
import ListProductivity from './list';

const getDefaultDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return { startdate: `${year}-${month}-01`, enddate: `${year}-${month}-${day}` };
};

const errorMessage = (error) =>
  error?.diagnostic?.message || error?.message || 'Gagal memuat laporan Productivity.';

const saveBlob = ({ blob, filename }) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export default function CustomersProductivityScreen() {
  const { enqueueSnackbar } = useSnackbar();
  const { data: session, status } = useSession();
  const router = useRouter();
  const defaultDates = useMemo(() => getDefaultDates(), []);
  const [openFilter, setOpenFilter] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('');
  const [params, setParams] = useState({
    page: 1,
    perPage: 25,
    startdate: defaultDates.startdate,
    enddate: defaultDates.enddate,
    equipment_ids: [],
    shift_ids: []
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login-customers');
      return;
    }
    if (status === 'authenticated') {
      const isCustomer =
        session?.authPortal === 'customers' ||
        String(session?.usertype || '').toLowerCase() === 'customers';
      if (!isCustomer) router.push('/home');
    }
  }, [status, session, router]);

  const result = useGetCustomersProductivityBase(params);
  const hmkmResult = useGetCustomersProductivityHmkm(params);
  const standbyResult = useGetCustomersProductivityStandby(params);
  const opportunityResult = useGetCustomersProductivityOpportunity(params);
  const operatingResult = useGetCustomersProductivityOperating(params);
  const paResult = useGetCustomersProductivityPa(params);
  const maResult = useGetCustomersProductivityMa(params);
  const uaResult = useGetCustomersProductivityUa(params);
  const euResult = useGetCustomersProductivityEu(params);
  const mttfsResult = useGetCustomersProductivityMttfs(params);
  const mttrResult = useGetCustomersProductivityMttr(params);
  const mtbsResult = useGetCustomersProductivityMtbs(params);

  const pelangganNama =
    result.pelangganNama || session?.pelanggan_nama || session?.nama || session?.name || '-';

  const handleDownload = async (format) => {
    try {
      setDownloadFormat(format);
      saveBlob(await downloadCustomersProductivity(params, format));
      enqueueSnackbar(`Productivity ${format.toUpperCase()} berhasil di-download`, {
        variant: 'success'
      });
    } catch (error) {
      enqueueSnackbar(errorMessage(error), { variant: 'error' });
    } finally {
      setDownloadFormat('');
    }
  };

  const mapMetric = (rows, field) => {
    const map = new Map();
    (rows || []).forEach((row) => {
      if (row.row_key) map.set(row.row_key, row[field] ?? 0);
    });
    return map;
  };

  const hmkmMap = useMemo(() => mapMetric(hmkmResult.data, 'hmkm'), [hmkmResult.data]);
  const standbyMap = useMemo(() => mapMetric(standbyResult.data, 'standby'), [standbyResult.data]);
  const opportunityMap = useMemo(
    () => mapMetric(opportunityResult.data, 'opportunity'),
    [opportunityResult.data]
  );
  const operatingMap = useMemo(
    () => mapMetric(operatingResult.data, 'operating'),
    [operatingResult.data]
  );
  const paMap = useMemo(() => mapMetric(paResult.data, 'PA'), [paResult.data]);
  const whMap = useMemo(() => mapMetric(paResult.data, 'WH'), [paResult.data]);
  const maMap = useMemo(() => mapMetric(maResult.data, 'MA'), [maResult.data]);
  const uaMap = useMemo(() => mapMetric(uaResult.data, 'UA'), [uaResult.data]);
  const euMap = useMemo(() => mapMetric(euResult.data, 'EU'), [euResult.data]);
  const mttfsMap = useMemo(() => mapMetric(mttfsResult.data, 'MTTFS'), [mttfsResult.data]);
  const mttrMap = useMemo(() => mapMetric(mttrResult.data, 'MTTR'), [mttrResult.data]);
  const mtbsMap = useMemo(() => mapMetric(mtbsResult.data, 'MTBS'), [mtbsResult.data]);

  const mergedData = useMemo(
    () =>
      (result.data || []).map((row) => ({
        ...row,
        hmkm: hmkmMap.get(row.row_key) ?? 0,
        standby: standbyMap.get(row.row_key) ?? 0,
        opportunity: opportunityMap.get(row.row_key) ?? 0,
        operating: operatingMap.get(row.row_key) ?? 0,
        PA: paMap.get(row.row_key) ?? 0,
        WH: whMap.get(row.row_key) ?? 0,
        MA: maMap.get(row.row_key) ?? 0,
        UA: uaMap.get(row.row_key) ?? 0,
        EU: euMap.get(row.row_key) ?? 0,
        MTTFS: mttfsMap.get(row.row_key) ?? 0,
        MTTR: mttrMap.get(row.row_key) ?? 0,
        MTBS: mtbsMap.get(row.row_key) ?? 0
      })),
    [
      result.data,
      hmkmMap,
      standbyMap,
      opportunityMap,
      operatingMap,
      paMap,
      whMap,
      maMap,
      uaMap,
      euMap,
      mttfsMap,
      mttrMap,
      mtbsMap
    ]
  );

  if (status === 'loading') return <CircularLoader />;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 3.5 } }}>
      <MainCard
        title="Productivity Equipment"
        secondary={
          <Stack direction="row" gap={1}>
            <Tooltip title="Download PDF">
              <span>
                <IconButton
                  aria-label="download-pdf"
                  variant="dashed"
                  color="error"
                  onClick={() => handleDownload('pdf')}
                  disabled={Boolean(downloadFormat)}
                >
                  {downloadFormat === 'pdf' ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <PictureAsPdfOutlinedIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Download Excel">
              <span>
                <IconButton
                  aria-label="download-excel"
                  variant="dashed"
                  color="success"
                  onClick={() => handleDownload('excel')}
                  disabled={Boolean(downloadFormat)}
                >
                  {downloadFormat === 'excel' ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <DescriptionOutlinedIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Filter">
              <IconButton
                aria-label="filter"
                variant="dashed"
                color="primary"
                onClick={() => setOpenFilter((open) => !open)}
              >
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        }
        content={false}
      >
        <Stack spacing={2} sx={{ px: 1, pb: 2 }}>
          <Alert severity="info" variant="outlined">
            Menampilkan data Productivity Equipment untuk pelanggan: <strong>{pelangganNama}</strong>
          </Alert>
          {result.dataError ? <Alert severity="error">{errorMessage(result.dataError)}</Alert> : null}
          {result.dataLoading && !result.data.length ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
              <CircularProgress />
            </Box>
          ) : null}
          <FilterCustomersProductivity
            open={openFilter}
            count={result.total}
            params={params}
            setParams={setParams}
            onClose={() => setOpenFilter(false)}
            pelangganNama={pelangganNama}
          />
          <ListProductivity
            data={mergedData}
            total={result.total}
            page={result.page}
            perPage={result.perPage}
            loading={result.dataLoading}
            filterParams={params}
            metricLoading={{
              hmkm: hmkmResult.dataLoading,
              standby: standbyResult.dataLoading,
              opportunity: opportunityResult.dataLoading,
              operating: operatingResult.dataLoading,
              PA: paResult.dataLoading,
              MA: maResult.dataLoading,
              UA: uaResult.dataLoading,
              EU: euResult.dataLoading,
              MTTFS: mttfsResult.dataLoading,
              MTTR: mttrResult.dataLoading,
              MTBS: mtbsResult.dataLoading
            }}
            onPageChange={(page) => setParams((previous) => ({ ...previous, page }))}
            onRowsPerPageChange={(perPage) =>
              setParams((previous) => ({ ...previous, perPage, page: 1 }))
            }
          />
        </Stack>
      </MainCard>
    </Container>
  );
}
