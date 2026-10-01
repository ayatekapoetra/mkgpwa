'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Box1, BoxTick, Trash } from 'iconsax-react';
import { FieldArray } from 'formik';
import axiosServices from 'utils/axios';

export function createEmptyItem() {
  return {
    barang_id: '',
    harga_id: '',
    qty_aktual: '',
    barang_option: null
  };
}

export default function StokopnameForm({ values, errors, touched, handleChange, setFieldValue, isSubmitting, gudangOptions }) {
  const theme = useTheme();
  const gudangId = values.gudang_id;

  const [rackOptions, setRackOptions] = useState([]);
  const [loadingRacks, setLoadingRacks] = useState(false);
  const [priceOptions, setPriceOptions] = useState({});
  const [loadingPrices, setLoadingPrices] = useState({});
  const [loadingBarangRack, setLoadingBarangRack] = useState(false);
  const rackCacheRef = useRef(null);

  // Ambil daftar rack untuk gudang terpilih (sekali per gudang)
  const fetchRacks = useCallback(async () => {
    if (!gudangId) {
      setRackOptions([]);
      return;
    }
    if (rackCacheRef.current?.gudangId === gudangId) {
      setRackOptions(rackCacheRef.current.racks);
      return;
    }
    setLoadingRacks(true);
    try {
      const response = await axiosServices.get(`/warehouse/stokopnames/options/racks?${new URLSearchParams({ gudang_id: gudangId }).toString()}`);
      const racks = Array.isArray(response.data?.data) ? response.data.data : [];
      rackCacheRef.current = { gudangId, racks };
      setRackOptions(racks);
    } catch {
      setRackOptions([]);
    } finally {
      setLoadingRacks(false);
    }
  }, [gudangId]);

  useEffect(() => {
    fetchRacks();
  }, [fetchRacks]);

  // Ambil semua barang pada rack terpilih
  const fetchBarangByRack = useCallback(
    async (rackIdValue) => {
      if (!gudangId || !rackIdValue) return [];
      setLoadingBarangRack(true);
      try {
        const params = new URLSearchParams({ gudang_id: gudangId, rack_id: rackIdValue, page: 1, limit: 500 });
        const response = await axiosServices.get(`/warehouse/stokopnames/options/items?${params.toString()}`);
        return response.data?.data?.items || response.data?.data || [];
      } catch {
        return [];
      } finally {
        setLoadingBarangRack(false);
      }
    },
    [gudangId]
  );

  // Ambil harga berdasarkan barang terpilih
  const fetchPrices = useCallback(
    async (index, barangId) => {
      if (!gudangId || !barangId) return;
      setLoadingPrices((prev) => ({ ...prev, [index]: true }));
      try {
        const response = await axiosServices.get(`/warehouse/goods-issues/options/prices?${new URLSearchParams({ gudang_id: gudangId, barang_id: barangId }).toString()}`);
        setPriceOptions((prev) => ({ ...prev, [index]: response.data?.data || [] }));
      } catch {
        setPriceOptions((prev) => ({ ...prev, [index]: [] }));
      } finally {
        setLoadingPrices((prev) => ({ ...prev, [index]: false }));
      }
    },
    [gudangId]
  );

  return (
    <Box component="form">
      {/* ===== HEADER ===== */}
      <Stack
        spacing={2}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
          backgroundImage: (t) => `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.08)} 0%, ${alpha(t.palette.background.paper, 0)} 70%)`
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-start' }}>
          <TextField
            label="Tanggal"
            name="opname_date"
            type="date"
            size="small"
            value={values.opname_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            error={touched.opname_date && Boolean(errors.opname_date)}
            helperText={touched.opname_date && errors.opname_date}
            sx={{ flex: .5, minWidth: { md: 180 } }}
          />
          <Autocomplete
            options={gudangOptions || []}
            value={(gudangOptions || []).find((item) => String(item.id) === String(values.gudang_id || '')) || null}
            getOptionLabel={(option) => `${option.kode || '-'} - ${option.nama || '-'}`}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
            onChange={(_, option) => {
              setFieldValue('gudang_id', option?.id || '');
              setFieldValue('rack_id', '');
              setFieldValue('items', [createEmptyItem()]);
              setPriceOptions({});
              rackCacheRef.current = null;
            }}
            renderInput={(params) => (
              <TextField {...params} label="Gudang" size="small" fullWidth error={touched.gudang_id && Boolean(errors.gudang_id)} helperText={touched.gudang_id && errors.gudang_id} />
            )}
            sx={{ flex: 1, minWidth: { md: 220 } }}
          />
          <Autocomplete
            options={rackOptions || []}
            value={(rackOptions || []).find((option) => String(option.id) === String(values.rack_id || '')) || null}
            openOnFocus
            loading={loadingRacks}
            disabled={!gudangId}
            getOptionLabel={(option) => `${option.kode} - ${option.nama}`}
            isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
            onChange={async (_, option) => {
              setFieldValue('rack_id', option?.id || '');
              setPriceOptions({});
              if (option?.id) {
                const barangList = await fetchBarangByRack(option.id);
                const items = barangList.map((barang) => ({
                  barang_id: barang.id,
                  harga_id: '',
                  qty_aktual: '',
                  barang_option: { id: barang.id, kode: barang.kode, nama: barang.nama, num_part: barang.num_part, manufacture_name: barang.manufacture_name, stn_pakai: barang.stn_pakai }
                }));
                setFieldValue('items', items.length ? items : [createEmptyItem()]);
              } else {
                setFieldValue('items', [createEmptyItem()]);
              }
            }}
            renderInput={(params) => (
              <TextField {...params} label="Rack" size="small" error={touched.rack_id && Boolean(errors.rack_id)} helperText={touched.rack_id && errors.rack_id} />
            )}
            sx={{ flex: 1, minWidth: { md: 220 } }}
          />
        </Stack>

        <TextField
          label="Keterangan"
          name="keterangan"
          size="small"
          fullWidth
          multiline
          rows={2}
          value={values.keterangan}
          onChange={handleChange}
          error={touched.keterangan && Boolean(errors.keterangan)}
          helperText={touched.keterangan && errors.keterangan}
        />
      </Stack>

      {/* ===== ITEMS ===== */}
      <Box sx={{ mt: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <BoxTick size={18} color={theme.palette.primary.main} />
          <Typography variant="subtitle1" fontWeight={700}>
            Items Stockopname
          </Typography>
          {values.rack_id ? (
            <Chip size="small" color="primary" variant="outlined" label={`${values.items.length} barang`} />
          ) : null}
        </Stack>

        {!values.rack_id ? (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 8, border: '1px dashed', borderColor: 'divider', borderRadius: 3, bgcolor: (t) => alpha(t.palette.background.default, 0.4) }}>
            <Box1 size={40} color={theme.palette.text.disabled} />
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Pilih gudang dan rack terlebih dahulu.
              <br />
              Item barang akan otomatis dimuat dari rack terpilih.
            </Typography>
          </Stack>
        ) : loadingBarangRack ? (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Memuat barang pada rack...
            </Typography>
          </Stack>
        ) : (
          <FieldArray
            name="items"
            render={(arrayHelpers) => (
              <Stack spacing={1.5}>
                {values.items.map((item, index) => {
                  const itemErrors = errors.items?.[index] || {};
                  const itemTouched = touched.items?.[index] || {};
                  const barang = item.barang_option || {};
                  const selectedPrice = (priceOptions[index] || []).find((option) => String(option.id) === String(item.harga_id || '')) || null;

                  return (
                    <Stack
                      key={index}
                      direction={{ xs: 'column', md: 'row' }}
                      alignItems={{ md: 'center' }}
                      spacing={2}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`,
                        transition: 'box-shadow 0.2s ease',
                        '&:hover': { boxShadow: `0 4px 14px ${alpha(theme.palette.common.black, 0.08)}` }
                      }}
                    >
                      {/* Nomor + Info Barang */}
                      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1.6, minWidth: { md: 320 } }}>
                        <Stack
                          alignItems="center"
                          justifyContent="center"
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1.5,
                            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                            color: 'primary.main',
                            flexShrink: 0
                          }}
                        >
                          <Typography variant="caption" fontWeight={800}>
                            {index + 1}
                          </Typography>
                        </Stack>
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography variant="body1" fontWeight={800} sx={{ letterSpacing: 0.2 }}>
                              {barang.kode || '-'}
                            </Typography>
                            {barang.stn_pakai ? (
                              <Chip size="small" label={barang.stn_pakai} color="error" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                            ) : null}
                          </Stack>
                          <Typography variant="body2" color="text.primary" sx={{ mt: 0.25 }}>
                            {barang.nama || '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {[barang.num_part || null, barang.manufacture_name || null].filter(Boolean).join(' · ') || '—'}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Harga */}
                      <Box sx={{ flex: 1, minWidth: { md: 180 } }}>
                        <Autocomplete
                          options={priceOptions[index] || []}
                          value={selectedPrice}
                          openOnFocus
                          loading={Boolean(loadingPrices[index])}
                          getOptionLabel={(option) => option.label || `Rp ${Number(option.harga_pakai || 0).toLocaleString('id-ID')}`}
                          isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
                          onOpen={() => {
                            if (item.barang_id && !(priceOptions[index] || []).length) fetchPrices(index, item.barang_id);
                          }}
                          onChange={(_, option) => setFieldValue(`items.${index}.harga_id`, option?.id || '')}
                          renderOption={(props, option) => (
                            <Box component="li" {...props} key={option.id} sx={{ alignItems: 'flex-start !important', py: 1 }}>
                              <Stack spacing={0.25} sx={{ width: '100%' }}>
                                <Typography variant="body2" fontWeight={700}>
                                  Rp {Number(option.harga_pakai || 0).toLocaleString('id-ID')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.periode || '-'}
                                </Typography>
                              </Stack>
                            </Box>
                          )}
                          renderInput={(params) => <TextField {...params} label="Harga" size="small" fullWidth />}
                        />
                      </Box>

                      {/* Qty Aktual */}
                      <Box sx={{ flex: 1, minWidth: { md: 140 } }}>
                        <TextField
                          label="Qty Aktual"
                          name={`items.${index}.qty_aktual`}
                          type="number"
                          size="small"
                          fullWidth
                          value={item.qty_aktual}
                          onChange={handleChange}
                          error={Boolean(itemTouched.qty_aktual && itemErrors.qty_aktual)}
                          helperText={itemTouched.qty_aktual && itemErrors.qty_aktual}
                        />
                      </Box>

                      {/* Aksi */}
                      <Box sx={{ flexShrink: 0 }}>
                        <IconButton color="error" size="small" onClick={() => arrayHelpers.remove(index)} disabled={values.items.length === 1}>
                          <Trash size={18} />
                        </IconButton>
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          />
        )}
      </Box>
    </Box>
  );
}
