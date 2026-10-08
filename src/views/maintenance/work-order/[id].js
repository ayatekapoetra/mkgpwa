'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import 'moment/locale/id';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add, Clock, Trash, Camera, Edit2, CloseSquare, Lock, Unlock } from "iconsax-react";

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import LoadingButton from 'components/@extended/LoadingButton';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import { addWorkOrderAction, closeWorkOrder, deleteWorkOrderAction, getTeknisiOptions, reopenWorkOrder, updateWorkOrder, updateWorkOrderAction, useWorkOrderAccess, useWorkOrderDetail } from 'api/work-order';
import { calculateDuration, formatBreakdownAt, formatDateIssue, getWorkOrderStatusInfo, parseApiDate, WORK_ORDER_STATUS } from '../breakdown/utils';
import MaterialRequestTab from './MaterialRequestTab';

moment.locale('id');

const PHOTO_BASE = 'https://cdn.makkuragatama.id/';

const resolvePhoto = (photo) => {
  if (!photo) return '';
  if (/^https?:\/\//i.test(photo)) return photo;
  return `${PHOTO_BASE}${photo.replace(/^\/+/, '')}`;
};

const formatDateTime = (value, fallbackFormat = 'DD-MM-YYYY HH:mm') => {
  const m = parseApiDate(value, fallbackFormat);
  return m ? m.format('DD MMM YYYY, HH:mm') : '-';
};

const formatTime = (value, fallbackFormat = 'DD-MM-YYYY HH:mm') => {
  const m = parseApiDate(value, fallbackFormat);
  return m ? m.format('HH:mm') : '-';
};

const toDatetimeLocal = (value, fallbackFormat = 'DD-MM-YYYY HH:mm') => {
  const m = parseApiDate(value, fallbackFormat);
  return m ? m.format('YYYY-MM-DDTHH:mm') : '';
};

export default function WorkOrderDetail({ woId, breakdownId, backHref: backHrefOverride, listHref = '/daily-breakdown', listTitle = 'Daily Breakdown' }) {
  const router = useRouter();
  const { data: detail, dataLoading, dataError, mutate } = useWorkOrderDetail(woId);
  const { permissions: woPermissions } = useWorkOrderAccess();
  const [teknisiOptions, setTeknisiOptions] = useState([]);

  const canClose = !!woPermissions?.can_validate;
  const canReopen = !!woPermissions?.can_approve;

  const [selectedStatus, setSelectedStatus] = useState('');
  const [form, setForm] = useState({ services_at: '', ready_at: '' });
  const [updating, setUpdating] = useState(false);

  const [showAddAction, setShowAddAction] = useState(false);
  const [actionForm, setActionForm] = useState({ narasi: '', starttime: '', endtime: '', teknisi_id: '', photo: '' });
  const [savingAction, setSavingAction] = useState(false);
  const [editAction, setEditAction] = useState(null);
  const [editForm, setEditForm] = useState({ narasi: '', starttime: '', endtime: '', teknisi_id: '', photo: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletingAction, setDeletingAction] = useState(false);

  const [closeDialog, setCloseDialog] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [closing, setClosing] = useState(false);
  const [reopenDialog, setReopenDialog] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    getTeknisiOptions()
      .then(setTeknisiOptions)
      .catch(() => setTeknisiOptions([]));
  }, []);

  useEffect(() => {
    if (detail) {
      const chronologicalActions = (detail.actions || [])
        .filter((action) => action.aktif !== 'N' && parseApiDate(action.starttime))
        .sort((a, b) => parseApiDate(a.starttime).valueOf() - parseApiDate(b.starttime).valueOf());
      const firstAction = chronologicalActions[0];
      const lastAction = chronologicalActions[chronologicalActions.length - 1];

      setSelectedStatus(detail.status || '');
      setForm({
        services_at: firstAction ? toDatetimeLocal(firstAction.starttime) : toDatetimeLocal(detail.services_at),
        ready_at: lastAction ? toDatetimeLocal(lastAction.endtime) : toDatetimeLocal(detail.ready_at)
      });
    }
  }, [detail]);

  const statusInfo = getWorkOrderStatusInfo(detail?.status);

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      openNotification({ open: true, message: 'Pilih status terlebih dahulu', alert: { color: 'warning', variant: 'filled' }, variant: 'alert' });
      return;
    }
    setUpdating(true);
    try {
      const payload = {
        status: selectedStatus,
        services_at: form.services_at ? moment(form.services_at).format('YYYY-MM-DD HH:mm:ss') : null,
        ready_at: form.ready_at ? moment(form.ready_at).format('YYYY-MM-DD HH:mm:ss') : null
      };
      await updateWorkOrder(woId, payload);
      openNotification({ open: true, message: 'Status work order berhasil diupdate', alert: { color: 'success', variant: 'filled' }, variant: 'alert' });
      mutate();
    } catch (error) {
      const message = error?.response?.data?.diagnostic?.message || error?.message || 'Gagal update status';
      openNotification({ open: true, message, alert: { color: 'error', variant: 'filled' }, variant: 'alert' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddAction = async () => {
    if (!actionForm.narasi || !actionForm.teknisi_id) {
      openNotification({ open: true, message: 'Narasi dan teknisi wajib diisi', alert: { color: 'warning', variant: 'filled' }, variant: 'alert' });
      return;
    }
    setSavingAction(true);
    try {
      const payload = {
        narasi: actionForm.narasi,
        starttime: actionForm.starttime ? moment(actionForm.starttime).format('YYYY-MM-DD HH:mm:ss') : null,
        endtime: actionForm.endtime ? moment(actionForm.endtime).format('YYYY-MM-DD HH:mm:ss') : null,
        teknisi_id: actionForm.teknisi_id,
        photo: actionForm.photo || undefined
      };
      await addWorkOrderAction(woId, payload);
      openNotification({ open: true, message: 'Catatan teknisi berhasil ditambahkan', alert: { color: 'success', variant: 'filled' }, variant: 'alert' });
      setActionForm({ narasi: '', starttime: '', endtime: '', teknisi_id: '', photo: '' });
      setShowAddAction(false);
      mutate();
    } catch (error) {
      const message = error?.response?.data?.diagnostic?.message || error?.message || 'Gagal menambah catatan';
      openNotification({ open: true, message, alert: { color: 'error', variant: 'filled' }, variant: 'alert' });
    } finally {
      setSavingAction(false);
    }
  };

  const handleDeleteAction = async () => {
    if (!deleteConfirm) return;
    setDeletingAction(true);
    try {
      await deleteWorkOrderAction(deleteConfirm.id);
      openNotification({ open: true, message: 'Catatan berhasil dihapus', alert: { color: 'success', variant: 'filled' }, variant: 'alert' });
      setDeleteConfirm(null);
      mutate();
    } catch (error) {
      const message = error?.response?.data?.diagnostic?.message || error?.message || 'Gagal menghapus catatan';
      openNotification({ open: true, message, alert: { color: 'error', variant: 'filled' }, variant: 'alert' });
    } finally {
      setDeletingAction(false);
    }
  };

  const handleEditAction = (act) => {
    setEditAction(act);
    setEditForm({
      narasi: act.narasi || '',
      starttime: toDatetimeLocal(act.starttime),
      endtime: toDatetimeLocal(act.endtime),
      teknisi_id: act.teknisi_id || '',
      photo: ''
    });
    setShowAddAction(false);
  };

  const handleUpdateAction = async () => {
    if (!editAction || !editForm.narasi || !editForm.teknisi_id) {
      openNotification({ open: true, message: 'Narasi dan teknisi wajib diisi', alert: { color: 'warning', variant: 'filled' }, variant: 'alert' });
      return;
    }
    setSavingEdit(true);
    try {
      const payload = {
        narasi: editForm.narasi,
        starttime: editForm.starttime ? moment(editForm.starttime).format('YYYY-MM-DD HH:mm:ss') : null,
        endtime: editForm.endtime ? moment(editForm.endtime).format('YYYY-MM-DD HH:mm:ss') : null,
        teknisi_id: editForm.teknisi_id,
        photo: editForm.photo || undefined
      };
      await updateWorkOrderAction(editAction.id, payload);
      openNotification({ open: true, message: 'Catatan teknisi berhasil diperbarui', alert: { color: 'success', variant: 'filled' }, variant: 'alert' });
      setEditAction(null);
      setEditForm({ narasi: '', starttime: '', endtime: '', teknisi_id: '', photo: '' });
      mutate();
    } catch (error) {
      const message = error?.response?.data?.diagnostic?.message || error?.message || 'Gagal memperbarui catatan';
      openNotification({ open: true, message, alert: { color: 'error', variant: 'filled' }, variant: 'alert' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditPhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm((prev) => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setActionForm((prev) => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleCloseWorkOrder = async () => {
    setClosing(true);
    try {
      await closeWorkOrder(woId, closeReason);
      openNotification({ open: true, message: 'Work order berhasil ditutup (CLOSED)', alert: { color: 'success', variant: 'filled' }, variant: 'alert' });
      setCloseDialog(false);
      setCloseReason('');
      mutate();
    } catch (error) {
      const message = error?.response?.data?.diagnostic?.message || error?.message || 'Gagal menutup work order';
      openNotification({ open: true, message, alert: { color: 'error', variant: 'filled' }, variant: 'alert' });
    } finally {
      setClosing(false);
    }
  };

  const handleReopenWorkOrder = async () => {
    if (!reopenReason || reopenReason.trim().length < 10) {
      openNotification({ open: true, message: 'Alasan reopen wajib diisi (minimal 10 karakter)', alert: { color: 'warning', variant: 'filled' }, variant: 'alert' });
      return;
    }
    setReopening(true);
    try {
      await reopenWorkOrder(woId, reopenReason.trim());
      openNotification({ open: true, message: 'Work order dibuka kembali', alert: { color: 'success', variant: 'filled' }, variant: 'alert' });
      setReopenDialog(false);
      setReopenReason('');
      mutate();
    } catch (error) {
      const message = error?.response?.data?.diagnostic?.message || error?.message || 'Gagal membuka kembali work order';
      openNotification({ open: true, message, alert: { color: 'error', variant: 'filled' }, variant: 'alert' });
    } finally {
      setReopening(false);
    }
  };

  const backHref = backHrefOverride || (breakdownId ? `/daily-breakdown/${breakdownId}` : listHref);
  const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Maintenances' }, { title: listTitle, to: listHref }, { title: 'Work Order' }];

  if (dataLoading) {
    return (
      <Box>
        <Breadcrumbs custom heading="Work Order" links={breadcrumbLinks} />
        <MainCard title={<BtnBack href={backHref} />}>
          <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        </MainCard>
      </Box>
    );
  }

  if (dataError || !detail) {
    return (
      <Box>
        <Breadcrumbs custom heading="Work Order" links={breadcrumbLinks} />
        <MainCard title={<BtnBack href={backHref} />}>
          <Alert severity={dataError ? 'error' : 'info'}>{dataError?.message || 'Work order tidak ditemukan'}</Alert>
        </MainCard>
      </Box>
    );
  }

  const actions = detail.actions || [];
  const duration = calculateDuration(detail.services_at || detail.breakdown?.breakdown_at, detail.ready_at);
  const OPTIONS_STATUS = WORK_ORDER_STATUS.slice(0, -1);
  return (
    <Box>
      <Breadcrumbs custom heading="Work Order" links={breadcrumbLinks} />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
        <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)}>
          <Tab label="Detail & Tindakan" />
          <Tab label="Material Request" />
        </Tabs>
      </Box>

      {activeTab === 1 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <MainCard title={<BtnBack href={backHref} />}>
              <MaterialRequestTab
                woId={woId}
                woStatus={detail.status}
                kdwo={detail.kode_wo}
                equipmentId={detail.equipment_id}
              />
            </MainCard>
          </Grid>
        </Grid>
      )}

      {activeTab === 0 && (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={7}>
          <MainCard title={<BtnBack href={backHref} />}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {detail.kode_wo || '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {detail.equipment?.kode || detail.unit || '-'}
                </Typography>
              </Box>
              <Chip label={statusInfo.label} sx={{ bgcolor: statusInfo.bg, color: statusInfo.text, fontWeight: 600 }} />
            </Stack>

            <Box
              sx={(theme) => ({
                p: 2,
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.045),
                borderRadius: 2,
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.16),
                mb: 2
              })}
            >
              <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ display: 'block', mb: 0.75, letterSpacing: 0.4 }}>
                Problem Issue
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                {detail.problem_issue || '-'}
              </Typography>
            </Box>

            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Clock size={14} color="text.secondary" />
                  <Typography variant="caption" color="text.secondary">Issue: {detail.breakdown?.date_issue ? formatDateIssue(detail.breakdown.date_issue) : '-'}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Start: {detail.services_at ? formatDateTime(detail.services_at) : '-'} | Ready: {detail.ready_at ? formatDateTime(detail.ready_at) : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Durasi: {duration.text}</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {actions.length} Aktivitas Teknisi
              </Typography>
              <Button variant="contained" size="small" color="success" startIcon={<Add size={16} />} onClick={() => setShowAddAction(!showAddAction)} disabled={detail?.status === 'CLOSE'}>
                Catatan
              </Button>
            </Stack>

            {actions.length > 0 ? (
              <Box sx={{ position: 'relative' }}>
                {actions.map((act, idx) => {
                  const nama = act.karyawan?.nama || 'System';
                  const isLast = idx === actions.length - 1;
                  return (
                    <Box key={act.id} sx={{ display: 'flex', gap: 1.5, position: 'relative', pb: isLast ? 0 : 2 }}>
                      {!isLast && <Box sx={{ position: 'absolute', left: 15, top: 32, bottom: 0, width: 2, bgcolor: 'divider', borderRadius: 1 }} />}
                      <Avatar sx={{ width: 32, height: 32, fontSize: 14, fontWeight: 700, bgcolor: 'primary.lighter', color: 'primary.main', flexShrink: 0, zIndex: 1 }}>
                        {nama.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Paper variant="outlined" sx={{ p: 1.5, transition: 'border-color 0.2s', '&:hover': { borderColor: 'primary.main' } }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>{nama}</Typography>
                              <Typography variant="body2" color="text.primary" sx={{ mb: 1, lineHeight: 1.5 }}>{act.narasi || '-'}</Typography>
                              <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Clock size={13} color="text.secondary" />
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDateTime(act.starttime)}{act.starttime && act.endtime ? ` – ${formatTime(act.endtime)}` : ''}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.5} sx={{ display: detail?.status === 'CLOSE' ? 'none' : 'flex' }}>
                                  <IconButton size="small" color="primary" onClick={() => handleEditAction(act)}>
                                    <Edit2 size={16} />
                                  </IconButton>
                                  <IconButton size="small" color="error" onClick={() => setDeleteConfirm(act)}>
                                    <Trash size={16} />
                                  </IconButton>
                                </Stack>
                              </Stack>
                            </Box>
                            {act.photo && (
                              <Box component="img" src={resolvePhoto(act.photo)} alt="action" sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1.5, border: '1px solid', borderColor: 'divider', flexShrink: 0 }} />
                            )}
                          </Stack>
                        </Paper>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Alert severity="info">Belum ada catatan teknisi</Alert>
            )}

            {showAddAction && (
              <Box
                sx={(theme) => ({
                  mt: 2,
                  p: { xs: 1.5, sm: 2 },
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.35 : 0.18),
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.1 : 0.035),
                  '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' }
                })}
              >
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={(theme) => ({
                      width: 34,
                      height: 34,
                      borderRadius: 1.5,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.14),
                      color: 'primary.main'
                    })}
                  >
                    <Add size={18} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>Tambah Aksi Baru</Typography>
                    <Typography variant="caption" color="text.secondary">Catat waktu, teknisi, dan tindakan perbaikan.</Typography>
                  </Box>
                </Stack>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                      label="Mulai"
                      type="datetime-local"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={actionForm.starttime}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, starttime: e.target.value }))}
                    />
                    <TextField
                      label="Selesai"
                      type="datetime-local"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={actionForm.endtime}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, endtime: e.target.value }))}
                    />
                  </Stack>

                  <Autocomplete
                    fullWidth
                    size="small"
                    options={teknisiOptions}
                    value={teknisiOptions.find((opt) => opt.id == actionForm.teknisi_id) || null}
                    isOptionEqualToValue={(option, value) => option.id == value?.id}
                    getOptionLabel={(option) => option?.nama || ''}
                    onChange={(_, option) => setActionForm((prev) => ({ ...prev, teknisi_id: option?.id || '' }))}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} key={option.id}>
                        <Stack>
                          <Typography variant="body2">{option.nama}</Typography>
                          {option.subtitle && <Typography variant="caption" color="text.secondary">{option.subtitle}</Typography>}
                        </Stack>
                      </Box>
                    )}
                    renderInput={(params) => <TextField {...params} label="Teknisi" />}
                  />

                  <TextField
                    label="Narasi"
                    multiline
                    minRows={3}
                    size="small"
                    fullWidth
                    value={actionForm.narasi}
                    onChange={(e) => setActionForm((prev) => ({ ...prev, narasi: e.target.value }))}
                    placeholder="Ceritakan tindakan perbaikan..."
                  />

                  <Box>
                    <Button variant="outlined" component="label" size="small" startIcon={<Camera size={16} />}>
                      Upload Photo
                      <input type="file" accept="image/*" hidden onChange={handlePhotoSelect} />
                    </Button>
                    {actionForm.photo && (
                      <Box component="img" src={actionForm.photo} alt="preview" sx={{ mt: 1, width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
                    )}
                  </Box>

                  <Stack direction="row" spacing={1.5}>
                    <Button variant="outlined" fullWidth onClick={() => { setShowAddAction(false); setActionForm({ narasi: '', starttime: '', endtime: '', teknisi_id: '', photo: '' }); }}>
                      Batal
                    </Button>
                    <LoadingButton variant="contained" fullWidth loading={savingAction} onClick={handleAddAction}>
                      Simpan
                    </LoadingButton>
                  </Stack>
                </Stack>
              </Box>
            )}

            {editAction && (
              <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'primary.main', borderRadius: 1.5, bgcolor: 'primary.lighter' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={700}>Edit Catatan Teknisi</Typography>
                  <IconButton size="small" onClick={() => { setEditAction(null); setEditForm({ narasi: '', starttime: '', endtime: '', teknisi_id: '', photo: '' }); }}>
                    <CloseSquare size={18} />
                  </IconButton>
                </Stack>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      label="Mulai"
                      type="datetime-local"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={editForm.starttime}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, starttime: e.target.value }))}
                    />
                    <TextField
                      label="Selesai"
                      type="datetime-local"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={editForm.endtime}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, endtime: e.target.value }))}
                    />
                  </Stack>

                  <Autocomplete
                    fullWidth
                    size="small"
                    options={teknisiOptions}
                    value={teknisiOptions.find((opt) => opt.id == editForm.teknisi_id) || null}
                    isOptionEqualToValue={(option, value) => option.id == value?.id}
                    getOptionLabel={(option) => option?.nama || ''}
                    onChange={(_, option) => setEditForm((prev) => ({ ...prev, teknisi_id: option?.id || '' }))}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} key={option.id}>
                        <Stack>
                          <Typography variant="body2">{option.nama}</Typography>
                          {option.subtitle && <Typography variant="caption" color="text.secondary">{option.subtitle}</Typography>}
                        </Stack>
                      </Box>
                    )}
                    renderInput={(params) => <TextField {...params} label="Teknisi" />}
                  />

                  <TextField
                    label="Narasi"
                    multiline
                    minRows={3}
                    size="small"
                    fullWidth
                    value={editForm.narasi}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, narasi: e.target.value }))}
                    placeholder="Ceritakan tindakan perbaikan..."
                  />

                  <Box>
                    <Button variant="outlined" component="label" size="small" startIcon={<Camera size={16} />}>
                      Ganti Photo
                      <input type="file" accept="image/*" hidden onChange={handleEditPhotoSelect} />
                    </Button>
                    {editForm.photo ? (
                      <Box component="img" src={editForm.photo} alt="preview" sx={{ mt: 1, width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
                    ) : editAction.photo ? (
                      <Box component="img" src={resolvePhoto(editAction.photo)} alt="current" sx={{ mt: 1, width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
                    ) : null}
                  </Box>

                  <Stack direction="row" spacing={1.5}>
                    <Button variant="outlined" fullWidth onClick={() => { setEditAction(null); setEditForm({ narasi: '', starttime: '', endtime: '', teknisi_id: '', photo: '' }); }}>
                      Batal
                    </Button>
                    <LoadingButton variant="contained" fullWidth loading={savingEdit} onClick={handleUpdateAction}>
                      Simpan Perubahan
                    </LoadingButton>
                  </Stack>
                </Stack>
              </Box>
            )}
          </MainCard>
        </Grid>

        <Grid item xs={12} md={5}>
          <MainCard title="Update Status">
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  {OPTIONS_STATUS?.map((opt) => (
                    <MenuItem key={opt.code} value={opt.code}>{opt.code} • {opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Mulai ditangani"
                type="datetime-local"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.services_at}
                onChange={(e) => setForm((prev) => ({ ...prev, services_at: e.target.value }))}
                helperText="Otomatis dari waktu mulai aksi pertama"
              />

              <TextField
                label="Selesai diperbaiki"
                type="datetime-local"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.ready_at}
                onChange={(e) => setForm((prev) => ({ ...prev, ready_at: e.target.value }))}
                helperText="Otomatis dari waktu selesai aksi terakhir"
              />

              <LoadingButton variant="contained" fullWidth loading={updating} onClick={handleUpdateStatus} disabled={detail?.status === 'CLOSE'}>
                Update Status
              </LoadingButton>

              {(selectedStatus === 'DONE' || detail?.status === 'DONE' || detail?.status === 'CLOSE') && (
                <>
                  <LoadingButton
                    variant="contained"
                    color="error"
                    fullWidth
                    loading={closing}
                    disabled={detail?.status === 'CLOSE' || !canClose}
                    onClick={() => setCloseDialog(true)}
                    startIcon={<Lock size={18} />}
                    sx={{ mt: 1 }}
                  >
                    {detail?.status === 'CLOSE' ? 'Work Order Closed' : 'CLOSE Work Order'}
                  </LoadingButton>
                  {!canClose && detail?.status !== 'CLOSE' && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                      Butuh akses validate untuk menutup work order
                    </Typography>
                  )}
                </>
              )}

              {detail?.status === 'CLOSE' && (
                <>
                  <LoadingButton
                    variant="contained"
                    color="warning"
                    fullWidth
                    loading={reopening}
                    disabled={!canReopen}
                    onClick={() => setReopenDialog(true)}
                    startIcon={<Unlock size={18} />}
                    sx={{ mt: 1 }}
                  >
                    REOPEN Work Order
                  </LoadingButton>
                  {!canReopen && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                      Butuh akses approve untuk membuka kembali work order
                    </Typography>
                  )}
                </>
              )}
            </Stack>
          </MainCard>
        </Grid>
      </Grid>
      )}

      <Dialog open={closeDialog} onClose={() => setCloseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lock size={20} /> Tutup Work Order
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              Setelah ditutup, transaksi berikut akan dikunci untuk WO ini:
              <Box component="ul" sx={{ m: 0, pl: 2.5, mt: 0.5 }}>
                <li>Tidak ada permintaan material baru</li>
                <li>Tidak ada pengeluaran barang baru (Goods Issue)</li>
                <li>Tidak ada order ke supplier baru (Purchase Request)</li>
                <li>Tidak bisa tambah tindakan teknisi</li>
              </Box>
            </Alert>
            <TextField
              label="Alasan (opsional)"
              multiline
              minRows={2}
              size="small"
              fullWidth
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="Contoh: Perbaikan selesai, semua part terpenuhi"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCloseDialog(false); setCloseReason(''); }}>Batal</Button>
          <LoadingButton variant="contained" color="error" loading={closing} onClick={handleCloseWorkOrder}>
            CLOSE
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={reopenDialog} onClose={() => setReopenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Unlock size={20} /> Buka Kembali Work Order
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Membuka kembali akan mengizinkan transaksi material & tindakan teknisi untuk WO ini.
            </Alert>
            <TextField
              label="Alasan reopen (wajib, min 10 karakter)"
              multiline
              minRows={3}
              size="small"
              fullWidth
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              error={!!reopenReason && reopenReason.trim().length > 0 && reopenReason.trim().length < 10}
              helperText={reopenReason && reopenReason.trim().length > 0 && reopenReason.trim().length < 10 ? `Minimal 10 karakter (saat ini ${reopenReason.trim().length})` : 'Wajib diisi'}
              placeholder="Contoh: Masih ada part yang belum diterima dari supplier untuk PR-xxx"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setReopenDialog(false); setReopenReason(''); }}>Batal</Button>
          <LoadingButton variant="contained" color="warning" loading={reopening} onClick={handleReopenWorkOrder}>
            REOPEN
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Hapus Catatan</DialogTitle>
        <DialogContent>
          <DialogContentText>Yakin menghapus catatan tindakan ini?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Batal</Button>
          <Button color="error" onClick={handleDeleteAction} disabled={deletingAction}>
            {deletingAction ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
