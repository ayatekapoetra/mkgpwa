'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Divider, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';

import { assetEndpoints, assetMutation, getAssetErrorMessage, saveAssetResource, useAssetDetail, useAssetList } from 'api/asset-purchases';
import { usePurchaseOrderBisnis } from 'api/purchase-orders';
import { openNotification } from 'api/notification';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import LoadingScreen from 'components/screens/LoadingScreen';
import ErrorScreen from 'components/screens/ErrorScreen';
import { APP_DEFAULT_PATH } from 'config';
import { ASSET_TYPES, FINANCING_TYPES, humanize } from './presentation';

const OPTIONAL_FIELDS = ['max_amount', 'effective_to', 'fee_expense_account_source_id', 'current_liability_account_source_id', 'debit_account_source_id', 'contract_id', 'payment_instruction_id', 'notes', 'brand', 'model', 'manufacture_year', 'requesting_branch_id', 'operational_site_id', 'budget_reference'];

function isRequired(name) {
  return !OPTIONAL_FIELDS.includes(name);
}

export const resourceFieldDefinitions = {
  offers: {
    title: 'Penawaran Vendor',
    parentBase: (purchaseId) => `/asset-purchases/${purchaseId}`,
    createEndpoint: (purchaseId) => `${assetEndpoints.purchase(purchaseId)}/vendor-offers`,
    updateEndpoint: (purchaseId, rowId) => `${assetEndpoints.purchase(purchaseId)}/vendor-offers/${rowId}`,
    detailEndpoint: (purchaseId) => `${assetEndpoints.purchase(purchaseId)}/vendor-offers`,
    fields: [
      ['vendor_id', 'ID vendor', 'text'], ['offer_number', 'Nomor penawaran', 'text'], ['offer_date', 'Tanggal penawaran', 'date'],
      ['valid_until', 'Berlaku sampai', 'date'], ['currency_code', 'Mata uang', 'text'], ['gross_amount', 'Nilai bruto', 'number'],
      ['discount_amount', 'Diskon', 'number'], ['tax_amount', 'Pajak', 'number'], ['other_cost_amount', 'Biaya lain', 'number'],
      ['payment_terms', 'Termin pembayaran', 'text'], ['delivery_terms', 'Termin pengiriman', 'text'], ['warranty_terms', 'Garansi', 'text']
    ]
  },
  financing: {
    title: 'Proposal Pembiayaan',
    parentBase: (purchaseId) => `/asset-purchases/${purchaseId}`,
    createEndpoint: (purchaseId) => `${assetEndpoints.purchase(purchaseId)}/financing-proposals`,
    updateEndpoint: (purchaseId, rowId) => `${assetEndpoints.purchase(purchaseId)}/financing-proposals/${rowId}`,
    detailEndpoint: (purchaseId) => `${assetEndpoints.purchase(purchaseId)}/financing-proposals`,
    fields: [
      ['financing_provider_id', 'ID provider', 'text'], ['financing_product_id', 'ID produk', 'text'],
      ['proposal_number', 'Nomor proposal', 'text'], ['proposal_date', 'Tanggal proposal', 'date'],
      ['valid_until', 'Berlaku sampai', 'date'], ['asset_price', 'Harga aset', 'number'],
      ['down_payment_amount', 'Down payment', 'number'], ['financed_principal', 'Pokok pembiayaan', 'number'],
      ['tenor_months', 'Tenor (bulan)', 'number'], ['interest_method', 'Metode bunga', 'select', ['FLAT', 'EFFECTIVE', 'ANNUITY', 'CUSTOM_SCHEDULE']],
      ['interest_rate', 'Bunga (%)', 'number'], ['installment_amount', 'Nilai angsuran', 'number'],
      ['balloon_payment_amount', 'Balloon payment', 'number'], ['administration_fee', 'Fee administrasi', 'number'],
      ['provision_fee', 'Provision fee', 'number'], ['insurance_amount', 'Asuransi', 'number'],
      ['fiduciary_notary_fee', 'Fee fiduciari/notaris', 'number'], ['other_fee', 'Biaya lain', 'number']
    ]
  },
  receipts: {
    title: 'Penerimaan Aset',
    parentBase: (purchaseId) => `/asset-purchases/${purchaseId}`,
    createEndpoint: (purchaseId) => `${assetEndpoints.purchase(purchaseId)}/receipts`,
    updateEndpoint: (purchaseId, rowId) => `${assetEndpoints.purchase(purchaseId)}/receipts/${rowId}`,
    detailEndpoint: (purchaseId) => `${assetEndpoints.purchase(purchaseId)}/receipts`,
    fields: [
      ['receipt_number', 'Nomor penerimaan', 'text'], ['receipt_date', 'Tanggal terima', 'date'],
      ['handover_number', 'Nomor BAST', 'text'], ['handover_date', 'Tanggal BAST', 'date'],
      ['location_business_id', 'ID bisnis lokasi', 'text'], ['location_branch_id', 'ID cabang lokasi', 'text'],
      ['quantity_received', 'Quantity diterima', 'number'], ['quantity_accepted', 'Quantity diterima (accepted)', 'number'],
      ['quantity_rejected', 'Quantity ditolak', 'number'], ['notes', 'Catatan', 'text']
    ]
  },
  contracts: {
    title: 'Kontrak Pembiayaan',
    parentBase: (purchaseId) => `/asset-purchases/${purchaseId}`,
    createEndpoint: (purchaseId) => `${assetEndpoints.purchase(purchaseId)}/contracts`,
    updateEndpoint: null,
    detailEndpoint: null,
    fields: [
      ['contract_number', 'Nomor kontrak', 'text'], ['financing_provider_id', 'ID provider', 'text'],
      ['financing_type', 'Skema pembiayaan', 'select', FINANCING_TYPES], ['ownership_scheme', 'Kepemilikan', 'select', ['COMPANY_OWNED', 'SGU']],
      ['legal_owner_type', 'Tipe legal owner', 'select', ['COMPANY', 'FINANCING_PROVIDER']],
      ['legal_owner_business_id', 'ID bisnis legal owner', 'text'], ['paying_business_id', 'ID perusahaan pembayar', 'text'],
      ['operational_user_business_id', 'ID pengguna operasional', 'text'], ['currency_code', 'Mata uang', 'text'],
      ['asset_price', 'Harga aset', 'number'], ['down_payment_amount', 'Down payment', 'number'],
      ['principal_amount', 'Pokok pembiayaan', 'number'], ['interest_method', 'Metode bunga', 'select', ['FLAT', 'EFFECTIVE', 'ANNUITY', 'CUSTOM_SCHEDULE']],
      ['interest_rate', 'Bunga (%)', 'number'], ['tenor_months', 'Tenor (bulan)', 'number'],
      ['start_date', 'Tanggal mulai', 'date'], ['maturity_date', 'Jatuh tempo', 'date'],
      ['buyout_amount', 'Nilai buyout', 'number'], ['finance_pic_user_id', 'ID PIC finance', 'text'],
      ['liability_account_source_id', 'ID akun liabilitas', 'text'],
      ['interest_expense_account_source_id', 'ID akun beban bunga', 'text'],
      ['fee_expense_account_source_id', 'ID akun beban biaya (opsional)', 'text'],
      ['current_liability_account_source_id', 'ID akun liabilitas lancar (opsional)', 'text']
    ]
  },
  payments: {
    title: 'Instruksi Pembayaran',
    parentBase: () => '/asset-payment-instructions',
    createEndpoint: () => assetEndpoints.payments,
    updateEndpoint: null,
    detailEndpoint: null,
    fields: [
      ['asset_purchase_id', 'ID pengajuan', 'text'], ['contract_id', 'ID kontrak', 'text'],
      ['company_wallet_id', 'ID wallet/rekening sumber', 'text'], ['debit_account_source_id', 'ID akun debit (tanpa kontrak)', 'text'],
      ['payee_type', 'Jenis penerima', 'select', ['VENDOR', 'FINANCING_PROVIDER', 'NOTARY', 'BROKER', 'TAX_AUTHORITY', 'APPRAISER', 'INSURANCE_PROVIDER', 'OTHER']],
      ['payee_source_id', 'ID penerima', 'text'], ['payee_name_snapshot', 'Nama penerima', 'text'],
      ['payment_purpose', 'Tujuan pembayaran', 'select', ['BOOKING_FEE', 'DOWN_PAYMENT', 'INSTALLMENT', 'EARLY_SETTLEMENT', 'BUYOUT', 'TAX', 'LEGAL_FEE', 'BROKER_FEE', 'APPRAISAL_FEE', 'INSURANCE', 'OTHER']],
      ['payment_channel', 'Kanal', 'select', ['TRANSFER', 'GIRO', 'CASH', 'VIRTUAL_ACCOUNT', 'AUTO_DEBIT', 'OTHER']],
      ['paying_business_id', 'ID perusahaan pembayar', 'text'], ['currency_code', 'Mata uang', 'text'],
      ['amount', 'Nilai', 'number'], ['due_date', 'Jatuh tempo', 'date'], ['notes', 'Catatan', 'text']
    ]
  },
  giros: {
    title: 'Giro Aset',
    parentBase: () => '/asset-giros',
    createEndpoint: () => assetEndpoints.giros,
    updateEndpoint: null,
    detailEndpoint: null,
    fields: [
      ['payment_instruction_id', 'ID instruksi pembayaran', 'text'], ['asset_purchase_id', 'ID pengajuan', 'text'],
      ['contract_id', 'ID kontrak', 'text'], ['paying_business_id', 'ID perusahaan pembayar', 'text'],
      ['purpose', 'Tujuan giro', 'select', ['PAYMENT', 'COLLATERAL']], ['company_bank_id', 'ID rekening bank sumber', 'text'],
      ['giro_number', 'Nomor giro', 'text'], ['payee_type', 'Jenis penerima', 'select', ['VENDOR', 'FINANCING_PROVIDER', 'NOTARY', 'BROKER', 'TAX_AUTHORITY', 'APPRAISER', 'INSURANCE_PROVIDER', 'OTHER']],
      ['payee_source_id', 'ID penerima', 'text'], ['payee_name_snapshot', 'Nama penerima', 'text'],
      ['currency_code', 'Mata uang', 'text'], ['amount', 'Nominal', 'number'],
      ['issue_date', 'Tanggal terbit', 'date'], ['effective_date', 'Tanggal efektif', 'date']
    ]
  }
};

