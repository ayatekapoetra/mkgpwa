'use client';

// import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardActions from '@mui/material/CardActions';
// import FormControl from '@mui/material/FormControl';
// import Autocomplete from '@mui/material/Autocomplete';
// import TextField from '@mui/material/TextField';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';

// COMPONENTS
import MainCard from 'components/MainCard';

// ASSETS
import { Add, Building3, AlignVertically, BagHappy, Box as BoxIcon } from 'iconsax-react';
import InputSearch from 'components/InputSearch';
import SelectForm from 'components/SelectForm';
import FilterCabang from 'components/FilterCabang';
import FilterLokasiPit from 'components/FilterLokasiPit';
import FilterMaterialMining from 'components/FilterMaterialMining';

export default function FilterDom({ count, open, onClose, data, setData, anchor = 'right' }) {
  const onResetFilterHandle = () => {
    setData({
      kode: '',
      cabang_id: '',
      material_id: '',
      cargo_type: '',
      contractor_code: '',
      status: '',
      page: 1,
      perPages: 25
    });
  };

  return (
    <div>
      <SwipeableDrawer anchor={anchor} onClose={onClose} open={open}>
        <Stack p={1} sx={{ maxWidth: anchor == 'right' ? '400px' : '100vw' }}>
          <MainCard content={true} title={<HeaderFilter count={count} onClose={onClose} />}>
            <Grid container spacing={1} alignItems="flex-start" justifyContent="flex-start">
              <Grid item xs={12} sm={12} lg={12}>
                <InputLabel htmlFor="kode-filter">Kode DOM</InputLabel>
                <InputSearch 
                  size="medium" 
                  type="text" 
                  value={data['kode'] || ''} 
                  onChange={(e) => setData({ ...data, kode: e.target.value })} 
                  placeholder="IM 1225 BTSI 01F"
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <SelectForm
                  array={[
                    { key: '', teks: 'Semua Cargo Type' },
                    { key: 'MPR', teks: 'MPR (Import)' },
                    { key: 'IMN', teks: 'IMN (Barge)' }
                  ]}
                  label="Cargo Type"
                  name="cargo_type"
                  value={data.cargo_type || ''}
                  onChange={(e) => setData({ ...data, cargo_type: e.target.value })}
                  onBlur={() => {}}
                  touched={{}}
                  errors={{}}
                  startAdornment={<BoxIcon />}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <SelectForm
                  array={[
                    { key: '', teks: 'Semua Contractor' },
                    { key: 'BTSI', teks: 'BTSI' },
                    { key: 'B', teks: 'B' }
                  ]}
                  label="Contractor"
                  name="contractor_code"
                  value={data.contractor_code || ''}
                  onChange={(e) => setData({ ...data, contractor_code: e.target.value })}
                  onBlur={() => {}}
                  touched={{}}
                  errors={{}}
                  startAdornment={<Building3 />}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <SelectForm
                  array={[
                    { key: '', teks: 'Semua Status' },
                    { key: 'OPEN', teks: 'OPEN' },
                    { key: 'CLOSED', teks: 'CLOSED' }
                  ]}
                  label="Status"
                  name="status"
                  value={data.status || ''}
                  onChange={(e) => setData({ ...data, status: e.target.value })}
                  onBlur={() => {}}
                  touched={{}}
                  errors={{}}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <FilterCabang
                  value={data.cabang_id}
                  name={'cabang_id'}
                  label="Nama Cabang"
                  startAdornment={<Building3 />}
                  setData={setData}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <FilterMaterialMining
                  value={data.material_id}
                  name={'material_id'}
                  label="Jenis Material"
                  startAdornment={<BagHappy />}
                  setData={setData}
                />
              </Grid>
            </Grid>
          </MainCard>
          <CardActions>
            <Button onClick={onResetFilterHandle} variant="dashed" color="secondary" fullWidth>
              Reset Filter
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
        <Typography variant="body">Filter Dom</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: 'rotate(45deg)' }} />
      </IconButton>
    </Stack>
  );
}
