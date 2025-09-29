'use client';

// REACT
import { Fragment, useCallback, useMemo, useState } from 'react';

// MATERIAL - UI
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CardActions from '@mui/material/CardActions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';

// COMPONENTS
import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import InputSkeleton from 'components/InputSkeleton';
import SelectForm from 'components/SelectForm';
import InputForm from 'components/InputForm';
import { APP_DEFAULT_PATH } from 'config';

// THIRD - PARTY
import * as Yup from 'yup';
import moment from 'moment';
import { AlignVertically, Calendar, Mobile, TruckTick, CloseSquare } from 'iconsax-react';
import { Formik, Form, FieldArray, useFormikContext } from 'formik';

// HOOK
import useDropdownOptions from 'hooks/useCustomOptions';

// SWR
import { useGetPemasokDelor } from 'api/pemasok';
import InputDateTime from 'components/InputDateTime';
import WaitOrderOption from './waitorder-option';

// REACT TABLE
import { useTable } from 'react-table';
import { EmptyTable } from 'components/third-party/ReactTable';
import InputAreaForm from 'components/InputAreaForm';
import BtnBack from 'components/BtnBack';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Delivery Order', to: '/delivery-order' },
  { title: 'Create', to: '/delivery-order/create' }
];

const initialValues = {
  do_date: moment().format('YYYY-MM-DD'),
  delivered_at: new Date().toISOString().slice(0, 16),
  est_received: new Date().toISOString().slice(0, 16),
  bisnis_id: '',
  pemasok_id: '',
  alamat_pemasok: '',
  phone_pemasok: '',
  createdby: '',
  narasi: '',
  via: '',
  type: '',
  jenis: '',
  forwarder: '',
  items: []
};

