'use client';

import { Fragment, useMemo } from 'react';

import * as Yup from 'yup';
import moment from 'moment';
import { Formik } from 'formik';
import { useRouter } from 'next/navigation';

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
import { useShowWarehouseTransfer } from 'api/warehouse-transfer';
import axiosServices from 'utils/axios';

import WarehouseTransferForm, { createEmptyItem } from './form';

const validationSchema = Yup.object().shape({
  trx_date: Yup.date().required('Tanggal transfer wajib diisi'),
  gudang_src: Yup.number().integer().positive().required('Gudang sumber wajib diisi'),
  gudang_target: Yup.number().integer().positive().required('Gudang tujuan wajib diisi'),
  items: Yup.array().of(
    Yup.object().shape({
      barang_id: Yup.number().integer().positive().required('Barang wajib dipilih'),
      rack_src_id: Yup.number().integer().positive().required('Rack sumber wajib dipilih'),
      hargabeli_id: Yup.number().integer().positive().required('Harga wajib dipilih'),
      qty_pakai: Yup.number().moreThan(0, 'Qty pakai harus lebih dari 0').required('Qty pakai wajib diisi')
    })
  ).min(1, 'Minimal 1 item transfer')
});

export default function WarehouseTransferFormScreen({ id = null, mode = 'create' }) {
  const router = useRouter();
  const { data: gudangRows, dataLoading: gudangLoading } = useGetGudang();
  const { data: detail, dataLoading: detailLoading, dataError } = useShowWarehouseTransfer(id);

  const breadcrumbLinks = useMemo(() => {
    const links = [
      { title: 'Home', to: APP_DEFAULT_PATH },
      { title: 'Warehouse Transfer', to: '/warehouse/transfers' }
    ];
    if (mode === 'edit') links.push({ title: 'Edit Draft', to: `/warehouse/transfers/${id}/edit` });
    if (mode === 'create') links.push({ title: 'Create', to: '/warehouse/transfers/create' });
    return links;
  }, [id, mode]);

  const initialValues = useMemo(() => {
    if (mode === 'edit' && detail?.header) {
      return {
        trx_date: detail.header.trx_date || moment().format('YYYY-MM-DD'),
        gudang_src: detail.header.gudang_src?.id || '',
        gudang_target: detail.header.gudang_target?.id || '',
        narasi: detail.header.narasi || '',
        items: (detail.items || []).map((item) => ({
          barang_id: item.barang_id,
          rack_src_id: item.rack_src_id || '',
          hargabeli_id: item.hargabeli_id || '',
          qty_pakai: item.qty_pakai || '',
          barang_option: item.barang
            ? {
                id: item.barang_id,
                kode: item.barang.kode,
                nama: item.barang.nama,
                num_part: item.barang.num_part || null,
                serial: item.barang.serial || null,
                kategori: item.barang.kategori || null,
                manufacture: item.barang.manufacture || null,
                brand: item.barang.brand || null,
                application: item.barang.application || null,
                satuan_pakai: item.satuan_pakai,
                satuan_order: item.satuan_order,
                pembagi_pakai: item.pembagi_pakai,
                stok_order: item.stok_order || 0,
                stok_pakai: item.stok_pakai || 0
              }
            : null,
          satuan_pakai: item.satuan_pakai || '',
          satuan_order: item.satuan_order || '',
          pembagi_pakai: item.pembagi_pakai || 0,
          stok_order: item.stok_order || 0,
          stok_pakai: item.stok_pakai || 0
        }))
      };
    }

    return {
      trx_date: moment().format('YYYY-MM-DD'),
      gudang_src: '',
      gudang_target: '',
      narasi: '',
      items: [createEmptyItem()]
    };
  }, [detail, mode]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        trx_date: values.trx_date,
        gudang_src: Number(values.gudang_src),
        gudang_target: Number(values.gudang_target),
        narasi: values.narasi || '',
        items: values.items.map((item) => ({
          barang_id: Number(item.barang_id),
          rack_src_id: Number(item.rack_src_id),
          hargabeli_id: Number(item.hargabeli_id),
          qty_pakai: Number(item.qty_pakai)
        }))
      };

      if (mode === 'edit') {
        const response = await axiosServices.put(`/warehouse/transfers/${id}`, payload, { skipOfflineQueue: true });
        if (!response.data?.success) throw new Error(response.data?.message || 'Draft transfer gagal diperbarui');
        openNotification({ open: true, title: 'success', message: 'Draft transfer berhasil diperbarui', alert: { color: 'success' } });
        router.push(`/warehouse/transfers/${id}`);
      } else {
        const response = await axiosServices.post('/warehouse/transfers', payload, { skipOfflineQueue: true });
        if (!response.data?.success) throw new Error(response.data?.message || 'Draft transfer gagal dibuat');
        openNotification({ open: true, title: 'success', message: 'Draft transfer berhasil dibuat', alert: { color: 'success' } });
        router.push(`/warehouse/transfers/${response.data.data.id}`);
      }
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: error?.response?.data?.message || error?.message || 'Gagal menyimpan draft transfer',
        alert: { color: 'error' }
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (gudangLoading || (mode === 'edit' && detailLoading)) {
    return (
      <Stack sx={{ py: 8 }} alignItems="center">
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (mode === 'edit' && dataError) {
    return <Alert severity="warning">Gagal memuat data transfer.</Alert>;
  }

  return (
    <Fragment>
      <Breadcrumbs custom heading={mode === 'edit' ? 'Edit Draft Transfer' : 'Create Transfer'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={mode === 'edit' ? `/warehouse/transfers/${id}` : '/warehouse/transfers'} />} content>
        <AlertNotification />
        <Formik enableReinitialize initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {(formikProps) => <WarehouseTransferForm {...formikProps} mode={mode} gudangOptions={gudangRows || []} />}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
