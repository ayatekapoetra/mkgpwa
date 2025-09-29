'use client';

// import { useTheme } from '@mui/material/styles';
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

// COMPONENTS
import MainCard from 'components/MainCard';

// ASSETS
import { Add, Heart } from 'iconsax-react';
import InputSearch from 'components/InputSearch';
import { useGetPrepareDo } from 'api/delivery-order';
import { useCallback, useEffect, useState } from 'react';
import { useSeachKeyword } from 'hooks/useSeachKeyword';

// THIRD - PARTY
import { useFormikContext } from 'formik';

export default function WaitOrderOption({ remove, push, open, onClose, pemasok, anchor = 'top', stateSelected, setStateSelected }) {
  const { setFieldValue } = useFormikContext();
  const [search, setSearch] = useState('');
  const { data: list, isLoading, mutate } = useGetPrepareDo(pemasok);
  const filteredData = useSeachKeyword(list, ['narasi', 'kode_pd', 'kode_pr', 'kode_po', 'kode_transfer'], search);

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

  // MENERIMA KEMBALI DATA YG SDH TERPILIH SEBELUMNYA
  useEffect(() => {
    for (const obj of stateSelected) {
      mutate((currentData) => {
        const rowUpdated = currentData?.rows.map((item) => (item.id === obj.id ? { ...item, selected: true } : item));

        const results = rowUpdated.filter((f) => f.selected);
        setStateSelected(results);
        setFieldValue(
          'items',
          results.map((m) => ({ ...m, pickup: m.qty_do }))
        );

        return { ...currentData, rows: rowUpdated };
      }, false);
    }
  }, [mutate, setFieldValue]); // ✅ aman

  // MEMILIH ITEM UTK MASUK KE FORMIK FORM
  const handleSelect = (id, push, remove, values) => {
    mutate((currentData) => {
      const updatedRows = currentData?.rows.map((item) => {
        if (item.id === id) {
          const isSelected = !item.selected;

          // Tambah ke Formik jika selected
          if (isSelected) {
            if (!values.items.some((itm) => itm.id === item.id)) {
              // console.log('item....', item);

              push({
                id: item.id,
                barang_id: item.barang.id,
                narasi: item.narasi,
                barang: item.barang,
                qty_do: item.qty_do,
                satuan: item.satuan,
                noberkas: item.kode_po || item.kode_pd || item.kode_transfer,
                harga: item.harga,
                pickup: item.qty_do
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

      setStateSelected(updatedRows.filter((row) => row.selected));
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
          {isLoading && <Typography variant="h5">Loading data?...</Typography>}
          <MainCard
            sx={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
            content={true}
            title={<HeaderFilter count={list?.length | '0'} onClose={onClose} />}
          >
            <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start" sx={{ flex: 1, overflow: 'auto' }}>
              {list
                ?.filter((row) => row.visibled !== false)
                .map((obj, idx) => (
                  <CardOptions
                    key={idx}
                    data={obj}
                    push={push}
                    remove={remove}
                    handleSelect={() => handleSelect(obj.id, push, remove, { items: list.filter((i) => i.selected) })}
                  />
                ))}
            </Grid>
          </MainCard>
          <CardActions>
            <Stack spacing={3} direction="row" alignItems="center" justifyContent="space-between" style={{ flex: 1 }}>
              <Stack spacing={2} direction="row" alignItems="center" style={{ flex: 1 }}>
                <InputLabel htmlFor="search">Search</InputLabel>
                <InputSearch
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    handleSearchKeyword(e.target.value);
                  }}
                />
              </Stack>
              <Stack>{list?.filter((f) => f.visibled)?.length || '0'} rows effected</Stack>
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

function HeaderFilter({ count = 0, onClose }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack>
        <Typography variant="body">List pilihan delivery order</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: 'rotate(45deg)' }} />
      </IconButton>
    </Stack>
  );
}

function CardOptions({ data, handleSelect }) {
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
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body1">{data?.qty_do}</Typography>
                  <Typography variant="body1">{data?.satuan}</Typography>
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
