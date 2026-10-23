'use client';

import Link from 'next/link';
import moment from 'moment';

import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Stack,
  Typography
} from '@mui/material';

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const statusColor = (status, lastAction) => {
  if (status === 'open' && lastAction === 'returned') return 'warning';
  if (status === 'open') return 'default';
  if (status === 'approval') return 'info';
  if (status === 'close') return 'success';
  if (status === 'reject') return 'error';
  return 'default';
};

const statusLabel = (status, lastAction) => {
  if (status === 'open' && lastAction === 'returned') return 'Open - Revisi';
  return status || '-';
};

function PageSelection({ rows, selectedIds, onSelect }) {
  const count = rows.filter((row) => selectedIds.has(String(row.id))).length;
  const indeterminate = count > 0 && count < rows.length;
  const checked = rows.length > 0 && count === rows.length;
  return (
    <Checkbox
      indeterminate={indeterminate}
      checked={checked}
      disabled={rows.length === 0}
      onChange={(_, nextChecked) => onSelect(rows, nextChecked)}
      inputProps={{ 'aria-label': 'Pilih semua di halaman ini' }}
    />
  );
}

export default function PengajuanDanaListMobile({
  rows = [],
  selectionMode = false,
  selectedIds = new Set(),
  onSelect = () => {}
}) {
  if (!rows || rows.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Belum ada data pengajuan non part sesuai filter.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {selectionMode && (
        <Box sx={{ px: 0.5 }}>
          <FormControlLabel
            control={<PageSelection rows={rows} selectedIds={selectedIds} onSelect={onSelect} />}
            label="Pilih semua di halaman ini"
          />
        </Box>
      )}
      {rows.map((row) => {
        const isRowSelected = selectedIds.has(String(row.id));
        return (
          <Card
            key={row.id}
            variant="outlined"
            sx={{
              borderColor: selectionMode && isRowSelected ? 'primary.main' : undefined,
              bgcolor: selectionMode && isRowSelected ? 'action.selected' : undefined
            }}
          >
            <CardContent>
              <Stack spacing={1.5}>
                {selectionMode && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isRowSelected}
                        onChange={(_, checked) => onSelect([row], checked)}
                        inputProps={{ 'aria-label': `Pilih Pengajuan Dana ${row.kode || row.id}` }}
                      />
                    }
                    label={<Typography variant="subtitle2">Pilih Pengajuan ini</Typography>}
                  />
                )}
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{row.kode || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.trx_date ? moment(row.trx_date).format('DD MMM YYYY') : '-'}</Typography>
                  </Box>
                  <Chip size="small" color={statusColor(row.status, row.last_action)} label={statusLabel(row.status, row.last_action)} />
                </Stack>
                <Typography variant="body2">{row.narasi || '-'}</Typography>
                <Typography variant="caption" color="text.secondary">{row.creator?.nama_lengkap || '-'}</Typography>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption">Items: {row.items_count || 0}</Typography>
                  <Typography variant="caption">File: {row.files_count || 0}</Typography>
                </Stack>
                <Typography variant="body1" fontWeight={700}>{formatCurrency(row.total)}</Typography>
                <Button component={Link} href={`/pengajuan-dana/${row.id}`} variant="outlined" fullWidth>
                  Lihat Detail
                </Button>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}
