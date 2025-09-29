// ListFetchFailed.js
import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import MainCard from 'components/MainCard';
import SimpleBar from 'components/third-party/SimpleBar';
import IconButton from 'components/@extended/IconButton';
import { ThemeMode } from 'config';
import { Trash, Add, Send2, NotificationStatus } from 'iconsax-react';

// offline queue utils
import { getAllRequests, deleteRequest } from 'lib/offlineFetch';
import axiosServices from 'utils/axios';

const ListFetchFailed = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [queue, setQueue] = useState([]);

  const handleToggle = () => setOpen(!open);

  const loadQueue = async () => {
    const items = await getAllRequests();
    setQueue(items);
  };

  useEffect(() => {
    loadQueue();

    // reload saat kembali online
    window.addEventListener('online', loadQueue);
    // reload saat ada update queue dari replayRequests
    window.addEventListener('queue-updated', loadQueue);

    return () => {
      window.removeEventListener('online', loadQueue);
      window.removeEventListener('queue-updated', loadQueue);
    };
  }, []);

  // retry satu request (kirim langsung via axiosServices)
  const handleRetry = async (key) => {
    const item = queue?.find((q) => q.key === key);
    if (!item) return;

    try {
      const res = await axiosServices({
        url: item.url,
        method: item.method,
        data: item.data,
        headers: item.headers
      });

      // sukses -> hapus queue
      if (res?.status >= 200 && res?.status < 300) {
        await deleteRequest(key);
        await loadQueue();
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          console.log('✅ Data berhasil dikirim ulang & dihapus:', key);
        }
      }
    } catch (err) {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.error('❌ Retry error:', err);
      }
    }
  };

  // hapus request dari queue
  const handleDelete = async (key) => {
    await deleteRequest(key);
    await loadQueue();
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('🗑️ Data dihapus:', key);
    }
  };

  const iconBackColorOpen = theme.palette.mode === ThemeMode.DARK ? 'secondary.200' : 'secondary.200';
  const iconBackColor = theme.palette.mode === ThemeMode.DARK ? 'background.default' : 'secondary.100';

  return (
    <>
      <Box sx={{ flexShrink: 0, ml: 0.75 }}>
        <IconButton
          color="secondary"
          variant="light"
          onClick={handleToggle}
          aria-label="settings toggler"
          size="large"
          sx={{
            color: 'secondary.main',
            bgcolor: open ? iconBackColorOpen : iconBackColor,
            p: 1
          }}
        >
          <NotificationStatus variant="Bulk" />
        </IconButton>
      </Box>

      <Drawer sx={{ zIndex: 2001 }} anchor="right" onClose={handleToggle} open={open} PaperProps={{ sx: { width: { xs: 350, sm: 474 } } }}>
        {open && (
          <MainCard content={false} sx={{ border: 'none', borderRadius: 0, height: '100vh' }}>
            <SimpleBar
              sx={{
                '& .simplebar-content': {
                  display: 'flex',
                  flexDirection: 'column'
                }
              }}
            >
              <Box sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
                  <Typography variant="h4">SINKRONISASI SERVER</Typography>
                  <IconButton color="secondary" sx={{ p: 0 }} onClick={handleToggle}>
                    <Add size={28} style={{ transform: 'rotate(45deg)' }} />
                  </IconButton>
                </Stack>

                <Grid container spacing={1.5} sx={{ mt: 2 }}>
                  {queue.length === 0 ? (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Tidak ada data pending
                      </Typography>
                    </Grid>
                  ) : (
                    queue.map((item) => (
                      <Grid item xs={12} key={item.key}>
                        <Stack sx={{ borderBottom: '1px dashed', mb: 1 }}>
                          <Stack direction="row" gap={2} alignItems="center" justifyContent="space-between" mb={1}>
                            <Chip
                              size="small"
                              label={item.status}
                              variant="light"
                              color={item.status == 'terkirim' ? 'success' : 'error'}
                            />
                            <Typography variant="caption">{new Date(item.timestamp).toLocaleString()}</Typography>
                          </Stack>
                          <Stack direction="row" gap={2} alignItems="center" justifyContent="space-between">
                            <Stack>
                              <Typography variant="subtitle1">{item.pesan || `${item.method} ${item.url}`}</Typography>
                              <Typography variant="caption">{`${item.method} ${item.url}`}</Typography>
                            </Stack>
                            <Stack direction="row" gap={0.5} alignItems="center">
                              <IconButton
                                aria-label="settings"
                                variant="dashed"
                                color="error"
                                size="small"
                                onClick={() => handleDelete(item.key)}
                              >
                                <Trash />
                              </IconButton>
                              {!item.status == 'terkirim' && (
                                <IconButton
                                  aria-label="settings"
                                  variant="contained"
                                  color="primary"
                                  size="small"
                                  onClick={() => handleRetry(item.key)}
                                >
                                  <Send2 />
                                </IconButton>
                              )}
                            </Stack>
                          </Stack>
                        </Stack>
                      </Grid>
                    ))
                  )}
                </Grid>
              </Box>
            </SimpleBar>
          </MainCard>
        )}
      </Drawer>
    </>
  );
};

export default ListFetchFailed;
