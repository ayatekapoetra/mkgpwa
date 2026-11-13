'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Divider,
  Stack,
  CircularProgress
} from '@mui/material';
import { Close } from '@mui/icons-material';

import { useGetRekapDetail } from 'api/ritase-rekap';

const formatNum = (v, digits = 2) => {
  const n = Number(v || 0);
  return n.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

export default function RekapRitaseDetailDialog({ open, onClose, selectedGroup }) {
  const { header, items, loading } = useGetRekapDetail(selectedGroup || {}, Boolean(open && selectedGroup));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight={700}>
            Detail Rekap Ritase
          </Typography>
          <Button size="small" onClick={onClose} startIcon={<Close />}>
            Tutup
          </Button>
        </Stack>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 2.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            {header && (
              <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Tanggal</Typography>
                    <Typography variant="body2" fontWeight={600}>{header.date_ops || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Shift</Typography>
                    <Typography variant="body2" fontWeight={600}>{header.shift_nama || `Shift ${header.shift_id}` || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Unit Bisnis / IUP</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {header.bisnis_initial || header.bisnis_id} / {header.penyewa_abbr || header.penyewa_id}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Fleet / Loader</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {header.fleet_name || '-'} ({header.excavator_kode || header.excavator_id || '-'})
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">PIT Asal</Typography>
                    <Typography variant="body2" fontWeight={600}>{header.startpit_nama || header.startpit_id || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Material</Typography>
                    <Typography variant="body2" fontWeight={600}>{header.material_nama || header.material_id || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Total Ritase / DT</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {header.total_ritase} Rit ({header.total_dumptruck} DT)
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Total Ton / BCM</Typography>
                    <Typography variant="body2" fontWeight={700} color="success.main">
                      {formatNum(header.total_ton)} T / {formatNum(header.total_bcm)} BCM
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            <Typography variant="subtitle1" fontWeight={700}>
              Daftar Dump Truck & Alokasi DOM
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell>Hauler (DT)</TableCell>
                    <TableCell>KDSM</TableCell>
                    <TableCell align="right">Jarak (km)</TableCell>
                    <TableCell align="center">TF (Ton/BCM)</TableCell>
                    <TableCell align="right">Rit</TableCell>
                    <TableCell align="right">Tonase</TableCell>
                    <TableCell align="right">BCM</TableCell>
                    <TableCell>Alokasi DOM & Stockpile</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        Tidak ada rincian baris.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((row, idx) => (
                      <TableRow key={row.dumptruck_id || idx} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {row.dumptruck_kode || `DT #${row.dumptruck_id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Tiretype: {row.tiretype || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.kdsm || '-'}</TableCell>
                        <TableCell align="right">{row.distance_km != null ? `${row.distance_km} km` : '-'}</TableCell>
                        <TableCell align="center">
                          {row.tf_ton || 0} / {row.tf_bcm || 0}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {row.total_ritase}
                        </TableCell>
                        <TableCell align="right">{formatNum(row.total_ton)}</TableCell>
                        <TableCell align="right">{formatNum(row.total_bcm)}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {(row.allocations || []).map((alloc, aidx) => (
                              <Chip
                                key={aidx}
                                size="small"
                                variant="outlined"
                                color="primary"
                                label={`${alloc.dom_id || 'DOM'}: ${alloc.ritase} rit ${alloc.stockpile_nama ? `(${alloc.stockpile_nama})` : ''}`}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="contained" onClick={onClose}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
}
