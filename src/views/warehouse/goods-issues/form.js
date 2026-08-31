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

export function createEmptyItem() {
  return {
    barang_id: '',
    rack_id: '',
    hargabeli_id: '',
    qty_pakai: '',
    equipment_id: '',
    smu: '',
    remark: '',
    mro_item_id: null,
    barang_option: null,
    equipment_option: null,
    satuan_pakai: '',
    satuan_order: '',
    pembagi_pakai: 0,
    stok_order: 0,
    stok_pakai: 0
  };
}

export function createEmptyItemFromMro(mroItem) {
  return {
    ...createEmptyItem(),
    barang_id: mroItem.barang_id || '',
    mro_item_id: mroItem.id || null,
    qty_pakai: mroItem.qty_outstanding || mroItem.qty || '',
    remark: mroItem.remark || '',
    barang_option: mroItem.barang
      ? {
          id: mroItem.barang_id,
          kode: mroItem.barang.kode,
          nama: mroItem.barang.nama,
          num_part: mroItem.barang.num_part || null,
          satuan_pakai: mroItem.barang.satuan_pakai || mroItem.satuan_pakai || '',
          satuan_order: mroItem.barang.satuan_order || mroItem.satuan_order || '',
          pembagi_pakai: mroItem.barang.pembagi_pakai || mroItem.pembagi_pakai || 0
        }
      : null,
    satuan_pakai: mroItem.satuan_pakai || mroItem.barang?.satuan_pakai || '',
    satuan_order: mroItem.satuan_order || mroItem.barang?.satuan_order || '',
    pembagi_pakai: mroItem.pembagi_pakai || mroItem.barang?.pembagi_pakai || 0
  };
}

