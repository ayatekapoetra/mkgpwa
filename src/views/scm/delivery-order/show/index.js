'use client';

// REACT
import { Fragment, useState } from 'react';

// COMPONENTS
import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';

// THIRD - PARTY
import * as Yup from 'yup';
import moment from 'moment';
import { Formik } from 'formik';
import axiosServices from 'utils/axios';
import {
  useRouter,
  useParams
} from 'next/navigation';

import BtnBack from 'components/BtnBack';
import FormikFormCreate from './form';
import AlertNotification from 'components/@extended/AlertNotification';
import { openNotification } from 'api/notification';
import { useShowDeliveryOrder } from 'api/delivery-order';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Delivery Order', to: '/delivery-order' },
  { title: 'Detail' }
];

export default function FormShowScreen() {
  const { id } = useParams();
  const router = useRouter();
  const { data: initialValues, dataLoading } = useShowDeliveryOrder(id);
  const [isDeleting, setIsDeleting] = useState(false);

  const dateTimeSchema = Yup.string()
    .required('Tanggal wajib diisi')
    .test('valid-datetime', 'Format tanggal dan waktu tidak valid', (value) => !value || moment(value, 'DD-MM-YYYY HH:mm', true).isValid());

  console.log('ID.', initialValues);

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
          pickup: Yup.number().required('Qty perintah pickup wajib diisi').min(1, 'Jumlah minimal 1')
        })
      )
      .min(1, 'Minimal 1 item harus diisi')
  });

  const onSubmitHandle = async (values) => {
    console.log(values);
    // try {
    //     const resp = await axiosServices.post('api/msc/delivery-order/create', values)
    //     // console.log('resp-api.', resp)
    //     openNotification(msgSuccess)
    //     router.push('/logistik/delivery-order')
    // } catch (error) {
    //     // console.log('err-api.', error);
    //     openNotification(msgError)
    // }
  };

  const onDeleteHandle = async () => {
    const confirmed = window.confirm('Hapus delivery order ini?');
    if (!confirmed || isDeleting) return;

    setIsDeleting(true);
    try {
      await axiosServices.post(`/scm/delivery-order/${id}/destroy`);
      openNotification({
        open: true,
        title: 'success',
        message: 'Delivery Order berhasil dihapus...',
        alert: { color: 'success' }
      });
      router.push('/delivery-order');
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: error?.diagnostic?.error || error?.message || 'Delivery Order gagal dihapus...',
        alert: { color: 'error' }
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Detail Delivery Order'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/delivery-order'} />} content={true}>
        <AlertNotification />
        <Formik initialValues={initialValues} validationSchema={validationSchema} enableReinitialize={true} onSubmit={onSubmitHandle}>
          {(formikProps) => {
            return !dataLoading && <FormikFormCreate {...formikProps} onDelete={onDeleteHandle} isDeleting={isDeleting} />;
          }}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
