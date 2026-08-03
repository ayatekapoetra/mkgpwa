'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { APP_DEFAULT_PATH } from 'config';
import { markNotificationRead, useNotificationInboxDetail } from 'api/push-notifications';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';

export default function NotificationDetailScreen({ uuid }) {
  const { data, dataLoading, dataError, mutate } = useNotificationInboxDetail(uuid);
  const marked = useRef(false);

  useEffect(() => {
    const read = data?.read_at || data?.readAt || data?.is_read || data?.read;
    if (!data || read || marked.current) return;
    marked.current = true;
    markNotificationRead(uuid).then(() => mutate()).catch(() => { marked.current = false; });
  }, [data, mutate, uuid]);

  return (
    <Stack spacing={2}>
      <Breadcrumbs custom heading="Notification detail" links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Notifications', to: '/notifications' }, { title: 'Detail' }]} />
      {dataLoading ? <Stack alignItems="center" py={8}><CircularProgress /></Stack> : dataError ? <Alert severity="error">{dataError?.message || dataError?.error || 'Unable to load this notification.'}</Alert> : !data ? <Alert severity="info">Notification not found.</Alert> : (
        <MainCard>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
              <Typography variant="h3">{data.title || 'Notification'}</Typography>
              <Chip size="small" label={data.priority === 'high' ? 'High priority' : 'Notification'} color={data.priority === 'high' ? 'error' : 'default'} sx={{ alignSelf: 'flex-start' }} />
            </Stack>
            <Typography variant="caption" color="text.secondary">{data.created_at || data.createdAt || ''}</Typography>
            <Divider />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{data.body || data.message || ''}</Typography>
            <Button component={Link} href="/notifications" variant="outlined" sx={{ alignSelf: 'flex-start' }}>Back to notifications</Button>
          </Stack>
        </MainCard>
      )}
    </Stack>
  );
}
