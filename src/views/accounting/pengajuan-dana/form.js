'use client';

import { useCallback, useMemo } from 'react';
import { FormikProvider, FieldArray, useFormik } from 'formik';
import * as Yup from 'yup';

import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Add, Trash } from 'iconsax-react';

import { openNotification } from 'api/notification';
import {
  createPengajuanDana,
  updatePengajuanDana,
  usePengajuanDanaBanks,
  usePengajuanDanaKaryawans,
  usePengajuanDanaSatuans
} from 'api/pengajuan-dana';
import OptionBarang from 'components/OptionBarang';
import OptionBisnisUnit from 'components/OptionBisnisUnit';
import OptionCabang from 'components/OptionCabang';
import OptionCoa from 'components/OptionCoa';
import OptionGudang from 'components/OptionGudang';
import OptionPemasok from 'components/OptionPemasok';

const currencyOptions = ['IDR', 'USD'];
const metodeOptions = ['tunai', 'kredit'];
const kategoriOptions = ['direct-paid', 'reimburse'];
const penerimaOptions = ['pemasok', 'karyawan', 'lainnya'];
const typeBayarOptions = ['cash', 'transfer', 'va'];
const prioritasOptions = ['P1', 'P2', 'P3'];

const createEmptyItem = () => ({
  coa_id: '',
  barang_id: '',
  qty: 1,
  satuan: '',
  curr: 'IDR',
  kurs: 0,
  harga: 0,
  harga_usd: 0,
  potongan: 0,
  ppn: 0,
  metode: 'tunai',
  kategori: 'direct-paid',
  penerima: 'pemasok',
  type_bayar: 'cash',
  pemasok_id: '',
  karyawan_id: '',
  nm_penerima: '',
  nm_bank: '',
  no_rekening: '',
  an_rekening: '',
  gudang_id: '',
  prioritas: 'P1',
  narasi: ''
});

const validationSchema = Yup.object({
  bisnis_id: Yup.string().required('Bisnis unit wajib diisi'),
  cabang_id: Yup.string().required('Cabang wajib diisi'),
  trx_date: Yup.string().required('Tanggal wajib diisi'),
  narasi: Yup.string().required('Narasi wajib diisi'),
  items: Yup.array()
    .of(
      Yup.object({
        coa_id: Yup.string().required('COA wajib diisi'),
        qty: Yup.number().moreThan(0, 'Qty harus lebih besar dari 0').required('Qty wajib diisi'),
        satuan: Yup.string().required('Satuan wajib diisi'),
        prioritas: Yup.string().required('Prioritas wajib diisi'),
        penerima: Yup.string().required('Penerima wajib diisi'),
        type_bayar: Yup.string().required('Type bayar wajib diisi')
      })
    )
    .min(1, 'Minimal 1 item')
});

const calculateItem = (item) => {
  const qty = Number(item.qty || 0);
  const harga = Number(item.harga || 0);
  const hargaUsd = Number(item.harga_usd || 0);
  const kurs = Number(item.kurs || 0);
  const potongan = Number(item.potongan || 0);
  const ppn = Number(item.ppn || 0);
  const base = String(item.curr || 'IDR').toUpperCase() === 'USD' ? qty * hargaUsd * kurs : qty * harga;
  const subtotal = base - potongan;
  const ppnRp = subtotal * (ppn / 100);
  const grandtotal = subtotal + ppnRp;
  return { subtotal, ppnRp, grandtotal };
};

const buildInitialValues = (initialData) => ({
  bisnis_id: initialData?.bisnis_id ? String(initialData.bisnis_id) : '',
  cabang_id: initialData?.cabang_id ? String(initialData.cabang_id) : '',
  trx_date: initialData?.trx_date || '',
  narasi: initialData?.narasi || '',
  lampiran: [],
  items: initialData?.items?.length
    ? initialData.items.map((item) => ({
        ...createEmptyItem(),
        ...item,
        coa_id: item.coa_id ? String(item.coa_id) : '',
        barang_id: item.barang_id ? String(item.barang_id) : '',
        pemasok_id: item.pemasok_id ? String(item.pemasok_id) : '',
        karyawan_id: item.karyawan_id ? String(item.karyawan_id) : '',
        gudang_id: item.gudang_id ? String(item.gudang_id) : '',
        curr: item.curr || 'IDR'
      }))
    : [createEmptyItem()]
});

