import { Box, Grid, Stack, SwipeableDrawer, Button } from '@mui/material';
import { CalendarMonth, Inventory2, Warehouse, Tag, Sync } from '@mui/icons-material';
import { CloseCircle, TickCircle } from 'iconsax-react';

import MainCard from 'components/MainCard';
import InputSearch from 'components/InputSearch';
import SelectForm from 'components/SelectForm';

const shiftOptions = [
  { key: '', teks: 'Semua Shift' },
  { key: '1', teks: 'Shift 1' },
  { key: '2', teks: 'Shift 2' },
  { key: '3', teks: 'Shift 3' }
];

const syncOptions = [
  { key: '', teks: 'Semua Sync Status' },
  { key: 'PENDING', teks: 'Ada Pending' },
  { key: 'SYNCED', teks: 'Semua Synced' }
];

export default function CheckerStockpileFilter({ open, onClose, params, setParams, anchor = 'right' }) {
  const onReset = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;

    setParams({
      start_date: formatDate(startOfMonth),
      end_date: formatDate(today),
      shift_id: '',
      sync_status: '',
      stockpile_keyword: '',
      material_keyword: '',
      dom_keyword: ''
    });
  };

  return (
    <SwipeableDrawer anchor={anchor} open={open} onClose={onClose} onOpen={() => {}} disableSwipeToOpen>
      <Box sx={{ width: { xs: 320, sm: 360 }, p: 2 }} role="presentation">
        <MainCard title="Filter Checker Stockpile" content>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={12}>
              <InputSearch
                type="date"
                label="Tanggal Mulai"
                size="md"
                value={params.start_date || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, start_date: e.target.value }))}
                startAdornment={<CalendarMonth fontSize="small" />}
              />
            </Grid>

            <Grid item xs={12} sm={12}>
              <InputSearch
                type="date"
                label="Tanggal Selesai"
                size="md"
                value={params.end_date || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, end_date: e.target.value }))}
                startAdornment={<CalendarMonth fontSize="small" />}
              />
            </Grid>

            <Grid item xs={12}>
              <SelectForm
                array={shiftOptions}
                label="Shift"
                name="shift_id"
                value={params.shift_id || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, shift_id: e.target.value }))}
                onBlur={() => {}}
                touched={{}}
                errors={{}}
                startAdornment={<Warehouse fontSize="small" />}
              />
            </Grid>

            <Grid item xs={12}>
              <SelectForm
                array={syncOptions}
                label="Sync Status"
                name="sync_status"
                value={params.sync_status || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, sync_status: e.target.value }))}
                onBlur={() => {}}
                touched={{}}
                errors={{}}
                startAdornment={<Sync fontSize="small" />}
              />
            </Grid>

            <Grid item xs={12}>
              <InputSearch
                size="md"
                label="Stockpile"
                placeholder="Cari stockpile"
                value={params.stockpile_keyword || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, stockpile_keyword: e.target.value }))}
                startAdornment={<Warehouse fontSize="small" />}
              />
            </Grid>

            <Grid item xs={12}>
              <InputSearch
                size="md"
                label="Material"
                placeholder="Cari material"
                value={params.material_keyword || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, material_keyword: e.target.value }))}
                startAdornment={<Inventory2 fontSize="small" />}
              />
            </Grid>

            <Grid item xs={12}>
              <InputSearch
                size="md"
                label="DOM"
                placeholder="Cari no DOM"
                value={params.dom_keyword || ''}
                onChange={(e) => setParams((prev) => ({ ...prev, dom_keyword: e.target.value }))}
                startAdornment={<Tag fontSize="small" />}
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button variant="outlined" color="secondary" startIcon={<CloseCircle />} onClick={onReset}>
                  Reset
                </Button>
                <Button variant="contained" startIcon={<TickCircle />} onClick={onClose}>
                  Terapkan
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </MainCard>
      </Box>
    </SwipeableDrawer>
  );
}
