'use client';

import { useCallback, useMemo, useState } from 'react';
import { FormikProvider, FieldArray, useFormik } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Add,
  ArrowDown2,
  DocumentUpload,
  InfoCircle,
  MoneyRecive,
  NoteText,
  Profile2User,
  Trash,
  Wallet3
} from 'iconsax-react';

import { openNotification } from 'api/notification';
import {
  createPengajuanDana,
  updatePengajuanDana
} from 'api/pengajuan-dana';
import OptionBank from 'components/OptionBank';
import OptionBarang from 'components/OptionBarang';
import OptionBisnisUnit from 'components/OptionBisnisUnit';
import OptionCabang from 'components/OptionCabang';
import OptionCoa from 'components/OptionCoa';
import OptionGudang from 'components/OptionGudang';
import OptionPemasok from 'components/OptionPemasok';
import OptionPemasokRekening from 'components/OptionPemasokRekening';
import OptionPengajuanKaryawan from 'components/OptionPengajuanKaryawan';
import OptionSysOption from 'components/OptionSysOption';

const currencyOptions = ['IDR', 'USD'];
const metodeOptions = [
  { value: 'tunai', label: 'Tunai' },
  { value: 'kredit', label: 'Kredit' }
];
const kategoriOptions = [
  { value: 'direct-paid', label: 'Direct Paid' },
  { value: 'reimburse', label: 'Reimburse' }
];
const penerimaOptions = [
  { value: 'pemasok', label: 'Pemasok' },
  { value: 'karyawan', label: 'Karyawan' },
  { value: 'lainnya', label: 'Lainnya' }
];
const typeBayarOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'va', label: 'Virtual Account' }
];
const prioritasOptions = [
  { value: 'P1', label: 'P1 - Urgent', color: 'error' },
  { value: 'P2', label: 'P2 - Normal', color: 'warning' },
  { value: 'P3', label: 'P3 - Rendah', color: 'default' }
];

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

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
  return { base, subtotal, ppnRp, grandtotal };
};

const buildInitialValues = (initialData) => ({
  bisnis_id: initialData?.bisnis_id ? String(initialData.bisnis_id) : '',
  cabang_id: initialData?.cabang_id ? String(initialData.cabang_id) : '',
  trx_date: initialData?.trx_date
    ? moment(initialData.trx_date).utcOffset(8).format('YYYY-MM-DD')
    : moment().format('YYYY-MM-DD'),
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

const countObjectErrors = (value) => {
  if (!value) return 0;
  if (typeof value === 'string') return 1;
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + countObjectErrors(item), 0);
  }
  if (typeof value === 'object') {
    return Object.values(value).reduce((sum, item) => sum + countObjectErrors(item), 0);
  }
  return 0;
};

function SectionCard({ title, subtitle, icon, action = null, children, sx = {} }) {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        borderColor: alpha(theme.palette.divider, 0.9),
        ...sx
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main'
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h6">{title}</Typography>
            {subtitle ? (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Stack>
        {action}
      </Box>
      <Box sx={{ p: { xs: 2, md: 2.5 } }}>{children}</Box>
    </Paper>
  );
}

function FieldGroup({ title, description, children }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px dashed',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        ) : null}
      </Stack>
      <Grid container spacing={2}>
        {children}
      </Grid>
    </Box>
  );
}

function SummaryStat({ label, value, emphasize = false }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant={emphasize ? 'h5' : 'subtitle1'} fontWeight={emphasize ? 800 : 700} color={emphasize ? 'primary.main' : 'text.primary'}>
        {value}
      </Typography>
    </Stack>
  );
}

