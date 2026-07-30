'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import * as Yup from 'yup';
import moment from 'moment';
import { Formik } from 'formik';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import AlertNotification from 'components/@extended/AlertNotification';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import { useShowWarehouseTransfer } from 'api/warehouse-transfer';
import axiosServices from 'utils/axios';

const validationSchema = Yup.object().shape({
  received_at: Yup.date().required('Tanggal terima wajib diisi'),
  items: Yup.array().of(
    Yup.object().shape({
      transfer_item_id: Yup.number().integer().positive().required(),
      rack_target_id: Yup.number().integer().positive().required('Rack tujuan wajib dipilih'),
      qty_terima_pakai: Yup.number().moreThan(0, 'Qty terima wajib lebih dari 0').required('Qty terima wajib diisi')
    })
  ).min(1, 'Minimal 1 item diterima')
});

export default function WarehouseTransferReceiveScreen({ id }) {
  const router = useRouter();
  const { data, dataLoading, dataError } = useShowWarehouseTransfer(id);
  const [targetRackOptions, setTargetRackOptions] = useState({});

  useEffect(() => {
    const loadRacks = async () => {
      if (!data?.header?.gudang_target?.id) return;
      const entries = await Promise.all(
        (data.items || []).map(async (item) => {
          const response = await axiosServices.get(`/warehouse/transfers/options/target-racks?${new URLSearchParams({ gudang_id: data.header.gudang_target.id, barang_id: item.barang_id }).toString()}`);
          return [item.id, response.data?.data || []];
        })
      );
      setTargetRackOptions(Object.fromEntries(entries));
    };
    loadRacks();
  }, [data]);

  if (dataLoading) return <Stack sx={{ py: 8 }} alignItems="center"><CircularProgress size={28} /></Stack>;
  if (dataError || !data?.header) return <Alert severity="warning">Gagal memuat data transfer.</Alert>;

  const receivableItems = (data.items || []).filter((item) => Number(item.qty_remaining_pakai || 0) > 0);
  const initialValues = {
    received_at: moment().format('YYYY-MM-DD'),
    narasi: data.header.narasi || '',
    items: receivableItems.map((item) => ({
      transfer_item_id: item.id,
      sjitem_id: item.surat_jalan_item_id || item.id,
      barang_id: item.barang_id,
      rack_target_id: targetRackOptions[item.id]?.find((rack) => rack.is_recommended)?.id || '',
      qty_terima_pakai: item.qty_remaining_pakai || ''
    }))
  };

  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'Warehouse Transfer', to: '/warehouse/transfers' },
    { title: data.header.kode || 'Detail', to: `/warehouse/transfers/${id}` },
    { title: 'Receive', to: `/warehouse/transfers/${id}/receive` }
  ];

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        received_at: values.received_at,
        narasi: values.narasi || '',
        items: values.items.map((item) => ({
          transfer_item_id: Number(item.transfer_item_id),
          sjitem_id: Number(item.sjitem_id),
          barang_id: Number(item.barang_id),
          rack_target_id: Number(item.rack_target_id),
          qty_terima_pakai: Number(item.qty_terima_pakai)
        }))
      };

      const response = await axiosServices.post(`/warehouse/transfers/${id}/receive`, payload, { skipOfflineQueue: true });
      if (!response.data?.success) throw new Error(response.data?.message || 'Penerimaan transfer gagal disimpan');
      openNotification({ open: true, title: 'success', message: response.data.message, alert: { color: 'success' } });
      router.push(`/warehouse/transfers/${id}`);
    } catch (error) {
      openNotification({ open: true, title: 'error', message: error?.response?.data?.message || error?.message || 'Penerimaan transfer gagal disimpan', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Receive Transfer'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={`/warehouse/transfers/${id}`} />} content>
        <AlertNotification />
        <Formik enableReinitialize initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ values, errors, touched, handleChange, handleSubmit, setFieldValue, isSubmitting }) => (
            <form onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={4}><TextField label="Tanggal Terima" type="date" name="received_at" size="small" fullWidth InputLabelProps={{ shrink: true }} value={values.received_at} onChange={handleChange} error={touched.received_at && Boolean(errors.received_at)} helperText={touched.received_at && errors.received_at} /></Grid>
                <Grid item xs={12} md={8}><TextField label="Narasi" name="narasi" size="small" fullWidth value={values.narasi} onChange={handleChange} /></Grid>
                <Grid item xs={12}>
                  <Divider sx={{ mb: 2 }}>Items Penerimaan</Divider>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 1100 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Barang</TableCell>
                          <TableCell align="right">Sisa Pakai</TableCell>
                          <TableCell align="right">Sisa Order</TableCell>
                          <TableCell>Rack Tujuan</TableCell>
                          <TableCell align="right">Qty Terima Pakai</TableCell>
                          <TableCell align="right">Preview Qty Order</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {receivableItems.map((item, index) => {
                          const current = values.items[index];
                          const previewOrder = Number(item.pembagi_pakai || 0) > 0 ? Number(current?.qty_terima_pakai || 0) / Number(item.pembagi_pakai || 1) : 0;
                          return (
                            <TableRow key={item.id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight={700}>{item.barang?.kode || '-'}</Typography>
                                <Typography variant="caption" color="text.secondary">{item.barang?.nama || '-'}</Typography>
                              </TableCell>
                              <TableCell align="right">{item.qty_remaining_pakai} {item.satuan_pakai}</TableCell>
                              <TableCell align="right">{item.qty_remaining_order} {item.satuan_order}</TableCell>
                              <TableCell sx={{ minWidth: 320 }}>
                                <Autocomplete
                                  options={targetRackOptions[item.id] || []}
                                  value={(targetRackOptions[item.id] || []).find((rack) => String(rack.id) === String(current?.rack_target_id || '')) || null}
                                  fullWidth
                                  openOnFocus
                                  getOptionLabel={(rack) => `${rack.kode} - ${rack.nama} | ${rack.stok_order || 0} ${item.satuan_order}`}
                                  isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
                                  onChange={(_, option) => setFieldValue(`items.${index}.rack_target_id`, option?.id || '')}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      size="small"
                                      label="Rack Tujuan"
                                      error={Boolean(touched.items?.[index]?.rack_target_id && errors.items?.[index]?.rack_target_id)}
                                      helperText={touched.items?.[index]?.rack_target_id && errors.items?.[index]?.rack_target_id}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ minWidth: 180 }}>
                                <TextField size="small" type="number" fullWidth value={current?.qty_terima_pakai || ''} onChange={(event) => setFieldValue(`items.${index}.qty_terima_pakai`, event.target.value)} error={Boolean(touched.items?.[index]?.qty_terima_pakai && errors.items?.[index]?.qty_terima_pakai)} helperText={touched.items?.[index]?.qty_terima_pakai && errors.items?.[index]?.qty_terima_pakai} />
                              </TableCell>
                              <TableCell align="right">{Number(previewOrder.toFixed(6))} {item.satuan_order}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                </Grid>
                <Grid item xs={12}><Stack direction="row" justifyContent="flex-end"><Button type="submit" variant="contained" disabled={isSubmitting}>Simpan Penerimaan</Button></Stack></Grid>
              </Grid>
            </form>
          )}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
