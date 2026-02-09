'use client';

import { useState } from 'react';
import MainCard from 'components/MainCard';
import { Button, Stack, TextField, MenuItem, Card, CardContent, Typography, Grid } from '@mui/material';
import { Send2, CloudAdd } from 'iconsax-react';
import axiosServices from 'utils/axios';
import { openNotification } from 'api/notification';
import moment from 'moment';
import BtnBack from 'components/BtnBack';

const cloudOptions = [
  { value: 'C2611851570E3331', label: 'C2611851570E3331 (checklog In)' },
  { value: 'C2608443072E122C', label: 'C2608443072E122C (checklog Out)' }
];

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Import mesin berhasil diproses',
  alert: { color: 'success' }
};

const msgError = {
  open: true,
  title: 'error',
  message: 'Gagal memproses import',
  alert: { color: 'error' }
};

export default function ImportMesinScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    trans_id: moment().format('YYMMDDHHmmsss'),
    cloud_id: cloudOptions[0].value,
    start_date: today,
    end_date: today
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    // validate date range: end_date >= start_date, and end_date <= start_date + 1 day
    const start = moment(form.start_date, 'YYYY-MM-DD');
    const end = moment(form.end_date, 'YYYY-MM-DD');

    if (!start.isValid() || !end.isValid()) {
      openNotification({ ...msgError, message: 'Tanggal tidak valid' });
      return;
    }

    if (end.isBefore(start)) {
      openNotification({ ...msgError, message: 'Tanggal selesai tidak boleh lebih kecil dari tanggal mulai' });
      return;
    }

    if (end.diff(start, 'days') > 1) {
      openNotification({ ...msgError, message: 'Tanggal selesai maksimal +1 hari dari tanggal mulai' });
      return;
    }
    setLoading(true);
    try {
      await axiosServices({
        url: '/attendances/import-mesin',
        method: 'POST',
        data: form
      });
      openNotification(msgSuccess);
    } catch (err) {
      openNotification({ ...msgError, message: err?.message || msgError.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainCard title={<BtnBack href={'/absensi-karyawan'} />} content={false}>
      <Card elevation={0} sx={{ borderRadius: 0 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Pilih cloud ID dan rentang tanggal untuk mengimpor data mesin absensi.
          </Typography>
          <form onSubmit={onSubmit}>
            <Grid container spacing={2} maxWidth={720}>
              <Grid item xs={12} sm={6} md={6}>
                <TextField
                  select
                  label="Cloud ID"
                  value={form.cloud_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, cloud_id: e.target.value }))}
                  fullWidth
                >
                  {cloudOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={3} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Tanggal Mulai"
                  value={form.start_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={3} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Tanggal Selesai"
                  value={form.end_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button type="submit" variant="contained" startIcon={<CloudAdd />} disabled={loading}>
                  {loading ? 'Memproses...' : 'Import'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </MainCard>
  );
}
