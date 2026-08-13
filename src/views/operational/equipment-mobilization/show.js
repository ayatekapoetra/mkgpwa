'use client';

import { Fragment, useMemo, useState } from 'react';
import moment from 'moment';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import {
  MOBILIZATION_STATUS_COLOR,
  MOBILIZATION_STATUS_LABEL,
  arriveEquipmentMobilizationItem,
  cancelEquipmentMobilizationDocument,
  cancelEquipmentMobilizationItem,
  dispatchEquipmentMobilizationItem,
  useShowEquipmentMobilization
} from 'api/equipment-mobilization';

moment.locale('id');

const pickName = (...values) => values.find((v) => !!v) || '-';

const emptyAction = {
  open: false,
  type: null,
  item: null,
  datetime: moment().format('YYYY-MM-DDTHH:mm'),
  meter: '',
  meter_type: 'UNKNOWN',
  recipient_name: '',
  notes: '',
  reason: ''
};

export default function EquipmentMobilizationShowScreen({ id }) {
  const { data, dataLoading, dataError, mutate } = useShowEquipmentMobilization(id);
  const [action, setAction] = useState(emptyAction);
  const [submitting, setSubmitting] = useState(false);

  const items = data?.items || [];
  const permissions = data?.permissions || {};

  const progress = useMemo(() => {
    const total = items.length;
    const draft = items.filter((i) => i.status === 'DRAFT').length;
    const transit = items.filter((i) => i.status === 'IN_TRANSIT').length;
    const arrived = items.filter((i) => i.status === 'ARRIVED').length;
    const cancelled = items.filter((i) => i.status === 'CANCELLED').length;
    const active = Math.max(total - cancelled, 0);
    const percent = active > 0 ? Math.round((arrived / active) * 100) : 0;
    return { total, draft, transit, arrived, cancelled, percent };
  }, [items]);

  const openAction = (type, item) => {
    const meterType = String(item?.equipment?.kategori || item?.equipment?.ctg || '').toUpperCase() === 'DT'
      ? 'KM'
      : String(item?.equipment?.kategori || item?.equipment?.ctg || '').toUpperCase() === 'HE'
        ? 'HM'
        : 'UNKNOWN';

    setAction({
      open: true,
      type,
      item,
      datetime: moment().format('YYYY-MM-DDTHH:mm'),
      meter: '',
      meter_type: meterType,
      recipient_name: '',
      notes: '',
      reason: ''
    });
  };

  const closeAction = () => setAction(emptyAction);

  const submitAction = async () => {
    try {
      setSubmitting(true);
      const itemId = action.item?.id;
      if (!itemId) throw new Error('Item tidak valid');

      if (action.type === 'dispatch') {
        if (!action.meter) throw new Error('Meter berangkat wajib diisi');
        await dispatchEquipmentMobilizationItem(id, itemId, {
          departed_at: moment(action.datetime).format('YYYY-MM-DD HH:mm:ss'),
          departed_meter: Number(action.meter),
          departed_meter_type: action.meter_type || 'UNKNOWN',
          dispatch_notes: action.notes || null
        });
      }

      if (action.type === 'arrive') {
        if (!action.meter) throw new Error('Meter tiba wajib diisi');
        if (!action.recipient_name?.trim()) throw new Error('Nama penerima wajib diisi');
        const arrivedAt = moment(action.datetime);
        if (action.item?.departed_at && arrivedAt.isBefore(moment(action.item.departed_at))) {
          throw new Error('Waktu tiba tidak boleh lebih awal dari waktu berangkat');
        }
        await arriveEquipmentMobilizationItem(id, itemId, {
          arrived_at: arrivedAt.format('YYYY-MM-DD HH:mm:ss'),
          arrived_meter: Number(action.meter),
          arrived_meter_type: action.meter_type || 'UNKNOWN',
          recipient_name: action.recipient_name.trim(),
          arrival_notes: action.notes || null
        });
      }

      if (action.type === 'cancel_item') {
        if (!action.reason?.trim()) throw new Error('Alasan pembatalan wajib diisi');
        await cancelEquipmentMobilizationItem(id, itemId, action.reason.trim());
      }

      if (action.type === 'cancel_document') {
        if (!action.reason?.trim()) throw new Error('Alasan pembatalan wajib diisi');
        await cancelEquipmentMobilizationDocument(id, action.reason.trim());
      }

      openNotification({
        open: true,
        title: 'success',
        message: 'Aksi berhasil disimpan',
        alert: { color: 'success' }
      });
      closeAction();
      await mutate();
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: error?.message || 'Gagal memproses aksi',
        alert: { color: 'error' }
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (dataLoading) {
    return (
      <Stack sx={{ py: 8 }} alignItems="center">
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (dataError || !data) {
    return <Alert severity="warning">Gagal memuat detail mobilisasi.</Alert>;
  }

  const status = String(data.status || '').toUpperCase();
  const origin = `${pickName(data.origin_tenant?.nama, data.originTenant?.nama)} · ${pickName(data.origin_branch?.nama, data.originBranch?.nama)}`;
  const destination = `${pickName(data.destination_tenant?.nama, data.destinationTenant?.nama)} · ${pickName(data.destination_branch?.nama, data.destinationBranch?.nama)}`;

  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'Equipment Mobilization', to: '/mobilisasi-equipments' },
    { title: data.document_no || 'Detail' }
  ];

  const actionTitle = {
    dispatch: 'Catat Dispatch',
    arrive: 'Catat Arrival',
    cancel_item: 'Batalkan Item',
    cancel_document: 'Batalkan Dokumen'
  }[action.type] || 'Aksi';

  return (
    <Fragment>
      <Breadcrumbs custom heading="Detail Equipment Mobilization" links={breadcrumbLinks} />
      <MainCard
        title={<BtnBack href="/mobilisasi-equipments" />}
        secondary={
          permissions?.can_remove && ['DRAFT', 'OPEN', 'IN_TRANSIT'].includes(status) ? (
            <Button color="error" variant="outlined" onClick={() => openAction('cancel_document', null)}>
              Batalkan Dokumen
            </Button>
          ) : null
        }
      >
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={3}>
            <Typography variant="caption" color="text.secondary">No. Dokumen</Typography>
            <Typography variant="subtitle1">{data.document_no || '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="caption" color="text.secondary">Waktu Mulai</Typography>
            <Typography variant="subtitle1">
              {data.started_at ? moment(data.started_at).format('DD MMM YYYY HH:mm') : '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="caption" color="text.secondary">Status</Typography>
            <Box>
              <Chip
                size="small"
                label={MOBILIZATION_STATUS_LABEL[status] || status}
                color={MOBILIZATION_STATUS_COLOR[status] || 'default'}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="caption" color="text.secondary">Progress Unit</Typography>
            <Typography variant="subtitle1">
              {progress.arrived}/{progress.total} tiba ({progress.percent}%)
            </Typography>
            <LinearProgress variant="determinate" value={progress.percent} sx={{ mt: 0.75, height: 7, borderRadius: 999 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">Asal</Typography>
            <Typography variant="subtitle1">{origin}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">Tujuan</Typography>
            <Typography variant="subtitle1">{destination}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">Catatan</Typography>
            <Typography variant="body2">{data.notes || '-'}</Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ mb: 2 }}>Equipment Items</Divider>
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <Table sx={{ minWidth: 1000 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Equipment</TableCell>
                    <TableCell>Pengantar</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Berangkat</TableCell>
                    <TableCell>Tiba</TableCell>
                    <TableCell>Penerima</TableCell>
                    <TableCell align="center">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => {
                    const itemStatus = String(item.status || '').toUpperCase();
                    const canDispatch = permissions?.can_validate && itemStatus === 'DRAFT' && ['DRAFT', 'OPEN', 'IN_TRANSIT'].includes(status);
                    const canArrive = permissions?.can_approve && itemStatus === 'IN_TRANSIT';
                    const canCancelItem = permissions?.can_remove && ['DRAFT', 'IN_TRANSIT'].includes(itemStatus);

                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {item.equipment?.kode || item.equipment?.identity || `EQ-${item.equipment_id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {[item.equipment?.kategori || item.equipment?.ctg, item.equipment?.model].filter(Boolean).join(' · ') || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.karyawan?.nama || item.karyawan?.name || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={MOBILIZATION_STATUS_LABEL[itemStatus] || itemStatus}
                            color={MOBILIZATION_STATUS_COLOR[itemStatus] || 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.departed_at ? moment(item.departed_at).format('DD MMM YYYY HH:mm') : '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.departed_meter != null ? `${item.departed_meter} ${item.departed_meter_type || ''}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.arrived_at ? moment(item.arrived_at).format('DD MMM YYYY HH:mm') : '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.arrived_meter != null ? `${item.arrived_meter} ${item.arrived_meter_type || ''}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.recipient_name || '-'}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.75} justifyContent="center">
                            {canDispatch && (
                              <Button size="small" variant="contained" color="warning" onClick={() => openAction('dispatch', item)}>
                                Dispatch
                              </Button>
                            )}
                            {canArrive && (
                              <Button size="small" variant="contained" color="success" onClick={() => openAction('arrive', item)}>
                                Arrival
                              </Button>
                            )}
                            {canCancelItem && (
                              <Button size="small" variant="outlined" color="error" onClick={() => openAction('cancel_item', item)}>
                                Cancel
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Grid>
        </Grid>
      </MainCard>

      <Dialog open={action.open} onClose={closeAction} fullWidth maxWidth="sm">
        <DialogTitle>{actionTitle}</DialogTitle>
        <DialogContent dividers>
          {action.item && (
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {action.item.equipment?.kode || action.item.equipment?.identity || `Item #${action.item.id}`}
            </Typography>
          )}

          {['dispatch', 'arrive'].includes(action.type) && (
            <Stack spacing={2}>
              <TextField
                fullWidth
                type="datetime-local"
                label={action.type === 'arrive' ? 'Waktu Tiba' : 'Waktu Berangkat'}
                value={action.datetime}
                onChange={(e) => setAction((prev) => ({ ...prev, datetime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                helperText="Default waktu sekarang, dapat diubah"
              />
              <TextField
                fullWidth
                label={`Meter (${action.meter_type || 'UNKNOWN'})`}
                value={action.meter}
                onChange={(e) => setAction((prev) => ({ ...prev, meter: e.target.value.replace(/[^0-9.]/g, '') }))}
              />
              {action.type === 'arrive' && (
                <TextField
                  fullWidth
                  label="Nama Penerima"
                  value={action.recipient_name}
                  onChange={(e) => setAction((prev) => ({ ...prev, recipient_name: e.target.value }))}
                />
              )}
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Catatan"
                value={action.notes}
                onChange={(e) => setAction((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </Stack>
          )}

          {['cancel_item', 'cancel_document'].includes(action.type) && (
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Alasan Pembatalan"
              value={action.reason}
              onChange={(e) => setAction((prev) => ({ ...prev, reason: e.target.value }))}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAction} color="secondary" disabled={submitting}>
            Batal
          </Button>
          <Button onClick={submitAction} variant="contained" disabled={submitting}>
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
