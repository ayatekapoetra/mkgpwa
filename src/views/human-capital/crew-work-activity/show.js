'use client';

import moment from 'moment';
import { useParams } from 'next/navigation';
import { Avatar, Box, Card, Chip, Divider, Grid, Stack, Typography } from '@mui/material';
import { Calendar, Clock, NoteText, Profile2User, Timer1 } from 'iconsax-react';

import MainCard from 'components/MainCard';
import BtnBack from 'components/BtnBack';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import { useShowCrewWorkActivity } from 'api/crew-work-activity';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Crew Work Activity', to: '/crew-work-activity' },
  { title: 'Show' }
];

const statusMap = {
  P: { label: 'Pending', color: 'warning' },
  A: { label: 'Approved', color: 'success' },
  R: { label: 'Rejected', color: 'error' }
};

const formatDate = (value) => (value ? moment(value).format('DD MMMM YYYY') : '-');
const formatDateTime = (value) => (value ? moment(value).format('DD MMMM YYYY HH:mm') : '-');
const formatTime = (value) => (value ? String(value).slice(0, 5) : '-');
const formatHour = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(2) : '0.00';
};

const getInitial = (value = '') => value.split(' ').filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || '-';

const getRelation = (row, key) => {
  const value = row?.[key];
  if (value?.nama) return value;
  if (value?.name) return { ...value, nama: value.name };
  return null;
};

