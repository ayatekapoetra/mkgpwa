'use client';

import { useDeferredValue, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Typography from '@mui/material/Typography';

import MainCard from 'components/MainCard';
import InputSearch from 'components/InputSearch';

import { Add, Heart } from 'iconsax-react';
import { useSeachKeyword } from 'hooks/useSeachKeyword';

const INITIAL_RENDER_LIMIT = 150;

export default function WaitOption({ data = [], dataLoading = false, push, remove, selectedItems = [], open, onClose, anchor = 'top' }) {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const filteredData = useSeachKeyword(data, ['keterangan', 'kode_doc', 'barang.nama', 'barang.kode'], deferredSearch);
  const selectedIds = useMemo(() => selectedItems.map((item) => item.doitemid || item.id), [selectedItems]);
  const visibleRows = useMemo(() => {
    if (deferredSearch.trim()) return filteredData;

    return filteredData.slice(0, INITIAL_RENDER_LIMIT);
  }, [deferredSearch, filteredData]);
  const hiddenCount = Math.max(filteredData.length - visibleRows.length, 0);

  const handleSelect = (item) => {
    const existingIndex = selectedItems.findIndex((selected) => (selected.doitemid || selected.id) === item.id);
    if (existingIndex !== -1) {
      remove(existingIndex);
      return;
    }

    push({
      id: item.doform_id,
      doid: item.doform_id,
      doitemid: item.id,
      wait_id: item.wait_id,
      barang_id: item.barang_id,
      barang: item.barang,
      nmpemasok: item.dataroot?.pemasok?.nama || '',
      narasi: item.keterangan,
      noberkas: item.kode_doc,
      satuan: item.satuan,
      harga: item.harga,
      qty_pickup: item.qty_pickup,
      lts_picked: item.lts_picked,
      remaining_qty: getRemainingQty(item),
      pickup: getRemainingQty(item)
    });
  };

  return (
    <SwipeableDrawer
      sx={{
        '& .MuiDrawer-paper': {
          width: '100vw',
          height: '100vh',
          maxWidth: '100%',
          overflow: 'hidden',
          borderRadius: 0
        }
      }}
      anchor={anchor}
      onClose={onClose}
      open={open}
    >
      <Stack sx={{ height: '100%', p: 1, overflow: 'hidden' }}>
        <MainCard
          sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}
          content
          title={<HeaderFilter count={filteredData?.length || 0} onClose={onClose} />}
        >
          {dataLoading ? (
            <Typography>Loading data...</Typography>
          ) : (
            <Stack spacing={2} sx={{ flex: 1, overflow: 'auto' }}>
              {!deferredSearch.trim() && hiddenCount > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Menampilkan {visibleRows.length} dari {filteredData.length} item. Gunakan search untuk mempersempit hasil.
                </Typography>
              )}
              <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start">
                {visibleRows.map((item, idx) => (
                  <Grid item xs={12} sm={6} lg={4} key={idx}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: selectedIds.includes(item.id) ? 'secondary.light' : 'background.paper',
                        '&:hover': { boxShadow: 6 }
                      }}
                    >
                      <CardActionArea onClick={() => handleSelect(item)}>
                        <CardContent>
                          <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle1">{item.kode_doc}</Typography>
                              <Heart variant={selectedIds.includes(item.id) ? 'Bold' : 'Outline'} color={selectedIds.includes(item.id) ? 'red' : ''} />
                            </Stack>
                            <Typography variant="body2">{item.keterangan}</Typography>
                            <Divider />
                            <Typography variant="caption">Pemasok: {item.dataroot?.pemasok?.nama || '-'}</Typography>
                            <Typography variant="caption">Barang: {item.barang?.nama || '-'}</Typography>
                            <Typography variant="body2">Ready Pickup: {item.qty_pickup} {item.satuan}</Typography>
                            <Typography variant="caption" color="error" sx={{ fontWeight: 700 }}>
                              Sisa Pickup: {getRemainingQty(item)} {item.satuan}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          )}
        </MainCard>
        <CardActions>
          <Stack spacing={3} direction="row" alignItems="center" justifyContent="space-between" sx={{ flex: 1 }}>
            <Stack spacing={2} direction="row" alignItems="center" sx={{ flex: 1 }}>
              <InputLabel htmlFor="search" sx={{ minWidth: 60 }}>
                Search
              </InputLabel>
              <InputSearch
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
              />
            </Stack>
            <Box>{filteredData.length} rows effected</Box>
            <Box sx={{ width: '30%' }}>
              <Button variant="dashed" color="secondary" fullWidth onClick={onClose}>
                Okey
              </Button>
            </Box>
          </Stack>
        </CardActions>
      </Stack>
    </SwipeableDrawer>
  );
}

function HeaderFilter({ count = 0, onClose }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack>
        <Typography variant="body">List pilihan pickup order</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: 'rotate(45deg)' }} />
      </IconButton>
    </Stack>
  );
}

function getRemainingQty(item) {
  const qtyPickup = Number(item?.qty_pickup || 0);
  const ltsPicked = Number(item?.lts_picked || 0);

  return Math.max(qtyPickup - ltsPicked, 0);
}
