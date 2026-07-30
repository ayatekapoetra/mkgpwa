'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Add, Trash } from 'iconsax-react';
import { FieldArray } from 'formik';

import axiosServices from 'utils/axios';

function createEmptyItem() {
  return {
    barang_id: '',
    rack_src_id: '',
    hargabeli_id: '',
    qty_pakai: '',
    barang_option: null,
    satuan_pakai: '',
    satuan_order: '',
    pembagi_pakai: 0,
    stok_order: 0,
    stok_pakai: 0
  };
}

export default function WarehouseTransferForm({
  values,
  errors,
  touched,
  handleChange,
  handleSubmit,
  setFieldValue,
  isSubmitting,
  gudangOptions,
  mode = 'create'
}) {
  const [barangOptions, setBarangOptions] = useState({});
  const [priceOptions, setPriceOptions] = useState({});
  const [sourceRackOptions, setSourceRackOptions] = useState({});
  const [loadingBarang, setLoadingBarang] = useState({});
  const [loadingDeps, setLoadingDeps] = useState({});

  const gudangSrc = values.gudang_src;

  const filteredGudangTarget = useMemo(
    () => (gudangOptions || []).filter((item) => String(item.id) !== String(values.gudang_src || '')),
    [gudangOptions, values.gudang_src]
  );

  const selectedGudangSrc = useMemo(
    () => (gudangOptions || []).find((item) => String(item.id) === String(values.gudang_src || '')) || null,
    [gudangOptions, values.gudang_src]
  );

  const selectedGudangTarget = useMemo(
    () => filteredGudangTarget.find((item) => String(item.id) === String(values.gudang_target || '')) || null,
    [filteredGudangTarget, values.gudang_target]
  );

  const fetchBarang = useCallback(async (index, keyword) => {
    if (!gudangSrc) return;
    setLoadingBarang((prev) => ({ ...prev, [index]: true }));
    try {
      const params = new URLSearchParams({ gudang_id: gudangSrc, page: 1, limit: 20, keyword: keyword || '' });
      const response = await axiosServices.get(`/warehouse/transfers/options/barang?${params.toString()}`);
      setBarangOptions((prev) => ({ ...prev, [index]: response.data?.data?.items || [] }));
    } catch (error) {
      setBarangOptions((prev) => ({ ...prev, [index]: [] }));
    } finally {
      setLoadingBarang((prev) => ({ ...prev, [index]: false }));
    }
  }, [gudangSrc]);

  const fetchDependencies = useCallback(async (index, barangId) => {
    if (!gudangSrc || !barangId) return;
    setLoadingDeps((prev) => ({ ...prev, [index]: true }));
    try {
      const [pricesResp, racksResp] = await Promise.all([
        axiosServices.get(`/warehouse/transfers/options/prices?${new URLSearchParams({ gudang_id: gudangSrc, barang_id: barangId }).toString()}`),
        axiosServices.get(`/warehouse/transfers/options/source-racks?${new URLSearchParams({ gudang_id: gudangSrc, barang_id: barangId }).toString()}`)
      ]);

      const prices = pricesResp.data?.data || [];
      const racks = racksResp.data?.data || [];
      setPriceOptions((prev) => ({ ...prev, [index]: prices }));
      setSourceRackOptions((prev) => ({ ...prev, [index]: racks }));

      if (prices.length === 1) setFieldValue(`items.${index}.hargabeli_id`, String(prices[0].id));
      if (racks.length === 1) setFieldValue(`items.${index}.rack_src_id`, String(racks[0].id));
    } catch (error) {
      setPriceOptions((prev) => ({ ...prev, [index]: [] }));
      setSourceRackOptions((prev) => ({ ...prev, [index]: [] }));
    } finally {
      setLoadingDeps((prev) => ({ ...prev, [index]: false }));
    }
  }, [gudangSrc, setFieldValue]);

  useEffect(() => {
    values.items.forEach((item, index) => {
      if (item.barang_id && !priceOptions[index] && !sourceRackOptions[index]) {
        fetchDependencies(index, item.barang_id);
      }
      if (item.barang_option && !barangOptions[index]) {
        setBarangOptions((prev) => ({ ...prev, [index]: [item.barang_option] }));
      }
    });
  }, [barangOptions, fetchDependencies, priceOptions, sourceRackOptions, values.items]);

  useEffect(() => {
    if (!gudangSrc) return;
    values.items.forEach((item, index) => {
      if (item.barang_id) fetchDependencies(index, item.barang_id);
    });
  }, [fetchDependencies, gudangSrc, values.items]);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={3}>
          <TextField label="Tanggal Transfer" type="date" name="trx_date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={values.trx_date} onChange={handleChange} error={touched.trx_date && Boolean(errors.trx_date)} helperText={touched.trx_date && errors.trx_date} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={gudangOptions || []}
            value={selectedGudangSrc}
            fullWidth
            openOnFocus
            getOptionLabel={(option) => `${option.kode || '-'} - ${option.nama || '-'}`}
            isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
            onChange={(_, option) => {
              const nextValue = option?.id || '';
              setFieldValue('gudang_src', nextValue);
              setFieldValue('gudang_target', '');
              setFieldValue('items', values.items.map(() => createEmptyItem()));
              setBarangOptions({});
              setPriceOptions({});
              setSourceRackOptions({});
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Gudang Sumber"
                size="small"
                error={touched.gudang_src && Boolean(errors.gudang_src)}
                helperText={touched.gudang_src && errors.gudang_src}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={5}>
          <Autocomplete
            options={filteredGudangTarget}
            value={selectedGudangTarget}
            fullWidth
            openOnFocus
            getOptionLabel={(option) => `${option.kode || '-'} - ${option.nama || '-'}`}
            isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
            onChange={(_, option) => setFieldValue('gudang_target', option?.id || '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Gudang Tujuan"
                size="small"
                error={touched.gudang_target && Boolean(errors.gudang_target)}
                helperText={touched.gudang_target && errors.gudang_target}
              />
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Narasi" name="narasi" size="small" fullWidth multiline rows={3} value={values.narasi} onChange={handleChange} error={touched.narasi && Boolean(errors.narasi)} helperText={touched.narasi && errors.narasi} />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ mb: 2 }}>Items Transfer</Divider>
          {!values.gudang_src ? <Alert severity="info" sx={{ mb: 2 }}>Pilih gudang sumber terlebih dahulu sebelum menambahkan item.</Alert> : null}
          <FieldArray
            name="items"
            render={(arrayHelpers) => (
              <Stack spacing={2}>
                {values.items.map((item, index) => {
                  const itemErrors = errors.items?.[index] || {};
                  const itemTouched = touched.items?.[index] || {};
                  const qtyPakai = Number(item.qty_pakai || 0);
                  const pembagi = Number(item.pembagi_pakai || 0);
                  const previewQtyOrder = pembagi > 0 ? qtyPakai / pembagi : 0;

                  return (
                    <Box key={index} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Grid container spacing={2} alignItems="flex-start">
                        <Grid item xs={12} md={8}>
                          <Autocomplete
                            options={barangOptions[index] || []}
                            value={item.barang_option || null}
                            fullWidth
                            openOnFocus
                            loading={Boolean(loadingBarang[index])}
                            getOptionLabel={(option) => `${option.kode || '-'} - ${option.nama || '-'}`}
                            isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
                            filterOptions={(options) => options}
                            onInputChange={(_, value) => {
                              fetchBarang(index, value || '');
                            }}
                            onOpen={() => fetchBarang(index, '')}
                            onChange={(_, option) => {
                              setFieldValue(`items.${index}.barang_option`, option);
                              setFieldValue(`items.${index}.barang_id`, option?.id || '');
                              setFieldValue(`items.${index}.satuan_pakai`, option?.satuan_pakai || '');
                              setFieldValue(`items.${index}.satuan_order`, option?.satuan_order || '');
                              setFieldValue(`items.${index}.pembagi_pakai`, option?.pembagi_pakai || 0);
                              setFieldValue(`items.${index}.stok_order`, option?.stok_order || 0);
                              setFieldValue(`items.${index}.stok_pakai`, option?.stok_pakai || 0);
                              setFieldValue(`items.${index}.hargabeli_id`, '');
                              setFieldValue(`items.${index}.rack_src_id`, '');
                              if (option?.id) fetchDependencies(index, option.id);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                size="small"
                                label="Barang"
                                error={Boolean(itemTouched.barang_id && itemErrors.barang_id)}
                                helperText={itemTouched.barang_id && itemErrors.barang_id}
                                InputProps={{
                                  ...params.InputProps,
                                  endAdornment: (
                                    <>
                                      {loadingBarang[index] ? <CircularProgress color="inherit" size={16} /> : null}
                                      {params.InputProps.endAdornment}
                                    </>
                                  )
                                }}
                              />
                            )}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Autocomplete
                            options={sourceRackOptions[index] || []}
                            value={(sourceRackOptions[index] || []).find((option) => String(option.id) === String(item.rack_src_id || '')) || null}
                            fullWidth
                            openOnFocus
                            getOptionLabel={(option) => `${option.kode} - ${option.nama} | ${option.stok_pakai} ${item.satuan_pakai || ''}`}
                            isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
                            onChange={(_, option) => setFieldValue(`items.${index}.rack_src_id`, option?.id || '')}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Rack Sumber"
                                size="small"
                                error={Boolean(itemTouched.rack_src_id && itemErrors.rack_src_id)}
                                helperText={itemTouched.rack_src_id && itemErrors.rack_src_id}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Autocomplete
                            options={priceOptions[index] || []}
                            value={(priceOptions[index] || []).find((option) => String(option.id) === String(item.hargabeli_id || '')) || null}
                            fullWidth
                            openOnFocus
                            getOptionLabel={(option) => option.label || '-'}
                            isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
                            onChange={(_, option) => setFieldValue(`items.${index}.hargabeli_id`, option?.id || '')}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Harga"
                                size="small"
                                error={Boolean(itemTouched.hargabeli_id && itemErrors.hargabeli_id)}
                                helperText={itemTouched.hargabeli_id && itemErrors.hargabeli_id}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            label={`Qty Pakai${item.satuan_pakai ? ` (${item.satuan_pakai})` : ''}`}
                            name={`items.${index}.qty_pakai`}
                            size="small"
                            fullWidth
                            type="number"
                            value={item.qty_pakai}
                            onChange={handleChange}
                            error={Boolean(itemTouched.qty_pakai && itemErrors.qty_pakai)}
                            helperText={itemTouched.qty_pakai && itemErrors.qty_pakai}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            label={`Qty Order${item.satuan_order ? ` (${item.satuan_order})` : ''}`}
                            size="small"
                            fullWidth
                            value={previewQtyOrder ? Number(previewQtyOrder.toFixed(6)) : ''}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={0.5}>
                          <IconButton color="error" onClick={() => arrayHelpers.remove(index)} disabled={values.items.length === 1}>
                            <Trash size={18} />
                          </IconButton>
                        </Grid>
                        <Grid item xs={12}>
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <Typography variant="caption" color="text.secondary">Stok sumber: {item.stok_pakai || 0} {item.satuan_pakai || '-'} | {item.stok_order || 0} {item.satuan_order || '-'}</Typography>
                            <Typography variant="caption" color="text.secondary">Konversi: {item.pembagi_pakai || 0}</Typography>
                            {loadingDeps[index] ? <Typography variant="caption" color="primary">Memuat harga dan rack...</Typography> : null}
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                  );
                })}
                <Box>
                  <Button variant="outlined" startIcon={<Add size={18} />} onClick={() => arrayHelpers.push(createEmptyItem())} disabled={!values.gudang_src}>
                    Tambah Item
                  </Button>
                </Box>
              </Stack>
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {mode === 'edit' ? 'Simpan Draft' : 'Buat Draft'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </form>
  );
}

export { createEmptyItem };