export default function GoodsIssueForm({
  values,
  errors,
  touched,
  handleChange,
  handleSubmit,
  setFieldValue,
  isSubmitting,
  gudangOptions,
  bisnisOptions,
  mode = 'create',
  isFromMro = false
}) {
  const theme = useTheme();
  const [barangOptions, setBarangOptions] = useState({});
  const [priceOptions, setPriceOptions] = useState({});
  const [rackOptions, setRackOptions] = useState({});
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [loadingBarang, setLoadingBarang] = useState({});
  const [loadingDeps, setLoadingDeps] = useState({});
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const barangSearchTimers = useRef({});
  const barangFetchSeq = useRef({});
  const barangCacheRef = useRef({});

  const gudangId = values.gudang_id;
  const bisnisId = values.bisnis_id;

  const filteredGudangOptions = useMemo(
    () => (gudangOptions || []).filter((item) => !bisnisId || String(item.bisnis_id) === String(bisnisId)),
    [gudangOptions, bisnisId]
  );

  const selectedGudang = useMemo(
    () => (filteredGudangOptions || []).find((item) => String(item.id) === String(values.gudang_id || '')) || null,
    [filteredGudangOptions, values.gudang_id]
  );

  const selectedBisnis = useMemo(
    () => (bisnisOptions || []).find((item) => String(item.id) === String(values.bisnis_id || '')) || null,
    [bisnisOptions, values.bisnis_id]
  );

  const fetchEquipment = useCallback(async () => {
    if (!bisnisId) {
      setEquipmentOptions([]);
      return;
    }
    setLoadingEquipment(true);
    try {
      const params = new URLSearchParams({ bisnis_id: bisnisId, page: 1, limit: 100 });
      const response = await axiosServices.get(`/warehouse/goods-issues/options/equipment?${params.toString()}`);
      setEquipmentOptions(response.data?.data || []);
    } catch {
      setEquipmentOptions([]);
    } finally {
      setLoadingEquipment(false);
    }
  }, [bisnisId]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const fetchBarang = useCallback(
    async (index, keyword = '', { force = false } = {}) => {
      if (!gudangId) return;
      const normalizedKeyword = String(keyword || '').trim();
      const cacheKey = `${gudangId}::${normalizedKeyword.toLowerCase()}`;
      if (!force && barangCacheRef.current[cacheKey]) {
        setBarangOptions((prev) => ({ ...prev, [index]: barangCacheRef.current[cacheKey] }));
        return;
      }
      const seq = (barangFetchSeq.current[index] || 0) + 1;
      barangFetchSeq.current[index] = seq;
      setLoadingBarang((prev) => ({ ...prev, [index]: true }));
      try {
        const params = new URLSearchParams({ gudang_id: gudangId, page: 1, limit: 20, keyword: normalizedKeyword });
        const response = await axiosServices.get(`/warehouse/goods-issues/options/items?${params.toString()}`);
        if (barangFetchSeq.current[index] !== seq) return;
        const items = response.data?.data?.items || response.data?.data || [];
        barangCacheRef.current[cacheKey] = items;
        setBarangOptions((prev) => ({ ...prev, [index]: items }));
      } catch {
        if (barangFetchSeq.current[index] !== seq) return;
        setBarangOptions((prev) => ({ ...prev, [index]: [] }));
      } finally {
        if (barangFetchSeq.current[index] === seq) {
          setLoadingBarang((prev) => ({ ...prev, [index]: false }));
        }
      }
    },
    [gudangId]
  );

  const scheduleFetchBarang = useCallback(
    (index, keyword) => {
      if (barangSearchTimers.current[index]) clearTimeout(barangSearchTimers.current[index]);
      barangSearchTimers.current[index] = setTimeout(() => fetchBarang(index, keyword), 300);
    },
    [fetchBarang]
  );

  useEffect(() => {
    return () => {
      Object.values(barangSearchTimers.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const fetchDependencies = useCallback(
    async (index, barangId) => {
      if (!gudangId || !barangId) return;
      setLoadingDeps((prev) => ({ ...prev, [index]: true }));
      try {
        const [pricesResp, racksResp] = await Promise.all([
          axiosServices.get(`/warehouse/goods-issues/options/prices?${new URLSearchParams({ gudang_id: gudangId, barang_id: barangId }).toString()}`),
          axiosServices.get(`/warehouse/goods-issues/options/source-racks?${new URLSearchParams({ gudang_id: gudangId, barang_id: barangId }).toString()}`)
        ]);
        const prices = pricesResp.data?.data || [];
        const racks = racksResp.data?.data || [];
        setPriceOptions((prev) => ({ ...prev, [index]: prices }));
        setRackOptions((prev) => ({ ...prev, [index]: racks }));
        if (prices.length === 1) setFieldValue(`items.${index}.hargabeli_id`, String(prices[0].id));
        if (racks.length === 1) setFieldValue(`items.${index}.rack_id`, String(racks[0].id));
      } catch {
        setPriceOptions((prev) => ({ ...prev, [index]: [] }));
        setRackOptions((prev) => ({ ...prev, [index]: [] }));
      } finally {
        setLoadingDeps((prev) => ({ ...prev, [index]: false }));
      }
    },
    [gudangId, setFieldValue]
  );

  useEffect(() => {
    values.items.forEach((item, index) => {
      if (item.barang_id && !priceOptions[index] && !rackOptions[index]) {
        fetchDependencies(index, item.barang_id);
      }
      if (item.barang_option && !barangOptions[index]) {
        setBarangOptions((prev) => ({ ...prev, [index]: [item.barang_option] }));
      }
    });
  }, [barangOptions, fetchDependencies, priceOptions, rackOptions, values.items]);

  useEffect(() => {
    if (!gudangId) return;
    values.items.forEach((item, index) => {
      if (item.barang_id) fetchDependencies(index, item.barang_id);
    });
  }, [fetchDependencies, gudangId, values.items]);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={3}>
          <TextField
            label="Tanggal Transaksi"
            type="date"
            name="trx_date"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={values.trx_date}
            onChange={handleChange}
            error={touched.trx_date && Boolean(errors.trx_date)}
            helperText={touched.trx_date && errors.trx_date}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Autocomplete
            options={bisnisOptions || []}
            value={selectedBisnis}
            fullWidth
            openOnFocus
            disabled={isFromMro}
            getOptionLabel={(option) => `${option.kode || option.initial || '-'} - ${option.name || '-'}`}
            isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
            onChange={(_, option) => {
              const nextValue = option?.id || '';
              setFieldValue('bisnis_id', nextValue);
              setFieldValue('gudang_id', '');
              setFieldValue('items', values.items.map(() => createEmptyItem()));
              setBarangOptions({});
              setPriceOptions({});
              setRackOptions({});
              barangCacheRef.current = {};
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Bisnis"
                size="small"
                error={touched.bisnis_id && Boolean(errors.bisnis_id)}
                helperText={touched.bisnis_id && errors.bisnis_id}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={5}>
          <Autocomplete
            options={filteredGudangOptions || []}
            value={selectedGudang}
            fullWidth
            openOnFocus
            disabled={isFromMro || !values.bisnis_id}
            getOptionLabel={(option) => `${option.kode || '-'} - ${option.nama || '-'}`}
            isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
            onChange={(_, option) => {
              const nextValue = option?.id || '';
              setFieldValue('gudang_id', nextValue);
              setFieldValue('items', values.items.map(() => createEmptyItem()));
              setBarangOptions({});
              setPriceOptions({});
              setRackOptions({});
              barangCacheRef.current = {};
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Gudang Sumber"
                size="small"
                error={touched.gudang_id && Boolean(errors.gudang_id)}
                helperText={touched.gudang_id && errors.gudang_id}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Penerima"
            name="penerima"
            size="small"
            fullWidth
            value={values.penerima}
            onChange={handleChange}
            error={touched.penerima && Boolean(errors.penerima)}
            helperText={touched.penerima && errors.penerima}
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <TextField
            label="Narasi"
            name="narasi"
            size="small"
            fullWidth
            value={values.narasi}
            onChange={handleChange}
            error={touched.narasi && Boolean(errors.narasi)}
            helperText={touched.narasi && errors.narasi}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ mb: 2 }}>Items Pemakaian</Divider>
          {!values.gudang_id ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Pilih bisnis dan gudang terlebih dahulu sebelum menambahkan item.
            </Alert>
          ) : null}
          <FieldArray
            name="items"
            render={(arrayHelpers) => (
              <Stack spacing={2}>
                {values.items.map((item, index) => {
                  const itemErrors = errors.items?.[index] || {};
                  const itemTouched = touched.items?.[index] || {};
                  const qtyPakai = Number(item.qty_pakai || 0);
                  const pembagi = Number(item.pembagi_pakai || 0);
                  const previewQtyBase = pembagi > 0 ? qtyPakai / pembagi : 0;
                  const selectedPrice = (priceOptions[index] || []).find((option) => String(option.id) === String(item.hargabeli_id || '')) || null;
                  const selectedRack = (rackOptions[index] || []).find((option) => String(option.id) === String(item.rack_id || '')) || null;
                  const selectedEquipment = (equipmentOptions || []).find((option) => String(option.id) === String(item.equipment_id || '')) || item.equipment_option || null;
                  const extendedPrice = selectedPrice?.harga_pakai ? Number(selectedPrice.harga_pakai) * qtyPakai : 0;

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
                          {item.mro_item_id ? (
                            <Chip size="small" label="MRO" color="info" sx={{ ml: 1, height: 20 }} />
                          ) : null}
                        </Typography>
                        <IconButton color="error" size="small" onClick={() => arrayHelpers.remove(index)} disabled={values.items.length === 1}>
                          <Trash size={18} />
                        </IconButton>
                      </Stack>

                      <Grid container spacing={2} alignItems="flex-start">
                        <Grid item xs={12} md={6}>
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
                              setFieldValue(`items.${index}.rack_id`, '');
                              if (option?.id) fetchDependencies(index, option.id);
                            }}
                            renderOption={(props, option) => (
                              <Box component="li" {...props} key={option.id} sx={{ alignItems: 'flex-start !important', py: 1.25 }}>
                                <Stack spacing={0.5} sx={{ width: '100%' }}>
                                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                    <Typography variant="body2" fontWeight={600}>
                                      {option.kode || '-'} — {option.nama || '-'}
                                    </Typography>
                                    {option.stok_pakai !== undefined ? (
                                      <Chip size="small" label={`${option.stok_pakai || 0} ${option.satuan_pakai || ''}`.trim()} color="success" variant="outlined" sx={{ height: 22 }} />
                                    ) : null}
                                  </Stack>
                                  <Typography variant="caption" color="text.secondary">
                                    {[option.num_part ? `PN ${option.num_part}` : null, option.kategori, option.manufacture, option.brand]
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
                                label="Barang / Sparepart"
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

                        <Grid item xs={12} md={3}>
                          <Autocomplete
                            options={rackOptions[index] || []}
                            value={selectedRack}
                            fullWidth
                            openOnFocus
                            getOptionLabel={(option) => `${option.kode} - ${option.nama} | ${option.stok_pakai ?? 0} ${item.satuan_pakai || ''}`}
                            isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
                            onChange={(_, option) => setFieldValue(`items.${index}.rack_id`, option?.id || '')}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Rack Sumber"
                                size="small"
                                error={Boolean(itemTouched.rack_id && itemErrors.rack_id)}
                                helperText={itemTouched.rack_id && itemErrors.rack_id}
                              />
                            )}
                          />
                        </Grid>

                        <Grid item xs={12} md={3}>
                          <Autocomplete
                            options={priceOptions[index] || []}
                            value={selectedPrice}
                            fullWidth
                            openOnFocus
                            getOptionLabel={(option) => formatPriceLabel(option)}
                            isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
                            onChange={(_, option) => setFieldValue(`items.${index}.hargabeli_id`, option?.id || '')}
                            renderOption={(props, option) => (
                              <Box component="li" {...props} key={option.id} sx={{ alignItems: 'flex-start !important', py: 1 }}>
                                <Stack spacing={0.25} sx={{ width: '100%' }}>
                                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                    <Typography variant="body2" fontWeight={700}>
                                      {formatCurrency(option.harga_pakai)}
                                    </Typography>
                                    <Chip
                                      size="small"
                                      label={option.periode || '-'}
                                      variant="outlined"
                                      sx={{ height: 22, fontSize: 11 }}
                                    />
                                  </Stack>
                                  <Stack direction="row" spacing={1.5} alignItems="center">
                                    {option.stn_pakai ? (
                                      <Typography variant="caption" color="text.secondary">
                                        Satuan Pakai: {option.stn_pakai}
                                      </Typography>
                                    ) : null}
                                  </Stack>
                                </Stack>
                              </Box>
                            )}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Harga Pakai"
                                size="small"
                                error={Boolean(itemTouched.hargabeli_id && itemErrors.hargabeli_id)}
                                helperText={itemTouched.hargabeli_id && itemErrors.hargabeli_id}
                              />
                            )}
                          />
                        </Grid>

                        <Grid item xs={12} md={3}>
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
                        <Grid item xs={12} md={3}>
                          <TextField
                            label={`Qty Base${item.satuan_order ? ` (${item.satuan_order})` : ''}`}
                            size="small"
                            fullWidth
                            value={previewQtyBase ? Number(previewQtyBase.toFixed(6)) : ''}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Autocomplete
                            options={equipmentOptions || []}
                            value={selectedEquipment}
                            fullWidth
                            openOnFocus
                            loading={loadingEquipment}
                            getOptionLabel={(option) => option.kode || option.nama || option.model || '-'}
                            isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
                            onChange={(_, option) => {
                              setFieldValue(`items.${index}.equipment_id`, option?.id || '');
                              setFieldValue(`items.${index}.equipment_option`, option || null);
                            }}
                            renderOption={(props, option) => (
                              <Box component="li" {...props} key={option.id} sx={{ alignItems: 'flex-start !important', py: 1 }}>
                                <Stack spacing={0.25} sx={{ width: '100%' }}>
                                  <Typography variant="body2" fontWeight={700}>
                                    {option.kode || '-'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {[option.kategori, option.model].filter(Boolean).join(' - ') || '-'}
                                  </Typography>
                                </Stack>
                              </Box>
                            )}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Equipment (opsional)"
                                size="small"
                                error={Boolean(itemTouched.equipment_id && itemErrors.equipment_id)}
                                helperText={itemTouched.equipment_id && itemErrors.equipment_id}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            label="HM/KM (SMU)"
                            name={`items.${index}.smu`}
                            size="small"
                            fullWidth
                            type="number"
                            value={item.smu}
                            onChange={handleChange}
                            error={Boolean(itemTouched.smu && itemErrors.smu)}
                            helperText={itemTouched.smu && itemErrors.smu}
                          />
                        </Grid>

                        <Grid item xs={12} md={12}>
                          <TextField
                            label="Remark"
                            name={`items.${index}.remark`}
                            size="small"
                            fullWidth
                            value={item.remark}
                            onChange={handleChange}
                            error={Boolean(itemTouched.remark && itemErrors.remark)}
                            helperText={itemTouched.remark && itemErrors.remark}
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
                                    <InfoCard title="Info Barang" icon={<Box1 size={16} variant="Bold" />} accent={theme.palette.primary.main}>
                                      <Stack spacing={1}>
                                        <Box>
                                          <Typography variant="caption" color="text.secondary">
                                            {item.barang_option.kode || '-'}
                                          </Typography>
                                          <Typography variant="subtitle2" sx={{ lineHeight: 1.35, mt: 0.25 }}>
                                            {item.barang_option.nama || '-'}
                                          </Typography>
                                        </Box>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                          <MetricTile label="Satuan Pakai" value={item.satuan_pakai || '-'} />
                                          <MetricTile label="Satuan Order" value={item.satuan_order || '-'} />
                                          <MetricTile label="Konversi" value={item.pembagi_pakai || 0} />
                                          <MetricTile label="Stok Sumber" value={`${item.stok_pakai || 0} ${item.satuan_pakai || ''}`.trim()} emphasize />
                                        </Box>
                                      </Stack>
                                    </InfoCard>
                                  </Grid>
                                ) : null}
                                {selectedPrice ? (
                                  <Grid item xs={12} md={4}>
                                    <InfoCard title="Info Harga" icon={<DollarCircle size={16} variant="Bold" />} accent={theme.palette.warning.main}>
                                      <Stack spacing={1}>
                                        <InfoRow label="Harga Pakai" value={formatCurrency(selectedPrice.harga_pakai)} highlight />
                                        <InfoRow label="Extended" value={formatCurrency(extendedPrice)} />
                                        <InfoRow label="Periode" value={selectedPrice.periode || '-'} />
                                      </Stack>
                                    </InfoCard>
                                  </Grid>
                                ) : null}
                                {selectedRack ? (
                                  <Grid item xs={12} md={4}>
                                    <InfoCard title="Info Rack" icon={<BoxTick size={16} variant="Bold" />} accent={theme.palette.success.main}>
                                      <Stack spacing={1}>
                                        <Box>
                                          <Typography variant="caption" color="text.secondary">
                                            {selectedRack.kode || '-'}
                                          </Typography>
                                          <Typography variant="subtitle2" sx={{ lineHeight: 1.35, mt: 0.25 }}>
                                            {selectedRack.nama || '-'}
                                          </Typography>
                                        </Box>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                          <MetricTile label="Stok Pakai" value={`${selectedRack.stok_pakai || 0} ${item.satuan_pakai || ''}`.trim()} emphasize />
                                          <MetricTile label="Stok Order" value={`${selectedRack.stok_order || 0} ${item.satuan_order || ''}`.trim()} />
                                        </Box>
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
                  <Button variant="outlined" startIcon={<Add size={18} />} onClick={() => arrayHelpers.push(createEmptyItem())} disabled={!values.gudang_id || isFromMro}>
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

function formatPriceLabel(option) {
  if (!option) return '';
  const harga = formatCurrency(option.harga_pakai);
  const satuan = option.stn_pakai || '';
  const periode = option.periode || '';
  const parts = [harga];
  if (satuan) parts.push(`/ ${satuan}`);
  if (periode) parts.push(`(${periode})`);
  return parts.join(' ');
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
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
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