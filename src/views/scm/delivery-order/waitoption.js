'use client';

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardActionArea from '@mui/material/CardActionArea';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import InputLabel from '@mui/material/InputLabel';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

// COMPONENTS
import MainCard from 'components/MainCard';

// ASSETS
import { Add, Category2, HambergerMenu, Heart } from 'iconsax-react';
import InputSearch from 'components/InputSearch';
import { useCallback, useState } from 'react';
import { useSeachKeyword } from 'hooks/useSeachKeyword';

export default function WaitOption({ data = [], mutate = null, remove, push, open, onClose, anchor = 'top' }) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('card');
  const filteredData = useSeachKeyword(data, ['narasi', 'kode_pd', 'kode_pr', 'kode_po', 'kode_transfer'], search);

  const handleSearchKeyword = useCallback(
    (teks) => {
      const arrayID = filteredData.map((m) => m.id);
      if (teks != '') {
        mutate((currentData) => {
          const rowUpdated = currentData?.rows.map((item) =>
            arrayID.includes(item.id) ? { ...item, visibled: true } : { ...item, visibled: false }
          );
          return { ...currentData, rows: rowUpdated };
        }, false);
      } else {
        mutate((currentData) => {
          const rowUpdated = currentData?.rows.map((item) => ({ ...item, visibled: true }));
          return { ...currentData, rows: rowUpdated };
        }, false);
      }
    },
    [filteredData, mutate] // ✅ mutate ditambahkan di sini
  );

  // MEMILIH ITEM UTK MASUK KE FORMIK FORM
  const handleSelect = (id, push, remove, values) => {
    mutate((currentData) => {
      const updatedRows = currentData?.rows.map((item) => {
        if (item.id === id) {
          const isSelected = !item.selected;
          const remainingQty = getRemainingQty(item);

          // Tambah ke Formik jika selected
          if (isSelected) {
            if (!values.items.some((itm) => itm.id === item.id)) {
              // console.log('item....', item);

              push({
                id: item.id,
                barang_id: item.barang?.id || null,
                narasi: item.narasi,
                barang: item.barang,
                qty_do: item.qty_do,
                is_pickup: 'N',
                existing_pickup: item.pickup,
                remaining_qty: remainingQty,
                satuan: item.satuan,
                noberkas: item.kode_po || item.kode_pd || item.kode_transfer,
                harga: item.harga,
                pickup: remainingQty
              });
            }
          } else {
            // Hapus dari Formik jika unselect
            const index = values.items.findIndex((itm) => itm.id === id);
            if (index !== -1) remove(index);
          }

          return { ...item, selected: isSelected };
        }
        return item;
      });

      // setStateSelected(updatedRows.filter((row) => row.selected));
      return { ...currentData, rows: updatedRows };
    }, false);
  };

  return (
    <div>
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
        <Stack
          p={1}
          sx={{
            height: '100%',
            p: 1,
            overflow: 'hidden'
          }}
        >
          <MainCard
            sx={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
            content={true}
            title={<HeaderFilter count={data?.length | '0'} onClose={onClose} viewMode={viewMode} onViewModeChange={setViewMode} />}
          >
            {viewMode === 'card' ? (
              <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start" sx={{ flex: 1, overflow: 'auto' }}>
                {data
                  ?.filter((row) => row.visibled !== false)
                  .map((obj, idx) => (
                    <CardOptions
                      key={idx}
                      data={obj}
                      handleSelect={() => handleSelect(obj.id, push, remove, { items: data.filter((i) => i.selected) })}
                    />
                  ))}
              </Grid>
            ) : (
              <Stack spacing={1.5} sx={{ flex: 1, overflow: 'auto' }}>
                {data
                  ?.filter((row) => row.visibled !== false)
                  .map((obj, idx) => (
                    <ListOptions key={idx} data={obj} handleSelect={() => handleSelect(obj.id, push, remove, { items: data.filter((i) => i.selected) })} />
                  ))}
              </Stack>
            )}
          </MainCard>
          <CardActions>
            <Stack spacing={3} direction="row" alignItems="center" justifyContent="space-between" style={{ flex: 1 }}>
              <Stack spacing={2} direction="row" alignItems="center" style={{ flex: 1 }}>
                <InputLabel htmlFor="search" sx={{ minWidth: 60 }}>
                  Search
                </InputLabel>
                <InputSearch
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    handleSearchKeyword(e.target.value);
                  }}
                />
              </Stack>
              <Stack>{data?.filter((f) => f.visibled)?.length || '0'} rows effected</Stack>
              <Stack style={{ width: '30%' }}>
                <Button variant="dashed" color="secondary" fullWidth onClick={onClose}>
                  Okey
                </Button>
              </Stack>
            </Stack>
          </CardActions>
        </Stack>
      </SwipeableDrawer>
    </div>
  );
}

