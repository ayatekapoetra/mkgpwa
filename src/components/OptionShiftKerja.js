import { Stack, Typography, FormControl, TextField, Autocomplete } from '@mui/material';
import { useGetShiftKerja } from 'api/shiftkerja';

import moment from 'moment';

const OptionShiftKerja = ({
  value = '',
  label = 'Shift Kerja',
  name = 'shift_id',
  error = null, // Tambahkan prop error
  // helperText = null, // Tambahkan prop helperText
  touched = false, // Tambahkan prop touched
  setFieldValue
}) => {
  const { data: array, dataLoading } = useGetShiftKerja();
  if (dataLoading) {
    return <div>Loading...</div>;
  }
  return (
    <Stack mt={2} justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          options={array}
          value={array.find((option) => option?.id == value) || null}
          onChange={(e, newValue) => {
            setFieldValue(name, newValue?.id || '');
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          getOptionLabel={(option) => option.nama || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.label}`}>
              <Stack>
                <Typography variant="body" color="text.primary">
                  {option.nama}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {moment(option.start_shift, 'HH:mm:ss').format('HH:mm A')} - {moment(option.end_shift, 'HH:mm:ss').format('HH:mm A')}
                </Typography>
              </Stack>
            </li>
          )}
          renderInput={(params) => <TextField {...params} label={label} error={touched && Boolean(error)} helperText={touched && error} />}
        />
      </FormControl>
    </Stack>
  );
};

export default OptionShiftKerja;
