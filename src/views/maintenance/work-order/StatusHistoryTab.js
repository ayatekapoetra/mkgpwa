'use client';

import moment from 'moment';
import 'moment/locale/id';
import { Alert, Box, Button, Chip, CircularProgress, Grid, Paper, Stack, Typography } from '@mui/material';

import { getWorkOrderStatusInfo } from '../breakdown/utils';

const formatWita = (value) => {
  if (!value) return '-';
  const date = moment.utc(value).utcOffset(8).locale('id');
  return date.isValid() ? `${date.format('DD MMM YYYY, HH:mm:ss')} WITA` : '-';
};

const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined || !Number.isFinite(Number(seconds))) return '-';
  const total = Math.max(0, Math.floor(Number(seconds)));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return [days && `${days} hari`, hours && `${hours} jam`, minutes && `${minutes} menit`, `${total % 60} detik`].filter(Boolean).join(' ');
};

const knownText = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const text = String(value).trim();
  return !text || ['unknown', 'null', 'undefined', '-'].includes(text.toLowerCase()) ? '' : text;
};

const actorLabel = (actor) => {
  if (!actor || typeof actor !== 'object') return knownText(actor);
  return knownText(actor.nama) || knownText(actor.name) || (actor.id ? `ID ${actor.id}` : '');
};

function StatusChip({ status }) {
  const info = getWorkOrderStatusInfo(status);
  return <Chip size="small" label={info.label} sx={{ bgcolor: info.bg, color: info.text, fontWeight: 600 }} />;
}

export default function StatusHistoryTab({ history }) {
  const { data, dataLoading, dataError, dataValidating, mutate } = history;
  const intervals = data?.intervals || [];
  const summary = data?.summary || [];
  const forbidden = dataError?.status === 403 || dataError?.response?.status === 403;
  const retry = <Button size="small" onClick={() => mutate()} disabled={dataValidating}>Coba lagi</Button>;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
        <Box>
          <Typography variant="h5">Riwayat Status</Typography>
          {data?.as_of && (
            <Typography variant="body2" color="text.secondary">Snapshot per {formatWita(data.as_of)}</Typography>
          )}
        </Box>
        <Button variant="outlined" size="small" onClick={() => mutate()} disabled={dataValidating}>
          {dataValidating ? 'Memuat...' : 'Refresh'}
        </Button>
      </Stack>

      <Alert severity="info">
        Durasi adalah waktu berada pada setiap status, bukan downtime. Durasi DONE (Selesai) dan CLOSE (Closed) juga bukan downtime.
        Angka mengikuti snapshot server dan diperbarui setiap sekitar 60 detik selama tab ini aktif.
      </Alert>

      {dataLoading && !data && (
        <Stack direction="row" spacing={1} alignItems="center" role="status">
          <CircularProgress size={20} />
          <Typography>Memuat riwayat status...</Typography>
        </Stack>
      )}

      {dataError && (
        <Alert severity={forbidden ? 'warning' : 'error'} action={retry}>
          {forbidden ? 'Anda tidak memiliki akses untuk melihat riwayat status (403).' : 'Gagal memuat riwayat status. Silakan coba lagi.'}
          {data && !forbidden && ' Snapshot terakhir tetap ditampilkan; pembaruan belum berhasil.'}
        </Alert>
      )}

      {!dataLoading && !dataError && !intervals.length && (
        <Alert severity="info" action={retry}>Belum ada riwayat status yang tercatat.</Alert>
      )}

      {data && !forbidden && (
        <>
          {intervals.some((interval) => interval.is_baseline) && (
            <Alert severity="warning">
              Baseline menandai awal pelacakan status saat pencatatan diaktifkan, bukan awal issue.
              Durasi historis sebelum baseline tidak tersedia dan tidak termasuk dalam perhitungan.
            </Alert>
          )}

          <Typography variant="subtitle1" fontWeight={700}>Ringkasan per Status</Typography>
          <Typography variant="body2">Total waktu tercatat: {formatDuration(data.total_seconds)}</Typography>
          <Grid container spacing={1}>
            {summary.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.status}>
                <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
                  <Stack spacing={1} alignItems="flex-start">
                    <StatusChip status={item.status} />
                    <Typography variant="body2">{formatDuration(item.duration_seconds)}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.visits} kali masuk status</Typography>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {intervals.length > 0 && <Typography variant="subtitle1" fontWeight={700}>Urutan Status (Terlama ke Terbaru)</Typography>}
          <Stack component="ol" spacing={1.5} sx={{ m: 0, pl: 3 }}>
            {intervals.map((interval) => {
              const actor = actorLabel(interval.changed_by);
              const source = knownText(interval.source);
              const reason = knownText(interval.reason);
              return (
                <Paper component="li" variant="outlined" key={interval.id} sx={{ p: 1.5, overflowWrap: 'anywhere' }}>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <StatusChip status={interval.status} />
                      {interval.is_open && <Chip size="small" color="info" label="Berjalan" />}
                      {interval.is_baseline && <Chip size="small" variant="outlined" label="Baseline" />}
                    </Stack>
                    <Typography variant="body2">
                      {formatWita(interval.started_at)} — {interval.ended_at ? formatWita(interval.ended_at) : `Snapshot ${formatWita(data.as_of)}`}
                    </Typography>
                    <Typography variant="body2">Durasi: {formatDuration(interval.duration_seconds)}</Typography>
                    {actor && <Typography variant="caption" color="text.secondary">Diubah oleh: {actor}</Typography>}
                    {source && <Typography variant="caption" color="text.secondary">Sumber: {source}</Typography>}
                    {reason && <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>Alasan: {reason}</Typography>}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </>
      )}
    </Stack>
  );
}
