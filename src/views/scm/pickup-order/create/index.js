'use client';

import { Fragment } from 'react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import AlertNotification from 'components/@extended/AlertNotification';
import { APP_DEFAULT_PATH } from 'config';

import * as Yup from 'yup';
import moment from 'moment';
import { Formik } from 'formik';
import axiosServices from 'utils/axios';
import { useRouter } from 'next/navigation';

import FormikFormCreate from './form';
import { openNotification } from 'api/notification';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Pickup Order', to: '/pickup-order' },
  { title: 'Create', to: '/pickup-order/create' }
];

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Pickup Order berhasil dibuat...',
  alert: { color: 'success' }
};

const msgError = {
  open: true,
  title: 'error',
  message: 'Pickup Order gagal dibuat...',
  alert: { color: 'error' }
};

  const initialValues = {
  date_pickup: moment().format('YYYY-MM-DD'),
  pickup_by: '',
  prioritas: 'P1',
  ctg: 'transit',
  drop_to: '',
  accepted_by: '',
  acceptedby: null,
  keterangan: '',
  photo: null,
  items: []
};

export default function FormCreateScreen() {
  const router = useRouter();

  const validationSchema = Yup.object().shape({
    date_pickup: Yup.date().required('Tanggal pickup wajib diisi'),
    pickup_by: Yup.string().required('Pickup by wajib diisi'),
    drop_to: Yup.string().required('Gudang transit wajib dipilih'),
    accepted_by: Yup.string().required('Accepted by wajib dipilih'),
    items: Yup.array()
      .of(
        Yup.object().shape({
          pickup: Yup.number().required('Qty pickup wajib diisi').min(1, 'Jumlah minimal 1')
        })
      )
      .min(1, 'Minimal 1 item harus dipilih')
  });

  const onSubmitHandle = async (values) => {
    const formData = new FormData();
    formData.append('date_pickup', values.date_pickup);
    formData.append('pickup_by', values.pickup_by);
    formData.append('prioritas', values.prioritas || 'P1');
    formData.append('ctg', values.ctg || 'transit');
    formData.append('drop_to', values.drop_to);
    formData.append('accepted_by', values.accepted_by);
    formData.append('keterangan', values.keterangan || '');
    formData.append('items', JSON.stringify(values.items));
    if (values.photo) {
      formData.append('photo', values.photo);
    }

    try {
      await axiosServices.post('/scm/pickup-order/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      openNotification(msgSuccess);
      router.push('/pickup-order');
    } catch (error) {
      openNotification({
        ...msgError,
        message: error?.diagnostic?.error || error?.message || msgError.message
      });
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Create Pickup Order'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/pickup-order'} />} content>
        <AlertNotification />
        <Formik initialValues={initialValues} validationSchema={validationSchema} enableReinitialize onSubmit={onSubmitHandle}>
          {(formikProps) => <FormikFormCreate {...formikProps} />}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
