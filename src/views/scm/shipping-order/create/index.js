'use client';

import { Fragment } from 'react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';

import * as Yup from 'yup';
import moment from 'moment';
import { Formik } from 'formik';
import axiosServices from 'utils/axios';
import { useRouter } from 'next/navigation';

import BtnBack from 'components/BtnBack';
import FormikFormCreate from './form';
import AlertNotification from 'components/@extended/AlertNotification';
import { openNotification } from 'api/notification';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Shipping Order', to: '/shipping-order' },
  { title: 'Create', to: '/shipping-order/create' }
];

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Shipping Order berhasil dibuat...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: 'Shipping Order gagal dibuat...',
  alert: { color: 'error' }
};

const initialValues = {
  trx_date: moment().format('YYYY-MM-DD'),
  nm_pengirim: '',
  cabang_src: '',
  phone_pengirim: '',
  alamat_pengirim: '',
  gudang_rec: '',
  nm_penerima: '',
  phone_penerima: '',
  alamat_penerima: '',
  keterangan: '',
  items: []
};

export default function FormCreateScreen() {
  const router = useRouter();

  const validationSchema = Yup.object().shape({
    trx_date: Yup.date().required('Tanggal wajib diisi'),
    nm_pengirim: Yup.string().required('Nama pengirim wajib diisi'),
    cabang_src: Yup.string().required('Cabang wajib diisi'),
    gudang_rec: Yup.string().required('Gudang tujuan wajib diisi'),
    nm_penerima: Yup.string().required('Nama penerima wajib diisi'),
    phone_penerima: Yup.string().required('Phone penerima wajib diisi'),
    alamat_penerima: Yup.string().required('Alamat penerima wajib diisi'),
    items: Yup.array()
      .of(
        Yup.object().shape({
          qty_available: Yup.number().required(),
          qty_kirim: Yup.number()
            .typeError('Qty kirim harus berupa angka')
            .required('Qty kirim wajib diisi')
            .moreThan(0, 'Qty kirim harus lebih dari 0')
            .test('max-decimals', 'Maksimal 2 angka desimal', (value) => value == null || Math.abs(value * 100 - Math.round(value * 100)) < 1e-8)
            .max(Yup.ref('qty_available'), 'Qty melebihi sisa yang tersedia')
        })
      )
      .min(1, 'Minimal 1 item harus diisi')
  });

  const onSubmitHandle = async (values) => {
    try {
      const resp = await axiosServices.post('/scm/shipping-order/create', values, { skipOfflineQueue: true });
      if (resp.data?.success) {
        openNotification(msgSuccess);
        router.push('/shipping-order');
      } else {
        openNotification({
          ...msgError,
          message: resp.data?.diagnostic?.error || resp.data?.message || 'Gagal'
        });
      }
    } catch (error) {
      openNotification({
        ...msgError,
        message: error?.diagnostic?.error || error?.message || 'Server error'
      });
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Create Shipping Order'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/shipping-order'} />} content={true}>
        <AlertNotification />
        <Formik initialValues={initialValues} validationSchema={validationSchema} enableReinitialize={true} onSubmit={onSubmitHandle}>
          {(formikProps) => {
            return <FormikFormCreate {...formikProps} />;
          }}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
