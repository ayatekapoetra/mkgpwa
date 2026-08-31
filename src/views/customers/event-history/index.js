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
  downloadCustomersEventHistory,
  useGetCustomersEventHistory
} from 'api/customers-event-history';
import FilterCustomersEventHistory from './filter';
import ListCustomersEventHistory from './list';

const getDefaultDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return { startdate: `${year}-${month}-01`, enddate: `${year}-${month}-${day}` };
};

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

const errorMessage = (error) =>
  error?.diagnostic?.message || error?.message || 'Gagal memuat laporan Event History.';

export default function CustomersEventHistoryScreen() {
  const defaultDates = useMemo(() => getDefaultDates(), []);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
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
      if (!isCustomer) {
        router.push('/home');
      }
    }
  }, [status, session, router]);

  const result = useGetCustomersEventHistory(params);
  const pelangganNama =
    result.pelangganNama || session?.pelanggan_nama || session?.nama || session?.name || '-';

  const handleDownload = async (format) => {
    try {
      setDownloadFormat(format);
      saveBlob(await downloadCustomersEventHistory(params, format));
      enqueueSnackbar(`Event History ${format.toUpperCase()} berhasil di-download`, {
        variant: 'success'
      });
    } catch (error) {
      enqueueSnackbar(errorMessage(error), { variant: 'error' });
    } finally {
      setDownloadFormat('');
    }
  };

  if (status === 'loading') {
    return <CircularLoader />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 3.5 } }}>
      <MainCard
        title="Event History"
        secondary={
          <Stack direction="row" gap={1}>
            <Tooltip title="Download PDF">
              <span>
                <IconButton
                  aria-label="download-pdf"
                  color="error"
                  onClick={() => handleDownload('pdf')}
                  disabled={Boolean(downloadFormat)}
                  sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}
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
                  color="success"
                  onClick={() => handleDownload('excel')}
                  disabled={Boolean(downloadFormat)}
                  sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}
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
                color="primary"
                onClick={() => setOpenFilter((open) => !open)}
                sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}
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
            Menampilkan data Event History untuk pelanggan: <strong>{pelangganNama}</strong>
          </Alert>
          {result.dataError ? <Alert severity="error">{errorMessage(result.dataError)}</Alert> : null}
          {result.dataLoading && !result.data.length ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
              <CircularProgress />
            </Box>
          ) : null}
          <FilterCustomersEventHistory
            open={openFilter}
            count={result.total}
            params={params}
            setParams={setParams}
            onClose={() => setOpenFilter(false)}
            pelangganNama={pelangganNama}
          />
          <ListCustomersEventHistory
            data={result.data}
            total={result.total}
            page={result.page}
            perPage={result.perPage}
            lastPage={result.lastPage}
            loading={result.dataLoading}
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
