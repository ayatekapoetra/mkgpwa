'use client';

import { Dialog, DialogContent, DialogTitle, LinearProgress, Typography, Box, Stack } from '@mui/material';
import { Wifi } from 'iconsax-react';

export default function SyncProgressDialog({ open, progress }) {
  const { synced = 0, failed = 0, total = 0, current = '' } = progress || {};
  const percentage = total > 0 ? ((synced + failed) / total) * 100 : 0;

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Wifi />
          <Typography variant="h5">Sinkronisasi Data</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Box>
            <LinearProgress variant="determinate" value={percentage} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
          <Box>
            <Typography variant="h6" gutterBottom>
              {synced + failed} / {total}
            </Typography>
            <Typography variant="body2" color="textSecondary" noWrap>
              {current || 'Memproses...'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Berhasil
              </Typography>
              <Typography variant="h6" color="success.main">
                {synced}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Gagal
              </Typography>
              <Typography variant="h6" color="error.main">
                {failed}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
