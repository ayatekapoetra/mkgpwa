'use client';

import { Fragment, useState } from 'react';
import moment from 'moment';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { CloseSquare, Edit2, TickSquare, Timer } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Paginate from 'components/Paginate';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import { useGetGudang } from 'api/gudang';
import { useGetRacks, updateRackCycleTime } from 'api/rack';

moment.locale('id');

export default function RackCycleTimeScreen() {
  const { data: gudangRows, dataLoading: gudangLoading } = useGetGudang();
  const [filters, setFilters] = useState({ page: 1, perPage: 25 });
  const { rows, total, page, perPage, dataLoading, mutate } = useGetRacks(filters);
  const [editing, setEditing] = useState(null);
  const [cycleInput, setCycleInput] = useState('');

  const handleOpenEdit = (row) => {
    setEditing(row.id);
    setCycleInput(row.cycle_time_days == null ? '' : String(row.cycle_time_days));
  };

  const handleSave = async (row) => {
    try {
      const cycle = cycleInput === '' ? null : Number(cycleInput);
      await updateRackCycleTime(row.id, { cycle_time_days: cycle });
      openNotification({ title: 'success', message: 'Cycle time rack berhasil diperbarui', alert: { color: 'success' } });
      setEditing(null);
      mutate();
    } catch (error) {
      openNotification({
        title: 'error',
        message: error?.response?.data?.message || error?.message || 'Gagal memperbarui cycle time',
        alert: { color: 'error' }
      });
    }
  };

  const handleResetOpname = async (row) => {
    try {
      await updateRackCycleTime(row.id, { reset_opname: true });
      openNotification({ title: 'success', message: 'Waktu stockopname rack di-reset', alert: { color: 'success' } });
      mutate();
    } catch (error) {
      openNotification({
        title: 'error',
        message: error?.response?.data?.message || error?.message || 'Gagal reset waktu stockopname',
        alert: { color: 'error' }
      });
    }
  };

  return (
    <Fragment>
      <Breadcrumbs
        custom
        heading="Rack Cycle Time"
        links={[
          { title: 'Home', to: APP_DEFAULT_PATH },
          { title: 'Rack Cycle Time', to: '/warehouse/racks' }
        ]}
      />
      <MainCard content>
        <Stack spacing={3}>
          <Autocomplete
            options={gudangRows || []}
            value={(gudangRows || []).find((item) => String(item.id) === String(filters.gudang_id || '')) || null}
            loading={gudangLoading}
            getOptionLabel={(option) => `${option.kode || '-'} - ${option.nama || '-'}`}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
            onChange={(_, option) => setFilters((prev) => ({ ...prev, page: 1, gudang_id: option?.id || '' }))}
            renderInput={(params) => <TextField {...params} label="Filter Gudang" size="small" />}
            sx={{ maxWidth: 360 }}
          />

          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 1000, whiteSpace: 'nowrap' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Kode Rack</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Nama</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Gudang</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Cycle Time (hari)</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Terakhir Stockopname</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Jatuh Tempo</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Status</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Tidak ada data rack.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {row.kode || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.nama || '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.gudang_kode ? `${row.gudang_kode} - ${row.gudang_nama || ''}` : '-'}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {editing === row.id ? (
                          <TextField
                            size="small"
                            type="number"
                            value={cycleInput}
                            onChange={(e) => setCycleInput(e.target.value)}
                            inputProps={{ min: 0 }}
                            sx={{ width: 100 }}
                          />
                        ) : row.cycle_time_days == null ? (
                          <Typography variant="body2" color="text.secondary">
                            Tidak wajib
                          </Typography>
                        ) : (
                          <Typography variant="body2">{row.cycle_time_days} hari</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.last_opname_at ? moment(row.last_opname_at).format('DD-MM-YYYY HH:mm') : '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.next_due_at ? moment(row.next_due_at).format('DD-MM-YYYY HH:mm') : '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {row.locked ? (
                          <Chip size="small" label="Terkunci" color="error" />
                        ) : (
                          <Chip size="small" label="Aman" color="success" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {editing === row.id ? (
                            <>
                              <Tooltip title="Simpan">
                                <IconButton size="small" color="success" onClick={() => handleSave(row)}>
                                  <TickSquare size={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Batal">
                                <IconButton size="small" color="secondary" onClick={() => setEditing(null)}>
                                  <CloseSquare size={18} />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              <Tooltip title="Set Cycle Time">
                                <IconButton size="small" color="primary" onClick={() => handleOpenEdit(row)}>
                                  <Edit2 size={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reset Stockopname">
                                <IconButton size="small" color="warning" onClick={() => handleResetOpname(row)}>
                                  <Timer size={18} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
          <Paginate page={page} total={total} lastPage={Math.ceil(total / perPage)} perPage={perPage} onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))} />
        </Stack>
      </MainCard>
    </Fragment>
  );
}