export default function CrewWorkActivityShowScreen() {
  const { id } = useParams();
  const { row, rowLoading, rowError } = useShowCrewWorkActivity(id);

  if (rowLoading) return <Typography variant="body1">Loading...</Typography>;
  if (rowError) return <Typography color="error">Gagal memuat detail Crew Work Activity</Typography>;
  if (!row?.id) return <Typography variant="body1">Data tidak ditemukan</Typography>;

  const crew = getRelation(row, 'crew') || getRelation(row, 'karyawan');
  const supervisor = getRelation(row, 'supervisor');
  const cabang = getRelation(row, 'cabang');
  const status = statusMap[row.status] || { label: row.status || '-', color: 'default' };
  const isOvertime = Number(row.jam_lembur || 0) > 0;

  return (
    <>
      <Breadcrumbs custom heading="Detail Crew Work Activity" links={breadcrumbLinks} />
      <MainCard title={<BtnBack href="/crew-work-activity" />} content={false}>
        <Box sx={{ p: 2.5 }}>
          <Stack spacing={3}>
          <Card
            elevation={0}
            sx={{
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.lighter || theme.palette.primary.light} 0%, ${theme.palette.background.paper} 48%, ${theme.palette.success.lighter || theme.palette.success.light} 140%)`
            }}
          >
            <Box sx={{ p: 2.5 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ width: 62, height: 62, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 800 }}>
                    {getInitial(crew?.nama)}
                  </Avatar>
                  <Stack spacing={0.75}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="h3">{crew?.nama || 'Crew Work Activity'}</Typography>
                      <Chip label={status.label} color={status.color} variant="light" size="small" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(row.tanggal)} • {cabang?.nama || row.area || '-'} • ID #{row.id}
                    </Typography>
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={`Produktif ${formatHour(row.jam_kerja_produktif)} jam`} color="primary" variant="light" />
                  <Chip label={`Lembur ${formatHour(row.jam_lembur)} jam`} color={isOvertime ? 'success' : 'default'} variant="light" />
                </Stack>
              </Stack>
            </Box>
          </Card>

          <Box>
            <Grid container spacing={2}>
              <SummaryCard icon={Calendar} label="Tanggal" value={formatDate(row.tanggal)} />
              <SummaryCard icon={Clock} label="Jam Kerja" value={`${formatTime(row.jam_mulai)} - ${formatTime(row.jam_selesai)}`} />
              <SummaryCard icon={Timer1} label="Jam Produktif" value={`${formatHour(row.jam_kerja_produktif)} jam`} />
              <SummaryCard icon={Timer1} label="Jam Lembur" value={`${formatHour(row.jam_lembur)} jam`} color={isOvertime ? 'success' : 'primary'} />
            </Grid>
          </Box>

          <Box>
            <Grid container spacing={2.5} alignItems="stretch">
              <Grid item xs={12} lg={6}>
                <SectionCard icon={Profile2User} title="Informasi Crew" subtitle="Identitas karyawan dan lokasi kerja">
                  <Grid container spacing={1.25}>
                    <InfoTile label="Nama Crew" value={crew?.nama || '-'} md={6} />
                    <InfoTile label="NIK Crew" value={crew?.nik || '-'} md={6} />
                    <InfoTile label="Section" value={crew?.section || '-'} />
                    <InfoTile label="Cabang" value={cabang?.nama || '-'} />
                    <InfoTile label="Kode Cabang" value={cabang?.kode || '-'} />
                    <InfoTile label="Area" value={row.area || cabang?.area || '-'} />
                  </Grid>
                </SectionCard>
              </Grid>
              <Grid item xs={12} lg={6}>
                <SectionCard icon={Clock} title="Timeline Kerja" subtitle="Rincian durasi kerja dan istirahat">
                  <Stack spacing={2.25}>
                    <TimelinePoint color="primary" label="Jam Kerja" start={formatTime(row.jam_mulai)} end={formatTime(row.jam_selesai)} total={`${formatHour(row.total_jam_kerja)} jam`} />
                    <TimelinePoint color="warning" label="Istirahat" start={formatTime(row.istirahat_mulai)} end={formatTime(row.istirahat_selesai)} total={`${formatHour(row.total_jam_istirahat)} jam`} />
                    <Divider />
                    <Grid container spacing={1.5}>
                      <InfoTile label="Jam Produktif" value={`${formatHour(row.jam_kerja_produktif)} jam`} highlight />
                      <InfoTile label="Jam Normal" value={`${formatHour(row.jam_kerja_normal || 8)} jam`} />
                      <InfoTile label="Jam Lembur" value={`${formatHour(row.jam_lembur)} jam`} color={isOvertime ? 'success.main' : 'text.primary'} />
                    </Grid>
                  </Stack>
                </SectionCard>
              </Grid>

              <Grid item xs={12}>
                <SectionCard icon={Profile2User} title="Approval" subtitle="Status validasi pengawas">
                  <Grid container spacing={1.25}>
                    <InfoTile label="Status" value={status.label} color={`${status.color}.main`} />
                    <InfoTile label="Pengawas" value={supervisor?.nama || '-'} />
                    <InfoTile label="NIK Pengawas" value={supervisor?.nik || '-'} />
                    <InfoTile label="Section Pengawas" value={supervisor?.section || '-'} />
                    <InfoTile label="Approval At" value={formatDateTime(row.approval_at)} md={8} />
                    <Grid item xs={12}>
                      <Box p={1.25} sx={{ borderRadius: 2, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">Komentar Pengawas</Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ whiteSpace: 'pre-wrap', mt: 0.35 }}>
                          {row.komentar_spv || '-'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </SectionCard>
              </Grid>
            </Grid>
          </Box>


          <Card variant="outlined">
            <Box sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <NoteText size={20} />
                  <Typography variant="h5">Keterangan Aktivitas</Typography>
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {row.keterangan || '-'}
                </Typography>
              </Stack>
            </Box>
          </Card>

          <Grid container spacing={2}>
            <InfoTile label="Created At" value={formatDateTime(row.created_at)} />
            <InfoTile label="Updated At" value={formatDateTime(row.updated_at)} />
          </Grid>
          </Stack>
        </Box>
      </MainCard>
    </>
  );
}

function SummaryCard({ icon: Icon, label, value, color = 'primary' }) {
  return (
    <Grid item xs={12} sm={6} md={3}>
      <Card variant="outlined" sx={{ height: '100%', transition: '0.2s', '&:hover': { boxShadow: 2, transform: 'translateY(-2px)' } }}>
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: `${color}.lighter`, color: `${color}.dark` }}>
              <Icon size={24} />
            </Box>
            <Stack spacing={0.25}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="h6">{value}</Typography>
            </Stack>
          </Stack>
        </Box>
      </Card>
    </Grid>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderRadius: 2.5, overflow: 'hidden' }}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: 2, py: 1.75, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ width: 38, height: 38, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'primary.lighter', color: 'primary.dark', flexShrink: 0 }}>
          <Icon size={22} />
        </Box>
        <Stack minWidth={0}>
          <Typography variant="h5">{title}</Typography>
          <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        </Stack>
      </Stack>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Card>
  );
}

function InfoTile({ label, value, highlight = false, color = 'text.primary', md = 4 }) {
  return (
    <Grid item xs={12} sm={6} md={md}>
      <Box sx={{ p: 1.25, height: '100%', borderRadius: 2, bgcolor: highlight ? 'primary.lighter' : 'background.default', border: '1px solid', borderColor: highlight ? 'primary.light' : 'divider' }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body2" fontWeight={700} color={color} sx={{ mt: 0.25 }}>{value}</Typography>
      </Box>
    </Grid>
  );
}

function TimelinePoint({ color, label, start, end, total }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: `${color}.main`, boxShadow: (theme) => `0 0 0 5px ${theme.palette[color].lighter || theme.palette[color].light}` }} />
      <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" spacing={2} flexWrap="wrap">
          <Stack>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="subtitle1" fontWeight={800}>{start} - {end}</Typography>
          </Stack>
          <Chip label={total} color={color} variant="light" />
        </Stack>
      </Box>
    </Stack>
  );
}
