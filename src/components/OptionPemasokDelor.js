import { Box, Stack, Typography, FormControl, TextField, Autocomplete } from '@mui/material';
import { useGetPemasokDelor } from 'api/pemasok';
import InputSkeleton from './InputSkeleton';

const OptionPemasokDelor = ({
  value = '',
  label = 'Pemasok',
  name = 'pemasok_id',
  error = null, // Tambahkan prop error
  //   helperText = null, // Tambahkan prop helperText
  touched = false, // Tambahkan prop touched
  setFieldValue
}) => {
  const { data: array, dataLoading } = useGetPemasokDelor();
  if (dataLoading || !array) {
    return <InputSkeleton height={30} />;
  }
  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          options={array}
          value={array.find((option) => option?.id == value) || null}
          onChange={(e, newValue) => {
            setFieldValue(name, newValue?.id || '');
            setFieldValue('pemasok', newValue || null);
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          getOptionLabel={(option) => option.nama || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.label}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Typography variant="body1">{option.nama}</Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => <TextField {...params} label={label} error={touched && Boolean(error)} helperText={touched && error} />}
        />
      </FormControl>
    </Stack>
  );
};

export default OptionPemasokDelor;
