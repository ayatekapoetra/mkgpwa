'use client';

// REACT
import { Fragment, useRef } from 'react';

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
import { v4 as uuidv4 } from 'uuid';

import BtnBack from 'components/BtnBack';
import FormikFormCreate from './form';
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

function getErrorMessage(error) {
  return error?.diagnostic?.message || (typeof error?.diagnostic?.error === 'string' ? error.diagnostic.error : null) || error?.message || msgError.message;
}

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
  const submissionKey = useRef(uuidv4());
  const submitting = useRef(false);
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
          pickup: Yup.number()
            .required('Qty item wajib diisi')
            .integer('Qty item harus berupa bilangan bulat')
            .min(1, 'Jumlah minimal 1')
            .test('remaining-qty', 'Qty melebihi sisa pesanan', function (value) {
              return value == null || value <= Number(this.parent.remaining_qty || 0);
            })
        })
      )
      .min(1, 'Minimal 1 item harus diisi')
  });

  const onSubmitHandle = async (values) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const payload = {
        bisnis_id: values.bisnis_id,
        pemasok_id: values.pemasok_id,
        do_date: values.do_date,
        delivered_at: toSqlDateTime(values.delivered_at),
        est_received: toSqlDateTime(values.est_received),
        narasi: values.narasi,
        via: values.via,
        type: values.type,
        jenis: values.jenis,
        forwarder: values.forwarder,
        items: values.items.map((item) => ({
          id: item.id,
          barang_id: item.barang_id,
          narasi: item.narasi,
          noberkas: item.noberkas,
          satuan: item.satuan,
          pickup: Number(item.pickup),
          harga: item.harga,
          is_pickup: item.is_pickup
        }))
      };

      await axiosServices.post('/scm/delivery-order/create', payload, {
        skipOfflineQueue: true,
        headers: {
          'Idempotency-Key': submissionKey.current,
          'X-Request-Id': `delor-${uuidv4()}`
        }
      });
      submissionKey.current = uuidv4();
      openNotification(msgSuccess);
      router.push('/delivery-order');
    } catch (error) {
      openNotification({ ...msgError, message: getErrorMessage(error) });
    } finally {
      submitting.current = false;
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Create Delivery Order'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/delivery-order'} />} content={true}>
        <Formik initialValues={initialValues} validationSchema={validationSchema} enableReinitialize={true} onSubmit={onSubmitHandle}>
          {(formikProps) => {
            return <FormikFormCreate {...formikProps} />;
          }}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
