'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Checkbox, Divider, FormControlLabel, Grid, InputAdornment, MenuItem, Stack, TextField as MuiTextField, Typography } from '@mui/material';
import { Business, CalendarToday, Category, Description, DirectionsCar, HomeWork, LocationOn, Numbers, Payments, Public, ReceiptLong, Straighten, TextFields, Tune } from '@mui/icons-material';
import { Add, Building3, Location, Trash } from 'iconsax-react';

import { createAssetPurchase, getAssetErrorMessage, updateAssetPurchase, useAssetPurchase, useAssetPurchases } from 'api/asset-purchases';
import { openNotification } from 'api/notification';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import LoadingScreen from 'components/screens/LoadingScreen';
import ErrorScreen from 'components/screens/ErrorScreen';
import OptionBisnisUnitBase from 'components/OptionBisnisUnit';
import OptionCabangBase from 'components/OptionCabang';
import { APP_DEFAULT_PATH } from 'config';
import { ASSET_CONDITIONS, ASSET_TYPES, CURRENCIES, FINANCING_TYPES, OWNERSHIP_SCHEMES, humanize } from './presentation';

const dueDiligenceChecks = [
  ['certificate_valid', 'Sertifikat valid'], ['owner_matches_seller', 'Pemilik sesuai penjual'], ['dispute_free', 'Bebas sengketa'],
  ['seizure_free', 'Bebas sita'], ['mortgage_checked', 'Hak tanggungan diperiksa'], ['area_boundary_matches', 'Luas dan batas sesuai'],
  ['zoning_compliant', 'Zoning sesuai'], ['pbb_clear', 'PBB tidak tertunggak'], ['building_permits_checked', 'Izin bangunan diperiksa'],
  ['occupancy_checked', 'Penghuni/penyewa diperiksa'], ['physical_condition_checked', 'Kondisi fisik dan utilitas diperiksa']
];
const emptyDueDiligence = Object.fromEntries(dueDiligenceChecks.map(([name]) => [name, false]));
const CATEGORY_CODES = [
  ['VEHICLE_CAR', 'Kendaraan - Mobil'], ['VEHICLE_TRUCK', 'Kendaraan - Truk'], ['VEHICLE_MOTORCYCLE', 'Kendaraan - Motor'],
  ['HEAVY_EQUIPMENT', 'Alat berat'], ['MINING_EQUIPMENT', 'Peralatan tambang'], ['PRODUCTION_EQUIPMENT', 'Peralatan produksi'],
  ['IT_HARDWARE', 'Perangkat IT'], ['IT_NETWORK', 'Perangkat jaringan'], ['OFFICE_EQUIPMENT', 'Peralatan kantor'],
  ['OFFICE_FURNITURE', 'Furnitur kantor'], ['LAND', 'Tanah'], ['BUILDING', 'Bangunan'],
  ['WAREHOUSE', 'Gudang'], ['SAFETY_EQUIPMENT', 'Peralatan keselamatan'], ['OTHER', 'Lainnya']
].map(([value, label]) => ({ value, label }));
const emptyPropertyDetails = { property_use: '', address: '', province: '', city: '', district: '', village: '', postal_code: '', land_area_m2: '', building_area_m2: '', occupancy_status: '', current_owner_name: '', certificate_type: '', certificate_number: '', certificate_holder: '', certificate_issue_date: '', certificate_expiry_date: '', pbb_nop: '', pbb_year: '', imb_pbg_number: '', slf_number: '', ppjb_number: '', ajb_number: '', appraisal_value: '', appraisal_date: '', land_value: '', building_value: '', allocation_method: '', title_custody_status: '', due_diligence_status: 'PENDING', due_diligence: { ...emptyDueDiligence, notes: '' } };
const emptyItem = { description: '', asset_condition: 'NEW', quantity: 1, estimated_unit_price: '', brand: '', model: '', manufacture_year: '', requires_inspection: false, requires_equipment_record: false, property_type: '', property_details: { ...emptyPropertyDetails, due_diligence: { ...emptyPropertyDetails.due_diligence } } };
const initialForm = { document_date: '', requesting_business_id: '', requesting_branch_id: '', legal_owner_business_id: '', paying_business_id: '', operational_user_business_id: '', operational_site_id: '', asset_type: 'VEHICLE', category_code: '', financing_type: 'CASH', ownership_scheme: 'COMPANY_OWNED', currency_code: 'IDR', exchange_rate: '1', budget_reference: '', purpose: '', items: [{ ...emptyItem }] };

