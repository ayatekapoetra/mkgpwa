'use client';

import { Fragment } from 'react';

import * as Yup from 'yup';
import moment from 'moment';
import { Formik } from 'formik';
import { useRouter } from 'next/navigation';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import AlertNotification from 'components/@extended/AlertNotification';
import BtnBack from 'components/BtnBack';
import { APP_DEFAULT_PATH } from 'config';
import axiosServices from 'utils/axios';
import { openNotification } from 'api/notification';
import GoodsReceiptCreateForm from './form';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Terima Barang', to: '/goods-receipt' },
  { title: 'Create', to: '/goods-receipt/create' }
];

const initialValues = {
  sj_id: '',
  kode_sj: '',
  ship_kode: '',
  gudang_id: '',
  gudang_label: '',
  received_at: moment().format('YYYY-MM-DD'),
  narasi: '',
  items: []
};

const validationSchema = Yup.object().shape({
  sj_id: Yup.number().integer().positive().required('Shipment wajib dipilih'),
  received_at: Yup.date().required('Tanggal terima wajib diisi'),
  narasi: Yup.string().required('Narasi wajib diisi'),
  items: Yup.array().of(
    Yup.object().shape({
      sjitem_id: Yup.number().integer().positive().required(),
      barang_id: Yup.number().integer().positive().required(),
      rack_id: Yup.number().integer().positive().required('Rack wajib dipilih'),
      qty_terima: Yup.number().required('Qty terima wajib diisi').moreThan(0, 'Qty terima harus lebih dari 0').max(Yup.ref('qty_sisa'), 'Qty terima melebihi sisa')
    })
  ).min(1, 'Minimal 1 item penerimaan')
});

export default function GoodsReceiptCreateScreen() {
  const router = useRouter();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        sj_id: Number(values.sj_id),
        received_at: values.received_at,
        narasi: values.narasi,
        items: values.items.map((item) => ({
          sjitem_id: item.sjitem_id,
          barang_id: item.barang_id,
          pemasok_id: item.pemasok_id || null,
          rack_id: Number(item.rack_id),
          qty_terima: Number(item.qty_terima),
          harga: Number(item.harga || 0),
          description: item.description || '',
          uom: item.uom || ''
        }))
      };
      const response = await axiosServices.post('/scm/terima-barang/create', payload, { skipOfflineQueue: true });
      if (!response.data?.success) throw new Error(response.data?.message || response.data?.diagnostic?.error || 'Penerimaan gagal disimpan');
      openNotification({ open: true, title: 'success', message: 'Penerimaan barang berhasil dibuat...', alert: { color: 'success' } });
      router.push('/goods-receipt');
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: error?.response?.data?.diagnostic?.error || error?.message || 'Penerimaan barang gagal dibuat...',
        alert: { color: 'error' }
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Create Terima Barang'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/goods-receipt'} />} content>
        <AlertNotification />
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {(formikProps) => <GoodsReceiptCreateForm {...formikProps} />}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
