import { Box, Stack, Typography, FormControl, TextField, Autocomplete } from '@mui/material';
import { useGetPenyewa } from 'api/penyewa';

const OptionPemasok = ({
  value = '',
  label = 'Penyewa',
  name = 'penyewa_id',
  error = null, // Tambahkan prop error
  // helperText = null, // Tambahkan prop helperText
  touched = false, // Tambahkan prop touched
  setFieldValue
}) => {
  const { data: array, dataLoading } = useGetPenyewa();
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
            // setData((prev) => ({ ...prev, assigner_id: newValue?.id || '' }));
            setFieldValue(name, newValue?.id || '');
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

export default OptionPemasok;
