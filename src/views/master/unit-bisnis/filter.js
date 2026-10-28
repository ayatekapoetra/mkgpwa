'use client';

import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardActions from '@mui/material/CardActions';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import InputAdornment from '@mui/material/InputAdornment';

import MainCard from 'components/MainCard';
import useDebouncedValue from 'hooks/useDebouncedValue';

import { Add, Building3, Code } from 'iconsax-react';
import InputSearch from 'components/InputSearch';

export default function FilterBisnisUnit({ count, open, onClose, data, setData, anchor = 'right' }) {
  const [localName, setLocalName] = useState(data?.name || '');
  const [localKode, setLocalKode] = useState(data?.kode || '');

  const debouncedName = useDebouncedValue(localName, 350);
  const debouncedKode = useDebouncedValue(localKode, 350);

  // Sync external changes (e.g. reset or initial) to local state
  useEffect(() => {
    const nextName = data?.name || '';
    if (nextName !== localName) {
      setLocalName(nextName);
    }
  }, [data?.name]);

  useEffect(() => {
    const nextKode = data?.kode || '';
    if (nextKode !== localKode) {
      setLocalKode(nextKode);
    }
  }, [data?.kode]);

  // Sync debounced values back to parent params
  useEffect(() => {
    setData((prev) => {
      const currentName = prev?.name || '';
      const currentKode = prev?.kode || '';
      if (currentName === debouncedName && currentKode === debouncedKode) {
        return prev;
      }
      return {
        ...prev,
        name: debouncedName,
        kode: debouncedKode,
        page: 1
      };
    });
  }, [debouncedName, debouncedKode, setData]);

  const onResetFilterHandle = () => {
    setLocalName('');
    setLocalKode('');
    setData((prev) => ({
      ...prev,
      name: '',
      kode: '',
      page: 1,
      perPages: 25
    }));
  };

  return (
    <div>
      <SwipeableDrawer anchor={anchor} onClose={onClose} onOpen={() => {}} open={open}>
        <Stack p={1} sx={{ maxWidth: anchor == 'right' ? '400px' : '100vw' }}>
          <MainCard content={true} title={<HeaderFilter count={count} onClose={onClose} />}>
            <Grid container spacing={2} alignItems="flex-start" justifyContent="flex-start">
              <Grid item xs={12} sm={12} lg={12}>
                <InputSearch 
                  label="Nama Unit Bisnis"
                  name="nama-unit-bisnis"
                  size="medium" 
                  type="text" 
                  value={localName} 
                  onChange={(e) => setLocalName(e.target.value)} 
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
                  name="kode-unit-bisnis"
                  size="medium" 
                  type="text" 
                  value={localKode} 
                  onChange={(e) => setLocalKode(e.target.value)} 
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
