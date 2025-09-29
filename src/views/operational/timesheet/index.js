'use client';

import { Fragment, useState, useEffect } from 'react';
import Link from 'next/link';

// MATERIAL - UI
import Button from '@mui/material/Button';
import { Stack, useMediaQuery, useTheme } from '@mui/material';

// COMPONENTS
import IconButton from 'components/@extended/IconButton';

// COMPONENTS
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';

// THIRD - PARTY
import { Filter, Wifi, NoteAdd } from 'iconsax-react';
import ListTimesheet from './list';
import { getAllRequests } from 'lib/offlineFetch';
import { replayRequests } from 'lib/offlineFetch';

// SWR
import { useGetDailyTimesheet } from 'api/daily-timesheet';
import FilterTimesheet from './filter';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Daily Timesheet', to: '/penugasan-kerja' }
];

export default function DailyTimesheetScreen() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [params, setParams] = useState({
    page: 1,
    perPage: 25,
    site_id: '',
    karyawan_id: '',
    penyewa_id: '',
    equipment_id: '',
    startdate: '',
    enddate: ''
  });
  const [openFilter, setOpenFilter] = useState(false);
  const [queueStatus, setQueueStatus] = useState({});
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { data, dataLoading } = useGetDailyTimesheet(params);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
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

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await replayRequests();
    } finally {
      setSyncing(false);
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
            {!isOnline &&
              (isMobile ? (
                <IconButton variant="outlined" color="warning" onClick={handleManualSync} disabled={syncing}>
                  <Wifi />
                </IconButton>
              ) : (
                <Button variant="outlined" color="warning" startIcon={<Wifi />} onClick={handleManualSync} disabled={syncing}>
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              ))}
            {isOnline &&
              (isMobile ? (
                <IconButton variant="outlined" color="success" onClick={handleManualSync} disabled={syncing}>
                  <Wifi />
                </IconButton>
              ) : (
                <Button variant="outlined" color="success" startIcon={<Wifi />} onClick={handleManualSync} disabled={syncing}>
                  {syncing ? 'Syncing...' : 'Refresh Queue'}
                </Button>
              ))}
          </Stack>
        }
        secondary={
          <IconButton shape="rounded" color="secondary" onClick={toggleFilterHandle}>
            <Filter />
          </IconButton>
        }
        content={false}
        sx={{ mt: 1 }}
      >
        <FilterTimesheet params={params} setParams={setParams} open={openFilter} count={data?.total} onClose={toggleFilterHandle} />
        {!dataLoading && <ListTimesheet data={data} queueStatus={queueStatus} setParams={setParams} />}
      </MainCard>
    </Fragment>
  );
}