export default function CreateDeliveryOrderScreen() {
  const [openOption, setOpenOption] = useState(false);
  const [stateSelected, setStateSelected] = useState([]);
  //   const columns = DataColumn();

  //   console.log('setStateSelected.', stateSelected);

  const validationSchema = Yup.object().shape({
    do_date: Yup.date().required('Tanggal wajib diisi'),
    bisnis_id: Yup.string().required('Bisnis unit oleh harus terisi'),
    pemasok_id: Yup.string().required('Pemasok wajib diisi'),
    alamat_pemasok: Yup.string().required('Alamat pemasok wajib diisi'),
    phone_pemasok: Yup.string().required('Phone pemasok wajib diisi'),
    delivered_at: Yup.date().required('Tanggal estimasi kirim wajib diisi'),
    est_received: Yup.date().required('Tanggal estimasi tiba wajib diisi'),
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
    //     console.log('resp-api.', resp)
    //     openSnackbar(configToast)
    //     router.push('/logistik/delivery-order')
    // } catch (error) {
    //     console.log('err-api.', error);
    //     openSnackbar({...configToast, message: 'Gagal menyimpan data...', alert: {...configToast.alert}})
    // }
  };

  const toggleFilterHandle = () => {
    setOpenOption(!openOption);
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Create Delivery Order'} links={breadcrumbLinks} />
      <MainCard
        title={<BtnBack href={'/delivery-order'} />}
        secondary={
          <Button onClick={toggleFilterHandle} variant="contained" color="secondary">
            Tambah Items
          </Button>
        }
        content={true}
      >
        <Formik initialValues={initialValues} enableReinitialize={true} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
          {(formikProps) => {
            return (
              <MyFormikForm
                {...formikProps}
                data={formikProps.values.items}
                openOption={openOption}
                stateSelected={stateSelected}
                setStateSelected={setStateSelected}
                openFilterFn={toggleFilterHandle}
                component={
                  <CardActions>
                    <Button type="submit" variant="dashed" color="secondary" fullWidth>
                      Simpan
                    </Button>
                  </CardActions>
                }
              />
            );
          }}
        </Formik>
      </MainCard>
    </Fragment>
  );
}

const MyFormikForm = (props) => {
  const { errors, touched, values, handleBlur, handleChange, handleSubmit, setFieldValue, setFieldTouched } = useFormikContext();
  const { data, openOption, stateSelected, setStateSelected, openFilterFn, component } = props;

  const { bisnisOptions, jenisItemOptions, typeKirimOptions, viaKirimOptions } = useDropdownOptions();
  const { data: pemasok, dataLoading } = useGetPemasokDelor();

  const handlePemasokChange = (e, newValue) => {
    const newValues = {
      pemasok_id: newValue?.id || '',
      alamat_pemasok: newValue?.alamat || '',
      phone_pemasok: newValue?.phone || ''
    };

    // Batch update semua field sekaligus
    setFieldValue('pemasok_id', newValues.pemasok_id);
    setFieldValue('alamat_pemasok', newValues.alamat_pemasok);
    setFieldValue('phone_pemasok', newValues.phone_pemasok);
  };

  return (
    <Fragment>
      <Form noValidate onSubmit={handleSubmit}>
        <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start">
          <Grid item xs={12} sm={6} lg={6}>
            <SelectForm
              label="Bisnis Unit"
              labelId="bisnis-unit"
              name="bisnis_id"
              value={values.bisnis_id || ''}
              placeholder=""
              touched={touched}
              errors={errors}
              onBlur={handleBlur}
              onChange={handleChange}
              array={bisnisOptions}
            />
          </Grid>
          <Grid item xs={12} sm={3} lg={3}>
            <InputForm
              errors={errors}
              touched={touched}
              type={'date'}
              label={'Tanggal'}
              name={'do_date'}
              placeholder={'Tanggal'}
              value={values.do_date}
              onBlur={handleBlur}
              onChange={handleChange}
              startAdornment={<Calendar />}
            />
          </Grid>
          <Grid item xs={12} sm={3} lg={3}>
            <SelectForm
              label="Jenis"
              labelId="jenis-items"
              name="jenis"
              value={values.jenis || ''}
              placeholder=""
              touched={touched}
              errors={errors}
              onBlur={handleBlur}
              onChange={handleChange}
              array={jenisItemOptions}
            />
          </Grid>
          <Grid item xs={12} sm={3} lg={3}>
            <SelectForm
              label="Paket Pengiriman"
              labelId="paket-kirim"
              name="type"
              value={values.type || ''}
              placeholder=""
              touched={touched}
              errors={errors}
              onBlur={handleBlur}
              onChange={handleChange}
              array={typeKirimOptions}
            />
          </Grid>
          <Grid item xs={12} sm={3} lg={3}>
            <SelectForm
              label="Via Transportasi"
              labelId="via-kirim"
              name="via"
              value={values.via || ''}
              placeholder=""
              touched={touched}
              errors={errors}
              onBlur={handleBlur}
              onChange={handleChange}
              array={viaKirimOptions}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={6}>
            {dataLoading ? (
              <InputSkeleton height={30} />
            ) : (
              <Stack justifyContent="flex-start" alignItems="flex-start">
                <FormControl fullWidth variant="outlined">
                  <Autocomplete
                    fullWidth
                    options={pemasok}
                    value={pemasok.find((option) => option?.id === values.pemasok_id) || null}
                    onChange={handlePemasokChange}
                    onBlur={() => setFieldTouched('pemasok_id', true)}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    getOptionLabel={(option) => option.label || ''}
                    sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
                    renderOption={(props, option) => (
                      <li {...props} key={`${option.id}-${option.label}`}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {option.label}
                          </Typography>
                          <Typography variant="caption" color="text.primary">
                            {option.bisnis?.initial}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Pemasok"
                        error={Boolean(touched.pemasok_id && errors.pemasok_id)}
                        helperText={touched.pemasok_id && errors.pemasok_id}
                      />
                    )}
                  />
                </FormControl>
              </Stack>
            )}
          </Grid>
          <Grid item xs={12} sm={4} lg={4}>
            <InputForm
              type={'text'}
              label={'Phone'}
              name={'phone_pemasok'}
              placeholder={'Phone'}
              value={values.phone_pemasok}
              startAdornment={<Mobile />}
            />
          </Grid>
          <Grid item xs={12} sm={8} lg={8}>
            <InputForm
              type={'text'}
              label={'Alamat Pemasok'}
              name={'alamat_pemasok'}
              placeholder={'Alamat'}
              value={values.alamat_pemasok}
              startAdornment={<AlignVertically />}
            />
          </Grid>
          <Grid item xs={12} sm={4} lg={4}>
            <InputDateTime
              name="delivered_at"
              label="Waktu Pengiriman"
              value={values.delivered_at}
              errors={errors}
              touched={touched}
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4} lg={4}>
            <InputDateTime
              name="est_received"
              label="Estimasi Tiba"
              value={values.est_received}
              errors={errors}
              touched={touched}
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4} lg={4}>
            <InputForm
              type={'text'}
              label={'Forwarder'}
              name={'forwarder'}
              placeholder={'Forwarder'}
              touched={touched}
              errors={errors}
              value={values.forwarder}
              onChange={handleChange}
              startAdornment={<AlignVertically />}
            />
          </Grid>
          <Grid item xs={12} sm={12} lg={12}>
            <InputAreaForm
              rows={5}
              type={'text'}
              label={'Keterangan'}
              name={'narasi'}
              placeholder={'Tuliskan keterangan atau narasi'}
              touched={touched}
              errors={errors}
              value={values.narasi}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
        <FieldArray name="items">
          {({ push, remove }) => {
            return (
              <>
                <WaitOrderOption
                  data={null}
                  remove={remove}
                  push={push}
                  stateSelected={stateSelected}
                  setStateSelected={setStateSelected}
                  pemasok={values.pemasok_id}
                  setData={openFilterFn}
                  open={openOption}
                  onClose={openFilterFn}
                />
                <Grid container sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={12} lg={12}>
                    <MainCard content={false} title={<Typography>List Item Pilihan</Typography>}>
                      <TableDataOption data={data} values={values} setFieldValue={setFieldValue} remove={remove} />
                    </MainCard>
                  </Grid>
                </Grid>
              </>
            );
          }}
        </FieldArray>
        <Stack>{component}</Stack>
      </Form>
    </Fragment>
  );
};

