'use client';

import { useEffect, useMemo, useState } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import Slide from '@mui/material/Slide';
import IconButton from '@mui/material/IconButton';
import { Add, Category2, HambergerMenu, SearchNormal1 } from 'iconsax-react';
import { useGetReadyShip } from 'api/shipping-order';
import { useGetGudang } from 'api/gudang';
import OptionCabang from 'components/OptionCabang';
import Paginate from 'components/Paginate';

export default function FormikFormCreate({
  values,
  errors,
  touched,
  handleChange,
  handleSubmit,
  setFieldValue,
  setFieldTouched,
  isSubmitting
}) {
  const [openModal, setOpenModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchInput, setSearchInput] = useState('');
  const [pickerParams, setPickerParams] = useState({ page: 1, perPage: 12, search: '', kodeDo: '' });
  const {
    data: readyItems,
    deliveryOrderOptions,
    dataLoading: itemsLoading,
    dataError: itemsError,
    page: pickerPage,
    total: pickerTotal,
    lastPage: pickerLastPage,
    perPage: pickerPerPage
  } = useGetReadyShip(pickerParams, openModal);
  const { data: gudangRows, dataLoading: gudangLoading, dataError: gudangError } = useGetGudang();
  const selectedGudang = useMemo(
    () => gudangRows.find((item) => String(item.id) === String(values.gudang_rec)) || null,
    [gudangRows, values.gudang_rec]
  );
  const selectedItemIds = useMemo(() => new Set(values.items.map((item) => item.doitem_id)), [values.items]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPickerParams((prev) => (prev.search === searchInput ? prev : { ...prev, page: 1, search: searchInput }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSelectItem = (item) => {
    const exists = selectedItemIds.has(item.id);
    if (exists) return;

    const newItem = {
      doitem_id: item.id,
      wait_id: item.wait_id,
      barang_id: item.barang_id,
      keterangan: item.keterangan,
      satuan: item.satuan,
      qty_pickup: item.qty_pickup,
      qty_send: item.qty_send || 0,
      qty_available: Number(item.sisa_kirim ?? 0),
      qty_kirim: Number(item.sisa_kirim ?? 0),
      multi: 'N',
      kode_barang: item.barang?.kode || '-',
      num_part: item.barang?.num_part || '-',
      pemasok: item.supplier?.nama || item.dataroot?.pemasok?.nama || '-',
      kode_doc: item.kode_doc || '-',
      source_code: item.source?.code || '-',
      source_type: item.source?.label || '-',
      gudang_pemesan: item.requesting_warehouse?.nama || '-'
    };

    setFieldValue('items', [...values.items, newItem]);
  };

  const handleSelectAllItems = () => {
    const newItems = readyItems
      .filter((item) => !selectedItemIds.has(item.id))
      .map((item) => ({
        doitem_id: item.id,
        wait_id: item.wait_id,
        barang_id: item.barang_id,
        keterangan: item.keterangan,
        satuan: item.satuan,
        qty_pickup: item.qty_pickup,
        qty_send: item.qty_send || 0,
        qty_available: Number(item.sisa_kirim ?? 0),
        qty_kirim: Number(item.sisa_kirim ?? 0),
        multi: 'N',
        kode_barang: item.barang?.kode || '-',
        num_part: item.barang?.num_part || '-',
        pemasok: item.supplier?.nama || item.dataroot?.pemasok?.nama || '-',
        kode_doc: item.kode_doc || '-',
        source_code: item.source?.code || '-',
        source_type: item.source?.label || '-',
        gudang_pemesan: item.requesting_warehouse?.nama || '-'
      }));

    if (newItems.length === 0) return;

    setFieldValue('items', [...values.items, ...newItems]);
  };

  const handleRemoveItem = (index) => {
    const newItems = values.items.filter((_, i) => i !== index);
    setFieldValue('items', newItems);
  };

  const handleMultiChange = (index) => {
    const newItems = [...values.items];
    newItems[index] = { ...newItems[index], multi: newItems[index].multi === 'Y' ? 'N' : 'Y' };
    setFieldValue('items', newItems);
  };

  return (
    <form noValidate onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom color="primary">
              Data Pengirim
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Tanggal"
                type="date"
                name="trx_date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={values.trx_date}
                onChange={handleChange}
                error={touched.trx_date && Boolean(errors.trx_date)}
                helperText={touched.trx_date && errors.trx_date}
              />
              <TextField
                label="Nama Pengirim"
                name="nm_pengirim"
                size="small"
                fullWidth
                value={values.nm_pengirim}
                onChange={handleChange}
                error={touched.nm_pengirim && Boolean(errors.nm_pengirim)}
                helperText={touched.nm_pengirim && errors.nm_pengirim}
              />
              <OptionCabang
                label="Cabang"
                name="cabang_src"
                value={values.cabang_src}
                setFieldValue={setFieldValue}
                error={errors.cabang_src}
                touched={touched.cabang_src}
              />
              <TextField
                label="Phone Pengirim"
                name="phone_pengirim"
                size="small"
                fullWidth
                value={values.phone_pengirim}
                onChange={handleChange}
              />
              <TextField
                label="Alamat Pengirim"
                name="alamat_pengirim"
                size="small"
                fullWidth
                multiline
                rows={3}
                value={values.alamat_pengirim}
                onChange={handleChange}
              />
            </Stack>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom color="error">
              Data Penerima
            </Typography>
            <Stack spacing={2}>
              <Autocomplete
                options={gudangRows}
                value={selectedGudang}
                loading={gudangLoading}
                onChange={(_, newValue) => setFieldValue('gudang_rec', newValue?.id || '')}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                getOptionLabel={(option) => `${option.kode || '-'} - ${option.nama || '-'}`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Gudang Tujuan"
                    error={touched.gudang_rec && Boolean(errors.gudang_rec || gudangError)}
                    helperText={(touched.gudang_rec && errors.gudang_rec) || (gudangError ? 'Gagal memuat data gudang' : '')}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {gudangLoading ? <CircularProgress color="inherit" size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
              <TextField
                label="Nama Penerima"
                name="nm_penerima"
                size="small"
                fullWidth
                value={values.nm_penerima}
                onChange={handleChange}
                error={touched.nm_penerima && Boolean(errors.nm_penerima)}
                helperText={touched.nm_penerima && errors.nm_penerima}
              />
              <TextField
                label="Phone Penerima"
                name="phone_penerima"
                size="small"
                fullWidth
                value={values.phone_penerima}
                onChange={handleChange}
                error={touched.phone_penerima && Boolean(errors.phone_penerima)}
                helperText={touched.phone_penerima && errors.phone_penerima}
              />
              <TextField
                label="Alamat Penerima"
                name="alamat_penerima"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={values.alamat_penerima}
                onChange={handleChange}
                error={touched.alamat_penerima && Boolean(errors.alamat_penerima)}
                helperText={touched.alamat_penerima && errors.alamat_penerima}
              />
              <TextField
                label="Keterangan Pengiriman"
                name="keterangan"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={values.keterangan}
                onChange={handleChange}
              />
            </Stack>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1">Items Kiriman</Typography>
              <Button variant="contained" color="warning" size="small" startIcon={<Add />} onClick={() => setOpenModal(true)}>
                Tambah Items
              </Button>
            </Stack>
            {values.items.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Belum ada item. Klik "Tambah Items" untuk memilih item pickup.
              </Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ACT</TableCell>
                      <TableCell>Account Code</TableCell>
                      <TableCell>Keterangan</TableCell>
                      <TableCell>Pemasok</TableCell>
                      <TableCell align="right">Pickup</TableCell>
                      <TableCell align="right">Jumlah Kirim</TableCell>
                      <TableCell align="center">Multi Dest</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {values.items.map((item, index) => {
                      const qtyError = errors.items?.[index]?.qty_kirim;
                      const qtyTouched = touched.items?.[index]?.qty_kirim;
                      const fieldName = `items.${index}.qty_kirim`;
                      return (
                      <TableRow key={item.doitem_id} hover>
                        <TableCell>
                          <Button size="small" color="error" variant="text" onClick={() => handleRemoveItem(index)}>
                            X
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.kode_barang}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.num_part}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.keterangan}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.kode_doc}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.pemasok}</TableCell>
                        <TableCell align="right">{item.qty_pickup} {item.satuan}</TableCell>
                        <TableCell align="right">
                           <TextField
                            name={fieldName}
                             type="number"
                             size="small"
                             value={item.qty_kirim}
                            onChange={(e) => setFieldValue(fieldName, e.target.value === '' ? '' : Number(e.target.value))}
                            onBlur={() => setFieldTouched(fieldName, true)}
                            error={Boolean(qtyTouched && qtyError)}
                            helperText={qtyTouched && qtyError}
                             sx={{ width: 100 }}
                            inputProps={{ min: 0, max: item.qty_available, step: 0.01 }}
                           />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant={item.multi === 'Y' ? 'contained' : 'outlined'}
                            color={item.multi === 'Y' ? 'warning' : 'secondary'}
                            onClick={() => handleMultiChange(index)}
                          >
                            {item.multi}
                          </Button>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
            {typeof errors.items === 'string' && touched.items && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {errors.items}
              </Typography>
            )}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider />
          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 2 }}>
            <Button variant="outlined" color="secondary" onClick={() => window.history.back()}>
              Batal
            </Button>
            <Button variant="contained" color="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Submit'}
            </Button>
          </Stack>
        </Grid>
      </Grid>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        fullScreen
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
      >
        <DialogTitle sx={{ px: 3, py: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1.5}>
            <Box>
              <Typography variant="h4">Pilih Item Shipping</Typography>
              <Typography variant="caption" color="text.secondary">
                {pickerTotal} item siap dikirim
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <ToggleButtonGroup
                size="small"
                exclusive
                value={viewMode}
                onChange={(_, value) => value && setViewMode(value)}
                color="primary"
              >
                <ToggleButton value="grid"><Category2 size={17} />&nbsp;Grid</ToggleButton>
                <ToggleButton value="list"><HambergerMenu size={17} />&nbsp;List</ToggleButton>
              </ToggleButtonGroup>
              <IconButton color="error" onClick={() => setOpenModal(false)}>
                <Add style={{ transform: 'rotate(45deg)' }} />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <Autocomplete
              size="small"
              options={deliveryOrderOptions}
              value={deliveryOrderOptions.find((option) => option.kode === pickerParams.kodeDo) || null}
              onChange={(_, newValue) => setPickerParams((prev) => ({ ...prev, page: 1, kodeDo: newValue?.kode || '' }))}
              isOptionEqualToValue={(option, value) => option.kode === value?.kode}
              getOptionLabel={(option) => option?.kode || ''}
              noOptionsText="Tidak ada kode DO"
              sx={{ minWidth: { xs: '100%', md: 280 } }}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.kode}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700}>{option.kode}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {option.pemasok_nama || '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {truncateText(option.narasi, 50) || '-'}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => <TextField {...params} label="Kode DO" placeholder="Semua Kode DO" />}
            />

            <TextField
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari nama barang, kode PO, gudang, delivery order, part number, atau field lain..."
              size="small"
              fullWidth
              autoFocus
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchNormal1 size={18} /></InputAdornment>
              }}
            />

            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 120 } }}>
              <InputLabel id="shipping-per-page-label">Per Page</InputLabel>
              <Select
                labelId="shipping-per-page-label"
                value={pickerParams.perPage}
                label="Per Page"
                onChange={(event) => setPickerParams((prev) => ({ ...prev, page: 1, perPage: Number(event.target.value) }))}
              >
                <MenuItem value={12}>12</MenuItem>
                <MenuItem value={24}>24</MenuItem>
                <MenuItem value={36}>36</MenuItem>
                <MenuItem value={48}>48</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              color="success"
              onClick={handleSelectAllItems}
              disabled={readyItems.length === 0 || readyItems.every((item) => selectedItemIds.has(item.id))}
              sx={{ minWidth: { xs: '100%', md: 140 } }}
            >
              Select All
            </Button>
          </Stack>

          {itemsError ? (
            <Alert severity="warning">
              {itemsError?.diagnostic?.error || itemsError?.message || 'Gagal memuat item yang siap dikirim. Silakan coba kembali.'}
            </Alert>
          ) : itemsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={30} /></Box>
          ) : readyItems.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5">Tidak ada item tersedia</Typography>
              <Typography variant="body2" color="text.secondary">Ubah kata pencarian atau periksa dokumen pickup terkait.</Typography>
            </Box>
          ) : viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {readyItems.map((item) => (
                <Grid item xs={12} sm={6} lg={4} xl={3} key={item.id}>
                  <ReadyItemCard
                    item={item}
                    selected={selectedItemIds.has(item.id)}
                    onSelect={handleSelectItem}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ACT</TableCell>
                    <TableCell>Dokumen Asal</TableCell>
                    <TableCell>Barang</TableCell>
                    <TableCell>Delivery Order / Pemasok</TableCell>
                    <TableCell align="right">Qty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {readyItems.map((item) => (
                    <ReadyItemRow
                      key={item.id}
                      item={item}
                      selected={selectedItemIds.has(item.id)}
                      onSelect={handleSelectItem}
                    />
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ display: 'block', px: 3, py: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" gap={2}>
            <Box sx={{ flex: 1, minWidth: 0, overflowX: 'auto' }}>
              <Paginate
                page={pickerPage}
                total={pickerTotal}
                lastPage={pickerLastPage}
                perPage={pickerPerPage}
                onPageChange={(page) => setPickerParams((prev) => ({ ...prev, page }))}
              />
            </Box>
            <Button onClick={() => setOpenModal(false)} color="secondary" variant="outlined">Tutup</Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </form>
  );
}

function ReadyItemCard({ item, selected, onSelect }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderColor: selected ? 'success.main' : 'divider',
        bgcolor: selected ? 'success.lighter' : 'background.paper',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': { borderColor: selected ? 'success.main' : 'primary.main', boxShadow: 3 }
      }}
    >
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box>
            <Typography variant="caption" color="text.secondary">{item.source?.label || 'Dokumen Asal'}</Typography>
            <Typography variant="h5" color="primary.main">{item.source?.code || '-'}</Typography>
          </Box>
          <Stack spacing={0.75} alignItems="flex-end">
            <Chip size="small" variant="outlined" color="primary" label={`DO: ${getDeliveryOrderCode(item)}`} />
            <Chip size="small" color={item.is_pickup === 'Y' ? 'warning' : 'info'} label={item.is_pickup === 'Y' ? 'Via Pickup' : 'Direct Ship'} />
          </Stack>
        </Stack>

        <InfoBlock label="Dipesan oleh gudang" primary={`${item.requesting_warehouse?.kode || '-'} - ${item.requesting_warehouse?.nama || '-'}`} />
        <Divider />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1">{item.barang?.nama || item.keterangan || '-'}</Typography>
          <Typography variant="body2" color="text.secondary">{item.barang?.kode || '-'} · Part {item.barang?.num_part || '-'}</Typography>
          <Typography variant="caption" color="text.secondary">{item.keterangan || '-'}</Typography>
        </Box>
        <InfoBlock label="Delivery Order" primary={getDeliveryOrderCode(item)} secondary={item.supplier?.nama || '-'} />

        <Stack direction="row" justifyContent="space-between" sx={{ bgcolor: 'action.hover', borderRadius: 1.5, p: 1.25 }}>
          <QtyInfo label="DO" value={item.qty_pickup} unit={item.satuan} />
          <QtyInfo label={item.is_pickup === 'Y' ? 'Picked' : 'Available'} value={item.qty_available} unit={item.satuan} />
          <QtyInfo label="Sisa Kirim" value={item.sisa_kirim} unit={item.satuan} highlight />
        </Stack>

        <Button fullWidth variant={selected ? 'outlined' : 'contained'} color={selected ? 'success' : 'warning'} disabled={selected} onClick={() => onSelect(item)}>
          {selected ? 'Sudah Dipilih' : 'Pilih Item'}
        </Button>
      </CardContent>
    </Card>
  );
}

function ReadyItemRow({ item, selected, onSelect }) {
  return (
    <TableRow hover selected={selected}>
      <TableCell>
        <Button size="small" variant={selected ? 'outlined' : 'contained'} color={selected ? 'success' : 'warning'} disabled={selected} onClick={() => onSelect(item)}>
          {selected ? 'Dipilih' : 'Pilih'}
        </Button>
      </TableCell>
      <TableCell sx={{ minWidth: 220 }}>
        <Chip size="small" variant="outlined" label={item.source?.label || '-'} sx={{ mb: 0.5 }} />
        <Typography variant="body2" fontWeight={700}>{item.source?.code || '-'}</Typography>
        <Typography variant="caption" color="text.secondary">
          Gudang: {item.requesting_warehouse?.kode || '-'} - {item.requesting_warehouse?.nama || '-'}
        </Typography>
      </TableCell>
      <TableCell sx={{ minWidth: 240 }}>
        <Typography variant="body2" fontWeight={700}>{item.barang?.nama || item.keterangan || '-'}</Typography>
        <Typography variant="caption" color="text.secondary">{item.barang?.kode || '-'} · {item.barang?.num_part || '-'}</Typography>
      </TableCell>
      <TableCell sx={{ minWidth: 210 }}>
        <Typography variant="body2" fontWeight={700}>{getDeliveryOrderCode(item)}</Typography>
        <Typography variant="caption" color="text.secondary">{item.supplier?.nama || '-'}</Typography>
      </TableCell>
      <TableCell align="right" sx={{ minWidth: 170 }}>
        <Typography variant="body2">DO: {item.qty_pickup} {item.satuan}</Typography>
        <Typography variant="body2" color="primary.main" fontWeight={700}>Sisa: {item.sisa_kirim} {item.satuan}</Typography>
        <Typography variant="caption" color="text.secondary">{item.is_pickup === 'Y' ? 'Berdasarkan pickup' : 'Direct shipping'}</Typography>
      </TableCell>
    </TableRow>
  );
}

function InfoBlock({ label, primary, secondary }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={700}>{primary}</Typography>
      {secondary ? <Typography variant="caption" color="text.secondary">{secondary}</Typography> : null}
    </Box>
  );
}

function getDeliveryOrderCode(item) {
  return item.dataroot?.kode || item.kode_doc || '-';
}

function truncateText(text, maxLength = 50) {
  const value = String(text || '').trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

function QtyInfo({ label, value, unit, highlight = false }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" color={highlight ? 'primary.main' : 'text.primary'} fontWeight={700}>{value ?? 0} {unit}</Typography>
    </Box>
  );
}
