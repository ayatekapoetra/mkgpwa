'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  Divider,
  Paper
} from '@mui/material';
import { Warning2 } from 'iconsax-react';

export default function ConflictResolutionDialog({ open, conflict, onResolve }) {
  if (!conflict) return null;

  const { localData, serverData, pesan } = conflict;

  const handleOverwrite = () => {
    onResolve('overwrite');
  };

  const handleSkip = () => {
    onResolve('skip');
  };

  return (
    <Dialog open={open} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Warning2 color="#ff9800" />
          <Typography variant="h5">Konflik Data Terdeteksi</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          {pesan || 'Data yang akan dikirim sudah ada di server. Pilih tindakan:'}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Data Lokal (Offline)
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(localData, null, 2)}
            </Typography>
          </Paper>

          <Divider sx={{ my: 2 }} />

          <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100' }}>
            <Typography variant="subtitle2" color="secondary" gutterBottom>
              Data Server (Online)
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(serverData, null, 2)}
            </Typography>
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSkip} color="secondary">
          Lewati (Skip)
        </Button>
        <Button onClick={handleOverwrite} variant="contained" color="warning">
          Timpa Data Server
        </Button>
      </DialogActions>
    </Dialog>
  );
}