export default function PengajuanDanaForm({ mode = 'create', initialData = null, onSuccess }) {
  const theme = useTheme();
  const isEdit = mode === 'edit';
  const [expandedItems, setExpandedItems] = useState({ 0: true });

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
        openNotification({
          open: true,
          title: 'success',
          message: result?.message || 'Pengajuan berhasil disimpan',
          alert: { color: 'success' }
        });
        onSuccess?.(result?.data?.id || initialData?.id);
      } catch (error) {
        openNotification({
          open: true,
          title: 'error',
          message: error?.message || 'Gagal menyimpan pengajuan',
          alert: { color: 'error' }
        });
      } finally {
        setSubmitting(false);
      }
    }
  });

  const { values, errors, touched, handleBlur, handleChange, setFieldValue, isSubmitting, handleSubmit, submitCount } = formik;

  const itemCalcs = useMemo(() => values.items.map((item) => calculateItem(item)), [values.items]);

  const totals = useMemo(() => {
    return itemCalcs.reduce(
      (acc, calc) => ({
        subtotal: acc.subtotal + Number(calc.subtotal || 0),
        ppnRp: acc.ppnRp + Number(calc.ppnRp || 0),
        grandtotal: acc.grandtotal + Number(calc.grandtotal || 0)
      }),
      { subtotal: 0, ppnRp: 0, grandtotal: 0 }
    );
  }, [itemCalcs]);

  const prioritySummary = useMemo(() => {
    return values.items.reduce(
      (acc, item) => {
        const key = item.prioritas || 'P3';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { P1: 0, P2: 0, P3: 0 }
    );
  }, [values.items]);

  const errorCount = useMemo(() => countObjectErrors(errors), [errors]);
  const showValidationSummary = submitCount > 0 && errorCount > 0;
  const canSubmit = !(isEdit && initialData?.status !== 'open');

  const handleHeaderFieldValue = useCallback(
    (field, value) => {
      setFieldValue(field, value);

      if (field === 'bisnis_id') {
        setFieldValue('cabang_id', '');
        values.items.forEach((_, index) => {
          setFieldValue(`items.${index}.coa_id`, '');
          setFieldValue(`items.${index}.barang_id`, '');
          setFieldValue(`items.${index}.gudang_id`, '');
        });
      }
    },
    [setFieldValue, values.items]
  );

  const toggleItem = (index) => {
    setExpandedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const expandItem = (index) => {
    setExpandedItems((prev) => ({ ...prev, [index]: true }));
  };

  const removeLampiran = (index) => {
    const next = [...(values.lampiran || [])];
    next.splice(index, 1);
    setFieldValue('lampiran', next);
  };

  return (
    <FormikProvider value={formik}>
      <form onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={8.5}>
            <Stack spacing={2}>
              {isEdit && initialData?.status !== 'open' && (
                <Alert severity="warning">Dokumen non-open tidak dapat disimpan kembali.</Alert>
              )}

              {showValidationSummary && (
                <Alert severity="error" icon={<InfoCircle size={18} />}>
                  Masih ada {errorCount} field yang perlu dilengkapi sebelum pengajuan dapat disimpan.
                </Alert>
              )}

              <SectionCard
                title="Informasi Dokumen"
                subtitle="Data utama pengajuan dana untuk penentuan unit, cabang, dan konteks transaksi"
                icon={<NoteText size={20} />}
              >
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
                      disabled={isSubmitting || !values.bisnis_id}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Tanggal Transaksi"
                      type="date"
                      name="trx_date"
                      InputLabelProps={{ shrink: true }}
                      value={values.trx_date}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.trx_date && errors.trx_date)}
                      helperText={touched.trx_date && errors.trx_date}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Narasi Pengajuan"
                      name="narasi"
                      placeholder="Jelaskan tujuan dan konteks pengajuan dana secara ringkas"
                      value={values.narasi}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.narasi && errors.narasi)}
                      helperText={(touched.narasi && errors.narasi) || 'Narasi ini akan tampil di approval dan laporan.'}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderStyle: 'dashed',
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.info.main, 0.03)
                      }}
                    >
                      <Stack spacing={1.5}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={700}>
                              Lampiran Pendukung
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Upload invoice, kwitansi, atau bukti pendukung (PNG/JPG/GIF/PDF)
                            </Typography>
                          </Box>
                          <Button component="label" variant="outlined" startIcon={<DocumentUpload size={18} />} disabled={isSubmitting}>
                            Pilih File
                            <input
                              hidden
                              type="file"
                              multiple
                              accept="image/png,image/jpeg,image/gif,application/pdf"
                              onChange={(event) => {
                                const files = Array.from(event.currentTarget.files || []);
                                setFieldValue('lampiran', [...(values.lampiran || []), ...files]);
                                event.currentTarget.value = '';
                              }}
                            />
                          </Button>
                        </Stack>

                        {values.lampiran?.length ? (
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            {values.lampiran.map((file, index) => (
                              <Chip
                                key={`${file.name}-${index}`}
                                label={file.name}
                                onDelete={() => removeLampiran(index)}
                                color="info"
                                variant="outlined"
                              />
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Belum ada lampiran dipilih.
                          </Typography>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </SectionCard>

              <FieldArray name="items">
                {({ push, remove }) => (
                  <SectionCard
                    title="Rincian Item Pengajuan"
                    subtitle="Kelompokkan akun, nilai, penerima, dan prioritas per item agar approval lebih cepat"
                    icon={<Wallet3 size={20} />}
                    action={
                      <Button
                        variant="contained"
                        startIcon={<Add size={18} />}
                        onClick={() => {
                          const nextIndex = values.items.length;
                          push(createEmptyItem());
                          expandItem(nextIndex);
                        }}
                        disabled={isSubmitting}
                      >
                        Item
                      </Button>
                    }
                  >
                    <Stack spacing={2}>
                      {!values.bisnis_id && (
                        <Alert severity="info">Pilih bisnis unit terlebih dahulu agar opsi COA, barang, pemasok, dan gudang tersaring otomatis.</Alert>
                      )}

                      {values.items.map((item, index) => {
                        const itemErrors = errors.items?.[index] || {};
                        const itemTouched = touched.items?.[index] || {};
                        const calc = itemCalcs[index] || calculateItem(item);
                        const showSupplier = item.penerima === 'pemasok';
                        const showOtherRecipient = item.penerima === 'lainnya';
                        const showEmployeeRecipient = item.penerima === 'karyawan';
                        // pemasok/lainnya tidak menampilkan pilihan karyawan
                        const showEmployee =
                          showEmployeeRecipient ||
                          (!showSupplier && !showOtherRecipient && item.kategori === 'reimburse');
                        const showBankFields =
                          showSupplier ||
                          showOtherRecipient ||
                          showEmployeeRecipient ||
                          ['transfer', 'va'].includes(item.type_bayar);
                        const usePemasokRekening = showSupplier && Boolean(item.pemasok_id);
                        const useKaryawanBankDefaults = showEmployeeRecipient && Boolean(item.karyawan_id);
                        const itemErrorCount = countObjectErrors(itemErrors);
                        const hasItemError = submitCount > 0 && itemErrorCount > 0;
                        const prioritasMeta = prioritasOptions.find((option) => option.value === item.prioritas) || prioritasOptions[0];
                        const expanded = Boolean(expandedItems[index]);

                        return (
                          <Accordion
                            key={index}
                            disableGutters
                            expanded={expanded}
                            onChange={() => toggleItem(index)}
                            sx={{
                              border: '1px solid',
                              borderColor: hasItemError ? 'error.light' : 'divider',
                              borderRadius: '12px !important',
                              overflow: 'hidden',
                              '&:before': { display: 'none' },
                              boxShadow: 'none'
                            }}
                          >
                            <AccordionSummary
                              expandIcon={<ArrowDown2 size={18} />}
                              sx={{
                                px: 2,
                                bgcolor: hasItemError ? alpha(theme.palette.error.main, 0.04) : alpha(theme.palette.secondary.main, 0.03),
                                '& .MuiAccordionSummary-content': {
                                  my: 1.25,
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 1.5,
                                  pr: 1
                                }
                              }}
                            >
                              <Stack spacing={1} sx={{ width: '100%' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Chip size="small" color="primary" label={`Item ${index + 1}`} />
                                    <Chip size="small" color={prioritasMeta.color} variant="outlined" label={item.prioritas || 'P1'} />
                                    <Chip size="small" variant="outlined" label={(item.curr || 'IDR').toUpperCase()} />
                                    {hasItemError ? <Chip size="small" color="error" label={`${itemErrorCount} error`} /> : null}
                                  </Stack>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                                      {formatCurrency(calc.grandtotal)}
                                    </Typography>
                                    <Tooltip title={values.items.length === 1 ? 'Minimal 1 item' : 'Hapus item'}>
                                      <span>
                                        <IconButton
                                          color="error"
                                          size="small"
                                          disabled={values.items.length === 1 || isSubmitting}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            remove(index);
                                            setExpandedItems((prev) => {
                                              const next = { ...prev };
                                              delete next[index];
                                              return next;
                                            });
                                          }}
                                        >
                                          <Trash size={16} />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </Stack>
                                </Stack>
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                  <Chip size="small" variant="outlined" icon={<MoneyRecive size={14} />} label={`${item.kategori || '-'} / ${item.metode || '-'}`} />
                                  <Chip size="small" variant="outlined" icon={<Profile2User size={14} />} label={`Penerima: ${item.penerima || '-'}`} />
                                  <Chip size="small" variant="outlined" label={`Bayar: ${item.type_bayar || '-'}`} />
                                  <Chip size="small" variant="outlined" label={`Qty ${item.qty || 0} ${item.satuan || ''}`.trim()} />
                                </Stack>
                              </Stack>
                            </AccordionSummary>

                            <AccordionDetails sx={{ px: 2, pb: 2.5, pt: 2 }}>
                              <Stack spacing={2}>
                                <FieldGroup title="Akun & Barang" description="Tentukan COA dan referensi barang untuk item ini.">
                                  <Grid item xs={12} md={9}>
                                    <OptionCoa
                                      value={item.coa_id}
                                      bisnisId={values.bisnis_id}
                                      name={`items.${index}.coa_id`}
                                      label="COA"
                                      error={itemErrors.coa_id}
                                      touched={itemTouched.coa_id}
                                      setFieldValue={setFieldValue}
                                      disabled={isSubmitting || !values.bisnis_id}
                                    />
                                  </Grid>
                                  <Grid item xs={12} md={3}>
                                    <TextField
                                      select
                                      fullWidth
                                      label="Prioritas"
                                      name={`items.${index}.prioritas`}
                                      value={item.prioritas}
                                      onChange={handleChange}
                                      error={Boolean(itemTouched.prioritas && itemErrors.prioritas)}
                                      helperText={itemTouched.prioritas && itemErrors.prioritas}
                                    >
                                      {prioritasOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                          {option.label}
                                        </MenuItem>
                                      ))}
                                    </TextField>
                                  </Grid>
                                  <Grid item xs={12} md={8}>
                                    <OptionBarang
                                      value={item.barang_id || ''}
                                      bisnisId={values.bisnis_id}
                                      name={`items.${index}.barang_id`}
                                      label="Barang (opsional)"
                                      setFieldValue={setFieldValue}
                                      onSelect={(selectedBarang) => {
                                        setFieldValue(
                                          `items.${index}.satuan`,
                                          selectedBarang?.satuan || ''
                                        );
                                      }}
                                      disabled={isSubmitting || !values.bisnis_id}
                                    />
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <OptionGudang
                                      value={item.gudang_id || ''}
                                      bisnisId={values.bisnis_id}
                                      name={`items.${index}.gudang_id`}
                                      label="Gudang (opsional)"
                                      setFieldValue={setFieldValue}
                                      disabled={isSubmitting || !values.bisnis_id}
                                    />
                                  </Grid>
                                  <Grid item xs={12} md={12}>
                                    <TextField
                                      fullWidth
                                      label="Narasi Item"
                                      name={`items.${index}.narasi`}
                                      value={item.narasi || ''}
                                      onChange={handleChange}
                                      placeholder="Catatan singkat item"
                                    />
                                  </Grid>
                                </FieldGroup>

                                <FieldGroup title="Nilai Transaksi" description="Hitungan subtotal, PPN, dan grand total diperbarui otomatis.">
                                  <Grid item xs={6} md={2}>
                                    <TextField
                                      fullWidth
                                      type="number"
                                      label="Qty"
                                      name={`items.${index}.qty`}
                                      value={item.qty}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      error={Boolean(itemTouched.qty && itemErrors.qty)}
                                      helperText={itemTouched.qty && itemErrors.qty}
                                    />
                                  </Grid>
                                  <Grid item xs={6} md={4}>
                                    <OptionSysOption
                                      label="Satuan"
                                      name={`items.${index}.satuan`}
                                      group="satuan"
                                      value={item.satuan}
                                      error={itemErrors.satuan}
                                      touched={itemTouched.satuan}
                                      setFieldValue={setFieldValue}
                                      disabled={isSubmitting}
                                      helperText={
                                        (item.barang_id
                                          ? 'Default satuan order barang, dapat diganti'
                                          : 'Pilih satuan transaksi')
                                      }
                                    />
                                  </Grid>
                                  <Grid item xs={6} md={6}>
                                    <TextField
                                      fullWidth
                                      type="number"
                                      label={item.curr === 'USD' ? 'Harga USD' : 'Harga'}
                                      name={item.curr === 'USD' ? `items.${index}.harga_usd` : `items.${index}.harga`}
                                      value={item.curr === 'USD' ? item.harga_usd : item.harga}
                                      onChange={handleChange}
                                    />
                                  </Grid>
                                  <Grid item xs={6} md={2}>
                                    <TextField select fullWidth label="Currency" name={`items.${index}.curr`} value={item.curr} onChange={handleChange}>
                                      {currencyOptions.map((option) => (
                                        <MenuItem key={option} value={option}>
                                          {option}
                                        </MenuItem>
                                      ))}
                                    </TextField>
                                  </Grid>
                                  <Grid item xs={6} md={3}>
                                    <TextField
                                      fullWidth
                                      type="number"
                                      label="Kurs"
                                      name={`items.${index}.kurs`}
                                      value={item.kurs}
                                      onChange={handleChange}
                                      disabled={item.curr !== 'USD'}
                                      helperText={item.curr !== 'USD' ? 'Aktif jika currency USD' : ' '}
                                    />
                                  </Grid>
                                  <Grid item xs={6} md={4}>
                                    <TextField fullWidth type="number" label="Potongan" name={`items.${index}.potongan`} value={item.potongan} onChange={handleChange} />
                                  </Grid>
                                  <Grid item xs={6} md={3}>
                                    <TextField fullWidth type="number" label="PPN %" name={`items.${index}.ppn`} value={item.ppn} onChange={handleChange} />
                                  </Grid>
                                  <Grid item xs={12} md={12}>
                                    <Paper
                                      variant="outlined"
                                      sx={{
                                        p: 1.5,
                                        height: '100%',
                                        borderRadius: 2,
                                        bgcolor: alpha(theme.palette.success.main, 0.04)
                                      }}
                                    >
                                      <Grid container spacing={1.5}>
                                        <Grid item xs={4}>
                                          <SummaryStat label="Subtotal" value={formatCurrency(calc.subtotal)} />
                                        </Grid>
                                        <Grid item xs={4}>
                                          <SummaryStat label="PPN" value={formatCurrency(calc.ppnRp)} />
                                        </Grid>
                                        <Grid item xs={4}>
                                          <SummaryStat label="Grand Total" value={formatCurrency(calc.grandtotal)} emphasize />
                                        </Grid>
                                      </Grid>
                                    </Paper>
                                  </Grid>
                                </FieldGroup>

                                <FieldGroup title="Pembayaran & Penerima" description="Field penerima dan bank menyesuaikan pilihan kategori/type bayar.">
                                  <Grid item xs={12} md={3}>
                                    <TextField select fullWidth label="Metode" name={`items.${index}.metode`} value={item.metode} onChange={handleChange}>
                                      {metodeOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                          {option.label}
                                        </MenuItem>
                                      ))}
                                    </TextField>
                                  </Grid>
                                  <Grid item xs={12} md={3}>
                                    <TextField select fullWidth label="Kategori" name={`items.${index}.kategori`} value={item.kategori} onChange={handleChange}>
                                      {kategoriOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                          {option.label}
                                        </MenuItem>
                                      ))}
                                    </TextField>
                                  </Grid>
                                  <Grid item xs={12} md={3}>
                                    <TextField
                                      select
                                      fullWidth
                                      label="Penerima"
                                      name={`items.${index}.penerima`}
                                      value={item.penerima}
                                      onChange={(event) => {
                                        const nextPenerima = event.target.value;
                                        setFieldValue(`items.${index}.penerima`, nextPenerima);

                                        if (nextPenerima === 'lainnya') {
                                          setFieldValue(`items.${index}.karyawan_id`, '');
                                          setFieldValue(`items.${index}.pemasok_id`, '');
                                          return;
                                        }

                                        if (nextPenerima === 'pemasok') {
                                          setFieldValue(`items.${index}.karyawan_id`, '');
                                          setFieldValue(`items.${index}.nm_penerima`, '');
                                          return;
                                        }

                                        if (nextPenerima === 'karyawan') {
                                          setFieldValue(`items.${index}.pemasok_id`, '');
                                          setFieldValue(`items.${index}.nm_penerima`, '');
                                        }
                                      }}
                                      error={Boolean(itemTouched.penerima && itemErrors.penerima)}
                                      helperText={
                                        (itemTouched.penerima && itemErrors.penerima) ||
                                        (item.penerima === 'lainnya'
                                          ? 'Isi manual nama penerima, bank, dan rekening'
                                          : ' ')
                                      }
                                    >
                                      {penerimaOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                          {option.label}
                                        </MenuItem>
                                      ))}
                                    </TextField>
                                  </Grid>
                                  <Grid item xs={12} md={3}>
                                    <TextField
                                      select
                                      fullWidth
                                      label="Type Bayar"
                                      name={`items.${index}.type_bayar`}
                                      value={item.type_bayar}
                                      onChange={handleChange}
                                      error={Boolean(itemTouched.type_bayar && itemErrors.type_bayar)}
                                      helperText={itemTouched.type_bayar && itemErrors.type_bayar}
                                    >
                                      {typeBayarOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                          {option.label}
                                        </MenuItem>
                                      ))}
                                    </TextField>
                                  </Grid>

                                  {showSupplier && (
                                    <Grid item xs={12} md={12}>
                                      <OptionPemasok
                                        value={item.pemasok_id || ''}
                                        name={`items.${index}.pemasok_id`}
                                        label="Pemasok"
                                        setFieldValue={(field, value) => {
                                          setFieldValue(field, value);
                                          if (field === `items.${index}.pemasok_id`) {
                                            setFieldValue(`items.${index}.karyawan_id`, '');
                                            setFieldValue(`items.${index}.nm_bank`, '');
                                            setFieldValue(`items.${index}.no_rekening`, '');
                                            setFieldValue(`items.${index}.an_rekening`, '');
                                          }
                                        }}
                                        disabled={isSubmitting}
                                      />
                                    </Grid>
                                  )}

                                  {showEmployee && (
                                    <Grid item xs={12} md={12}>
                                      <OptionPengajuanKaryawan
                                        value={item.karyawan_id || ''}
                                        name={`items.${index}.karyawan_id`}
                                        label="Karyawan"
                                        setFieldValue={setFieldValue}
                                        disabled={isSubmitting}
                                        helperText={
                                          showEmployeeRecipient
                                            ? 'Bank & rekening diisi default dari data karyawan, tetap bisa diubah'
                                            : ''
                                        }
                                        onSelect={(selectedKaryawan) => {
                                          setFieldValue(`items.${index}.pemasok_id`, '');
                                          setFieldValue(`items.${index}.nm_penerima`, '');

                                          if (!selectedKaryawan) {
                                            if (showEmployeeRecipient) {
                                              setFieldValue(`items.${index}.nm_bank`, '');
                                              setFieldValue(`items.${index}.no_rekening`, '');
                                              setFieldValue(`items.${index}.an_rekening`, '');
                                            }
                                            return;
                                          }

                                          // Default dari data karyawan, tetap bisa diubah manual
                                          setFieldValue(`items.${index}.nm_bank`, selectedKaryawan.nm_bank || '');
                                          setFieldValue(`items.${index}.no_rekening`, selectedKaryawan.no_rekening || '');
                                          setFieldValue(
                                            `items.${index}.an_rekening`,
                                            selectedKaryawan.an_rekening || selectedKaryawan.nama || ''
                                          );
                                        }}
                                      />
                                    </Grid>
                                  )}

                                  {showOtherRecipient && (
                                    <Grid item xs={12} md={12}>
                                      <TextField
                                        fullWidth
                                        label="Nama Penerima Lainnya"
                                        name={`items.${index}.nm_penerima`}
                                        value={item.nm_penerima || ''}
                                        onChange={handleChange}
                                        placeholder="Nama penerima dana"
                                        helperText="Wajib diisi manual karena penerima bukan pemasok/karyawan"
                                      />
                                    </Grid>
                                  )}

                                  {showBankFields && (
                                    <>
                                      {usePemasokRekening ? (
                                        <>
                                          <Grid item xs={12} md={12}>
                                            <OptionPemasokRekening
                                              pemasokId={item.pemasok_id}
                                              value={{
                                                nm_bank: item.nm_bank,
                                                no_rekening: item.no_rekening
                                              }}
                                              label="Rekening Pemasok"
                                              bankField={`items.${index}.nm_bank`}
                                              noRekeningField={`items.${index}.no_rekening`}
                                              anRekeningField={`items.${index}.an_rekening`}
                                              setFieldValue={setFieldValue}
                                              disabled={isSubmitting}
                                            />
                                          </Grid>
                                          <Grid item xs={12} md={4}>
                                            <TextField fullWidth label="Bank" name={`items.${index}.nm_bank`} value={item.nm_bank || ''} InputProps={{ readOnly: true }} helperText="Terisi dari rekening pemasok" />
                                          </Grid>
                                          <Grid item xs={12} md={4}>
                                            <TextField fullWidth label="No Rekening" name={`items.${index}.no_rekening`} value={item.no_rekening || ''} InputProps={{ readOnly: true }} helperText="Terisi dari rekening pemasok" />
                                          </Grid>
                                          <Grid item xs={12} md={4}>
                                            <TextField fullWidth label="Atas Nama Rekening" name={`items.${index}.an_rekening`} value={item.an_rekening || ''} InputProps={{ readOnly: true }} helperText="Terisi dari rekening pemasok" />
                                          </Grid>
                                        </>
                                      ) : showSupplier && !item.pemasok_id ? (
                                        <Grid item xs={12}>
                                          <Alert severity="info">Pilih pemasok terlebih dahulu untuk menampilkan rekening bank aktif.</Alert>
                                        </Grid>
                                      ) : (
                                        <>
                                          <Grid item xs={12} md={4}>
                                            <OptionBank
                                              value={item.nm_bank || ''}
                                              name={`items.${index}.nm_bank`}
                                              label="Bank"
                                              setFieldValue={setFieldValue}
                                              disabled={isSubmitting}
                                              extraOptions={item.nm_bank ? [item.nm_bank] : []}
                                              helperText={
                                                useKaryawanBankDefaults
                                                  ? 'Default dari karyawan, bisa diganti'
                                                  : showOtherRecipient
                                                    ? 'Pilih bank penerima secara manual'
                                                    : ''
                                              }
                                            />
                                          </Grid>
                                          <Grid item xs={12} md={4}>
                                            <TextField
                                              fullWidth
                                              label="No Rekening"
                                              name={`items.${index}.no_rekening`}
                                              value={item.no_rekening || ''}
                                              onChange={handleChange}
                                              helperText={
                                                useKaryawanBankDefaults
                                                  ? 'Default dari karyawan, bisa diganti'
                                                  : showOtherRecipient
                                                    ? 'Input manual nomor rekening'
                                                    : ' '
                                              }
                                            />
                                          </Grid>
                                          <Grid item xs={12} md={4}>
                                            <TextField
                                              fullWidth
                                              label="Atas Nama Rekening"
                                              name={`items.${index}.an_rekening`}
                                              value={item.an_rekening || ''}
                                              onChange={handleChange}
                                              helperText={
                                                useKaryawanBankDefaults
                                                  ? 'Default dari karyawan, bisa diganti'
                                                  : showOtherRecipient
                                                    ? 'Input manual nama pemilik rekening'
                                                    : ' '
                                              }
                                            />
                                          </Grid>
                                        </>
                                      )}
                                    </>
                                  )}
                                </FieldGroup>
                              </Stack>
                            </AccordionDetails>
                          </Accordion>
                        );
                      })}
                    </Stack>
                  </SectionCard>
                )}
              </FieldArray>
            </Stack>
          </Grid>

          <Grid item xs={12} lg={3.5}>
            <Stack spacing={2} sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: `linear-gradient(160deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.background.paper, 1)} 55%)`
                }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Ringkasan Pengajuan
                    </Typography>
                    <Typography variant="h4" fontWeight={800} color="primary.main">
                      {formatCurrency(totals.grandtotal)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total final termasuk PPN
                    </Typography>
                  </Box>

                  <Divider />

                  <Stack spacing={1.25}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Jumlah Item
                      </Typography>
                      <Typography variant="subtitle2">{values.items.length}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Subtotal
                      </Typography>
                      <Typography variant="subtitle2">{formatCurrency(totals.subtotal)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Total PPN
                      </Typography>
                      <Typography variant="subtitle2">{formatCurrency(totals.ppnRp)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Lampiran
                      </Typography>
                      <Typography variant="subtitle2">{values.lampiran?.length || 0} file</Typography>
                    </Stack>
                  </Stack>

                  <Divider />

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Distribusi Prioritas
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                      <Chip size="small" color="error" variant={prioritySummary.P1 ? 'filled' : 'outlined'} label={`P1: ${prioritySummary.P1}`} />
                      <Chip size="small" color="warning" variant={prioritySummary.P2 ? 'filled' : 'outlined'} label={`P2: ${prioritySummary.P2}`} />
                      <Chip size="small" variant={prioritySummary.P3 ? 'filled' : 'outlined'} label={`P3: ${prioritySummary.P3}`} />
                    </Stack>
                  </Box>

                  <Alert severity="info" icon={<InfoCircle size={16} />} sx={{ py: 0.5 }}>
                    Pastikan COA dan nilai tiap item sudah sesuai sebelum dikirim ke approval.
                  </Alert>

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={isSubmitting || !canSubmit}
                  >
                    {isSubmitting ? 'Menyimpan...' : isEdit ? 'Update Pengajuan' : 'Simpan Pengajuan'}
                  </Button>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Checklist Cepat</Typography>
                  <Typography variant="caption" color={values.bisnis_id ? 'success.main' : 'text.secondary'}>
                    {values.bisnis_id ? '✓' : '•'} Bisnis unit terisi
                  </Typography>
                  <Typography variant="caption" color={values.cabang_id ? 'success.main' : 'text.secondary'}>
                    {values.cabang_id ? '✓' : '•'} Cabang terisi
                  </Typography>
                  <Typography variant="caption" color={values.narasi ? 'success.main' : 'text.secondary'}>
                    {values.narasi ? '✓' : '•'} Narasi dokumen terisi
                  </Typography>
                  <Typography variant="caption" color={values.items.every((item) => item.coa_id) ? 'success.main' : 'text.secondary'}>
                    {values.items.every((item) => item.coa_id) ? '✓' : '•'} Semua item punya COA
                  </Typography>
                  <Typography variant="caption" color={totals.grandtotal > 0 ? 'success.main' : 'text.secondary'}>
                    {totals.grandtotal > 0 ? '✓' : '•'} Total pengajuan &gt; 0
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </FormikProvider>
  );
}