export const settingsFieldDefinitions = {
  providers: {
    title: 'Pihak Pembiayaan',
    parentBase: () => '/financing-providers',
    createEndpoint: () => assetEndpoints.providers,
    updateEndpoint: (id) => assetEndpoints.provider(id),
    listEndpoint: assetEndpoints.providers,
    fields: [
      ['code', 'Kode provider', 'text'], ['name', 'Nama legal', 'text'],
      ['provider_type', 'Jenis provider', 'select', ['BANK', 'LEASING', 'MULTIFINANCE', 'COOPERATIVE', 'INTERNAL', 'OTHER']],
      ['tax_number', 'NPWP', 'text'], ['contact_name', 'Nama kontak', 'text'],
      ['contact_email', 'Email', 'email'], ['contact_phone', 'Telepon', 'text'],
      ['address', 'Alamat', 'text'], ['is_active', 'Status', 'select', ['1', '0']]
    ]
  },
  products: {
    title: 'Produk Pembiayaan',
    parentBase: () => '/financing-providers',
    createEndpoint: () => assetEndpoints.products,
    updateEndpoint: (id) => assetEndpoints.product(id),
    listEndpoint: assetEndpoints.products,
    fields: [
      ['financing_provider_id', 'ID provider', 'text'], ['code', 'Kode produk', 'text'],
      ['name', 'Nama produk', 'text'], ['financing_type', 'Skema', 'select', FINANCING_TYPES],
      ['default_tenor_months', 'Tenor default', 'number'], ['default_interest_method', 'Metode bunga', 'select', ['FLAT', 'EFFECTIVE', 'ANNUITY', 'CUSTOM_SCHEDULE']],
      ['default_interest_rate', 'Bunga default (%)', 'number'], ['is_active', 'Status', 'select', ['1', '0']]
    ]
  },
  rules: {
    title: 'Approval Rule',
    parentBase: () => '/settings/asset-approval-matrix',
    createEndpoint: () => assetEndpoints.approvalRules,
    updateEndpoint: (id) => assetEndpoints.approvalRule(id),
    listEndpoint: assetEndpoints.approvalRules,
    fields: [
      ['requesting_business_id', 'ID bisnis (* = semua)', 'text'], ['asset_type', 'Jenis aset', 'select', ['*', ...ASSET_TYPES]],
      ['category_code', 'Kategori (* = semua)', 'text'], ['financing_type', 'Skema pembiayaan', 'select', ['*', ...FINANCING_TYPES]],
      ['min_amount', 'Nilai minimum', 'number'], ['max_amount', 'Nilai maksimum (kosong = tanpa batas)', 'number'],
      ['effective_from', 'Berlaku mulai', 'date'], ['effective_to', 'Berlaku sampai', 'date'],
      ['priority', 'Prioritas', 'number'], ['required_approvals', 'Jumlah approval', 'number'],
      ['is_active', 'Status', 'select', ['1', '0']]
    ],
    validateOverlap: true
  }
};

