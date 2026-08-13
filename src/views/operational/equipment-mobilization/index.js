'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import moment from 'moment';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Eye, Filter } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Paginate from 'components/Paginate';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import {
  MOBILIZATION_STATUS_COLOR,
  MOBILIZATION_STATUS_LABEL,
  useEquipmentMobilizationAccess,
  useGetEquipmentMobilizations
} from 'api/equipment-mobilization';
import FilterEquipmentMobilization from './filter';

moment.locale('id');

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Equipment Mobilization', to: '/mobilisasi-equipments' }
];

const pickName = (...values) => values.find((v) => !!v) || '-';

export default function EquipmentMobilizationScreen() {
  const { permissions, accessLoading } = useEquipmentMobilizationAccess();
  const [openFilter, setOpenFilter] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: '',
    movement_date_start: '',
    movement_date_end: '',
    origin_branch_id: '',
    destination_branch_id: '',
    origin_tenant_id: '',
    destination_tenant_id: '',
    equipment_id: ''
  });

  const { data, dataLoading, dataError } = useGetEquipmentMobilizations(filters);
  const rows = data?.data || [];

  const summary = useMemo(() => {
    const base = { all: rows.length, DRAFT: 0, OPEN: 0, ARRIVED: 0, unitTotal: 0, unitArrived: 0 };
    rows.forEach((row) => {
      const status = String(row.status || '').toUpperCase();
      if (base[status] !== undefined) base[status] += 1;
      base.unitTotal += Number(row.item_count || 0);
      base.unitArrived += Number(row.arrived_count || 0);
    });
    base.unitPercent = base.unitTotal > 0 ? Math.round((base.unitArrived / base.unitTotal) * 100) : 0;
    return base;
  }, [rows]);

  const canCreate = !accessLoading && permissions?.can_insert !== false;

  return (
    <Fragment>
      <Breadcrumbs custom heading="Equipment Mobilization" links={breadcrumbLinks} />
      <MainCard
        title={
          canCreate ? (
            <Button variant="contained" component={Link} href="/mobilisasi-equipments/create">
              Buat Dokumen
            </Button>
          ) : (
            'Daftar Mobilisasi'
          )
        }
        secondary={
          <Tooltip title="Filter">
            <IconButton color="secondary" onClick={() => setOpenFilter(true)}>
              <Filter />
            </IconButton>
          </Tooltip>
        }
        content={false}
      >
        <Box sx={{ px: 2.5, pt: 2.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
            {[
              { label: 'Total', value: summary.all, color: 'primary' },
              { label: 'Draft', value: summary.DRAFT, color: 'default' },
              { label: 'Open', value: summary.OPEN, color: 'info' },
              { label: 'Tiba', value: summary.ARRIVED, color: 'success' }
            ].map((item) => (
              <Box
                key={item.label}
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper'
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h4">{item.value}</Typography>
              </Box>
            ))}
          </Stack>
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progress unit (halaman ini)
              </Typography>
              <Typography variant="caption" fontWeight={700}>
                {summary.unitPercent}% tiba ({summary.unitArrived}/{summary.unitTotal})
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={summary.unitPercent} sx={{ height: 8, borderRadius: 999 }} />
          </Box>
        </Box>

        {dataError ? (
          <Alert severity="warning" sx={{ m: 2 }}>
            Gagal memuat data mobilisasi.
          </Alert>
        ) : dataLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Stack>
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <Table sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">Aksi</TableCell>
                    <TableCell>No. Dokumen</TableCell>
                    <TableCell>Mulai</TableCell>
                    <TableCell>Asal</TableCell>
                    <TableCell>Tujuan</TableCell>
                    <TableCell align="center">Unit</TableCell>
                    <TableCell align="center">Progress</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          Belum ada dokumen mobilisasi
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => {
                      const status = String(row.status || '').toUpperCase();
                      const origin = `${pickName(row.origin_tenant?.nama, row.originTenant?.nama)} · ${pickName(row.origin_branch?.nama, row.originBranch?.nama)}`;
                      const destination = `${pickName(row.destination_tenant?.nama, row.destinationTenant?.nama)} · ${pickName(row.destination_branch?.nama, row.destinationBranch?.nama)}`;
                      const itemCount = Number(row.item_count || 0);
                      const arrivedCount = Number(row.arrived_count || 0);
                      const percent = itemCount > 0 ? Math.round((arrivedCount / itemCount) * 100) : 0;

                      return (
                        <TableRow key={row.id} hover>
                          <TableCell align="center">
                            <Tooltip title="Detail">
                              <IconButton
                                component={Link}
                                href={`/mobilisasi-equipments/${row.id}`}
                                color="primary"
                                size="small"
                              >
                                <Eye />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">{row.document_no || `-`}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.notes || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {row.started_at || row.movement_date
                              ? moment(row.started_at || row.movement_date).format('DD MMM YYYY HH:mm')
                              : '-'}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 220 }}>
                            <Typography variant="body2" noWrap title={origin}>
                              {origin}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 220 }}>
                            <Typography variant="body2" noWrap title={destination}>
                              {destination}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{itemCount}</TableCell>
                          <TableCell align="center" sx={{ minWidth: 140 }}>
                            <Typography variant="caption">
                              {arrivedCount}/{itemCount} ({percent}%)
                            </Typography>
                            <LinearProgress variant="determinate" value={percent} sx={{ mt: 0.5, height: 6, borderRadius: 999 }} />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={MOBILIZATION_STATUS_LABEL[status] || status || '-'}
                              color={MOBILIZATION_STATUS_COLOR[status] || 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>

            <Box sx={{ p: 2 }}>
              <Paginate
                page={data?.page || 1}
                lastPage={data?.lastPage || 1}
                total={data?.total || 0}
                perPage={data?.perPage || filters.limit || 20}
                onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
              />
            </Box>
          </Stack>
        )}
      </MainCard>

      <FilterEquipmentMobilization
        open={openFilter}
        onClose={() => setOpenFilter(false)}
        data={filters}
        setData={setFilters}
        count={data?.total || 0}
      />
    </Fragment>
  );
}
