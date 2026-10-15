'use client';

import { useEffect, useState } from 'react';
import {
  Box, Button, Drawer, Grid, IconButton, MenuItem, Stack, TextField, Typography
} from '@mui/material';
import { CloseCircle, FilterSearch } from 'iconsax-react';
import { STATUSES, PLAN_STATUS_LABELS } from './utils';

export default function DailyActivityFilter({ open, onClose, filters, defaults, options, planView = false, onApply, onReset }) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const setField = (key, value) => setDraft(current => ({ ...current, [key]: value }));
  const apply = event => {
    event.preventDefault();
    onApply({ ...draft, page: 1 });
    onClose();
  };
  const reset = () => {
    setDraft(defaults);
    onReset();
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, maxWidth: '100vw', bgcolor: 'background.paper' }, role: 'dialog', 'aria-labelledby': 'daily-activity-filter-title', 'aria-modal': true }}
    >
      <Box component="form" onSubmit={apply} sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FilterSearch size={22} />
            <Typography id="daily-activity-filter-title" variant="h5">Filter {planView ? 'Daily Activity Plan' : 'Daily Activity'}</Typography>
          </Stack>
          <IconButton aria-label="Tutup filter" onClick={onClose}><CloseCircle size={22} /></IconButton>
        </Stack>

        <Box sx={{ p: 2.5, flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <Stack spacing={2.25}>
            {planView && (
              <>
                <TextField select fullWidth label="Tipe" value={draft.is_plan} onChange={event => setField('is_plan', event.target.value)}>
                  <MenuItem value="all">Semua</MenuItem>
                  <MenuItem value="true">Rencana</MenuItem>
                  <MenuItem value="false">Aktual</MenuItem>
                </TextField>
                <TextField select fullWidth label="Status Rencana" value={draft.plan_status} onChange={event => setField('plan_status', event.target.value)}>
                  <MenuItem value="">Semua</MenuItem>
                  {Object.entries(PLAN_STATUS_LABELS).map(([status, label]) => <MenuItem key={status} value={status}>{label}</MenuItem>)}
                </TextField>
              </>
            )}
            <Grid container spacing={1.5}>
              <Grid item xs={6}><TextField fullWidth type="date" label="Dari" value={draft.date_from} onChange={event => setField('date_from', event.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField fullWidth type="date" label="Sampai" value={draft.date_to} onChange={event => setField('date_to', event.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            </Grid>
            <TextField select fullWidth label="Shift" value={draft.shift_id} onChange={event => setField('shift_id', event.target.value)}>
              <MenuItem value="">Semua</MenuItem><MenuItem value="1">Siang</MenuItem><MenuItem value="2">Malam</MenuItem>
            </TextField>
            <TextField select fullWidth label="Status Aktivitas" value={draft.status} onChange={event => setField('status', event.target.value)}>
              <MenuItem value="">Semua</MenuItem>{STATUSES.map(status => <MenuItem key={status.id} value={status.id}>{status.label}</MenuItem>)}
            </TextField>
            {!planView && (
              <TextField select fullWidth label="Kategori Unit" value={draft.ctgunit} onChange={event => setField('ctgunit', event.target.value)}>
                <MenuItem value="">Semua</MenuItem>{['HE', 'DT', 'Drill'].map(category => <MenuItem key={category} value={category}>{category}</MenuItem>)}
              </TextField>
            )}
            <TextField select fullWidth label="Kontraktor" value={draft.kontraktor} onChange={event => setField('kontraktor', event.target.value)}>
              <MenuItem value="">Semua</MenuItem>{options.contractors.map(contractor => <MenuItem key={contractor} value={contractor}>{contractor}</MenuItem>)}
            </TextField>
            <TextField select fullWidth label="Site" value={draft.lokasi_site_id} onChange={event => setField('lokasi_site_id', event.target.value)}>
              <MenuItem value="">Semua</MenuItem>{options.sites.map(([id, label]) => <MenuItem key={id} value={id}>{label}</MenuItem>)}
            </TextField>
            <TextField select fullWidth label="Pit" value={draft.lokasi_pit_id} onChange={event => setField('lokasi_pit_id', event.target.value)}>
              <MenuItem value="">Semua</MenuItem>{options.pits.map(([id, label]) => <MenuItem key={id} value={id}>{label}</MenuItem>)}
            </TextField>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ p: 2.5, borderTop: 1, borderColor: 'divider' }}>
          <Button fullWidth variant="outlined" color="secondary" onClick={reset}>Reset Filter</Button>
          <Button fullWidth variant="contained" type="submit">Terapkan</Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
