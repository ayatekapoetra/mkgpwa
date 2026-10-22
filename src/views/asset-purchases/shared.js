'use client';

import Link from 'next/link';
import { Alert, Box, Button, Card, CardContent, Chip, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ArrowRight2, BoxSearch, Refresh } from 'iconsax-react';

import { getAssetErrorMessage } from 'api/asset-purchases';
import { humanize, statusColor } from './presentation';

export function StatusChip({ status }) {
  return <Chip size="small" color={statusColor(status)} label={humanize(status)} sx={{ fontWeight: 700 }} />;
}

export function StateContent({ loading, error, empty, onRetry, children, emptyText = 'Belum ada data untuk ditampilkan.' }) {
  if (loading) return <Stack spacing={1.5} sx={{ p: 2.5 }}>{[1, 2, 3].map((key) => <Skeleton key={key} height={64} variant="rounded" />)}</Stack>;
  if (error) return <Alert severity="error" action={<Button color="inherit" onClick={onRetry}>Coba lagi</Button>} sx={{ m: 2 }}>{getAssetErrorMessage(error, 'Data gagal dimuat')}</Alert>;
  if (empty) return <Stack alignItems="center" spacing={1.5} sx={{ py: 7, px: 2, textAlign: 'center' }}><BoxSearch size={42} color="#64748b" /><Typography variant="h5">Data belum tersedia</Typography><Typography color="text.secondary">{emptyText}</Typography>{onRetry && <Button startIcon={<Refresh size={17} />} onClick={onRetry}>Muat ulang</Button>}</Stack>;
  return children;
}

export function ResponsiveResourceRows({ rows, columns, href, pagination, setPage }) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  if (mobile) return <Stack spacing={1.5} sx={{ p: 2 }}>{rows.map((row) => <Card variant="outlined" key={row.id}><CardContent><Stack spacing={1.5}><Stack direction="row" justifyContent="space-between" gap={1}><Box><Typography variant="caption" color="text.secondary">{columns[0].label}</Typography><Typography variant="h5">{columns[0].render(row)}</Typography></Box>{row.status && <StatusChip status={row.status} />}</Stack>{columns.slice(1, 4).map((column) => <Box key={column.label}><Typography variant="caption" color="text.secondary">{column.label}</Typography><Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{column.render(row)}</Typography></Box>)}<Button component={Link} href={href(row)} variant="outlined" endIcon={<ArrowRight2 size={16} />}>Buka detail</Button></Stack></CardContent></Card>)}</Stack>;
  return <><Box sx={{ overflowX: 'auto' }}><Table sx={{ minWidth: 850 }}><TableHead><TableRow>{columns.map((column) => <TableCell key={column.label}>{column.label}</TableCell>)}<TableCell align="right">Aksi</TableCell></TableRow></TableHead><TableBody>{rows.map((row) => <TableRow hover key={row.id}>{columns.map((column) => <TableCell key={column.label}>{column.render(row)}</TableCell>)}<TableCell align="right"><Button component={Link} href={href(row)} size="small">Detail</Button></TableCell></TableRow>)}</TableBody></Table></Box>{pagination?.total > 0 && <TablePagination component="div" count={pagination.total} page={Math.max(0, pagination.page - 1)} rowsPerPage={pagination.perPage} rowsPerPageOptions={[25]} onPageChange={(_, page) => setPage(page + 1)} />}</>;
}
