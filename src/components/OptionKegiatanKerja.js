import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment } from '@mui/material';
import { useGetKegiatanKerja } from 'api/kegiatan-mining';

const OptionKegiatanKerja = ({
  value = '',
  searchParams = '', // { type: 'DT' } atau { type: 'HE' }
  label = 'Kegiatan',
  name = 'kegiatan_id',
  error = null, // Tambahkan prop error
  touched = false, // Tambahkan prop touched
  startAdornment = null,
  setFieldValue
}) => {
  const { data: array, dataLoading } = useGetKegiatanKerja(searchParams);
  console.log('KEGIATAN-----', array);
  
  const options = Array.isArray(array) ? array : [];

  if (dataLoading) {
    return <div>Loading...</div>;
  }
  return (
    <Stack mt={2} justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          options={options}
          value={options.find((option) => option?.id == value) || null}
          onChange={(e, newValue) => {
            setFieldValue(name, newValue?.id || '');
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          getOptionLabel={(option) => option.nama || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.label}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Typography variant="body1">{option.nama}</Typography>
                <Typography variant="caption">{option.grpequipment}</Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => {
            return (
              <TextField
                {...params}
                label={label}
                error={touched && Boolean(error)}
                helperText={touched && error}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: startAdornment && (
                    <>
                      <InputAdornment position="start">{startAdornment}</InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  )
                }}
              />
            );
          }}
        />
      </FormControl>
    </Stack>
  );
};

export default OptionKegiatanKerja;
