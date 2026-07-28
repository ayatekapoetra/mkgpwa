'use client';

import { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { SearchNormal1 } from 'iconsax-react';

import Paginate from 'components/Paginate';
import { useGetAvailableReceiptShipments, useGetGoodsReceiptShipmentItems } from 'api/goods-receipt';
import axiosServices from 'utils/axios';

export default function GoodsReceiptCreateForm({ values, errors, touched, handleChange, handleSubmit, setFieldValue, isSubmitting }) {
  const [openShipmentModal, setOpenShipmentModal] = useState(false);
  const [shipmentParams, setShipmentParams] = useState({ page: 1, perPage: 10, search: '' });
  const [searchShipmentError, setSearchShipmentError] = useState('');
  const [isSearchingShipment, setIsSearchingShipment] = useState(false);
  const { data: shipments, dataLoading: shipmentsLoading, dataError: shipmentsError, page, total, lastPage, perPage } = useGetAvailableReceiptShipments(shipmentParams, openShipmentModal);
  const { data: shipmentDetail, dataLoading: shipmentItemsLoading, dataError: shipmentItemsError } = useGetGoodsReceiptShipmentItems(values.sj_id, Boolean(values.sj_id));

  useEffect(() => {
    if (!shipmentDetail?.suratJalan) return;
    setFieldValue('kode_sj', shipmentDetail.suratJalan.kode_sj || '');
    setFieldValue('ship_kode', shipmentDetail.suratJalan.ship_kode || '');
    setFieldValue('gudang_id', shipmentDetail.suratJalan.gudang_id || '');
    setFieldValue('gudang_label', shipmentDetail.suratJalan.gudang_label || shipmentDetail.suratJalan.gudang_id || '');
    setFieldValue('narasi', shipmentDetail.suratJalan.narasi || '');
    setFieldValue(
      'items',
      (shipmentDetail.items || []).map((item) => ({
        sjitem_id: item.sjitem_id,
        barang_id: item.barang_id,
        pemasok_id: item.pemasok_id,
        description: item.description,
        uom: item.uom,
        harga: item.harga,
        qty_kirim: item.qty_kirim,
        qty_terima: item.qty_sisa,
        qty_sisa: item.qty_sisa,
        rack_id: item.recommendedRackId || '',
        rackOptions: item.rackOptions || [],
        hasRackLocation: item.hasRackLocation,
        rackValidationMessage: item.rackValidationMessage,
        barang: item.barang,
        pemasok: item.pemasok,
        narasi: item.narasi
      }))
    );
  }, [shipmentDetail, setFieldValue]);

  const hasRackErrors = values.items.some((item) => !item.hasRackLocation);

  const applyShipmentSelection = (item) => {
    setFieldValue('sj_id', item.sj_id);
    setFieldValue('kode_sj', item.kode_sj);
    setFieldValue('ship_kode', item.ship_kode || '');
    setFieldValue('gudang_id', item.gudang_id);
    setFieldValue('gudang_label', item.gudang_label);
    setSearchShipmentError('');
  };

  const handleSearchShipmentByCode = async () => {
    const kode = String(values.kode_sj || '').trim();
    if (!kode) {
      setSearchShipmentError('Kode surat jalan wajib diisi untuk pencarian.');
      return;
    }

    setIsSearchingShipment(true);
    setSearchShipmentError('');
    try {
      const response = await axiosServices.get(`/scm/terima-barang/available-shipments?${new URLSearchParams({ page: 1, perPage: 25, search: kode })}`);
      const rows = response.data?.rows?.data || [];
      const matched = rows.find((item) => String(item.kode_sj).toLowerCase() === kode.toLowerCase()) || rows[0];
      if (!matched) {
        setSearchShipmentError('Shipment dengan kode surat jalan tersebut tidak ditemukan atau tidak siap diterima.');
        return;
      }

      applyShipmentSelection(matched);
    } catch (error) {
      setSearchShipmentError(error?.response?.data?.diagnostic?.error || error?.message || 'Gagal mencari shipment.');
    } finally {
      setIsSearchingShipment(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={6} md={8}>
          <TextField
            label="Kode Surat Jalan"
            name="kode_sj"
            size="small"
            fullWidth
            value={values.kode_sj}
            onChange={(event) => {
              setFieldValue('kode_sj', event.target.value);
              setSearchShipmentError('');
            }}
          />
        </Grid>
        <Grid item xs={3} md={2}>
          <Button variant="outlined" fullWidth sx={{ height: '100%' }} onClick={handleSearchShipmentByCode} disabled={isSearchingShipment}>
            {isSearchingShipment ? 'Mencari...' : 'Cari'}
          </Button>
        </Grid>
        <Grid item xs={3} md={2}>
          <Button variant="contained" fullWidth sx={{ height: '100%' }} onClick={() => setOpenShipmentModal(true)}>
            Pilih Shipment
          </Button>
        </Grid>
        {searchShipmentError ? (
          <Grid item xs={12}>
            <Alert severity="warning">{searchShipmentError}</Alert>
          </Grid>
        ) : null}
        <Grid item xs={12} md={4}>
          <TextField
            label="Tanggal Terima"
            type="date"
            name="received_at"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={values.received_at}
            onChange={handleChange}
            error={touched.received_at && Boolean(errors.received_at)}
            helperText={touched.received_at && errors.received_at}
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <TextField label="Gudang Tujuan" size="small" fullWidth value={values.gudang_label} InputProps={{ readOnly: true }} />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Narasi"
            name="narasi"
            size="small"
            fullWidth
            multiline
            rows={3}
            value={values.narasi}
            onChange={handleChange}
            error={touched.narasi && Boolean(errors.narasi)}
            helperText={touched.narasi && errors.narasi}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Stack spacing={1.5} mb={2}>
              <Typography variant="subtitle1">Items Penerimaan</Typography>
              {shipmentItemsError ? <Alert severity="warning">{shipmentItemsError?.message || 'Gagal memuat item shipment.'}</Alert> : null}
              {hasRackErrors ? <Alert severity="error">Masih ada barang yang belum memiliki lokasi rack pada gudang tujuan. Submit dinonaktifkan.</Alert> : null}
            </Stack>
            {shipmentItemsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
            ) : values.items.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Pilih shipment untuk memuat item penerimaan.</Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table
                  size="small"
                  sx={{
                    minWidth: 1100,
                    '& .MuiTableCell-root': { whiteSpace: 'nowrap', verticalAlign: 'top' }
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>Barang</TableCell>
                      <TableCell>Pemasok</TableCell>
                      <TableCell align="right">Qty Kirim</TableCell>
                      <TableCell align="right">Qty Sisa</TableCell>
                      <TableCell>Rack</TableCell>
                      <TableCell align="right">Qty Terima</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {values.items.map((item, index) => {
                      const qtyField = `items.${index}.qty_terima`;
                      const rackField = `items.${index}.rack_id`;
                      return (
                        <TableRow key={item.sjitem_id} hover selected={!item.hasRackLocation}>
                          <TableCell sx={{ minWidth: 280, whiteSpace: 'normal !important' }}>
                            <Stack spacing={0.5}>
                              <Typography variant="body2" fontWeight={700}>{item.barang?.kode || '-'}</Typography>
                              <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                {item.barang?.nama || item.description || '-'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                {item.barang?.num_part || item.narasi || '-'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.pemasok?.nama || '-'}</Typography>
                          </TableCell>
                          <TableCell align="right">{item.qty_kirim} {item.uom}</TableCell>
                          <TableCell align="right">{item.qty_sisa} {item.uom}</TableCell>
                          <TableCell sx={{ minWidth: 280 }}>
                            <Autocomplete
                              size="small"
                              options={item.rackOptions}
                              value={item.rackOptions.find((rack) => Number(rack.id) === Number(item.rack_id)) || null}
                              onChange={(_, newValue) => setFieldValue(rackField, newValue?.id || '')}
                              isOptionEqualToValue={(option, value) => Number(option.id) === Number(value?.id)}
                              getOptionLabel={(option) => `${option.kode || '-'} - ${option.nama || '-'} | Stok: ${option.current_stock} ${item.uom || ''}`}
                              noOptionsText="Tidak ada rack"
                              renderOption={(props, option) => (
                                <Box component="li" {...props} key={option.id}>
                                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={700}>{option.kode || '-'}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {option.nama || '-'}
                                    </Typography>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Typography variant="caption" color="text.secondary">
                                        {`Stok: ${option.current_stock} ${item.uom || ''}`}
                                      </Typography>
                                      {option.is_recommended ? <Chip size="small" color="success" label="Direkomendasikan" /> : null}
                                    </Stack>
                                  </Stack>
                                </Box>
                              )}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  size="small"
                                  error={!item.hasRackLocation || Boolean(errors.items?.[index]?.rack_id)}
                                  helperText={item.hasRackLocation ? (errors.items?.[index]?.rack_id || '') : item.rackValidationMessage}
                                  placeholder="Pilih Rack"
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ minWidth: 140 }}>
                            <TextField
                              type="number"
                              size="small"
                              value={item.qty_terima}
                              onChange={(event) => setFieldValue(qtyField, event.target.value === '' ? '' : Number(event.target.value))}
                              error={Boolean(errors.items?.[index]?.qty_terima)}
                              helperText={errors.items?.[index]?.qty_terima}
                              inputProps={{ min: 0, max: item.qty_sisa, step: 0.01 }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider />
          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 2 }}>
            <Button variant="outlined" color="secondary" onClick={() => window.history.back()}>Batal</Button>
            <Button variant="contained" type="submit" disabled={isSubmitting || hasRackErrors || values.items.length === 0}>
              {isSubmitting ? 'Menyimpan...' : 'Submit'}
            </Button>
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={openShipmentModal} onClose={() => setOpenShipmentModal(false)} fullWidth maxWidth="lg">
        <DialogTitle>Pilih Shipment</DialogTitle>
        <DialogContent dividers>
          <TextField
            size="small"
            fullWidth
            placeholder="Cari kode shipping, surat jalan, gudang, atau narasi..."
            value={shipmentParams.search}
            onChange={(event) => setShipmentParams((prev) => ({ ...prev, page: 1, search: event.target.value }))}
            sx={{ mb: 2 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchNormal1 size={16} /></InputAdornment> }}
          />
          {shipmentsError ? (
            <Alert severity="warning">{shipmentsError?.message || 'Gagal memuat shipment.'}</Alert>
          ) : shipmentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
          ) : shipments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Tidak ada shipment siap diterima.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Shipping</TableCell>
                  <TableCell>Surat Jalan</TableCell>
                  <TableCell>Gudang</TableCell>
                  <TableCell>Info</TableCell>
                  <TableCell align="center">ACT</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shipments.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{item.ship_kode}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{item.kode_sj}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.delivered_at || '-'}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{item.gudang_label}</TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">{item.narasi || '-'}</Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip size="small" label={`${item.total_items} item`} />
                          <Chip size="small" color="warning" label={`Sisa ${item.remaining_qty}`} />
                        </Stack>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          applyShipmentSelection(item);
                          setOpenShipmentModal(false);
                        }}
                      >
                        Pilih
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Paginate page={page} total={total} lastPage={lastPage} perPage={perPage} onPageChange={(value) => setShipmentParams((prev) => ({ ...prev, page: value }))} />
          <Button onClick={() => setOpenShipmentModal(false)} color="secondary">Tutup</Button>
        </DialogActions>
      </Dialog>
    </form>
  );
}