const TableDataOption = ({ data, values, setFieldValue, remove }) => {
  const columns = DataColumn({ values, setFieldValue, remove });
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    columns,
    data
  });

  return (
    <Table {...getTableProps()}>
      <TableHead sx={{ borderTopWidth: 2 }}>
        {headerGroups.map((headerGroup) => {
          const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
          return (
            <TableRow key={key} {...restHeaderGroupProps}>
              {headerGroup.headers.map((column) => {
                const { key: columnKey, ...restColumnProps } = column.getHeaderProps();
                return (
                  <TableCell key={columnKey} {...restColumnProps}>
                    {column.render('Header')}
                    {column.canFilter ? <div>{column.render('Filter')}</div> : null}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableHead>
      <TableBody {...getTableBodyProps()}>
        {rows.length > 0 ? (
          rows.map((row) => {
            prepareRow(row);
            const { key, ...restRowProps } = row.getRowProps();
            return (
              <TableRow key={key} {...restRowProps}>
                {row.cells.map((cell) => {
                  const { key: cellKey, ...restCellProps } = cell.getCellProps();
                  return (
                    <TableCell key={cellKey} {...restCellProps}>
                      {cell.render('Cell')}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })
        ) : (
          <EmptyTable msg="No Data" colSpan={headerGroups[0]?.headers?.length || 12} />
        )}
      </TableBody>
    </Table>
  );
};

function DataColumn({ values, setFieldValue, remove }) {
  const column = useMemo(
    () => [
      {
        Header: () => <div style={{ textAlign: 'center', maxWidth: 5 }}>No</div>,
        accessor: 'index',
        Cell: ({ row }) => <div style={{ width: '5px' }}>{row.index + 1}.</div>
      },
      {
        Header: 'Narasi',
        id: 'narasi',
        accessor: 'narasi',
        Cell: ({ row }) => {
          const { narasi, barang } = row.original;
          return (
            <Stack>
              <Typography variant="body1">{narasi}</Typography>
              <Typography variant="caption">{barang?.kode}</Typography>
            </Stack>
          );
        }
      },
      {
        Header: 'Order',
        id: 'order',
        accessor: 'kategori',
        minWidth: 300, // lebar minimum
        Cell: ({ row }) => {
          const { qty_do, satuan } = row.original;
          return (
            <Typography variant="body1">
              {qty_do} {satuan}
            </Typography>
          );
        }
      },
      {
        Header: 'Berkas',
        id: 'berkas',
        accessor: 'kode_po',
        Cell: ({ row }) => {
          const { kode_po, kode_pd, kode_transfer } = row.original;
          return <Typography variant="body1">{kode_po || kode_pd || kode_transfer}</Typography>;
        }
      },
      {
        Header: () => <div style={{ textAlign: 'right' }}>Perintah Pickup</div>,
        id: 'perintahpickup',
        minWidth: 100,
        Cell: ({ row }) => {
          const itemId = row.original.id;
          const handleChange = useCallback(
            (e) => {
              const newValue = e.target.value;
              const index = values.items.findIndex((item) => item.id === itemId);
              setFieldValue(`items[${index}].pickup`, newValue);
            },
            [values.items, itemId, setFieldValue]
          );

          const pickupValue = values.items.find((item) => item.id === itemId)?.pickup || '';

          return (
            <div style={{ textAlign: 'right' }}>
              <InputForm
                type="number"
                label="Qty Pickup"
                name={`pickup-${itemId}`}
                placeholder="Pickup"
                value={pickupValue}
                onChange={handleChange}
                startAdornment={<TruckTick />}
              />
            </div>
          );
        }
      },
      {
        Header: 'Act',
        id: 'action',
        Cell: ({ row }) => {
          const itemId = row.original.id;
          const index = values.items.findIndex((item) => item.id === itemId);
          return (
            <IconButton
              shape="rounded"
              color="error"
              onClick={() => {
                if (index !== -1) {
                  remove(index); // ✅ sekarang remove tersedia
                }
              }}
            >
              <CloseSquare />
            </IconButton>
          );
        }
      }
    ],
    [values.items, setFieldValue]
  );

  return column;
}
