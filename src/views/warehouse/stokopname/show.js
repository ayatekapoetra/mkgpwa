'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import moment from 'moment';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import AlertNotification from 'components/@extended/AlertNotification';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import {
  useShowStokopname,
  useGetStokopnameAudit,
  requestApprovalStokopname,
  approveStokopname,
  closeStokopname
} from 'api/stokopname';

moment.locale('id');

const statusConfig = {
  draft: { color: 'default', label: 'Draft' },
  open: { color: 'info', label: 'Open' },
  approval: { color: 'warning', label: 'Approval' },
  close: { color: 'success', label: 'Close' }
};

const formatQty = (value) => {
  const amount = Number(value || 0);
  return amount.toLocaleString('id-ID', { maximumFractionDigits: 2 });
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `Rp ${amount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const auditEventLabels = {
  CREATE: 'Dokumen Dibuat',
  UPDATE: 'Draft Diperbarui',
  REQUEST_APPROVAL: 'Diajukan Approval',
  APPROVE: 'Dokumen Disetujui',
  CLOSE: 'Dokumen Ditutup'
};

export default function StokopnameShowScreen({ id }) {
  const { data, dataLoading, dataError, mutate } = useShowStokopname(id);
  const { data: audits, dataLoading: auditLoading } = useGetStokopnameAudit(id);
  const [acting, setActing] = useState('');

  const header = data?.header || null;
  const items = data?.items || [];
  const permissions = data?.permissions || null;

  const handleAction = async (action) => {
    setActing(action);
    try {
      let message = '';
      if (action === 'request-approval') {
        await requestApprovalStokopname(id);
        message = 'Dokumen berhasil diajukan approval';
      } else if (action === 'approve') {
        await approveStokopname(id);
        message = 'Dokumen berhasil disetujui';
      } else if (action === 'close') {
        await closeStokopname(id);
        message = 'Dokumen berhasil ditutup';
      }
      openNotification({ title: 'success', message, alert: { color: 'success' } });
      mutate();
    } catch (error) {
      openNotification({
        title: 'error',
        message: error?.response?.data?.message || error?.message || 'Gagal memproses aksi',
        alert: { color: 'error' }
      });
    } finally {
      setActing('');
    }
  };

  if (dataLoading) {
    return (
      <Stack sx={{ py: 8 }} alignItems="center">
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (dataError || !header) {
    return <Alert severity="warning">Gagal memuat data Stockopname.</Alert>;
  }

  const status = statusConfig[header.status] || { color: 'default', label: header.status };

  return (
    <Fragment>
      <Breadcrumbs
        custom
        heading={header.kode || 'Detail Stockopname'}
        links={[
          { title: 'Home', to: APP_DEFAULT_PATH },
          { title: 'Stockopname', to: '/warehouse/stokopname' },
          { title: header.kode || 'Detail', to: `/warehouse/stokopname/${id}` }
        ]}
      />
      <MainCard title={<BtnBack href="/warehouse/stokopname" />} content>
        <AlertNotification />
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip size="small" label={status.label} color={status.color} sx={{ textTransform: 'capitalize', fontWeight: 600 }} />
            {permissions?.can_update ? (
              <Button component={Link} href={`/warehouse/stokopname/${id}/edit`} variant="outlined" size="small">
                Edit
              </Button>
            ) : null}
            <Button component={Link} href={`/warehouse/stokopname/${id}/rekap`} variant="outlined" size="small">
              Rekap
            </Button>
            {permissions?.can_request_approval ? (
              <Button variant="contained" size="small" disabled={acting === 'request-approval'} onClick={() => handleAction('request-approval')}>
                {acting === 'request-approval' ? 'Memproses...' : 'Request Approval'}
              </Button>
            ) : null}
            {permissions?.can_approve ? (
              <Button variant="contained" color="warning" size="small" disabled={acting === 'approve'} onClick={() => handleAction('approve')}>
                {acting === 'approve' ? 'Memproses...' : 'Approve'}
              </Button>
            ) : null}
            {permissions?.can_close ? (
              <Button variant="contained" color="success" size="small" disabled={acting === 'close'} onClick={() => handleAction('close')}>
                {acting === 'close' ? 'Memproses...' : 'Close'}
              </Button>
            ) : null}
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                Gudang
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {header.gudang ? `${header.gudang.kode} - ${header.gudang.nama}` : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                Tanggal
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {header.opname_date ? moment(header.opname_date).format('DD-MM-YYYY') : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Keterangan
              </Typography>
              <Typography variant="body2">{header.keterangan || '-'}</Typography>
            </Grid>
          </Grid>

          <Divider />

          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Barang</TableCell>
                  <TableCell>Rack</TableCell>
                  <TableCell align="right">Qty Aktual</TableCell>
                  <TableCell>Satuan</TableCell>
                  <TableCell>ScanBy</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Tidak ada item.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {item.kd_barang || '-'} — {item.nm_barang || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.rack_code ? `${item.rack_code} - ${item.rack_name || ''}` : '-'}
                      </TableCell>
                      <TableCell align="right">{formatQty(item.qty_aktual)}</TableCell>
                      <TableCell>{item.satuan || '-'}</TableCell>
                      <TableCell>{item.scanby || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Riwayat Audit
            </Typography>
            {auditLoading ? (
              <CircularProgress size={18} />
            ) : audits.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Belum ada riwayat.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {audits.map((audit) => (
                  <Stack key={audit.id} direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 140 }}>
                      {audit.created_at ? moment(audit.created_at).format('DD-MM-YYYY HH:mm') : '-'}
                    </Typography>
                    <Typography variant="body2">{auditEventLabels[audit.event_type] || audit.event_type}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {audit.created_by_name || '-'}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </MainCard>
    </Fragment>
  );
}
