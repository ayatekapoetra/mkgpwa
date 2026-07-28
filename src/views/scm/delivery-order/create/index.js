'use client';

// REACT
import { Fragment } from 'react';

// COMPONENTS
import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';

// THIRD - PARTY
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
  { title: 'Delivery Order', to: '/delivery-order' },
  { title: 'Create', to: '/delivery-order/create' }
];

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Delivery Order berhasil dibuat...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: 'Delivery Order gagal dibuat...',
  alert: { color: 'error' }
};

const initialValues = {
  do_date: moment().format('YYYY-MM-DD'),
  delivered_at: moment().format('DD-MM-YYYY HH:mm'),
  est_received: moment().format('DD-MM-YYYY HH:mm'),
  bisnis_id: '',
  pemasok_id: '',
  pemasok: null,
  createdby: '',
  narasi: '',
  via: '',
  type: '',
  jenis: '',
  forwarder: '',
  items: []
};

function toSqlDateTime(value) {
  const parsed = moment(value, ['DD-MM-YYYY HH:mm', 'YYYY-MM-DDTHH:mm', 'YYYY-MM-DD HH:mm:ss', moment.ISO_8601], true);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : null;
}

export default function FormCreateScreen() {
  const router = useRouter();
  const dateTimeSchema = Yup.string()
    .required('Tanggal wajib diisi')
    .test('valid-datetime', 'Format tanggal dan waktu tidak valid', (value) => !value || moment(value, 'DD-MM-YYYY HH:mm', true).isValid());

  const validationSchema = Yup.object().shape({
    do_date: Yup.date().required('Tanggal wajib diisi'),
    bisnis_id: Yup.string().required('Bisnis unit oleh harus terisi'),
    pemasok_id: Yup.string().required('Pemasok wajib diisi'),
    delivered_at: dateTimeSchema.label('Tanggal estimasi kirim'),
    est_received: dateTimeSchema.label('Tanggal estimasi tiba'),
    narasi: Yup.string().required('Keterangan wajib diisi'),
    via: Yup.string().required('Via pengiriman wajib diisi'),
    type: Yup.string().required('Type pengiriman wajib diisi'),
    jenis: Yup.string().required('Jenis barang wajib diisi'),
    forwarder: Yup.string().required('Forwarder wajib diisi'),
    items: Yup.array()
      .of(
        Yup.object().shape({
          is_pickup: Yup.string().oneOf(['Y', 'N']).default('N'),
          pickup: Yup.number().required('Qty item wajib diisi').min(1, 'Jumlah minimal 1')
        })
      )
      .min(1, 'Minimal 1 item harus diisi')
  });

  const onSubmitHandle = async (values) => {
    try {
      const payload = {
        ...values,
        delivered_at: toSqlDateTime(values.delivered_at),
        est_received: toSqlDateTime(values.est_received)
      };

      const resp = await axiosServices.post('/scm/delivery-order/create', payload);
      console.log('resp-api.', resp);
      openNotification(msgSuccess);
      router.push('/delivery-order');
    } catch (error) {
      // console.log('err-api.', error);
      openNotification(msgError);
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Create Delivery Order'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/delivery-order'} />} content={true}>
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