function FormField({ name, label, type, options, value, onChange }) {
  const selectType = type === 'select';
  const inputType = selectType ? 'text' : type;
  return (
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        required={isRequired(name)}
        select={selectType}
        type={inputType}
        label={label}
        InputLabelProps={type === 'date' ? { shrink: true } : undefined}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
      >
        {options?.map((option) => (
          <MenuItem value={option} key={option}>
            {name === 'is_active' ? (option === '1' ? 'Aktif' : 'Nonaktif') : humanize(option)}
          </MenuItem>
        ))}
      </TextField>
    </Grid>
  );
}

function PaymentAllocationSection({ form, setForm }) {
  const needsAllocation = Boolean(form.contract_id);
  if (!needsAllocation) return null;
  const updateAllocation = (name, value) => setForm((current) => ({ ...current, allocations: [{ ...current.allocations[0], [name]: value }] }));
  return (
    <>
      <Grid item xs={12}><Typography variant="subtitle1" fontWeight={700}>Alokasi angsuran</Typography></Grid>
      <Grid item xs={12} md={4}><TextField fullWidth required label="ID installment" value={form.allocations[0].installment_id} onChange={(event) => updateAllocation('installment_id', event.target.value)} /></Grid>
      <Grid item xs={12} md={4}><TextField fullWidth required select label="Jenis alokasi" value={form.allocations[0].allocation_type} onChange={(event) => updateAllocation('allocation_type', event.target.value)}>{['PRINCIPAL', 'INTEREST', 'INSURANCE', 'ADMINISTRATION', 'PENALTY', 'OTHER'].map((value) => <MenuItem key={value} value={value}>{humanize(value)}</MenuItem>)}</TextField></Grid>
      <Grid item xs={12} md={4}><TextField fullWidth required type="number" label="Nilai alokasi" value={form.allocations[0].planned_amount} onChange={(event) => updateAllocation('planned_amount', event.target.value)} /></Grid>
    </>
  );
}

