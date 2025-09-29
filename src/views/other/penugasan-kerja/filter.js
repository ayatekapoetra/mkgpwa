'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardActions from '@mui/material/CardActions';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';

// COMPONENTS
import MainCard from 'components/MainCard';

// ASSETS
import { Add, CodeCircle, CalendarCircle } from 'iconsax-react';
import InputSearch from 'components/InputSearch';
import SelectSearch from 'components/SelectSearch';
import { useGetAssigner, useGetKaryawan } from 'api/karyawan';

export default function FilterPenugasanKerja({ count, open, onClose, data, setData, anchor = 'right' }) {
  const { data: assigner, dataLoading: assignerLoad } = useGetAssigner();
  const { data: karyawan, dataLoading: assignedLoad } = useGetKaryawan();

  return (
    <div>
      <SwipeableDrawer anchor={anchor} onClose={onClose} open={open}>
        <Stack p={1} sx={{ maxWidth: anchor == 'right' ? '400px' : '100vw' }}>
          <MainCard content={true} title={<HeaderFilter count={count} onClose={onClose} />}>
            <Grid container spacing={1} alignItems="flex-start" justifyContent="flex-start">
              <Grid item xs={12} sm={12} lg={12}>
                <SelectSearch
                  name={'type'}
                  label={'Type Penugasan'}
                  value={data.type}
                  onChange={(e) => setData((prev) => ({ ...prev, type: e.target.value }))}
                  array={[
                    { key: 'equipment', teks: 'Equipment' },
                    { key: 'karyawan', teks: 'Karyawan' }
                  ]}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mt: 1.5 }}>
                <InputSearch
                  size="medium"
                  type="text"
                  label={'Kode'}
                  value={data['kode']}
                  startAdornment={<CodeCircle />}
                  onChange={(e) => setData({ ...data, kode: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mt: 1.5 }}>
                <InputSearch
                  label={'Mulai Tanggal'}
                  size="medium"
                  type="date"
                  startAdornment={<CalendarCircle />}
                  value={data['startDate']}
                  onChange={(e) => setData({ ...data, startDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mt: 1.5 }}>
                <InputSearch
                  label={'Hingga Tanggal'}
                  size="medium"
                  type="date"
                  startAdornment={<CalendarCircle />}
                  value={data['endDate']}
                  onChange={(e) => setData({ ...data, endDate: e.target.value })}
                />
              </Grid>
              {!assignerLoad && (
                <Grid item xs={12} sm={12} lg={12}>
                  <Stack mt={2} justifyContent="flex-start" alignItems="flex-start">
                    <FormControl fullWidth variant="outlined">
                      <Autocomplete
                        fullWidth
                        options={assigner}
                        value={assigner?.find((option) => option?.id == data.assigner_id) || null}
                        onChange={(e, newValue) => {
                          setData((prev) => ({ ...prev, assigner_id: newValue?.id || '' }));
                        }}
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        getOptionLabel={(option) => option.nama || ''}
                        sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
                        renderOption={(props, option) => (
                          <li {...props} key={`${option.id}-${option.label}`}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                {option.nama}
                              </Typography>
                              <Typography variant="caption" color="text.primary">
                                {option.section}
                              </Typography>
                            </Box>
                          </li>
                        )}
                        renderInput={(params) => <TextField {...params} label="Pemberi Tugas" />}
                      />
                    </FormControl>
                  </Stack>
                </Grid>
              )}
              {!assignedLoad && (
                <Grid item xs={12} sm={12} lg={12}>
                  <Stack mt={2} justifyContent="flex-start" alignItems="flex-start">
                    <FormControl fullWidth variant="outlined">
                      <Autocomplete
                        fullWidth
                        options={karyawan}
                        value={karyawan?.find((option) => option?.id === data.assigned_id) || null}
                        onChange={(e, newValue) => {
                          setData((prev) => ({ ...prev, assigned_id: newValue?.id || '' }));
                        }}
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        getOptionLabel={(option) => option.nama || ''}
                        sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
                        renderOption={(props, option) => (
                          <li {...props} key={`${option.id}-${option.label}`}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                {option.nama}
                              </Typography>
                              <Typography variant="caption" color="text.primary">
                                {option.section}
                              </Typography>
                            </Box>
                          </li>
                        )}
                        renderInput={(params) => <TextField {...params} label="Penerima Tugas" />}
                      />
                    </FormControl>
                  </Stack>
                </Grid>
              )}
            </Grid>
          </MainCard>
          <CardActions>
            <Button variant="dashed" color="secondary" fullWidth>
              Reset Filter
            </Button>
          </CardActions>
        </Stack>
      </SwipeableDrawer>
    </div>
  );
}

function HeaderFilter({ count = 0, onClose }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack>
        <Typography variant="body">Filter Penugasan</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: 'rotate(45deg)' }} />
      </IconButton>
    </Stack>
  );
}
