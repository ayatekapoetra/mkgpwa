'use client';

import { Fragment, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import * as Yup from 'yup';
import moment from 'moment';
import { Formik } from 'formik';

import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import AlertNotification from 'components/@extended/AlertNotification';
import BtnBack from 'components/BtnBack';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import { useGetGudang } from 'api/gudang';
import { useGetBisnisUnit } from 'api/bisnis-unit';
import { useShowGoodsIssue, createGoodsIssueDraft, updateGoodsIssueDraft, createGoodsIssueFromMaterialRequest } from 'api/goods-issue';
import { generateIdempotencyKey } from 'utils/idempotency';

import GoodsIssueForm, { createEmptyItem, createEmptyItemFromMro } from './form';

const validationSchema = Yup.object().shape({
  trx_date: Yup.date().required('Tanggal transaksi wajib diisi'),
  bisnis_id: Yup.number().integer().positive().required('Bisnis wajib dipilih'),
  gudang_id: Yup.number().integer().positive().required('Gudang wajib dipilih'),
  penerima: Yup.string().trim().required('Penerima wajib diisi').max(200, 'Maksimal 200 karakter'),
  narasi: Yup.string().trim().max(1000, 'Maksimal 1000 karakter'),
  items: Yup.array().of(
    Yup.object().shape({
      barang_id: Yup.number().integer().positive().required('Barang wajib dipilih'),
      rack_id: Yup.number().integer().positive().required('Rack wajib dipilih'),
      hargabeli_id: Yup.number().integer().positive().required('Harga wajib dipilih'),
      qty_pakai: Yup.number().moreThan(0, 'Qty pakai harus lebih dari 0').required('Qty pakai wajib diisi')
    })
  ).min(1, 'Minimal 1 item pemakaian')
});

export default function GoodsIssueFormScreen({ id = null, mode = 'create' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const materialRequestId = searchParams.get('mro');
  const isFromMro = Boolean(materialRequestId && mode === 'create');

  const bisnisUnitHook = useGetBisnisUnit({ my_units: true });
  const bisnisRows = bisnisUnitHook?.bisnisUnit?.rows || [];
  const bisnisLoading = bisnisUnitHook?.bisnisUnitLoading || false;
  const { data: gudangRows, dataLoading: gudangLoading } = useGetGudang();
  const { data: detail, dataLoading: detailLoading, dataError } = useShowGoodsIssue(id);

  const breadcrumbLinks = useMemo(() => {
    const links = [
      { title: 'Home', to: APP_DEFAULT_PATH },
      { title: 'Goods Issues', to: '/goods-issues' }
    ];
    if (mode === 'edit') links.push({ title: 'Edit Draft', to: `/goods-issues/${id}/edit` });
    if (mode === 'create') links.push({ title: 'Create', to: '/goods-issues/create' });
    return links;
  }, [id, mode]);

  const initialValues = useMemo(() => {
    if (mode === 'edit' && detail?.header) {
      return {
        trx_date: detail.header.trx_date || moment().format('YYYY-MM-DD'),
        bisnis_id: detail.header.bisnis_id || '',
        gudang_id: detail.header.gudang_id || '',
        penerima: detail.header.penerima || '',
        narasi: detail.header.narasi || '',
        items: (detail.items || []).map((item) => ({
          barang_id: item.barang_id,
          rack_id: item.rack_id || '',
          hargabeli_id: item.hargabeli_id || '',
          qty_pakai: item.qty_pakai || item.qty || '',
          equipment_id: item.equipment_id || '',
          smu: item.smu || '',
          remark: item.remark || '',
          mro_item_id: item.mro_item_id || null,
          barang_option: item.barang
            ? {
                id: item.barang_id,
                kode: item.barang.kode,
                nama: item.barang.nama,
                num_part: item.barang.num_part || null,
                satuan_pakai: item.satuan_pakai || item.barang.satuan_pakai,
                satuan_order: item.satuan_order || item.barang.satuan_order,
                pembagi_pakai: item.conversion_factor || item.barang.pembagi_pakai || 0,
                stok_order: 0,
                stok_pakai: 0
              }
            : null,
          equipment_option: item.equipment || null,
          satuan_pakai: item.satuan_pakai || item.usage_uom || '',
          satuan_order: item.satuan_order || item.base_uom || '',
          pembagi_pakai: item.conversion_factor || 0,
          stok_order: 0,
          stok_pakai: 0
        }))
      };
    }

    if (isFromMro && detail?.header) {
      return {
        trx_date: detail.header.trx_date || moment().format('YYYY-MM-DD'),
        bisnis_id: detail.header.bisnis_id || '',
        gudang_id: detail.header.gudang_id || detail.header.gudang?.id || '',
        penerima: detail.header.penerima || '',
        narasi: detail.header.narasi || '',
        items: (detail.items || []).map((mroItem) => createEmptyItemFromMro(mroItem))
      };
    }

    return {
      trx_date: moment().format('YYYY-MM-DD'),
      bisnis_id: '',
      gudang_id: '',
      penerima: '',
      narasi: '',
      items: [createEmptyItem()]
    };
  }, [detail, mode, isFromMro]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        trx_date: values.trx_date,
        bisnis_id: Number(values.bisnis_id),
        gudang_id: Number(values.gudang_id),
        penerima: values.penerima,
        narasi: values.narasi || '',
        idempotency_key: generateIdempotencyKey(),
        items: values.items.map((item) => ({
          barang_id: Number(item.barang_id),
          rack_id: Number(item.rack_id),
          hargabeli_id: Number(item.hargabeli_id),
          qty_pakai: Number(item.qty_pakai),
          equipment_id: item.equipment_id ? Number(item.equipment_id) : null,
          smu: item.smu ? Number(item.smu) : null,
          remark: item.remark || '',
          mro_item_id: item.mro_item_id || null
        }))
      };

      if (mode === 'edit') {
        payload.version = values.version || detail?.header?.version || 1;
        const response = await updateGoodsIssueDraft(id, payload);
        if (!response?.success) throw new Error(response?.message || 'Draft gagal diperbarui');
        openNotification({ open: true, title: 'success', message: 'Draft Goods Issue berhasil diperbarui', alert: { color: 'success' } });
        router.push(`/goods-issues/${id}`);
      } else if (isFromMro && materialRequestId) {
        const response = await createGoodsIssueFromMaterialRequest(materialRequestId, payload);
        if (!response?.success) throw new Error(response?.message || 'Goods Issue dari Material Request gagal dibuat');
        openNotification({ open: true, title: 'success', message: 'Draft Goods Issue dari MRO berhasil dibuat', alert: { color: 'success' } });
        router.push(`/goods-issues/${response.data?.id || response.data?.header?.id}`);
      } else {
        const response = await createGoodsIssueDraft(payload);
        if (!response?.success) throw new Error(response?.message || 'Draft gagal dibuat');
        openNotification({ open: true, title: 'success', message: 'Draft Goods Issue berhasil dibuat', alert: { color: 'success' } });
        router.push(`/goods-issues/${response.data?.id || response.data?.header?.id}`);
      }
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: error?.response?.data?.message || error?.message || 'Gagal menyimpan draft',
        alert: { color: 'error' }
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (bisnisLoading || gudangLoading || (mode === 'edit' && detailLoading) || (isFromMro && detailLoading)) {
    return (
      <Stack sx={{ py: 8 }} alignItems="center">
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if ((mode === 'edit' || isFromMro) && dataError) {
    return <Alert severity="warning">Gagal memuat data Goods Issue.</Alert>;
  }

  return (
    <Fragment>
      <Breadcrumbs
        custom
        heading={mode === 'edit' ? 'Edit Draft Goods Issue' : isFromMro ? 'Goods Issue dari Material Request' : 'Create Goods Issue'}
        links={breadcrumbLinks}
      />
      <MainCard
        title={<BtnBack href={mode === 'edit' ? `/goods-issues/${id}` : '/goods-issues'} />}
        content
      >
        <AlertNotification />
        <Formik enableReinitialize initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {(formikProps) => (
            <GoodsIssueForm
              {...formikProps}
              mode={mode}
              gudangOptions={gudangRows || []}
              bisnisOptions={bisnisRows || []}
              isFromMro={isFromMro}
            />
          )}
        </Formik>
      </MainCard>
    </Fragment>
  );
}