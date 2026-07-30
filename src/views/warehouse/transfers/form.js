'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Add, Box1, BoxTick, DollarCircle, Trash } from 'iconsax-react';
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
  const theme = useTheme();
  const [barangOptions, setBarangOptions] = useState({});
  const [priceOptions, setPriceOptions] = useState({});
  const [sourceRackOptions, setSourceRackOptions] = useState({});
  const [loadingBarang, setLoadingBarang] = useState({});
  const [loadingDeps, setLoadingDeps] = useState({});
  const barangSearchTimers = useRef({});
  const barangFetchSeq = useRef({});
  const barangCacheRef = useRef({});

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

  const fetchBarang = useCallback(async (index, keyword = '', { force = false } = {}) => {
    if (!gudangSrc) return;
    const normalizedKeyword = String(keyword || '').trim();
    const cacheKey = `${gudangSrc}::${normalizedKeyword.toLowerCase()}`;

    if (!force && barangCacheRef.current[cacheKey]) {
      setBarangOptions((prev) => ({ ...prev, [index]: barangCacheRef.current[cacheKey] }));
      return;
    }

    const seq = (barangFetchSeq.current[index] || 0) + 1;
    barangFetchSeq.current[index] = seq;
    setLoadingBarang((prev) => ({ ...prev, [index]: true }));
    try {
      const params = new URLSearchParams({ gudang_id: gudangSrc, page: 1, limit: 20, keyword: normalizedKeyword });
      const response = await axiosServices.get(`/warehouse/transfers/options/barang?${params.toString()}`);
      if (barangFetchSeq.current[index] !== seq) return;
      const items = response.data?.data?.items || [];
      barangCacheRef.current[cacheKey] = items;
      setBarangOptions((prev) => ({ ...prev, [index]: items }));
    } catch (error) {
      if (barangFetchSeq.current[index] !== seq) return;
      setBarangOptions((prev) => ({ ...prev, [index]: [] }));
    } finally {
      if (barangFetchSeq.current[index] === seq) {
        setLoadingBarang((prev) => ({ ...prev, [index]: false }));
      }
    }
  }, [gudangSrc]);

  const scheduleFetchBarang = useCallback((index, keyword) => {
    if (barangSearchTimers.current[index]) {
      clearTimeout(barangSearchTimers.current[index]);
    }
    barangSearchTimers.current[index] = setTimeout(() => {
      fetchBarang(index, keyword);
    }, 300);
  }, [fetchBarang]);

  useEffect(() => {
    return () => {
      Object.values(barangSearchTimers.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

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
              barangCacheRef.current = {};
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
                  const selectedPrice = (priceOptions[index] || []).find((option) => String(option.id) === String(item.hargabeli_id || '')) || null;
                  const selectedRack = (sourceRackOptions[index] || []).find((option) => String(option.id) === String(item.rack_src_id || '')) || null;
                  const barangMetaChips = buildBarangMetaChips(item.barang_option);

                  return (
                    <Box
                      key={index}
                      sx={{
                        p: { xs: 1.75, md: 2.25 },
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2.5,
                        bgcolor: 'background.paper',
                        boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Item #{index + 1}
                        </Typography>
                        <IconButton color="error" size="small" onClick={() => arrayHelpers.remove(index)} disabled={values.items.length === 1}>
                          <Trash size={18} />
                        </IconButton>
                      </Stack>

                      <Grid container spacing={2} alignItems="flex-start">
                        <Grid item xs={12} md={8}>
                          <Autocomplete
                            options={barangOptions[index] || []}
                            value={item.barang_option || null}
                            fullWidth
                            openOnFocus
                            loading={Boolean(loadingBarang[index])}
                            getOptionLabel={(option) => formatBarangLabel(option)}
                            isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
                            filterOptions={(options) => options}
                            onInputChange={(_, value, reason) => {
                              if (reason === 'input') scheduleFetchBarang(index, value || '');
                              if (reason === 'clear') fetchBarang(index, '');
                            }}
                            onOpen={() => {
                              if (!(barangOptions[index] || []).length) fetchBarang(index, '');
                            }}
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
                            renderOption={(props, option) => (
                              <Box component="li" {...props} key={option.id} sx={{ alignItems: 'flex-start !important', py: 1.25 }}>
                                <Stack spacing={0.5} sx={{ width: '100%' }}>
                                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                    <Typography variant="body2" fontWeight={600}>
                                      {option.kode || '-'} — {option.nama || '-'}
                                    </Typography>
                                    <Chip
                                      size="small"
                                      label={`${option.stok_pakai || 0} ${option.satuan_pakai || ''}`.trim()}
                                      color="success"
                                      variant="outlined"
                                      sx={{ height: 22 }}
                                    />
                                  </Stack>
                                  <Typography variant="caption" color="text.secondary">
                                    {[
                                      option.num_part ? `PN ${option.num_part}` : null,
                                      option.kategori,
                                      option.manufacture,
                                      option.brand
                                    ]
                                      .filter(Boolean)
                                      .join(' · ') || 'Tanpa detail tambahan'}
                                  </Typography>
                                </Stack>
                              </Box>
                            )}
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
                        <Grid item xs={12} md={4}>
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
                        <Grid item xs={12} md={4}>
                          <TextField
                            label={`Qty Order${item.satuan_order ? ` (${item.satuan_order})` : ''}`}
                            size="small"
                            fullWidth
                            value={previewQtyOrder ? Number(previewQtyOrder.toFixed(6)) : ''}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Stack spacing={1.5}>
                            {loadingDeps[index] ? (
                              <Typography variant="caption" color="primary">
                                Memuat harga dan rack...
                              </Typography>
                            ) : null}

                            {(item.barang_option || selectedPrice || selectedRack) ? (
                              <Grid container spacing={1.5}>
                                {item.barang_option ? (
                                  <Grid item xs={12} md={4}>
                                    <InfoCard
                                      title="Info Barang"
                                      icon={<Box1 size={16} variant="Bold" />}
                                      accent={theme.palette.primary.main}
                                    >
                                      <Stack spacing={1.25}>
                                        <Box>
                                          <Typography variant="caption" color="text.secondary">
                                            {item.barang_option.kode || '-'}
                                          </Typography>
                                          <Typography variant="subtitle2" sx={{ lineHeight: 1.35, mt: 0.25 }}>
                                            {item.barang_option.nama || '-'}
                                          </Typography>
                                        </Box>

                                        {barangMetaChips.length ? (
                                          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                                            {barangMetaChips.map((chip) => (
                                              <Chip
                                                key={`${chip.label}-${chip.value}`}
                                                size="small"
                                                label={`${chip.label}: ${chip.value}`}
                                                variant="filled"
                                                sx={{
                                                  height: 24,
                                                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                  color: 'text.primary',
                                                  '& .MuiChip-label': { px: 1, fontSize: 11 }
                                                }}
                                              />
                                            ))}
                                          </Stack>
                                        ) : null}

                                        <Box
                                          sx={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: 1
                                          }}
                                        >
                                          <MetricTile label="Satuan Pakai" value={item.satuan_pakai || '-'} />
                                          <MetricTile label="Satuan Order" value={item.satuan_order || '-'} />
                                          <MetricTile label="Konversi" value={item.pembagi_pakai || 0} />
                                          <MetricTile
                                            label="Stok Sumber"
                                            value={`${item.stok_pakai || 0} ${item.satuan_pakai || ''}`.trim()}
                                            emphasize
                                          />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                          Stok order: {item.stok_order || 0} {item.satuan_order || '-'}
                                        </Typography>
                                      </Stack>
                                    </InfoCard>
                                  </Grid>
                                ) : null}

                                {selectedPrice ? (
                                  <Grid item xs={12} md={4}>
                                    <InfoCard
                                      title="Info Harga"
                                      icon={<DollarCircle size={16} variant="Bold" />}
                                      accent={theme.palette.warning.main}
                                    >
                                      <Stack spacing={1}>
                                        <InfoRow label="Periode" value={selectedPrice.periode || '-'} />
                                        <InfoRow label="Harga Pakai" value={formatCurrency(selectedPrice.harga_pakai)} highlight />
                                        <InfoRow label="Harga Order" value={formatCurrency(selectedPrice.harga_order)} />
                                        <InfoRow label="Satuan Pakai" value={selectedPrice.satuan_pakai || '-'} />
                                        <InfoRow label="Satuan Order" value={selectedPrice.satuan_order || '-'} />
                                      </Stack>
                                    </InfoCard>
                                  </Grid>
                                ) : null}

                                {selectedRack ? (
                                  <Grid item xs={12} md={4}>
                                    <InfoCard
                                      title="Info Rack Sumber"
                                      icon={<BoxTick size={16} variant="Bold" />}
                                      accent={theme.palette.success.main}
                                    >
                                      <Stack spacing={1}>
                                        <Box>
                                          <Typography variant="caption" color="text.secondary">
                                            {selectedRack.kode || '-'}
                                          </Typography>
                                          <Typography variant="subtitle2" sx={{ lineHeight: 1.35, mt: 0.25 }}>
                                            {selectedRack.nama || '-'}
                                          </Typography>
                                        </Box>
                                        <Box
                                          sx={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: 1
                                          }}
                                        >
                                          <MetricTile
                                            label="Stok Pakai"
                                            value={`${selectedRack.stok_pakai || 0} ${item.satuan_pakai || ''}`.trim()}
                                            emphasize
                                          />
                                          <MetricTile
                                            label="Stok Order"
                                            value={`${selectedRack.stok_order || 0} ${item.satuan_order || ''}`.trim()}
                                          />
                                        </Box>
                                        <Chip
                                          size="small"
                                          color={selectedRack.is_recommended ? 'success' : 'default'}
                                          variant={selectedRack.is_recommended ? 'filled' : 'outlined'}
                                          label={selectedRack.is_recommended ? 'Rekomendasi' : 'Bukan rekomendasi'}
                                          sx={{ alignSelf: 'flex-start', height: 24 }}
                                        />
                                      </Stack>
                                    </InfoCard>
                                  </Grid>
                                ) : null}
                              </Grid>
                            ) : null}
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

function formatBarangLabel(option) {
  if (!option) return '';
  const base = `${option.kode || '-'} - ${option.nama || '-'}`;
  if (option.num_part) return `${base} (${option.num_part})`;
  return base;
}

function buildBarangMetaChips(barang) {
  if (!barang) return [];
  return [
    { label: 'Part No', value: barang.num_part },
    { label: 'Serial', value: barang.serial },
    { label: 'Kategori', value: barang.kategori },
    { label: 'Manufaktur', value: barang.manufacture },
    { label: 'Brand', value: barang.brand },
    { label: 'Aplikasi', value: barang.application }
  ].filter((item) => item.value);
}

function InfoCard({ title, children, icon, accent }) {
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: 2.5,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: (t) => alpha(accent || t.palette.primary.main, 0.03),
        backgroundImage: (t) =>
          `linear-gradient(180deg, ${alpha(accent || t.palette.primary.main, 0.08)} 0%, ${alpha(t.palette.background.paper, 0)} 48%)`
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            color: accent || 'primary.main',
            bgcolor: (t) => alpha(accent || t.palette.primary.main, 0.12)
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle2" sx={{ color: accent || 'primary.main', fontWeight: 700 }}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

function MetricTile({ label, value, emphasize = false }) {
  return (
    <Box
      sx={{
        px: 1,
        py: 0.85,
        borderRadius: 1.5,
        bgcolor: (t) => alpha(t.palette.common.black, t.palette.mode === 'dark' ? 0.18 : 0.03),
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 0.35,
          fontWeight: emphasize ? 700 : 600,
          color: emphasize ? 'success.main' : 'text.primary',
          wordBreak: 'break-word'
        }}
      >
        {value || '-'}
      </Typography>
    </Box>
  );
}

function InfoRow({ label, value, highlight = false }) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 92 }}>
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          textAlign: 'right',
          wordBreak: 'break-word',
          fontWeight: highlight ? 700 : 500,
          color: highlight ? 'warning.dark' : 'text.primary'
        }}
      >
        {value || '-'}
      </Typography>
    </Stack>
  );
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `Rp ${amount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export { createEmptyItem };
