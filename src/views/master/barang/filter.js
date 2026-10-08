'use client';

import { useEffect, useState } from 'react';
// import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CardActions from '@mui/material/CardActions';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';

// COMPONENTS
import MainCard from 'components/MainCard';

// ASSETS
import { Add, SearchNormal1, Hashtag, Barcode } from 'iconsax-react';
import InputSearch from 'components/InputSearch';
import { useBarangFilterOptions } from 'api/barang';

export default function FilterBarang({ count, open, onClose, data, setData, anchor = 'right' }) {
  const [draft, setDraft] = useState(data);
  const { options, optionsLoading } = useBarangFilterOptions(open);

  const manufactures = options.manufactures || [];
  const brands = options.brands || [];
  const categories = options.categories || [];
  const satuans = options.satuans || [];
  const stnPakais = options.stnPakais || [];

  useEffect(() => {
    if (open) setDraft(data);
  }, [data, open]);

  const onApplyFilterHandle = () => {
    setData((current) => ({ ...current, ...draft, page: 1 }));
    onClose();
  };

  const onResetFilterHandle = () => {
    const resetData = {
      nama: '',
      kode: '',
      num_part: '',
      kategori_id: '',
      application_id: '',
      manufacture_id: '',
      brand_id: '',
      satuan: '',
      stn_pakai: '',
      page: 1,
      perPages: 30
    };

    setDraft(resetData);
    setData(resetData);
  };

  return (
    <div>
      <SwipeableDrawer anchor={anchor} onClose={onClose} open={open}>
        <Stack p={1} sx={{ maxWidth: anchor == 'right' ? '400px' : '100vw' }}>
          <MainCard content={true} title={<HeaderFilter count={count} onClose={onClose} />}>
            <Grid container spacing={1} alignItems="flex-start" justifyContent="flex-start">
              <Grid item xs={12} sm={12} lg={12} sx={{ mb: 2 }}>
                <InputSearch 
                  size="medium" 
                  type="text" 
                  value={draft.nama}
                  onChange={(e) => setDraft((current) => ({ ...current, nama: e.target.value }))}
                  startAdornment={<SearchNormal1 size="20" />}
                  placeholder="Nama Barang"
                  label="Nama Barang"
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mb: 2 }}>
                <InputSearch 
                  size="medium" 
                  type="text" 
                  value={draft.kode}
                  onChange={(e) => setDraft((current) => ({ ...current, kode: e.target.value }))}
                  startAdornment={<Hashtag size="20" />}
                  placeholder="Kode Barang"
                  label="Kode Barang"
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mb: 2 }}>
                <InputSearch 
                  size="medium" 
                  type="text" 
                  value={draft.num_part}
                  onChange={(e) => setDraft((current) => ({ ...current, num_part: e.target.value }))}
                  startAdornment={<Barcode size="20" />}
                  placeholder="Part Number"
                  label="Part Number"
                />
              </Grid>
              <Grid item xs={12} sx={{ mb: 2 }}>
                <Autocomplete
                  options={manufactures}
                  value={manufactures.find((option) => String(option.id) === String(draft.manufacture_id)) || null}
                  loading={optionsLoading}
                  getOptionLabel={(option) => option.label || option.name || ''}
                  isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
                  onChange={(_, option) => setDraft((current) => ({ ...current, manufacture_id: option?.id || '' }))}
                  renderInput={(params) => <TextField {...params} label="Manufaktur" />}
                />
              </Grid>
              <Grid item xs={12} sx={{ mb: 2 }}>
                <Autocomplete
                  options={brands}
                  value={brands.find((option) => String(option.id) === String(draft.brand_id)) || null}
                  loading={optionsLoading}
                  getOptionLabel={(option) => option.label || option.name || ''}
                  isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
                  onChange={(_, option) => setDraft((current) => ({ ...current, brand_id: option?.id || '' }))}
                  renderInput={(params) => <TextField {...params} label="Brand" />}
                />
              </Grid>
              <Grid item xs={12} sx={{ mb: 2 }}>
                <Autocomplete
                  options={categories}
                  value={categories.find((option) => String(option.id) === String(draft.kategori_id)) || null}
                  loading={optionsLoading}
                  getOptionLabel={(option) => option.label || option.name || ''}
                  isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
                  onChange={(_, option) => setDraft((current) => ({ ...current, kategori_id: option?.id || '' }))}
                  renderInput={(params) => <TextField {...params} label="Kategori" />}
                />
              </Grid>
              <Grid item xs={12} sx={{ mb: 2 }}>
                <Autocomplete
                  options={satuans}
                  value={satuans.find((option) => option.value === draft.satuan) || null}
                  loading={optionsLoading}
                  getOptionLabel={(option) => option.label || option.value || ''}
                  isOptionEqualToValue={(option, value) => option.value === value?.value}
                  onChange={(_, option) => setDraft((current) => ({ ...current, satuan: option?.value || '' }))}
                  renderInput={(params) => <TextField {...params} label="Satuan" />}
                />
              </Grid>
              <Grid item xs={12} sx={{ mb: 2 }}>
                <Autocomplete
                  options={stnPakais}
                  value={stnPakais.find((option) => option.value === draft.stn_pakai) || null}
                  loading={optionsLoading}
                  getOptionLabel={(option) => option.label || option.value || ''}
                  isOptionEqualToValue={(option, value) => option.value === value?.value}
                  onChange={(_, option) => setDraft((current) => ({ ...current, stn_pakai: option?.value || '' }))}
                  renderInput={(params) => <TextField {...params} label="Satuan Pakai" />}
                />
              </Grid>
            </Grid>
          </MainCard>
          <CardActions sx={{ gap: 1 }}>
            <Button onClick={onResetFilterHandle} variant="dashed" color="secondary" fullWidth>
              Reset Filter
            </Button>
            <Button onClick={onApplyFilterHandle} variant="contained" fullWidth>
              Terapkan
            </Button>
          </CardActions>
        </Stack>
      </SwipeableDrawer>
    </div>
  );
}

function HeaderFilter({ count = 0, onClose }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack>
        <Typography variant="body">Filter Barang</Typography>
        <Typography variant="caption">{count} data ditemukan</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: 'rotate(45deg)' }} />
      </IconButton>
    </Stack>
  );
}
