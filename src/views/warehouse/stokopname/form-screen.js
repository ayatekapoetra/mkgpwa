'use client';

import { Fragment, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import * as Yup from 'yup';
import moment from 'moment';
import { Formik } from 'formik';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { DocumentDownload } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import AlertNotification from 'components/@extended/AlertNotification';
import BtnBack from 'components/BtnBack';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import { useGetGudang } from 'api/gudang';
import { useShowStokopname, createStokopnameDraft, updateStokopnameDraft, downloadStokopnameTemplate } from 'api/stokopname';

import StokopnameForm, { createEmptyItem } from './form';

const validationSchema = Yup.object().shape({
  opname_date: Yup.date().required('Tanggal wajib diisi'),
  gudang_id: Yup.number().integer().positive().required('Gudang wajib dipilih'),
  rack_id: Yup.number().integer().positive().required('Rack wajib dipilih'),
  keterangan: Yup.string().trim().max(1000, 'Maksimal 1000 karakter'),
  items: Yup.array()
    .of(
      Yup.object().shape({
        barang_id: Yup.number().integer().positive().required('Barang wajib dipilih'),
        qty_aktual: Yup.number().min(0, 'Qty aktual minimal 0').required('Qty aktual wajib diisi')
      })
    )
    .min(1, 'Minimal 1 item stockopname')
});

export default function StokopnameFormScreen({ id = null, mode = 'create' }) {
  const router = useRouter();
  const { data: gudangRows, dataLoading: gudangLoading } = useGetGudang();
  const { data: detail, dataLoading: detailLoading, dataError } = useShowStokopname(id);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleDownloadTemplate = async (gudangId, rackId) => {
    if (!gudangId || !rackId) return;
    setDownloadingTemplate(true);
    try {
      const response = await downloadStokopnameTemplate({ gudang_id: gudangId, rack_id: rackId });
      const disposition = response.headers?.['content-disposition'] || '';
      const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
      let filename = utfMatch?.[1] ? decodeURIComponent(utfMatch[1]) : asciiMatch?.[1] || `template-stockopname-${rackId}.pdf`;
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      openNotification({ title: 'success', message: 'Template stockopname berhasil diunduh', alert: { color: 'success' } });
    } catch (error) {
      openNotification({
        title: 'error',
        message: error?.response?.data?.message || error?.message || 'Gagal mengunduh template',
        alert: { color: 'error' }
      });
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const breadcrumbLinks = useMemo(() => {
    const links = [
      { title: 'Home', to: APP_DEFAULT_PATH },
      { title: 'Stockopname', to: '/warehouse/stokopname' }
    ];
    if (mode === 'edit') links.push({ title: 'Edit Draft', to: `/warehouse/stokopname/${id}/edit` });
    if (mode === 'create') links.push({ title: 'Create', to: '/warehouse/stokopname/create' });
    return links;
  }, [id, mode]);

  const initialValues = useMemo(() => {
    if (mode === 'edit' && detail?.header) {
      const firstItem = (detail.items || [])[0] || {};
      return {
        opname_date: detail.header.opname_date || moment().format('YYYY-MM-DD'),
        gudang_id: detail.header.gudang_id || '',
        rack_id: firstItem.rack_id || '',
        keterangan: detail.header.keterangan || '',
        kode: detail.header.kode || '',
        items: (detail.items || []).map((item) => ({
          barang_id: item.barang_id,
          harga_id: item.harga_id || '',
          qty_aktual: item.qty_aktual || '',
          barang_option: {
            id: item.barang_id,
            kode: item.kd_barang,
            nama: item.nm_barang,
            num_part: item.num_part,
            manufacture_name: item.manufacture_name,
            stn_pakai: item.stn_pakai
          }
        }))
      };
    }
    return {
      opname_date: moment().format('YYYY-MM-DD'),
      gudang_id: '',
      rack_id: '',
      keterangan: '',
      kode: '',
      items: [createEmptyItem()]
    };
  }, [detail, mode]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        opname_date: values.opname_date,
        gudang_id: values.gudang_id,
        keterangan: values.keterangan,
        items: values.items.map((item) => ({
          barang_id: item.barang_id,
          rack_id: values.rack_id,
          harga_id: item.harga_id || null,
          qty_aktual: Number(item.qty_aktual || 0)
        }))
      };

      if (mode === 'edit') {
        await updateStokopnameDraft(id, payload);
        openNotification({
          title: 'success',
          message: 'Draft Stockopname berhasil diperbarui',
          alert: { color: 'success' }
        });
        router.push(`/warehouse/stokopname/${id}`);
      } else {
        const result = await createStokopnameDraft(payload);
        openNotification({
          title: 'success',
          message: 'Draft Stockopname berhasil dibuat',
          alert: { color: 'success' }
        });
        router.push(`/warehouse/stokopname/${result.data?.id || result.id}`);
      }
    } catch (error) {
      openNotification({
        title: 'error',
        message: error?.response?.data?.message || error?.message || 'Gagal menyimpan draft',
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
    return <Alert severity="warning">Gagal memuat data Stockopname.</Alert>;
  }

  const heading = mode === 'edit' ? 'Edit Draft Stockopname' : 'Create Stockopname';

  return (
    <Fragment>
      <Breadcrumbs custom heading={heading} links={breadcrumbLinks} />
      <MainCard 
        title={<BtnBack href={mode === 'edit' ? `/warehouse/stokopname/${id}` : '/warehouse/stokopname'} />} 
        content>
        <AlertNotification />
        <Formik enableReinitialize initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {(formikProps) => (
            <Stack spacing={3}>
              <StokopnameForm {...formikProps} gudangOptions={gudangRows || []} />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <BtnBack href="/warehouse/stokopname" />
                <Tooltip title={formikProps.values.rack_id ? 'Download template hitung fisik (PDF)' : 'Pilih rack terlebih dahulu'}>
                  <span>
                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={downloadingTemplate ? <CircularProgress size={16} /> : <DocumentDownload size={18} />}
                      disabled={!formikProps.values.rack_id || downloadingTemplate}
                      onClick={() => handleDownloadTemplate(formikProps.values.gudang_id, formikProps.values.rack_id)}
                    >
                      Template
                    </Button>
                  </span>
                </Tooltip>
                <Button type="button" variant="contained" onClick={formikProps.submitForm} disabled={formikProps.isSubmitting}>
                  {formikProps.isSubmitting ? 'Menyimpan...' : 'Save Draft'}
                </Button>
              </Stack>
            </Stack>
          )}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