export default function AssetResourceForm({ definitionKey, purchaseId = null, resourceId = null, mode = 'create' }) {
  const router = useRouter();
  const definition = resourceFieldDefinitions[definitionKey] || settingsFieldDefinitions[definitionKey];
  const isEdit = mode === 'edit' && resourceId;
  const isSettings = Boolean(settingsFieldDefinitions[definitionKey]);

  const detailEndpoint = isEdit && definition.updateEndpoint
    ? (purchaseId ? definition.updateEndpoint(purchaseId, resourceId) : definition.updateEndpoint(resourceId))
    : null;
  const { row: existing, loading: detailLoading, error: detailError } = useAssetDetail(detailEndpoint, Boolean(detailEndpoint));

  const [form, setForm] = useState(() => {
    if (definitionKey === 'payments') return { currency_code: 'IDR', allocations: [{ installment_id: '', allocation_type: 'PRINCIPAL', planned_amount: '' }] };
    if (definitionKey === 'giros') return { currency_code: 'IDR' };
    if (definitionKey === 'contracts') return { financing_type: 'BANK_LOAN', ownership_scheme: 'COMPANY_OWNED', interest_method: 'FLAT' };
    return {};
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && existing) setForm({ ...existing });
  }, [isEdit, existing]);

  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const parentPath = purchaseId ? definition.parentBase(purchaseId) : definition.parentBase();

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (isSettings) {
        if (definition.validateOverlap && !isEdit) await assetMutation('post', `${assetEndpoints.approvalRules}/validate-overlap`, form);
        await saveAssetResource(definition.createEndpoint(), form, isEdit ? resourceId : null, isEdit ? existing?.version : null);
      } else if (isEdit) {
        await saveAssetResource(purchaseId ? definition.updateEndpoint(purchaseId, resourceId) : definition.updateEndpoint(resourceId), form, resourceId, existing?.version);
      } else {
        const payload = definitionKey === 'payments' ? { ...form, allocations: form.contract_id ? form.allocations : undefined } : form;
        await assetMutation('post', purchaseId ? definition.createEndpoint(purchaseId) : definition.createEndpoint(), payload);
      }
      openNotification({ open: true, title: 'success', message: `${definition.title} berhasil ${isEdit ? 'diperbarui' : 'dibuat'}`, alert: { color: 'success' } });
      router.push(parentPath);
    } catch (error) {
      openNotification({ open: true, title: 'error', message: getAssetErrorMessage(error, `${definition.title} gagal disimpan`), alert: { color: 'error' } });
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && detailLoading) return <LoadingScreen fullScreen={false} message={`Memuat ${definition.title.toLowerCase()}`} />;
  if (isEdit && (detailError || !existing)) return <ErrorScreen error={detailError || { message: 'Data tidak ditemukan' }} variant="data" showDetails={false} />;

  const breadcrumbs = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: definition.title, to: parentPath },
    { title: isEdit ? 'Edit' : 'Create' }
  ];

  return (
    <>
      <Breadcrumbs custom heading={`${isEdit ? 'Edit' : 'Tambah'} ${definition.title}`} links={breadcrumbs} />
      <MainCard title={isEdit ? `Edit ${definition.title}` : `Tambah ${definition.title}`}>
        <Box component="form" onSubmit={submit}>
          <Stack spacing={3}>
            {definition.validateOverlap && (
              <Alert severity="info">Rentang nominal bersifat minimum inklusif dan maksimum eksklusif. Overlap akan divalidasi sebelum penyimpanan.</Alert>
            )}
            <Grid container spacing={2}>
              {definition.fields.map(([name, label, type, options]) => (
                <FormField key={name} name={name} label={label} type={type} options={options} value={form[name]} onChange={(value) => update(name, value)} />
              ))}
              {definitionKey === 'payments' && <PaymentAllocationSection form={form} setForm={setForm} />}
            </Grid>
            <Divider />
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} justifyContent="flex-end" spacing={1}>
              <Button onClick={() => router.push(parentPath)} disabled={saving}>Batal</Button>
              <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
            </Stack>
          </Stack>
        </Box>
      </MainCard>
    </>
  );
}