export default function PengajuanDanaForm({ mode = 'create', initialData = null, onSuccess }) {
  const isEdit = mode === 'edit';

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: buildInitialValues(initialData),
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = {
          bisnis_id: Number(values.bisnis_id),
          cabang_id: Number(values.cabang_id),
          trx_date: values.trx_date,
          narasi: values.narasi,
          lampiran: values.lampiran,
          items: values.items.map((item) => ({
            ...item,
            coa_id: Number(item.coa_id),
            barang_id: item.barang_id ? Number(item.barang_id) : null,
            pemasok_id: item.pemasok_id ? Number(item.pemasok_id) : null,
            karyawan_id: item.karyawan_id ? Number(item.karyawan_id) : null,
            gudang_id: item.gudang_id ? Number(item.gudang_id) : null,
            qty: Number(item.qty || 0),
            kurs: Number(item.kurs || 0),
            harga: Number(item.harga || 0),
            harga_usd: Number(item.harga_usd || 0),
            potongan: Number(item.potongan || 0),
            ppn: Number(item.ppn || 0)
          }))
        };

        const result = isEdit ? await updatePengajuanDana(initialData.id, payload) : await createPengajuanDana(payload);
        openNotification({ open: true, title: 'success', message: result?.message || 'Pengajuan berhasil disimpan', alert: { color: 'success' } });
        onSuccess?.(result?.data?.id || initialData?.id);
      } catch (error) {
        openNotification({ open: true, title: 'error', message: error?.message || 'Gagal menyimpan pengajuan', alert: { color: 'error' } });
      } finally {
        setSubmitting(false);
      }
    }
  });

  const { values, errors, touched, handleBlur, handleChange, setFieldValue, isSubmitting, handleSubmit } = formik;

  const { rows: karyawanRows } = usePengajuanDanaKaryawans({ bisnis_id: values.bisnis_id || undefined });
  const { rows: satuanRows } = usePengajuanDanaSatuans();
  const { rows: bankRows } = usePengajuanDanaBanks();

  const mappedSatuan = useMemo(() => {
    return satuanRows.map((item) => item.value || item.key || item.description).filter(Boolean);
  }, [satuanRows]);

  const mappedBank = useMemo(() => {
    return bankRows.map((item) => item.value || item.key || item.description).filter(Boolean);
  }, [bankRows]);

  const totalAll = useMemo(() => values.items.reduce((sum, item) => sum + calculateItem(item).grandtotal, 0), [values.items]);

  const handleHeaderFieldValue = useCallback(
    (field, value) => {
      setFieldValue(field, value);

      if (field === 'bisnis_id') {
        setFieldValue('cabang_id', '');
        values.items.forEach((_, index) => {
          setFieldValue(`items.${index}.coa_id`, '');
          setFieldValue(`items.${index}.barang_id`, '');
          setFieldValue(`items.${index}.pemasok_id`, '');
          setFieldValue(`items.${index}.gudang_id`, '');
          setFieldValue(`items.${index}.karyawan_id`, '');
        });
      }
    },
    [setFieldValue, values.items]
  );

  return (
    <FormikProvider value={formik}>
      <form onSubmit={handleSubmit} noValidate>
        <Stack spacing={3}>
          {isEdit && initialData?.status !== 'open' && <Alert severity="warning">Dokumen non-open tidak dapat disimpan kembali.</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <OptionBisnisUnit
                value={values.bisnis_id}
                name="bisnis_id"
                label="Bisnis Unit"
                error={errors.bisnis_id}
                touched={touched.bisnis_id}
                setFieldValue={handleHeaderFieldValue}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <OptionCabang
                value={values.cabang_id}
                bisnisId={values.bisnis_id}
                name="cabang_id"
                label="Cabang"
                error={errors.cabang_id}
                touched={touched.cabang_id}
                setFieldValue={setFieldValue}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Tanggal Transaksi" type="date" name="trx_date" InputLabelProps={{ shrink: true }} value={values.trx_date} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.trx_date && errors.trx_date)} helperText={touched.trx_date && errors.trx_date} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={3} label="Narasi" name="narasi" value={values.narasi} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.narasi && errors.narasi)} helperText={touched.narasi && errors.narasi} />
            </Grid>
            <Grid item xs={12}>
              <Button component="label" variant="outlined" fullWidth>
                {values.lampiran?.length ? `${values.lampiran.length} file dipilih` : 'Upload Lampiran'}
                <input
                  hidden
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/gif"
                  onChange={(event) => {
                    const files = Array.from(event.currentTarget.files || []);
                    setFieldValue('lampiran', files);
                  }}
                />
              </Button>
            </Grid>
          </Grid>

          <FieldArray name="items">
            {({ push, remove }) => (
              <Stack spacing={2}>
                {values.items.map((item, index) => {
                  const itemErrors = errors.items?.[index] || {};
                  const itemTouched = touched.items?.[index] || {};
                  const calc = calculateItem(item);
                  const showSupplier = item.penerima === 'pemasok';
                  const showEmployee = item.penerima === 'karyawan' || item.kategori === 'reimburse';
                  const showOtherRecipient = item.penerima === 'lainnya';
                  const showBankFields = ['transfer', 'va'].includes(item.type_bayar);

                  return (
                    <Paper key={index} variant="outlined" sx={{ p: 2.5 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6">Item {index + 1}</Typography>
                          <IconButton color="error" onClick={() => remove(index)} disabled={values.items.length === 1}>
                            <Trash size={18} />
                          </IconButton>
                        </Stack>

                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <OptionCoa
                              value={item.coa_id}
                              bisnisId={values.bisnis_id}
                              name={`items.${index}.coa_id`}
                              label="COA"
                              error={itemErrors.coa_id}
                              touched={itemTouched.coa_id}
                              setFieldValue={setFieldValue}
                              disabled={isSubmitting}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <OptionBarang
                              value={item.barang_id || ''}
                              bisnisId={values.bisnis_id}
                              name={`items.${index}.barang_id`}
                              label="Barang"
                              setFieldValue={setFieldValue}
                              disabled={isSubmitting}
                            />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <TextField fullWidth type="number" label="Qty" name={`items.${index}.qty`} value={item.qty} onChange={handleChange} onBlur={handleBlur} error={Boolean(itemTouched.qty && itemErrors.qty)} helperText={itemTouched.qty && itemErrors.qty} />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <TextField select fullWidth label="Satuan" name={`items.${index}.satuan`} value={item.satuan} onChange={handleChange} onBlur={handleBlur} error={Boolean(itemTouched.satuan && itemErrors.satuan)} helperText={itemTouched.satuan && itemErrors.satuan}>
                              {[...new Set(['', ...mappedSatuan, item.satuan].filter(Boolean))].map((option) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <TextField select fullWidth label="Currency" name={`items.${index}.curr`} value={item.curr} onChange={handleChange}>
                              {currencyOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField fullWidth type="number" label={item.curr === 'USD' ? 'Harga USD' : 'Harga'} name={item.curr === 'USD' ? `items.${index}.harga_usd` : `items.${index}.harga`} value={item.curr === 'USD' ? item.harga_usd : item.harga} onChange={handleChange} />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField fullWidth type="number" label="Kurs" name={`items.${index}.kurs`} value={item.kurs} onChange={handleChange} disabled={item.curr !== 'USD'} />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField fullWidth type="number" label="Potongan" name={`items.${index}.potongan`} value={item.potongan} onChange={handleChange} />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField fullWidth type="number" label="PPN %" name={`items.${index}.ppn`} value={item.ppn} onChange={handleChange} />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField select fullWidth label="Metode" name={`items.${index}.metode`} value={item.metode} onChange={handleChange}>
                              {metodeOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField select fullWidth label="Kategori" name={`items.${index}.kategori`} value={item.kategori} onChange={handleChange}>
                              {kategoriOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField select fullWidth label="Penerima" name={`items.${index}.penerima`} value={item.penerima} onChange={handleChange} error={Boolean(itemTouched.penerima && itemErrors.penerima)} helperText={itemTouched.penerima && itemErrors.penerima}>
                              {penerimaOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField select fullWidth label="Type Bayar" name={`items.${index}.type_bayar`} value={item.type_bayar} onChange={handleChange} error={Boolean(itemTouched.type_bayar && itemErrors.type_bayar)} helperText={itemTouched.type_bayar && itemErrors.type_bayar}>
                              {typeBayarOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                            </TextField>
                          </Grid>
                          {showSupplier && (
                            <Grid item xs={12} md={4}>
                              <OptionPemasok
                                value={item.pemasok_id || ''}
                                bisnisId={values.bisnis_id}
                                name={`items.${index}.pemasok_id`}
                                label="Pemasok"
                                setFieldValue={setFieldValue}
                                disabled={isSubmitting}
                              />
                            </Grid>
                          )}
                          {showEmployee && (
                            <Grid item xs={12} md={4}>
                              <TextField select fullWidth label="Karyawan" name={`items.${index}.karyawan_id`} value={item.karyawan_id || ''} onChange={handleChange}>
                                <MenuItem value="">-</MenuItem>
                                {Array.isArray(karyawanRows) && karyawanRows.map((karyawan) => <MenuItem key={karyawan.id} value={String(karyawan.id)}>{karyawan.nama}</MenuItem>)}
                              </TextField>
                            </Grid>
                          )}
                          {showOtherRecipient && (
                            <Grid item xs={12} md={4}>
                              <TextField fullWidth label="Nama Penerima Lainnya" name={`items.${index}.nm_penerima`} value={item.nm_penerima || ''} onChange={handleChange} />
                            </Grid>
                          )}
                          {showBankFields && (
                            <>
                              <Grid item xs={12} md={4}>
                                <TextField select fullWidth label="Bank" name={`items.${index}.nm_bank`} value={item.nm_bank || ''} onChange={handleChange}>
                                  <MenuItem value="">-</MenuItem>
                                  {[...new Set([...mappedBank, item.nm_bank].filter(Boolean))].map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                                </TextField>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <TextField fullWidth label="No Rekening" name={`items.${index}.no_rekening`} value={item.no_rekening || ''} onChange={handleChange} />
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <TextField fullWidth label="Atas Nama Rekening" name={`items.${index}.an_rekening`} value={item.an_rekening || ''} onChange={handleChange} />
                              </Grid>
                            </>
                          )}
                          <Grid item xs={12} md={4}>
                            <OptionGudang
                              value={item.gudang_id || ''}
                              bisnisId={values.bisnis_id}
                              name={`items.${index}.gudang_id`}
                              label="Gudang"
                              setFieldValue={setFieldValue}
                              disabled={isSubmitting}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField select fullWidth label="Prioritas" name={`items.${index}.prioritas`} value={item.prioritas} onChange={handleChange} error={Boolean(itemTouched.prioritas && itemErrors.prioritas)} helperText={itemTouched.prioritas && itemErrors.prioritas}>
                              {prioritasOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={8}>
                            <TextField fullWidth label="Narasi Item" name={`items.${index}.narasi`} value={item.narasi || ''} onChange={handleChange} />
                          </Grid>
                        </Grid>

                        <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2 }}>
                          <Typography variant="body2">Subtotal: Rp {Number(calc.subtotal || 0).toLocaleString('id-ID')}</Typography>
                          <Typography variant="body2">PPN: Rp {Number(calc.ppnRp || 0).toLocaleString('id-ID')}</Typography>
                          <Typography variant="body1" fontWeight={700}>Grand Total: Rp {Number(calc.grandtotal || 0).toLocaleString('id-ID')}</Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })}

                <Button variant="outlined" startIcon={<Add size={18} />} onClick={() => push(createEmptyItem())}>
                  Tambah Item
                </Button>
              </Stack>
            )}
          </FieldArray>

          <Divider />
          <Typography variant="h5">Total Pengajuan: Rp {Number(totalAll || 0).toLocaleString('id-ID')}</Typography>

          <Stack direction="row" spacing={2}>
            <Button type="submit" variant="contained" disabled={isSubmitting || (isEdit && initialData?.status !== 'open')}>
              {isSubmitting ? 'Menyimpan...' : isEdit ? 'Update Pengajuan' : 'Simpan Pengajuan'}
            </Button>
          </Stack>
        </Stack>
      </form>
    </FormikProvider>
  );
}
