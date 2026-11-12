'use client';
import { useState } from 'react';
import { Alert, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper, Typography, CircularProgress, Box } from '@mui/material';

export const KDSM_STATUS = ['BELUM_DIHAULING', 'SISA', 'BANCI', 'HABIS'];
export const ASSAY_FIELDS = [['ni', 'Ni'], ['fe', 'Fe'], ['mgo', 'MgO'], ['sio2', 'SiO2'], ['al2o3', 'Al2O3'], ['mc', 'MC']];

// Pesan server ditampilkan apa adanya (kode + pesan).
export function errorText(e) {
  if (!e) return '';
  return e.code ? `${e.code}: ${e.message}` : e.message || 'Terjadi kesalahan';
}

export function inRange0to100(v) {
  if (v === '' || v === null || v === undefined) return true;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

export function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000) + 1;
}

export function fmt(n, d = 2) {
  if (n === null || n === undefined || n === '') return '-';
  return Number(n).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function useSubmit(fn) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (...args) => {
    if (busy) return undefined; // cegah double-submit
    setBusy(true);
    setError('');
    try {
      return await fn(...args);
    } catch (e) {
      setError(errorText(e));
      return undefined;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, setError, run };
}

export function StateBlock({ loading, error, empty }) {
  if (loading) return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box>;
  if (error) return <Alert severity="error">{error.message || 'Gagal memuat data'}</Alert>;
  if (empty) return <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>Tidak ada data</Typography>;
  return null;
}

export function SimpleTable({ columns, rows, rowKey = 'id', total, page, perPage, onPage, footer }) {
  return (
    <Paper variant="outlined">
      <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>{columns.map((c) => <TableCell key={c.key} align={c.align}>{c.label}</TableCell>)}</TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r[rowKey] ?? i} hover>
                {columns.map((c) => <TableCell key={c.key} align={c.align}>{c.render ? c.render(r) : r[c.key] ?? '-'}</TableCell>)}
              </TableRow>
            ))}
            {footer}
          </TableBody>
        </Table>
      </TableContainer>
      {onPage && (
        <TablePagination component="div" count={total || 0} page={(page || 1) - 1} rowsPerPage={perPage || 25} rowsPerPageOptions={[perPage || 25]}
          onPageChange={(_e, p) => onPage(p + 1)} />
      )}
    </Paper>
  );
}

export function Banner({ error }) {
  return error ? <Stack sx={{ mb: 2 }}><Alert severity="error">{error}</Alert></Stack> : null;
}
