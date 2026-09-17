'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import moment from 'moment';
import 'moment/locale/id';
import {
  Alert,
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
  Grid,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { Edit, Trash, Clock } from 'iconsax-react';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import { deleteDailyBreakdown, useBreakdownDetail } from 'api/daily-breakdown-form';
import { calculateDuration, formatBreakdownAt, formatDateIssue, getItemStatusLabel, getStatusInfo, parseApiDate } from 'views/maintenance/breakdown/utils';

moment.locale('id');

const formatDateTime = (value, fallbackFormat = 'DD-MM-YYYY HH:mm') => {
  const m = parseApiDate(value, fallbackFormat);
  return m ? m.format('DD MMM YYYY, HH:mm') : '-';
};

const formatTime = (value, fallbackFormat = 'DD-MM-YYYY HH:mm') => {
  const m = parseApiDate(value, fallbackFormat);
  return m ? m.format('HH:mm') : '-';
};

const PHOTO_BASE = 'https://cdn.makkuragatama.id/';

const resolvePhoto = (photo) => {
  if (!photo) return '';
  if (/^https?:\/\//i.test(photo)) return photo;
  return `${PHOTO_BASE}${photo.replace(/^\/+/, '')}`;
};

export default function BreakdownDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { data, dataLoading, dataError, mutate } = useBreakdownDetail(id);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    setConfirmOpen(false);
    setDeleting(true);
    try {
      await deleteDailyBreakdown(id);
      openNotification({ open: true, message: 'Breakdown berhasil dihapus', alert: { color: 'success', variant: 'filled' }, variant: 'alert' });
      router.push('/daily-breakdown');
      router.refresh();
    } catch (error) {
      const message = error?.response?.data?.diagnostic?.message || error?.message || 'Gagal menghapus breakdown';
      openNotification({ open: true, message, alert: { color: 'error', variant: 'filled' }, variant: 'alert' });
      setDeleting(false);
    }
  };

  if (dataLoading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (dataError) {
    return (
      <Box>
        <Breadcrumbs custom heading="Detail Breakdown" links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Maintenances' }, { title: 'Daily Breakdown', to: '/daily-breakdown' }, { title: 'Detail' }]} />
        <MainCard title={<BtnBack href="/daily-breakdown" />}>
          <Alert severity="error">{dataError?.message || 'Gagal memuat detail breakdown'}</Alert>
        </MainCard>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box>
        <Breadcrumbs custom heading="Detail Breakdown" links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Maintenances' }, { title: 'Daily Breakdown', to: '/daily-breakdown' }, { title: 'Detail' }]} />
        <MainCard title={<BtnBack href="/daily-breakdown" />}>
          <Alert severity="info">Breakdown tidak ditemukan</Alert>
        </MainCard>
      </Box>
    );
  }

  const statusInfo = getStatusInfo(data.status);
  const duration = calculateDuration(data.breakdown_at, data.ready_at);

  return (
    <Box>
      <Breadcrumbs
        custom
        heading="Detail Breakdown"
        links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Maintenances' }, { title: 'Daily Breakdown', to: '/daily-breakdown' }, { title: 'Detail' }]}
      />

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={8}>
          <MainCard
            title={<BtnBack href="/daily-breakdown" />}
            secondary={
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<Edit size={18} />} component={Link} href={`/daily-breakdown/${id}/edit`}>
                  Edit
                </Button>
                <Button variant="outlined" color="error" startIcon={<Trash size={18} />} onClick={() => setConfirmOpen(true)} disabled={deleting}>
                  {deleting ? 'Menghapus...' : 'Hapus'}
                </Button>
              </Stack>
            }
          >
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <InfoItem label="Kode Unit" value={data.kode_unit || '-'} />
              <InfoItem label="Equipment" value={data.equipment?.kode || '-'} subvalue={data.equipment?.nama} />
              <InfoItem label="Lokasi" value={data.lokasi?.nama || '-'} />
              <InfoItem label="Cabang" value={data.cabang ? `[${data.cabang.kode || ''}] ${data.cabang.nama || ''}` : '-'} />
              <InfoItem label="Penyewa" value={data.penyewa?.nama || '-'} />
              <InfoItem label="Kategori" value={data.kategori || '-'} />
              <InfoItem label="Date Issue" value={formatDateIssue(data.date_issue)} />
              <InfoItem label="Breakdown At" value={formatBreakdownAt(data.breakdown_at)} />
              <InfoItem label="HM/KM Start" value={data.hmkm_start || '-'} />
              <InfoItem label="HM/KM End" value={data.hmkm_end || '-'} />
              <InfoItem label="SMU" value={data.smu || '-'} />
              <InfoItem label="Durasi" value={duration.text} />
            </Grid>
          </MainCard>

          <MainCard title="Daftar Breakdown Issue (Work Order)" sx={{ mt: 2 }}>
            {(!data.items || data.items.length === 0) && (
              <Alert severity="info">Tidak ada issue pada breakdown ini</Alert>
            )}
              <Stack spacing={2}>
              {(data.items || []).map((item, index) => (
                <ItemCard key={item.id || index} item={item} index={index} breakdownId={id} />
              ))}
            </Stack>
          </MainCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <MainCard title="Riwayat Tindakan">
            <ActionTimeline items={data.items} />
          </MainCard>
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <DialogContentText>Apakah Anda yakin ingin menghapus breakdown ini? Tindakan ini tidak dapat dibatalkan.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Batal</Button>
          <Button color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function InfoItem({ label, value, subvalue }) {
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        {value}
      </Typography>
      {subvalue && (
        <Typography variant="caption" color="text.secondary">
          {subvalue}
        </Typography>
      )}
    </Grid>
  );
}

function ItemCard({ item, index, breakdownId }) {
  const statusLabel = getItemStatusLabel(item.status);
  const teknisiList = (item.teknisi || []).filter((t) => t.aktif !== 'N');
  const actions = item.actions || [];
  const [expanded, setExpanded] = useState(false);
  const woHref = breakdownId && item.id ? `/daily-breakdown/${breakdownId}/work-order/${item.id}` : null;

  const statusColor = item.status === 'DONE' ? 'success' : item.status === 'IP' ? 'info' : 'warning';
  const statusSx = {
    DONE: { bg: '#d1fae5', color: '#065f46' },
    IP: { bg: '#dbeafe', color: '#1e40af' },
    WP: { bg: '#fef9c3', color: '#854d0e' },
    WT: { bg: '#fef3c7', color: '#92400e' },
    WS: { bg: '#fce7f3', color: '#9d174d' }
  };
  const sc = statusSx[item.status] || { bg: '#f3f4f6', color: '#374151' };

  return (
    <Card variant="outlined" sx={{ '&:hover': { borderColor: 'primary.main' }, transition: 'border-color 0.2s' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: 'primary.lighter',
                color: 'primary.main',
                display: 'grid',
                placeItems: 'center',
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              {index + 1}
            </Box>
            {item.kode_wo && (
              <Chip label={item.kode_wo} size="small" variant="outlined" sx={{ fontSize: 11, height: 20 }} />
            )}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            {woHref && (
              <Button size="small" variant="outlined" href={woHref} component={Link} sx={{ fontSize: 11, py: 0.25, px: 1 }}>
                Update WO
              </Button>
            )}
            <Chip label={statusLabel} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600, fontSize: 11 }} />
          </Stack>
        </Stack>

        <Box
          sx={{
            p: 1.5,
            bgcolor: 'grey.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            mb: 1.5
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Problem Issue
          </Typography>
          <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.5 }}>
            {item.problem_issue || '-'}
          </Typography>
        </Box>

        <Grid container spacing={1} sx={{ mb: teknisiList.length > 0 || actions.length > 0 ? 1.5 : 0 }}>
          <Grid item xs={4}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Clock size={13} color="text.secondary" />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                  Services
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: 12 }}>
                  {item.services_at ? formatDateTime(item.services_at) : '-'}
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={4}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                  Ready
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: 12 }}>
                  {item.ready_at ? formatDateTime(item.ready_at) : '-'}
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={4}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                  Durasi
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: 12 }}>
                  {calculateDuration(item.services_at || item.breakdown_at, item.ready_at).text}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        {teknisiList.length > 0 && (
          <Box sx={{ mb: actions.length > 0 ? 1 : 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Teknisi ({teknisiList.length})
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {teknisiList.map((tek, i) => {
                const nama = tek.karyawan?.nama || tek.nama || '-';
                return (
                  <Chip
                    key={i}
                    avatar={<Avatar sx={{ width: 20, height: 20, fontSize: 10 }}>{nama.charAt(0).toUpperCase()}</Avatar>}
                    label={nama}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: 11, height: 22 }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}

        {actions.length > 0 && (
          <>
            <Divider sx={{ mb: 1 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                Catatan Teknisi ({actions.length})
              </Typography>
              <Button size="small" sx={{ minWidth: 'auto', p: 0.5, fontSize: 11 }}>
                {expanded ? 'Sembunyikan' : 'Tampilkan'}
              </Button>
            </Stack>

            {expanded && (
              <Box sx={{ mt: 1.5, position: 'relative' }}>
                {actions.map((act, actIdx) => {
                  const nama = act.karyawan?.nama || 'System';
                  const isLast = actIdx === actions.length - 1;
                  return (
                    <Box key={act.id} sx={{ display: 'flex', gap: 1, position: 'relative', pb: isLast ? 0 : 1.5 }}>
                      {!isLast && (
                        <Box sx={{ position: 'absolute', left: 11, top: 22, bottom: 0, width: 1.5, bgcolor: 'divider' }} />
                      )}
                      <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: 'primary.lighter', color: 'primary.main', flexShrink: 0, zIndex: 1 }}>
                        {nama.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" fontWeight={600} sx={{ display: 'block' }}>
                          {nama}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: 12, mb: 0.5, lineHeight: 1.4 }}>
                          {act.narasi || '-'}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(act.starttime)} – {formatTime(act.endtime)}
                          </Typography>
                          {act.photo && (
                            <Box
                              component="img"
                              src={resolvePhoto(act.photo)}
                              alt="action"
                              sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                            />
                          )}
                        </Stack>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ActionTimeline({ items }) {
  const allActions = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items
      .flatMap((item, index) => {
        const actions = Array.isArray(item.actions) ? item.actions : [];
        return actions
          .filter((act) => act.aktif !== 'N')
          .map((act) => ({
            ...act,
            itemIndex: index,
            kode_wo: item.kode_wo || null,
            problem_issue: item.problem_issue || null
          }));
      })
      .sort((a, b) => {
        const dateA = parseApiDate(a.starttime || a.action_at) || moment(0);
        const dateB = parseApiDate(b.starttime || b.action_at) || moment(0);
        return dateB.valueOf() - dateA.valueOf();
      });
  }, [items]);

  if (allActions.length === 0) {
    return <Alert severity="info">Belum ada tindakan tercatat</Alert>;
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {allActions.map((action, index) => {
        const teknisi = action.karyawan?.nama || 'System';
        const initial = teknisi.charAt(0).toUpperCase();
        const startDate = formatDateTime(action.starttime || action.action_at);
        const isLast = index === allActions.length - 1;

        return (
          <Box key={action.id} sx={{ display: 'flex', gap: 1.5, position: 'relative', pb: isLast ? 0 : 2 }}>
            {!isLast && (
              <Box
                sx={{
                  position: 'absolute',
                  left: 15,
                  top: 32,
                  bottom: 0,
                  width: 2,
                  bgcolor: 'divider',
                  borderRadius: 1
                }}
              />
            )}

            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: 14,
                fontWeight: 700,
                bgcolor: 'primary.lighter',
                color: 'primary.main',
                flexShrink: 0,
                zIndex: 1
              }}
            >
              {initial}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: 'primary.main' }
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75, flexWrap: 'wrap', rowGap: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {teknisi}
                      </Typography>
                      {action.kode_wo && (
                        <Chip label={action.kode_wo} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                      )}
                    </Stack>

                    <Typography variant="body2" color="text.primary" sx={{ mb: 1, lineHeight: 1.5 }}>
                      {action.narasi || '-'}
                    </Typography>

                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Clock size={13} color="text.secondary" />
                        <Typography variant="caption" color="text.secondary">
                          {startDate}
                          {action.starttime && action.endtime ? ` – ${formatTime(action.endtime)}` : ''}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>

                  {action.photo && (
                    <Box
                      component="img"
                      src={resolvePhoto(action.photo)}
                      alt="action"
                      sx={{
                        width: 64,
                        height: 64,
                        objectFit: 'cover',
                        borderRadius: 1.5,
                        flexShrink: 0,
                        border: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer'
                      }}
                    />
                  )}
                </Stack>
              </Paper>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}