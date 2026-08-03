'use client';

import { useState } from 'react';
import Link from 'next/link';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { APP_DEFAULT_PATH } from 'config';
import { markAllNotificationsRead, markNotificationRead, useNotificationInbox } from 'api/push-notifications';
import { openNotification } from 'api/notification';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';

const rowId = (row) => row?.uuid || row?.id;
const isRead = (row) => Boolean(row?.read_at || row?.readAt || row?.is_read || row?.read);
const getError = (error) => error?.message || error?.error || 'Unable to load notifications.';

export default function NotificationsScreen() {
  const [params, setParams] = useState({ page: 1, perPage: 10 });
  const [readFilter, setReadFilter] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);
  const { rows, total, page, lastPage, dataLoading, dataError, mutate } = useNotificationInbox({
    ...params,
    app: 'web',
    ...(readFilter === 'unread' ? { read: false } : {})
  });

  const handleMarkAll = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      await mutate();
    } catch (error) {
      openNotification({ open: true, title: 'error', message: getError(error), alert: { color: 'error' } });
    } finally {
      setMarkingAll(false);
    }
  };

  const handleOpen = async (row) => {
    if (!isRead(row)) {
      try {
        await markNotificationRead(rowId(row));
      } catch {
        // Detail remains available when the read receipt cannot be saved.
      }
    }
  };

  return (
    <Stack spacing={2}>
      <Breadcrumbs custom heading="Notifications" links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Notifications' }]} />
      <MainCard
        title="Inbox"
        secondary={<Button size="small" onClick={handleMarkAll} disabled={markingAll}>{markingAll ? <CircularProgress size={18} /> : 'Mark all read'}</Button>}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1.5} mb={1}>
          <Typography variant="body2" color="text.secondary">{total} notifications</Typography>
          <TextField select size="small" label="Show" value={readFilter} onChange={(event) => { setReadFilter(event.target.value); setParams((current) => ({ ...current, page: 1 })); }} sx={{ minWidth: 150 }}>
            <MenuItem value="all">All</MenuItem><MenuItem value="unread">Unread</MenuItem>
          </TextField>
        </Stack>
        {dataLoading ? <Stack alignItems="center" py={7}><CircularProgress /></Stack> : dataError ? <Alert severity="error">{getError(dataError)}</Alert> : !rows.length ? <Alert severity="info">No notifications here yet.</Alert> : (
          <>
            <List disablePadding>
              {rows.map((row, index) => (
                <Box key={rowId(row)}>
                  {index > 0 && <Divider />}
                  <ListItemButton component={Link} href={`/notifications/${rowId(row)}`} onClick={() => handleOpen(row)} sx={{ px: { xs: 0, sm: 1.5 }, py: 2, alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={<Stack direction="row" alignItems="center" gap={1}><Typography variant={isRead(row) ? 'body1' : 'subtitle1'}>{row.title || 'Notification'}</Typography>{!isRead(row) && <Chip size="small" color="primary" label="New" />}</Stack>}
                      secondary={<><Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{row.body || row.message || ''}</Typography><Typography component="span" variant="caption" color="text.secondary">{row.created_at || row.createdAt || ''}</Typography></>}
                    />
                  </ListItemButton>
                </Box>
              ))}
            </List>
            <Stack alignItems="center" mt={2}><Pagination count={lastPage} page={page} onChange={(_, nextPage) => setParams((current) => ({ ...current, page: nextPage }))} /></Stack>
          </>
        )}
      </MainCard>
    </Stack>
  );
}