const toForm = (row) => row ? { ...initialForm, ...row, currency_code: row.currency_code || 'IDR', document_date: String(row.document_date || '').slice(0, 10), items: (row.items || []).map((item) => ({ ...emptyItem, ...item, property_details: { ...emptyPropertyDetails, ...(item.property_details || {}), due_diligence: { ...emptyPropertyDetails.due_diligence, ...(item.property_details?.due_diligence || {}) } } })) } : initialForm;

const OptionBisnisUnit = (props) => <OptionBisnisUnitBase {...props} startAdornment={<Building3 size={18} />} />;
const OptionCabang = (props) => <OptionCabangBase {...props} startAdornment={<Location size={18} />} />;

const fieldIcons = [
  [/tanggal|date|terbit|berlaku|appraisal/i, CalendarToday],
  [/bisnis|perusahaan|owner|pengguna|pemilik|pemegang/i, Business],
  [/cabang|alamat|provinsi|kota|kecamatan|kelurahan|site|lokasi/i, LocationOn],
  [/properti|bangunan|tanah|rumah|warehouse|office/i, HomeWork],
  [/jenis aset|kategori|jenis properti|kondisi/i, Category],
  [/deskripsi|tujuan(?! penggunaan)|catatan|referensi|nomor|kode|id /i, Description],
  [/quantity|tahun|nop|luas|area|kode pos/i, Numbers],
  [/kurs|nilai|harga|alokasi|mata uang|pembiayaan|budget/i, Payments],
  [/kepemilikan|penguasaan|sertifikat|pbb|imb|slf|ppjb|ajb/i, ReceiptLong],
  [/kendaraan|vehicle|merek|model/i, DirectionsCar],
  [/lokasi|dunia|zoning/i, Public],
  [/luas|ukuran/i, Straighten],
  [/status|skema|metode|tujuan penggunaan/i, Tune]
];

function getFieldIcon(label = '') {
  const Icon = fieldIcons.find(([pattern]) => pattern.test(label))?.[1] || TextFields;
  return <Icon sx={{ fontSize: 18 }} />;
}

function TextField({ multiline = false, InputProps, label, placeholder, children, select = false, ...props }) {
  const isCategory = label === 'Kode kategori';
  const categoryOptions = props.value && !CATEGORY_CODES.some((option) => option.value === props.value)
    ? [{ value: props.value, label: `${props.value} (tersimpan)` }, ...CATEGORY_CODES]
    : CATEGORY_CODES;

  return <MuiTextField {...props} label={label} select={select || isCategory} placeholder={placeholder} multiline={multiline} InputProps={multiline ? InputProps : { ...InputProps, startAdornment: <InputAdornment position="start">{getFieldIcon(label)}</InputAdornment> }}>
    {isCategory ? categoryOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>) : children}
  </MuiTextField>;
}

function SelectField({ label, value, options, onChange, required = true }) {
  return <TextField select fullWidth required={required} label={label} value={value ?? ''} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <MenuItem key={option.value ?? option.id} value={option.value ?? option.id}>{option.label ?? option.nama ?? option.name ?? option.kode ?? option.id}</MenuItem>)}</TextField>;
}

