'use client';

import { useRef, useState } from 'react';
import NextLink from 'next/link';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { markAllNotificationsRead, markNotificationRead, useNotificationInbox, useNotificationUnreadCount } from 'api/push-notifications';
import Avatar from 'components/@extended/Avatar';
import IconButton from 'components/@extended/IconButton';
import Transitions from 'components/@extended/Transitions';
import MainCard from 'components/MainCard';
import { ThemeMode } from 'config';
import { Notification } from 'iconsax-react';

const rowId = (row) => row?.uuid || row?.id;
const isRead = (row) => Boolean(row?.read_at || row?.readAt || row?.is_read || row?.read);

export default function NotificationPage() {
  const theme = useTheme();
  const matchesXs = useMediaQuery(theme.breakpoints.down('md'));
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const { unreadCount } = useNotificationUnreadCount();
  const { rows, dataLoading, dataError, mutate } = useNotificationInbox({ page: 1, perPage: 5, app: 'web' });

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpen(false);
  };

  const handleMarkAll = async (event) => {
    event.preventDefault();
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      await mutate();
    } finally {
      setMarkingAll(false);
    }
  };

  const iconBackColorOpen = theme.palette.mode === ThemeMode.DARK ? 'secondary.200' : 'secondary.200';
  const iconBackColor = theme.palette.mode === ThemeMode.DARK ? 'background.default' : 'secondary.100';

  return (
    <Box sx={{ flexShrink: 0, ml: 0.5 }}>
      <IconButton
        color="secondary"
        variant="light"
        aria-label="Open notifications"
        ref={anchorRef}
        aria-controls={open ? 'notification-menu' : undefined}
        aria-haspopup="true"
        onClick={() => setOpen((current) => !current)}
        size="large"
        sx={{ color: 'secondary.main', bgcolor: open ? iconBackColorOpen : iconBackColor, p: 1 }}
      >
        <Badge badgeContent={unreadCount} max={99} color="success" sx={{ '& .MuiBadge-badge': { top: 2, right: 4 } }}>
          <Notification variant="Bold" />
        </Badge>
      </IconButton>
      <Popper
        placement={matchesXs ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        transition
        disablePortal
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [matchesXs ? -5 : 0, 9] } }] }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position={matchesXs ? 'top' : 'top-right'} sx={{ overflow: 'hidden' }} in={open} {...TransitionProps}>
            <Paper sx={{ boxShadow: theme.customShadows.z1, borderRadius: 1.5, width: '100%', minWidth: 285, maxWidth: 420, [theme.breakpoints.down('md')]: { maxWidth: 285 } }}>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard elevation={0} border={false}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h5">Notifications</Typography>
                    <Link component="button" type="button" variant="h6" color="primary" onClick={handleMarkAll} disabled={markingAll || unreadCount === 0} sx={{ border: 0, bgcolor: 'transparent', cursor: 'pointer' }}>
                      {markingAll ? 'Marking...' : 'Mark all read'}
                    </Link>
                  </Stack>
                  {dataLoading ? <Stack alignItems="center" py={5}><CircularProgress size={28} /></Stack> : dataError ? <Alert severity="error" sx={{ mt: 2 }}>Unable to load notifications.</Alert> : !rows.length ? <Typography color="text.secondary" textAlign="center" py={5}>No notifications yet.</Typography> : (
                    <List component="nav" sx={{ maxHeight: 390, overflowY: 'auto', '& .MuiListItemButton-root': { p: 1.5, my: 1.5, border: `1px solid ${theme.palette.divider}`, '&:hover': { bgcolor: 'primary.lighter', borderColor: theme.palette.primary.light } } }}>
                      {rows.map((row) => (
                        <ListItemButton
                          key={rowId(row)}
                          component={NextLink}
                          href={`/notifications/${rowId(row)}`}
                          onClick={() => { setOpen(false); if (!isRead(row)) markNotificationRead(rowId(row)).catch(() => {}); }}
                          sx={{ bgcolor: isRead(row) ? 'transparent' : 'primary.lighter' }}
                        >
                          <ListItemAvatar><Avatar type={isRead(row) ? 'outlined' : 'filled'}><Notification size={20} variant="Bold" /></Avatar></ListItemAvatar>
                          <ListItemText
                            primary={<Typography variant={isRead(row) ? 'body2' : 'subtitle2'} noWrap>{row.title || 'Notification'}</Typography>}
                            secondary={<><Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>{row.body || row.message || ''}</Typography><Typography component="span" variant="caption" color="text.secondary">{row.created_at || row.createdAt || ''}</Typography></>}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  )}
                  <Stack direction="row" justifyContent="center">
                    <Link component={NextLink} href="/notifications" variant="h6" color="primary" onClick={() => setOpen(false)}>View all</Link>
                  </Stack>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}
