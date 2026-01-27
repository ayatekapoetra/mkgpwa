'use client';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardActions from '@mui/material/CardActions';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import InputAdornment from '@mui/material/InputAdornment';

import MainCard from 'components/MainCard';

import { Add, Building3, Code } from 'iconsax-react';
import InputSearch from 'components/InputSearch';

export default function FilterBisnisUnit({ count, open, onClose, data, setData, anchor = 'right' }) {
  const onResetFilterHandle = () => {
    setData({
      name: '',
      kode: '',
      page: 1,
      perPages: 25
    });
  };

  return (
    <div>
      <SwipeableDrawer anchor={anchor} onClose={onClose} open={open}>
        <Stack p={1} sx={{ maxWidth: anchor == 'right' ? '400px' : '100vw' }}>
          <MainCard content={true} title={<HeaderFilter count={count} onClose={onClose} />}>
            <Grid container spacing={2} alignItems="flex-start" justifyContent="flex-start">
              <Grid item xs={12} sm={12} lg={12}>
                <InputSearch 
                  label="Nama Unit Bisnis"
                  size="medium" 
                  type="text" 
                  value={data['name']} 
                  onChange={(e) => setData({ ...data, name: e.target.value })} 
                  startAdornment={
                    <InputAdornment position="start">
                      <Building3 size={20} />
                    </InputAdornment>
                  }
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <InputSearch 
                  label="Kode"
                  size="medium" 
                  type="text" 
                  value={data['kode']} 
                  onChange={(e) => setData({ ...data, kode: e.target.value })} 
                  startAdornment={
                    <InputAdornment position="start">
                      <Code size={20} />
                    </InputAdornment>
                  }
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
        <Typography variant="body">Filter Unit Bisnis</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: 'rotate(45deg)' }} />
      </IconButton>
    </Stack>
  );
}