export default function AssetPurchaseForm({ id = null }) {
  const router = useRouter();
  const isEdit = Boolean(id);
  const detail = useAssetPurchase(id, isEdit);
  const access = useAssetPurchases({ page: 1, per_page: 1 }, !isEdit);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!isEdit && !form.document_date) setForm((current) => ({ ...current, document_date: new Date().toISOString().slice(0, 10) })); }, [isEdit]);
  useEffect(() => { if (detail.row) setForm(toForm(detail.row)); }, [detail.row]);

  const permissions = isEdit ? detail.permissions : access.permissions;
  const allowed = isEdit ? permissions.can_update : permissions.can_insert;
  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const updateItem = (index, name, value) => setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [name]: value } : item) }));
  const updateProperty = (index, name, value) => setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, property_details: { ...item.property_details, [name]: value } } : item) }));
  const updateDueDiligence = (index, name, value) => setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, property_details: { ...item.property_details, due_diligence: { ...item.property_details.due_diligence, [name]: value } } } : item) }));
  const setFieldValue = (field, value) => setForm((current) => {
    if (field === 'requesting_business_id') return { ...current, requesting_business_id: value, requesting_branch_id: '' };
    return { ...current, [field]: value };
  });

  const submit = async (event) => {
    event.preventDefault();
    if (!form.items.length) return;
    setSaving(true);
    const payload = { ...form, estimated_amount: form.items.reduce((total, item) => total + Number(item.quantity || 0) * Number(item.estimated_unit_price || 0), 0).toFixed(2), items: form.items.map((item) => ({ ...item, asset_type: form.asset_type, category_code: form.category_code, quantity: Number(item.quantity), estimated_unit_price: String(item.estimated_unit_price), estimated_total: (Number(item.quantity) * Number(item.estimated_unit_price)).toFixed(2), manufacture_year: item.manufacture_year ? Number(item.manufacture_year) : null, property_type: form.asset_type === 'PROPERTY' ? item.property_type : null, property_details: form.asset_type === 'PROPERTY' ? Object.fromEntries(Object.entries(item.property_details).map(([key, value]) => [key, value === '' ? null : value])) : null })) };
    try {
      const response = isEdit ? await updateAssetPurchase(id, payload, detail.row?.version) : await createAssetPurchase(payload);
      const saved = response?.rows || response?.data?.rows || response?.data || response;
      openNotification({ open: true, title: 'success', message: `Pengajuan berhasil ${isEdit ? 'diperbarui' : 'dibuat'}`, alert: { color: 'success' } });
      router.push(`/asset-purchases/${saved?.id || id}`);
    } catch (error) {
      openNotification({ open: true, title: 'error', message: getAssetErrorMessage(error, 'Pengajuan gagal disimpan'), alert: { color: 'error' } });
    } finally { setSaving(false); }
  };

  if ((isEdit && detail.loading) || (!isEdit && access.loading)) return <LoadingScreen fullScreen={false} message="Memuat form pembelian aset" />;
  if ((isEdit && detail.error) || (!isEdit && access.error)) return <ErrorScreen error={detail.error || access.error} variant="data" showDetails={false} />;
  if (!allowed) return <ErrorScreen error={{ message: 'Anda tidak memiliki hak akses untuk menyimpan pengajuan pembelian aset.' }} variant="data" showDetails={false} />;

  return <>
    <Breadcrumbs custom heading={isEdit ? 'Edit Pembelian Aset' : 'Pengajuan Pembelian Aset'} links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Pembelian Aset', to: '/asset-purchases' }, { title: isEdit ? 'Edit' : 'Create' }]} />
    <MainCard title={isEdit ? detail.row?.document_number : 'Pengajuan baru'}>
      <Box component="form" onSubmit={submit}><Stack spacing={3}>
        {isEdit && !['DRAFT', 'RETURNED'].includes(detail.row?.status) && <Alert severity="warning">Backend akan menolak perubahan material jika workflow sudah dikunci.</Alert>}
        <Box><Typography variant="h5">Identitas dan organisasi</Typography><Typography color="text.secondary" variant="body2">Empat dimensi organisasi disimpan sebagai snapshot saat submit.</Typography></Box>
        <Grid container spacing={2}><Grid item xs={12} md={4}><TextField type="date" fullWidth required label="Tanggal dokumen" InputLabelProps={{ shrink: true }} value={form.document_date} onChange={(e) => update('document_date', e.target.value)} /></Grid><Grid item xs={12} md={4}><OptionBisnisUnit value={form.requesting_business_id} name="requesting_business_id" label="Bisnis pemohon" setFieldValue={setFieldValue} disabled={saving} /></Grid><Grid item xs={12} md={4}><OptionBisnisUnit value={form.legal_owner_business_id} name="legal_owner_business_id" label="Legal owner" setFieldValue={setFieldValue} disabled={saving} /></Grid><Grid item xs={12} md={4}><OptionBisnisUnit value={form.paying_business_id} name="paying_business_id" label="Perusahaan pembayar" setFieldValue={setFieldValue} disabled={saving} /></Grid><Grid item xs={12} md={4}><OptionBisnisUnit value={form.operational_user_business_id} name="operational_user_business_id" label="Pengguna operasional" setFieldValue={setFieldValue} disabled={saving} /></Grid><Grid item xs={12} md={4}><OptionCabang value={form.requesting_branch_id} bisnisId={form.requesting_business_id} name="requesting_branch_id" label="Cabang pemohon" setFieldValue={setFieldValue} disabled={saving || !form.requesting_business_id} /></Grid><Grid item xs={12} md={4}><TextField fullWidth label="ID site operasional" value={form.operational_site_id} onChange={(e) => update('operational_site_id', e.target.value)} /></Grid></Grid>
        <Divider />
        <Box><Typography variant="h5">Klasifikasi transaksi</Typography></Box>
        <Grid container spacing={2}><Grid item xs={12} md={3}><SelectField label="Jenis aset" value={form.asset_type} options={ASSET_TYPES.map((value) => ({ value, label: humanize(value) }))} onChange={(value) => update('asset_type', value)} /></Grid><Grid item xs={12} md={3}><TextField fullWidth required label="Kode kategori" value={form.category_code} onChange={(e) => update('category_code', e.target.value)} /></Grid><Grid item xs={12} md={3}><SelectField label="Skema pembiayaan" value={form.financing_type} options={FINANCING_TYPES.map((value) => ({ value, label: humanize(value) }))} onChange={(value) => update('financing_type', value)} /></Grid><Grid item xs={12} md={3}><SelectField label="Kepemilikan" value={form.ownership_scheme} options={OWNERSHIP_SCHEMES.map((value) => ({ value, label: humanize(value) }))} onChange={(value) => update('ownership_scheme', value)} /></Grid><Grid item xs={6} md={2}><SelectField label="Mata uang" value={form.currency_code} options={CURRENCIES.map((c) => ({ value: c, label: c }))} onChange={(value) => update('currency_code', value)} /></Grid><Grid item xs={6} md={2}><TextField fullWidth required type="number" label="Kurs" value={form.exchange_rate} onChange={(e) => update('exchange_rate', e.target.value)} /></Grid><Grid item xs={12} md={4}><TextField fullWidth label="Referensi budget" value={form.budget_reference} onChange={(e) => update('budget_reference', e.target.value)} /></Grid><Grid item xs={12}><TextField fullWidth required multiline minRows={3} label="Tujuan dan justifikasi" value={form.purpose} onChange={(e) => update('purpose', e.target.value)} /></Grid></Grid>
        <Divider />
        <Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography variant="h5">Item aset</Typography><Typography variant="body2" color="text.secondary">Setiap quantity akan menghasilkan unit aset individual.</Typography></Box><Button startIcon={<Add />} onClick={() => setForm({ ...form, items: [...form.items, { ...emptyItem }] })}>Tambah item</Button></Stack>
        {form.items.map((item, index) => <Box key={item.id || index} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}><Stack spacing={2}><Stack direction="row" justifyContent="space-between"><Typography fontWeight={700}>Item {index + 1}</Typography><Button color="error" startIcon={<Trash size={16} />} disabled={form.items.length === 1} onClick={() => setForm({ ...form, items: form.items.filter((_, itemIndex) => itemIndex !== index) })}>Hapus</Button></Stack><Grid container spacing={2}><Grid item xs={12} md={6}><TextField fullWidth required label="Deskripsi" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} /></Grid><Grid item xs={6} md={2}><SelectField label="Kondisi" value={item.asset_condition} options={ASSET_CONDITIONS.map((value) => ({ value, label: humanize(value) }))} onChange={(value) => updateItem(index, 'asset_condition', value)} /></Grid><Grid item xs={6} md={2}><TextField fullWidth required type="number" inputProps={{ min: 1 }} label="Quantity" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} /></Grid><Grid item xs={12} md={2}><TextField fullWidth required type="number" inputProps={{ min: 0 }} label="Estimasi/unit" value={item.estimated_unit_price} onChange={(e) => updateItem(index, 'estimated_unit_price', e.target.value)} /></Grid>{form.asset_type !== 'PROPERTY' && <><Grid item xs={6} md={3}><TextField fullWidth label="Merek" value={item.brand} onChange={(e) => updateItem(index, 'brand', e.target.value)} /></Grid><Grid item xs={6} md={3}><TextField fullWidth label="Model" value={item.model} onChange={(e) => updateItem(index, 'model', e.target.value)} /></Grid><Grid item xs={12} md={3}><TextField fullWidth type="number" label="Tahun pembuatan" value={item.manufacture_year} onChange={(e) => updateItem(index, 'manufacture_year', e.target.value)} /></Grid></>}</Grid>
        {form.asset_type === 'PROPERTY' && <><Divider /><Typography variant="h6">Detail properti siap pakai</Typography><Grid container spacing={2}><Grid item xs={12} md={4}><SelectField label="Jenis properti" value={item.property_type} options={['LAND', 'BUILDING', 'LAND_AND_BUILDING', 'WAREHOUSE', 'OFFICE', 'HOUSE_MESS', 'COMMERCIAL_UNIT', 'OTHER'].map((value) => ({ value, label: humanize(value) }))} onChange={(value) => updateItem(index, 'property_type', value)} /></Grid><Grid item xs={12} md={4}><SelectField label="Tujuan penggunaan" value={item.property_details.property_use} options={['OWNER_OCCUPIED', 'INVESTMENT_PROPERTY', 'FOR_RESALE', 'EMPLOYEE_FACILITY'].map((value) => ({ value, label: humanize(value) }))} onChange={(value) => updateProperty(index, 'property_use', value)} /></Grid><Grid item xs={12} md={4}><TextField fullWidth required label="Status penguasaan" value={item.property_details.occupancy_status} onChange={(e) => updateProperty(index, 'occupancy_status', e.target.value)} /></Grid><Grid item xs={12}><TextField fullWidth required multiline minRows={2} label="Alamat" value={item.property_details.address} onChange={(e) => updateProperty(index, 'address', e.target.value)} /></Grid>{[['province', 'Provinsi'], ['city', 'Kota/Kabupaten'], ['district', 'Kecamatan'], ['village', 'Kelurahan/Desa'], ['postal_code', 'Kode pos']].map(([name, label]) => <Grid item xs={6} md={2.4} key={name}><TextField fullWidth label={label} value={item.property_details[name]} onChange={(e) => updateProperty(index, name, e.target.value)} /></Grid>)}<Grid item xs={6} md={3}><TextField fullWidth required={['LAND', 'LAND_AND_BUILDING'].includes(item.property_type)} type="number" label="Luas tanah (m2)" value={item.property_details.land_area_m2} onChange={(e) => updateProperty(index, 'land_area_m2', e.target.value)} /></Grid><Grid item xs={6} md={3}><TextField fullWidth required={item.property_type && item.property_type !== 'LAND'} type="number" label="Luas bangunan (m2)" value={item.property_details.building_area_m2} onChange={(e) => updateProperty(index, 'building_area_m2', e.target.value)} /></Grid></Grid><Typography variant="subtitle1" fontWeight={700}>Sertifikat dan appraisal</Typography><Grid container spacing={2}>{[['current_owner_name', 'Pemilik saat ini'], ['certificate_type', 'Jenis sertifikat'], ['certificate_number', 'Nomor sertifikat'], ['certificate_holder', 'Nama pemegang sertifikat'], ['title_custody_status', 'Status penyimpanan sertifikat']].map(([name, label]) => <Grid item xs={12} md={4} key={name}><TextField fullWidth required label={label} value={item.property_details[name]} onChange={(e) => updateProperty(index, name, e.target.value)} /></Grid>)}{[['certificate_issue_date', 'Tanggal terbit sertifikat'], ['certificate_expiry_date', 'Masa berlaku sertifikat'], ['appraisal_date', 'Tanggal appraisal']].map(([name, label]) => <Grid item xs={12} md={4} key={name}><TextField fullWidth required={name === 'appraisal_date'} type="date" label={label} InputLabelProps={{ shrink: true }} value={item.property_details[name]} onChange={(e) => updateProperty(index, name, e.target.value)} /></Grid>)}<Grid item xs={12} md={4}><TextField fullWidth required type="number" label="Nilai appraisal" value={item.property_details.appraisal_value} onChange={(e) => updateProperty(index, 'appraisal_value', e.target.value)} /></Grid>{item.property_type === 'LAND_AND_BUILDING' && <><Grid item xs={12} md={4}><TextField fullWidth required type="number" label="Alokasi nilai tanah" value={item.property_details.land_value} onChange={(e) => updateProperty(index, 'land_value', e.target.value)} /></Grid><Grid item xs={12} md={4}><TextField fullWidth required type="number" label="Alokasi nilai bangunan" value={item.property_details.building_value} onChange={(e) => updateProperty(index, 'building_value', e.target.value)} /></Grid><Grid item xs={12} md={4}><SelectField label="Metode alokasi" value={item.property_details.allocation_method} options={['CONTRACT', 'APPRAISAL', 'TAX_ASSESSMENT', 'MANUAL_APPROVED'].map((value) => ({ value, label: humanize(value) }))} onChange={(value) => updateProperty(index, 'allocation_method', value)} /></Grid></>}{[['pbb_nop', 'NOP PBB'], ['imb_pbg_number', 'Nomor IMB/PBG'], ['slf_number', 'Nomor SLF'], ['ppjb_number', 'Nomor PPJB'], ['ajb_number', 'Nomor AJB']].map(([name, label]) => <Grid item xs={12} md={4} key={name}><TextField fullWidth label={label} value={item.property_details[name]} onChange={(e) => updateProperty(index, name, e.target.value)} /></Grid>)}</Grid><Typography variant="subtitle1" fontWeight={700}>Due diligence minimum</Typography><Grid container spacing={1}>{dueDiligenceChecks.map(([name, label]) => <Grid item xs={12} sm={6} md={4} key={name}><FormControlLabel control={<Checkbox checked={Boolean(item.property_details.due_diligence[name])} onChange={(e) => updateDueDiligence(index, name, e.target.checked)} />} label={label} /></Grid>)}<Grid item xs={12} md={4}><SelectField label="Hasil due diligence" value={item.property_details.due_diligence_status} options={['PENDING', 'PASSED', 'PASSED_WITH_CONDITIONS', 'FAILED'].map((value) => ({ value, label: humanize(value) }))} onChange={(value) => updateProperty(index, 'due_diligence_status', value)} /></Grid><Grid item xs={12} md={8}><TextField fullWidth multiline minRows={2} label="Catatan due diligence" value={item.property_details.due_diligence.notes} onChange={(e) => updateDueDiligence(index, 'notes', e.target.value)} /></Grid></Grid></>}
        </Stack></Box>)}
        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} justifyContent="flex-end" spacing={1}><Button onClick={() => router.push(isEdit ? `/asset-purchases/${id}` : '/asset-purchases')} disabled={saving}>Batal</Button><Button type="submit" variant="contained" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan draft'}</Button></Stack>
      </Stack></Box>
    </MainCard>
  </>;
}