function HeaderFilter({ count = 0, onClose, viewMode = 'card', onViewModeChange }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
      <Stack>
        <Typography variant="body">List pilihan delivery order</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <ToggleButtonGroup
          size="small"
          exclusive
          value={viewMode}
          onChange={(_, nextViewMode) => {
            if (nextViewMode) onViewModeChange?.(nextViewMode);
          }}
          color="primary"
        >
          <ToggleButton value="card">
            <Category2 size={16} />
            <Box component="span" sx={{ ml: 0.75 }}>
              Card
            </Box>
          </ToggleButton>
          <ToggleButton value="list">
            <HambergerMenu size={16} />
            <Box component="span" sx={{ ml: 0.75 }}>
              List
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
        <IconButton color="error" onClick={onClose}>
          <Add style={{ transform: 'rotate(45deg)' }} />
        </IconButton>
      </Stack>
    </Stack>
  );
}

function CardOptions({ data, handleSelect }) {
  const theme = useTheme();
  const remainingQty = getRemainingQty(data);

  if (data?.kode_po) {
    var kodeBerkas = <Typography variant="h5">{data?.kode_po}</Typography>;
    var typeBerkas = <Typography variant="body1">Purchase Order</Typography>;
  } else if (data?.kode_pd) {
    var kodeBerkas = <Typography variant="h5">{data?.kode_pd}</Typography>;
    var typeBerkas = <Typography variant="body1">Pengajuan Dana</Typography>;
  } else {
    var kodeBerkas = <Typography variant="h5">{data?.kode_transfer}</Typography>;
    var typeBerkas = <Typography variant="body1">Transfer Barang</Typography>;
  }

  if (data.visibled) {
    return (
      <Grid item xs={12} sm={4} lg={3}>
        <Card
          sx={{
            mb: 1,
            mr: 1,
            cursor: 'pointer',
            backgroundColor: data.selected ? 'secondary.light' : 'background.paper',
            transition: '0.3s',
            '&:hover': {
              boxShadow: 6
            }
          }}
        >
          <CardActionArea sx={{ minHeight: '385px' }} onClick={() => handleSelect(data.id)}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'secondary' }} aria-label="recipe">
                  {data?.prioritas}
                </Avatar>
              }
              action={<Heart variant={data.selected ? 'Bold' : 'Outline'} color={data.selected ? 'red' : ''} />}
              title={typeBerkas}
              subheader={data?.metode}
            />
            <CardContent>
              <Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Type :
                </Typography>
                {kodeBerkas}
              </Stack>
              <Divider />
              <Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Description :
                </Typography>
                <Typography variant="body1">{data?.narasi}</Typography>
              </Stack>
              <Divider />
              <Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Jumlah & Satuan:
                </Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack>
                    <Typography variant="body1">
                      Total: {data?.qty_do} {data?.satuan}
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.error.main, fontWeight: 700 }}>
                      Sisa DO: {remainingQty} {data?.satuan}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
              <Divider />
              <Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Pemasok:
                </Typography>
                <Typography variant="body1">{data?.pemasok?.nama}</Typography>
              </Stack>
              <Divider />
              <Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Alamat Pemasok:
                </Typography>
                <Typography variant="caption">{data?.pemasok?.alamat}</Typography>
              </Stack>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
    );
  }
}

function ListOptions({ data, handleSelect }) {
  const theme = useTheme();
  const remainingQty = getRemainingQty(data);
  const documentType = getDocumentType(data);
  const documentCode = getDocumentCode(data);

  return (
    <Card
      sx={{
        cursor: 'pointer',
        border: '1px solid',
        borderColor: data.selected ? 'secondary.main' : 'divider',
        backgroundColor: data.selected ? 'secondary.light' : 'background.paper',
        transition: '0.2s',
        '&:hover': { boxShadow: 4 }
      }}
    >
      <CardActionArea onClick={() => handleSelect(data.id)}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2 }} alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: { md: 220 } }}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>{data?.prioritas}</Avatar>
            <Stack>
              <Typography variant="body1" fontWeight={700}>
                {documentType}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {data?.metode}
              </Typography>
            </Stack>
          </Stack>

          <Stack sx={{ flex: 1, minWidth: 0 }} spacing={0.5}>
            <Typography variant="subtitle1" noWrap>
              {documentCode}
            </Typography>
            <Typography variant="body2">{data?.narasi}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {data?.pemasok?.nama} - {data?.pemasok?.alamat}
            </Typography>
          </Stack>

          <Stack spacing={0.5} sx={{ minWidth: { xs: '100%', md: 180 } }}>
            <Typography variant="body2">Total: {data?.qty_do} {data?.satuan}</Typography>
            <Typography variant="body2" sx={{ color: theme.palette.error.main, fontWeight: 700 }}>
              Sisa DO: {remainingQty} {data?.satuan}
            </Typography>
          </Stack>

          <Heart variant={data.selected ? 'Bold' : 'Outline'} color={data.selected ? theme.palette.error.main : undefined} />
        </Stack>
      </CardActionArea>
    </Card>
  );
}

function getDocumentType(data) {
  if (data?.kode_po) return 'Purchase Order';
  if (data?.kode_pd) return 'Pengajuan Dana';
  return 'Transfer Barang';
}

function getDocumentCode(data) {
  return data?.kode_po || data?.kode_pd || data?.kode_transfer || '-';
}

function getRemainingQty(item) {
  const qtyDo = Number(item?.qty_do || 0);
  const qtyPickup = Number(item?.pickup || 0);

  return Math.max(qtyDo - qtyPickup, 0);
}
