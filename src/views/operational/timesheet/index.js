'use client';

import { Fragment, useState, useEffect } from 'react';
import Link from 'next/link';

// MATERIAL - UI
import Button from '@mui/material/Button';
import { Stack, useMediaQuery, useTheme, List, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';

// COMPONENTS
import IconButton from 'components/@extended/IconButton';

// COMPONENTS
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';

// THIRD - PARTY
import { Filter, Wifi, NoteAdd, DocumentDownload } from 'iconsax-react';
import ListTimesheet from './list';
import { getAllRequests, replayRequests } from 'lib/offlineFetch';
import SyncProgressDialog from 'components/SyncProgressDialog';

// SWR
import { useGetDailyTimesheet, exportTimesheetHeavyEquipment, exportTimesheetDumptruck, exportTimesheetAll } from 'api/daily-timesheet';
import FilterTimesheet from './filter';
import { generateHeavyEquipmentTimesheetExcel, generateDumptruckTimesheetExcel, generateAllTimesheetExcel } from 'utils/excelExport';
import { useSnackbar } from 'notistack';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Daily Timesheet', to: '/penugasan-kerja' }
];

const STORAGE_KEY = 'timesheet_filter_params';

const getStoredParams = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

const saveParamsToStorage = (params) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export default function DailyTimesheetScreen() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();

  const defaultParams = {
    page: 1,
    perPage: 25,
    id: '',
    site_id: '',
    karyawan_id: '',
    penyewa_id: '',
    equipment_id: '',
    startdate: '',
    enddate: '',
    status: '',
    type: ''
  };

  const [params, setParams] = useState(() => {
    const storedParams = getStoredParams();
    return storedParams || defaultParams;
  });

  const [openFilter, setOpenFilter] = useState(false);
  const [queueStatus, setQueueStatus] = useState({});
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ synced: 0, failed: 0, total: 0, current: '' });
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [anchorElDownload, setAnchorElDownload] = useState(null);
  const openDownloadMenu = Boolean(anchorElDownload);
  const { data, dataLoading } = useGetDailyTimesheet(params);

  useEffect(() => {
    saveParamsToStorage(params);
  }, [params]);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  const handleClickDownload = (event) => {
    setAnchorElDownload(event.currentTarget);
  };

  const handleCloseDownloadMenu = () => {
    setAnchorElDownload(null);
  };

  // Load queue status
  useEffect(() => {
    const loadQueueStatus = async () => {
      const requests = await getAllRequests();
      const statusMap = {};

      requests.forEach((req) => {
        // Extract timesheet ID from request URL if it's an update operation
        if (req.url && req.url.includes('/timesheet/') && req.url.includes('/update')) {
          const match = req.url.match(/\/timesheet\/([^\/]+)\/update/);
          if (match && match[1]) {
            statusMap[match[1]] = req.status || 'pending';
          }
        }
      });

      setQueueStatus(statusMap);
    };

    loadQueueStatus();

    // Listen for queue updates
    window.addEventListener('queue-updated', loadQueueStatus);
    return () => window.removeEventListener('queue-updated', loadQueueStatus);
  }, []);

  // Online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync on background trigger
  useEffect(() => {
    const handleBackgroundSync = async () => {
      if (navigator.onLine && !syncing) {
        const requests = await getAllRequests();
        const pendingRequests = requests.filter((r) => r.status === 'pending' || r.status === 'error');
        
        if (pendingRequests.length > 0) {
          handleManualSync();
        }
      }
    };

    return undefined;
  }, [syncing]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await replayRequests((progress) => {
        setSyncProgress(progress);
      });
    } finally {
      setSyncing(false);
      setTimeout(() => {
        setSyncProgress({ synced: 0, failed: 0, total: 0, current: '' });
      }, 2000);
    }
  };

  const handleDownloadExcel = async (type) => {
    handleCloseDownloadMenu();
    setDownloadingExcel(true);
    try {
      const exportParams = {
        site_id: params.site_id,
        karyawan_id: params.karyawan_id,
        penyewa_id: params.penyewa_id,
        equipment_id: params.equipment_id,
        startdate: params.startdate,
        enddate: params.enddate,
        status: params.status
      };

      Object.keys(exportParams).forEach(key => {
        if (!exportParams[key]) delete exportParams[key];
      });

      if (type === 'alat-berat') {
        const response = await exportTimesheetHeavyEquipment(exportParams);
        
        if (!response?.rows || response.rows.length === 0) {
          enqueueSnackbar('Tidak ada data Alat Berat untuk di-export', { variant: 'warning' });
          return;
        }

        generateHeavyEquipmentTimesheetExcel(response.rows);
        enqueueSnackbar('Excel Alat Berat berhasil di-download', { variant: 'success' });
      } else if (type === 'dumptruck') {
        console.log('Fetching Dumptruck data with params:', exportParams);
        const response = await exportTimesheetDumptruck(exportParams);
        console.log('Dumptruck response:', response);
        
        if (!response?.rows || response.rows.length === 0) {
          enqueueSnackbar('Tidak ada data Dumptruck untuk di-export', { variant: 'warning' });
          return;
        }

        console.log('Generating Excel for', response.rows.length, 'records');
        generateDumptruckTimesheetExcel(response.rows);
        enqueueSnackbar('Excel Dumptruck berhasil di-download', { variant: 'success' });
      } else if (type === 'all') {
        console.log('Fetching All data with params:', exportParams);
        const response = await exportTimesheetAll(exportParams);
        console.log('All response:', response);
        
        if (!response?.rows || response.rows.length === 0) {
          enqueueSnackbar('Tidak ada data untuk di-export', { variant: 'warning' });
          return;
        }

        console.log('Generating Excel for', response.rows.length, 'records');
        generateAllTimesheetExcel(response.rows);
        enqueueSnackbar('Excel All Equipment berhasil di-download', { variant: 'success' });
      }
    } catch (error) {
      console.error('Download Excel error:', error);
      if (error?.stack) {
        console.error('Error stack:', error.stack);
      }
      if (error?.response) {
        console.error('Error response:', error.response);
      }
      enqueueSnackbar(error?.response?.data?.diagnostic?.message || error?.message || 'Gagal download Excel', { variant: 'error' });
    } finally {
      setDownloadingExcel(false);
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Daily Timesheet'} links={breadcrumbLinks} />
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            {isMobile ? (
              <IconButton variant="contained" component={Link} href="/timesheet/create" color="primary">
                <NoteAdd />
              </IconButton>
            ) : (
              <Button variant="contained" component={Link} href="/timesheet/create">
                Buat Timesheet
              </Button>
            )}
            {!isOnline && (
              <IconButton variant="outlined" color="warning" onClick={handleManualSync} disabled={syncing}>
                <Wifi />
              </IconButton>
            )}
            {isOnline && (
              <IconButton variant="outlined" color="success" onClick={handleManualSync} disabled={syncing}>
                <Wifi />
              </IconButton>
            )}
          </Stack>
        }
        secondary={
          <>
            <List component="nav" sx={{ p: 0, '& .MuiListItemIcon-root': { minWidth: 32 } }}>
              <Stack direction="row" spacing={0}>
                <ListItemButton onClick={handleClickDownload} disabled={downloadingExcel}>
                  <ListItemIcon>
                    <DocumentDownload />
                  </ListItemIcon>
                </ListItemButton>
                <ListItemButton onClick={toggleFilterHandle}>
                  <ListItemIcon>
                    <Filter />
                  </ListItemIcon>
                </ListItemButton>
              </Stack>
            </List>
            <Menu
              anchorEl={anchorElDownload}
              open={openDownloadMenu}
              onClose={handleCloseDownloadMenu}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => handleDownloadExcel('alat-berat')}>
                <ListItemIcon>
                  <DocumentDownload size={20} />
                </ListItemIcon>
                <ListItemText>Download Excel Alat Berat</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleDownloadExcel('dumptruck')}>
                <ListItemIcon>
                  <DocumentDownload size={20} />
                </ListItemIcon>
                <ListItemText>Download Excel Dumptruck</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleDownloadExcel('all')}>
                <ListItemIcon>
                  <DocumentDownload size={20} />
                </ListItemIcon>
                <ListItemText>Download Excel All Equipment</ListItemText>
              </MenuItem>
            </Menu>
          </>
        }
        content={false}
        sx={{ mt: 1 }}
      >
        <FilterTimesheet params={params} setParams={setParams} open={openFilter} count={data?.total} onClose={toggleFilterHandle} />
        {!dataLoading && <ListTimesheet data={data} queueStatus={queueStatus} setParams={setParams} />}
        <SyncProgressDialog open={syncing} progress={syncProgress} />
      </MainCard>
    </Fragment>
  );
}
